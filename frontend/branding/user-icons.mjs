// Intègre les icônes SVG fournies par Alexis (branding/icons/*.svg) :
// on inline leur contenu, on force la couleur d'accent et on les met à l'échelle.
//
// Les fichiers sont en APLAT (fill), pas au trait → les autres pictos de la
// bannière sont dessinés dans le même style pour rester homogènes.

import { readFileSync } from "node:fs";

/** Contenu interne d'un SVG (sans la balise <svg>), recoloré. */
function inner(file, color) {
  const raw = readFileSync(`branding/icons/${file}`, "utf8");
  const body = raw.replace(/[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return (
    body
      // les <defs>/clipPath restent valides ; on ne recolore que les remplissages noirs
      .replace(/fill="(black|#000000|#000)"/gi, `fill="${color}"`)
      // `fill="white"` sert de contre-forme (détails évidés) → couleur du fond
      .replace(/fill="white"/gi, `fill="${"var(--bg)"}"`)
  );
}

/** viewBox d'origine de chaque fichier (pour la mise à l'échelle). */
const VB = {
  "pompier.svg": 667,
  "tuba-et-masque.svg": 512,
  "rugby.svg": 512,
};

/**
 * Place une icône utilisateur centrée en (cx, cy), à la taille `size`.
 * `bg` remplace les contre-formes blanches (détails évidés du dessin).
 */
export function userIcon(file, cx, cy, size, color, bg) {
  const vb = VB[file];
  const k = size / vb;
  const body = inner(file, color).replaceAll("var(--bg)", bg);
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k})">${body}</g>`;
}

export const ICON_FILES = Object.keys(VB);
