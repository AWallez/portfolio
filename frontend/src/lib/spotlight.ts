import type { MouseEvent } from "react";

// Met à jour la position du halo (--mx/--my) selon le curseur, relative à la carte.
function onMouseMove(e: MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  el.style.setProperty("--mx", `${e.clientX - r.left}px`);
  el.style.setProperty("--my", `${e.clientY - r.top}px`);
}

// Renvoie le halo hors de la carte quand on en sort.
function onMouseLeave(e: MouseEvent<HTMLElement>) {
  e.currentTarget.style.setProperty("--my", "-200%");
}

/** Props à étaler sur une carte (avec la classe `spotlight`) pour activer le halo. */
export const spotlight = { onMouseMove, onMouseLeave };
