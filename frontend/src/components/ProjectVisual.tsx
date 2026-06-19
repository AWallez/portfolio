type Props = { light: string; dark: string };

/**
 * Visuel projet en SVG inline, une version par thème (clair masqué en sombre et
 * inversement). Inliné (et non en <img>) pour hériter des webfonts du site.
 * Partagé par la carte (Projects) et l'aperçu agrandi (Lightbox).
 */
const svgFit = "[&>svg]:block [&>svg]:w-full [&>svg]:h-auto";

export default function ProjectVisual({ light, dark }: Props) {
  return (
    <>
      <div
        aria-hidden
        className={`dark:hidden ${svgFit}`}
        dangerouslySetInnerHTML={{ __html: light }}
      />
      <div
        aria-hidden
        className={`hidden dark:block ${svgFit}`}
        dangerouslySetInnerHTML={{ __html: dark }}
      />
    </>
  );
}
