// Intègre les icônes SVG fournies par Alexis (branding/icons/*.svg) :
// on inline leur contenu, on force la couleur d'accent et on les met à l'échelle.
//
// Les fichiers sont en APLAT (fill), pas au trait → les autres pictos de la
// bannière sont dessinés dans le même style pour rester homogènes.

import { readFileSync } from "node:fs";

/**
 * `vb` : viewBox d'origine (mise à l'échelle).
 * `unit` : échelle accumulée entre la racine du fichier et ses <path>. Les
 * dessins vectorisés par potrace enveloppent leurs tracés dans un
 * `scale(0.1,-0.1)` : leurs coordonnées sont donc 10× plus grandes, ce dont il
 * faut tenir compte pour exprimer une épaisseur de trait en pixels finaux.
 */
const ICONS = {
  "pompier.svg": { vb: 667, unit: 1 },
  "tuba-et-masque.svg": { vb: 512, unit: 0.1 },
  "rugby.svg": { vb: 512, unit: 0.1 },
};

/** Contenu interne d'un SVG (sans la balise <svg>), recoloré. */
function inner(file, color, paint) {
  const raw = readFileSync(`branding/icons/${file}`, "utf8");
  const body = raw.replace(/[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return (
    body
      // les <defs>/clipPath restent valides ; on ne recolore que les remplissages noirs
      .replace(/fill="(black|#000000|#000)"/gi, paint)
      // `fill="white"` sert de contre-forme (détails évidés) → couleur du fond,
      // et jamais de contour : elle doit rester en creux.
      .replace(/fill="white"/gi, `fill="${"var(--bg)"}"`)
  );
}

/**
 * Place une icône utilisateur centrée en (cx, cy), à la taille `size`.
 * `bg` remplace les contre-formes blanches (détails évidés du dessin).
 *
 * `boldPx` épaissit le dessin de N pixels finaux, en contournant les aplats de
 * leur propre couleur (faux-gras). Les dessins au trait fin (pompier, masque)
 * ne couvrent presque aucun pixel plein une fois réduits à ~80 px : ils sont
 * alors majoritairement rendus en anti-aliasing, et paraissent délavés à côté
 * des pictos en aplats. Les épaissir rétablit leur densité optique.
 */
export function userIcon(file, cx, cy, size, color, bg, boldPx = 0) {
  const { vb, unit } = ICONS[file];
  const k = size / vb;
  // épaisseur exprimée dans l'espace de coordonnées des tracés
  const sw = boldPx / (unit * k);
  const paint =
    boldPx > 0
      ? `fill="${color}" stroke="${color}" stroke-width="${sw.toFixed(1)}" stroke-linejoin="round"`
      : `fill="${color}"`;
  let body = inner(file, color, paint).replaceAll("var(--bg)", bg);
  // potrace pose un `stroke="none"` de groupe qui neutraliserait le faux-gras
  if (boldPx > 0) body = body.replace(/\sstroke="none"/gi, "");
  return `<g transform="translate(${cx - size / 2} ${cy - size / 2}) scale(${k})">${body}</g>`;
}

export const ICON_FILES = Object.keys(ICONS);
