type Props = {
  /** SVG du thème courant ; absent tant qu'il n'est pas chargé */
  svg?: string;
  /** largeur / hauteur, pour réserver la place avant l'arrivée du SVG */
  ratio: number;
};

/**
 * Visuel projet en SVG inline. Inliné (et non en <img>) pour hériter des
 * webfonts du site. Partagé par la carte (Projects) et l'aperçu agrandi
 * (Lightbox). Avant son arrivée (cf. lib/projectSvgs), un cadre vide aux mêmes
 * proportions tient la place : la page ne saute pas quand il s'affiche.
 *
 * ⚠️ `svg` est injecté via dangerouslySetInnerHTML : il DOIT rester un SVG de
 * confiance généré au build (branding/generate-projects.mjs). Ne jamais y
 * passer un contenu venant d'un utilisateur/CMS sans sanitisation.
 */
export default function ProjectVisual({ svg, ratio }: Props) {
  if (svg === undefined)
    return <div aria-hidden className="w-full" style={{ aspectRatio: ratio }} />;
  return (
    <div
      aria-hidden
      className="[&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
