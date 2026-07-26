import { useCallback, useRef, useState } from "react";

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;

type Transform = { scale: number; tx: number; ty: number };
const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };

const clamp = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

/**
 * Zoom + déplacement pour les aperçus plein écran (CV, visuels projets) :
 * molette, pinch tactile, drag, double-clic, et boutons via `zoomByCenter`.
 *
 * Usage : poser `ref` sur la zone d'affichage, y étaler `handlers`, et appliquer
 * `style` sur le contenu à transformer.
 * `transform` est l'état de rendu ; une ref interne sert de source de vérité pour
 * enchaîner les gestes sans dépendre du cycle de rendu.
 */
export function useZoomPan() {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const transformRef = useRef<Transform>(IDENTITY);

  const apply = useCallback((next: Transform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);
  const reset = useCallback(() => apply(IDENTITY), [apply]);

  // zoom centré sur un point (coords écran) en le gardant fixe
  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;
      const cur = transformRef.current;
      const ns = clamp(cur.scale * factor);
      if (ns === cur.scale) return;
      if (ns === 1) {
        apply(IDENTITY);
        return;
      }
      const r = ns / cur.scale;
      apply({
        scale: ns,
        tx: px - r * (px - cur.tx),
        ty: py - r * (py - cur.ty),
      });
    },
    [apply],
  );

  const zoomByCenter = useCallback(
    (factor: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
    },
    [zoomAt],
  );

  // --- gestes : molette (zoom), drag (déplacement), pinch (zoom tactile) ---
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
    },
    [zoomAt],
  );

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    ref.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  }, []);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const p = pointers.current.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pointers.current.size >= 2) {
        const [a, b] = [...pointers.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist.current > 0)
          zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinchDist.current);
        pinchDist.current = dist;
      } else if (transformRef.current.scale > 1) {
        const cur = transformRef.current;
        apply({ ...cur, tx: cur.tx + dx, ty: cur.ty + dy });
      }
    },
    [apply, zoomAt],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
  }, []);

  // double-clic / double-tap : zoome, ou revient à l'échelle 1 si déjà zoomé
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const cur = transformRef.current;
      zoomAt(e.clientX, e.clientY, cur.scale > 1 ? 1 / cur.scale : 2.2);
    },
    [zoomAt],
  );

  return {
    ref,
    transform,
    /** à appliquer sur le contenu transformé */
    style: {
      transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
      transformOrigin: "center" as const,
    },
    /** à étaler sur la zone d'affichage (celle qui porte `ref`) */
    handlers: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick,
    },
    zoomByCenter,
    reset,
    canZoomIn: transform.scale < MAX_SCALE,
    canZoomOut: transform.scale > MIN_SCALE,
    isReset: transform.scale === 1 && transform.tx === 0 && transform.ty === 0,
  };
}
