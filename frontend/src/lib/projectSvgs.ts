import type { Lang } from "../i18n/LangContext";
import PROPORTIONS from "../assets/projects/proportions.json";

// Visuels des projets, chargés À LA DEMANDE : chaque SVG est un petit fichier
// à part, et on ne télécharge que ceux du thème, de la langue et du format
// affichés. Tous ensemble, ils pesaient 900 Ko de JS à lire au chargement.
// Générés par branding/generate-projects.mjs, inlinés ensuite (et non en <img>)
// pour hériter des webfonts du site.

export type Theme = "light" | "dark";
export type Variante = { theme: Theme; lang: Lang; vertical: boolean };

const LOADERS = import.meta.glob<string>("../assets/projects/**/*.svg", {
  query: "?raw",
  import: "default",
});

// fichier à charger : {thème}-{langue}, ou {thème} seul (perso : terminal pur,
// sans langue). Sur écran étroit, la version verticale : {thème}-v-{langue},
// ou {thème}-v pour perso ; à défaut, la version en largeur.
function chemin(asset: string, { theme, lang, vertical }: Variante) {
  const base = `../assets/projects/${asset}/${theme}`;
  const essais = [
    ...(vertical ? [`${base}-v-${lang}.svg`, `${base}-v.svg`] : []),
    `${base}-${lang}.svg`,
    `${base}.svg`,
  ];
  return essais.find((p) => p in LOADERS);
}

const cache = new Map<string, string>();
const enCours = new Map<string, Promise<string | undefined>>();

/** Le visuel s'il est déjà chargé (lecture synchrone, pour le rendu). */
export function svgCharge(asset: string, v: Variante) {
  const p = chemin(asset, v);
  return p ? cache.get(p) : undefined;
}

/** Charge le visuel (une seule requête, même appelé plusieurs fois). */
export function chargerSvg(asset: string, v: Variante) {
  const p = chemin(asset, v);
  if (!p) return Promise.resolve(undefined);
  const deja = cache.get(p);
  if (deja !== undefined) return Promise.resolve(deja);
  let promesse = enCours.get(p);
  if (!promesse) {
    promesse = LOADERS[p]()
      .then((svg) => {
        cache.set(p, svg);
        return svg;
      })
      .catch(() => undefined) // réseau coupé : on retentera au prochain rendu
      .finally(() => enCours.delete(p));
    enCours.set(p, promesse);
  }
  return promesse;
}

/** Largeur / hauteur du visuel, connue avant de le charger (place réservée). */
export function proportion(asset: string, vertical: boolean) {
  const p = (PROPORTIONS as Record<string, { paysage: number; vertical?: number }>)[
    asset
  ];
  if (!p) return 16 / 9;
  return (vertical && p.vertical) || p.paysage;
}
