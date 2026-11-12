import { useCallback, useEffect, useRef, useState } from "react";

export const MIN_SCALE = 1;
export const MAX_SCALE = 5;

type Transform = { scale: number; tx: number; ty: number };
const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };
// repos « en haut » : un ty infini, que les bornes ramènent au bord supérieur
const HAUT: Transform = { scale: 1, tx: 0, ty: Infinity };

const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
const borne = (v: number, max: number) => Math.min(max, Math.max(-max, v));
const css = (t: Transform) =>
  `translate(${t.tx}px, ${t.ty}px) scale(${t.scale})`;

// les éléments transformés, marqués data-zoom-content
const contenus = (zone: HTMLElement | null) =>
  zone?.querySelectorAll<HTMLElement>("[data-zoom-content]") ?? [];

// délai et distance maximaux entre deux tapes pour un double-tap
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 30;

type Options = {
  /**
   * « zoom » (par défaut) : la molette zoome, pour un visuel qui tient dans la
   * zone. « defiler » : la molette fait défiler, Ctrl + molette et le
   * pincement du pavé tactile zooment, comme dans tout lecteur de documents.
   */
  molette?: "zoom" | "defiler";
  /**
   * Position de repos (ouverture, bouton « réinitialiser ») : « centre », ou
   * « haut » pour un document plus haut que la zone, qu'on lit depuis le début.
   */
  repos?: "centre" | "haut";
};

/**
 * Zoom + déplacement pour les aperçus plein écran (CV, visuels projets) :
 * molette, pinch tactile, drag, double-clic, double-tap, et boutons via
 * `zoomByCenter`.
 *
 * Usage : poser `ref` sur la zone d'affichage, présente dès le premier rendu
 * (la molette s'y branche au montage), y étaler `handlers`, et sur le contenu
 * à transformer, appliquer `style` ET l'attribut `data-zoom-content`.
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
export function useZoomPan({ molette = "zoom", repos = "centre" }: Options = {}) {
  const ref = useRef<HTMLDivElement>(null);
  // `auRepos` grise « réinitialiser ». Calculé à la validation et non au
  // rendu : en mode « haut », la position de repos dépend de la mise en page.
  const [etat, setEtat] = useState({ t: IDENTITY, auRepos: true });
  const transformRef = useRef<Transform>(IDENTITY);
  const frame = useRef(0);
  const finMolette = useRef(0);
  const enGeste = useRef(false);
  const cibleRepos = repos === "haut" ? HAUT : IDENTITY;

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

  // état React à jour (fin de geste, bouton) : curseur et boutons de zoom
  const valider = useCallback(() => {
    const t = transformRef.current;
    const r = borner(cibleRepos);
    setEtat({ t, auRepos: t.scale === r.scale && t.tx === r.tx && t.ty === r.ty });
  }, [borner, cibleRepos]);

  /** `valide` : met aussi à jour l'état React (fin de geste, bouton) */
  const appliquer = useCallback(
    (next: Transform, valide: boolean) => {
      transformRef.current = borner(next);
      if (valide) valider();
      else peindre();
    },
    [borner, peindre, valider],
  );

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      window.clearTimeout(finMolette.current);
    },
    [],
  );

  const reset = useCallback(() => appliquer(cibleRepos, true), [appliquer, cibleRepos]);

  // zoom centré sur un point (coords écran) en le gardant fixe
  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number, valide: boolean) => {
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
        valide,
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

  // --- molette : peinte tout de suite, état validé quand elle s'arrête ---
  // Écouteur natif NON PASSIF : React pose les siens en passif, où
  // preventDefault reste sans effet. Or sans lui, Ctrl + molette (et le
  // pincement du pavé tactile, que Chrome et Firefox traduisent ainsi)
  // zoomait aussi toute la page derrière la fenêtre.
  useEffect(() => {
    const zone = ref.current;
    if (!zone) return;
    const surMolette = (e: WheelEvent) => {
      e.preventDefault();
      debutGeste();
      if (molette === "defiler" && !e.ctrlKey && !e.metaKey) {
        // deltaMode : 0 en pixels, 1 en lignes (Firefox), 2 en pages
        const k = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? zone.clientHeight : 1;
        const cur = transformRef.current;
        appliquer({ ...cur, tx: cur.tx - e.deltaX * k, ty: cur.ty - e.deltaY * k }, false);
      } else {
        zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12, false);
      }
      window.clearTimeout(finMolette.current);
      finMolette.current = window.setTimeout(() => {
        valider();
        finGeste();
      }, 150);
    };
    zone.addEventListener("wheel", surMolette, { passive: false });
    return () => zone.removeEventListener("wheel", surMolette);
  }, [molette, appliquer, zoomAt, debutGeste, finGeste, valider]);

  // --- gestes : drag (déplacement), pinch (zoom tactile) ---
  type Doigt = { x: number; y: number; x0: number; y0: number; t0: number };
  const pointers = useRef(new Map<number, Doigt>());
  const pinchDist = useRef(0);
  const derniereTape = useRef({ t: 0, x: 0, y: 0 });

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
      valider();
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
    [finGeste, valider, zoomAt],
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
    transform: etat.t,
    /** à appliquer sur le contenu transformé (avec l'attribut data-zoom-content) */
    style: {
      transform: css(etat.t),
      transformOrigin: "center" as const,
    },
    /** à étaler sur la zone d'affichage (celle qui porte `ref`) */
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
      onDoubleClick,
    },
    zoomByCenter,
    reset,
    canZoomIn: etat.t.scale < MAX_SCALE,
    canZoomOut: etat.t.scale > MIN_SCALE,
    isReset: etat.auRepos,
  };
}
