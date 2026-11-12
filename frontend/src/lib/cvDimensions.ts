// Dimensions de l'aperçu du CV dans sa fenêtre modale (<CvModal>).
//
// Le CV prend TOUTE la largeur de la fenêtre, et c'est la zone d'affichage qui
// s'arrête à la hauteur de l'écran : le reste se fait défiler (molette,
// glisser). Il était auparavant réduit pour tenir entier en hauteur, et le
// texte tombait à 7 px sur un portable en 1366 × 768, à 3 px sur un téléphone
// en paysage. Même règle que l'agrandissement des projets (cf. Lightbox).

export type Fenetre = { w: number; h: number };

// hauteur de la barre d'outils (py-2.5 + bouton de 36 px + bordure)
const BARRE = 57;
// bordures de la fenêtre (2) + p-3.5 autour de l'aperçu (28)
const CADRE = 30;
// sm:max-w-4xl
const LARGEUR_MAX = 896;

/** `zone` : hauteur affichée ; plus petite que `hauteur`, le reste défile. */
export function dimensionsCv(ratio: number, { w: vw, h: vh }: Fenetre) {
  const marge = vw < 640 ? 12 : 32; // p-3, sm:p-8 du fond
  const largeur = Math.max(0, Math.floor(Math.min(vw - 2 * marge, LARGEUR_MAX) - CADRE));
  const hauteur = Math.round(largeur / ratio);
  const dispo = Math.max(0, Math.floor(vh - 2 * marge - BARRE - CADRE));
  return { largeur, hauteur, zone: Math.min(hauteur, dispo) };
}
