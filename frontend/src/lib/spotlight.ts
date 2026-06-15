import type { MouseEvent } from "react";

// Met à jour la position du halo (--mx/--my) ET son intensité (--si) selon le curseur.
// --si = distance normalisée au centre (0 au centre → 1 au bord) :
// le halo est donc discret au centre de la carte et marqué sur les bords.
function onMouseMove(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  el.style.setProperty("--mx", `${x}px`);
  el.style.setProperty("--my", `${y}px`);

  const dx = (x - r.width / 2) / (r.width / 2);
  const dy = (y - r.height / 2) / (r.height / 2);
  const dist = Math.min(1, Math.hypot(dx, dy)); // 0 (centre) → 1 (bord)
  el.style.setProperty("--si", `${dist.toFixed(3)}`);
}

// Renvoie le halo hors de la carte quand on en sort.
function onMouseLeave(e: MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--my", "-200%");
  e.currentTarget.style.setProperty("--si", "0");
}

/** Props à étaler sur une carte (avec la classe `spotlight`) pour activer le halo. */
export const spotlight = { onMouseMove, onMouseLeave };
