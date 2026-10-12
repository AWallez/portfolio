import { useCallback, useEffect, useRef, useState } from "react";

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;

type Transform = { scale: number; tx: number; ty: number };
const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
const borne = (v: number, max: number) => Math.min(max, Math.max(-max, v));
const css = (t: Transform) =>
  `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;

// les éléments transformés, marqués data-zoom-content (deux images pour le CV)
const contenus = (zone: HTMLElement | null) =>
  zone?.querySelectorAll<HTMLElement>("[data-zoom-content]") ?? [];

// délai et distance maximaux entre deux tapes pour un double-tap
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;

/**
 * Zoom + déplacement pour les aperçus plein écran (CV, visuels projets) :
 * molette, pinch tactile, drag, double-clic, double-tap, et boutons via
 * `zoomByCenter`.
 *
 * Usage : poser `ref` sur la zone d'affichage, y étaler `handlers`, et sur le
 * contenu à transformer, appliquer `style` ET l'attribut `data-zoom-content`.
 *
 * ⚠️ Pendant un geste, le transform est écrit DIRECTEMENT dans le DOM, une fois
 * par image (requestAnimationFrame), sans passer par React. Avant, chaque
 * mouvement de doigt changeait l'état, React redessinait la fenêtre et le
 * navigateur recalculait tout le SVG (ombres comprises) : le pinch traînait
 * derrière les doigts. L'état React n'est mis à jour qu'à la fin du geste
 * (boutons de zoom, curseur). `will-change` fait zoomer une image déjà
 * rendue pendant le geste (fluide, mais floue en grossissant) ; il est retiré
 * à la fin pour que le navigateur redessine net à la nouvelle échelle.
 *
 * Le déplacement est permis dès que l'image dépasse de la zone, même sans
 * zoom : un visuel plus haut que l'écran (téléphone en paysage) se fait
 * glisser pour en voir le bas.
 */
export function useZoomPan() {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const transformRef = useRef<Transform>(IDENTITY);
  const frame = useRef(0);
  const finMolette = useRef(0);
  const enGeste = useRef(false);

  // Bornes : l'image ne sort jamais du cadre. Elle se déplace tant qu'elle
  // dépasse de la zone, zoomée ou non.
  const borner = useCallback((t: Transform): Transform => {
    const zone = ref.current;
    // l'élément VISIBLE : celui de l'autre thème est masqué (largeur nulle)
    const image = [...contenus(zone)].find((n) => n.offsetWidth > 0);
    if (!zone || !image) return IDENTITY;
    const mx = Math.max(0, (image.offsetWidth * t.scale - zone.clientWidth) / 2);
    const my = Math.max(0, (image.offsetHeight * t.scale - zone.clientHeight) / 2);
    return { scale: t.scale, tx: borne(t.tx, mx), ty: borne(t.ty, my) };
  }, []);

  const peindre = useCallback(() => {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      const valeur = css(transformRef.current);
      contenus(ref.current).forEach((n) => {
        n.style.transform = valeur;
      });
    });
  }, []);

  const debutGeste = useCallback(() => {
    if (enGeste.current) return;
    enGeste.current = true;
    contenus(ref.current).forEach((n) => {
      n.style.willChange = "transform";
    });
  }, []);

  // fin de geste : `will-change` retiré, le navigateur redessine net
  // (instantané : une animation de flou vers le net a été essayée et retirée)
  const finGeste = useCallback(() => {
    if (!enGeste.current) return;
    enGeste.current = false;
    contenus(ref.current).forEach((n) => {
      n.style.willChange = "";
    });
  }, []);

  /** `valider` : met aussi à jour l'état React (fin de geste, bouton) */
  const appliquer = useCallback(
    (next: Transform, valider: boolean) => {
      transformRef.current = borner(next);
      if (valider) setTransform(transformRef.current);
      else peindre();
    },
    [borner, peindre],
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(finMolette.current);
    },
    [],
  );

  const reset = useCallback(() => appliquer(IDENTITY, true), [appliquer]);

  // zoom centré sur un point (coords écran) en le gardant fixe
  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number, valider: boolean) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;
      const cur = transformRef.current;
      const ns = clampScale(cur.scale * factor);
      if (ns === cur.scale) return;
      const r = ns / cur.scale;
      appliquer(
        { scale: ns, tx: px - r * (px - cur.tx), ty: py - r * (py - cur.ty) },
        valider,
      );
    },
    [appliquer],
  );

  const zoomByCenter = useCallback(
    (factor: number) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor, true);
    },
    [zoomAt],
  );

  // --- gestes : molette (zoom), drag (déplacement), pinch (zoom tactile) ---
  type Doigt = { x: number; y: number; x0: number; y0: number; t0: number };
  const pointers = useRef(new Map<number, Doigt>());
  const pinchDist = useRef(0);
  const derniereTape = useRef({ t: 0, x: 0, y: 0 });

  // molette : peinte tout de suite, état validé quand elle s'arrête
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      debutGeste();
      zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12, false);
      window.clearTimeout(finMolette.current);
      finMolette.current = window.setTimeout(() => {
        setTransform(transformRef.current);
        finGeste();
      }, 150);
    },
    [debutGeste, finGeste, zoomAt],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      ref.current?.setPointerCapture(e.pointerId);
      pointers.current.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
        x0: e.clientX,
        y0: e.clientY,
        t0: e.timeStamp,
      });
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()];
        pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
      }
      debutGeste();
    },
    [debutGeste],
  );

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
          zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinchDist.current, false);
        pinchDist.current = dist;
      } else {
        // déplacement, borné : sans effet si l'image tient entière dans la zone
        const cur = transformRef.current;
        appliquer({ ...cur, tx: cur.tx + dx, ty: cur.ty + dy }, false);
      }
    },
    [appliquer, zoomAt],
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const p = pointers.current.get(e.pointerId);
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinchDist.current = 0;
      if (pointers.current.size > 0) return;

      // fin du geste : état React à jour, rendu net
      setTransform(transformRef.current);
      finGeste();

      // Double-tap au doigt : le navigateur n'émet pas de dblclick quand la
      // zone gère elle-même le tactile (touch-action: none).
      if (!p || e.pointerType !== "touch") return;
      const immobile = Math.hypot(e.clientX - p.x0, e.clientY - p.y0) < 10;
      if (!immobile || e.timeStamp - p.t0 > 250) return;
      const d = derniereTape.current;
      if (
        e.timeStamp - d.t < DOUBLE_TAP_MS &&
        Math.hypot(e.clientX - d.x, e.clientY - d.y) < DOUBLE_TAP_PX
      ) {
        const cur = transformRef.current;
        zoomAt(e.clientX, e.clientY, cur.scale > 1 ? 1 / cur.scale : 2.5, true);
        derniereTape.current = { t: 0, x: 0, y: 0 };
      } else {
        derniereTape.current = { t: e.timeStamp, x: e.clientX, y: e.clientY };
      }
    },
    [finGeste, zoomAt],
  );

  // double-clic à la souris : zoome, ou revient à l'échelle 1 si déjà zoomé
  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const cur = transformRef.current;
      zoomAt(e.clientX, e.clientY, cur.scale > 1 ? 1 / cur.scale : 2.2, true);
    },
    [zoomAt],
  );

  return {
    ref,
    transform,
    /** à appliquer sur le contenu transformé (avec l'attribut data-zoom-content) */
    style: {
      transform: css(transform),
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
