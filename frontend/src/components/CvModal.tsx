import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Loader2 } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { useZoomPan } from "../hooks/useZoomPan";
import { useModal } from "../hooks/useModal";
import { useEtroit } from "../hooks/useEtroit";
import { dimensionsCv, type Fenetre } from "../lib/cvDimensions";
import ZoomControls from "./ZoomControls";

// Fichiers du CV selon la langue : PDF téléchargeable + SVG affiché (clair/sombre).
const CV_FILES = {
  fr: {
    pdf: "/cv-alexis-wallez.pdf",
    light: "/cv-alexis-wallez.svg",
    dark: "/cv-alexis-wallez-dark.svg",
  },
  en: {
    pdf: "/cv-alexis-wallez-en.pdf",
    light: "/cv-alexis-wallez-en.svg",
    dark: "/cv-alexis-wallez-en-dark.svg",
  },
} as const;
const A4_RATIO = 0.7071; // largeur / hauteur, avant lecture du ratio réel du SVG

const fenetre = (): Fenetre => ({
  w: window.innerWidth,
  h: window.visualViewport?.height ?? window.innerHeight,
});

type Props = { onClose: () => void };

/**
 * Aperçu plein écran du CV en SVG (vectoriel) : zoom net à l'infini, sans pdfjs.
 * Le CV prend toute la largeur de la fenêtre, et ce qui dépasse de l'écran se
 * fait défiler : molette ou glisser. Ctrl + molette, pincement, double-clic et
 * boutons zooment. Même mécanique de modale que <Lightbox> (portail,
 * focus-trap, Échap, scroll-lock), dimensions dans lib/cvDimensions.
 */
export default function CvModal({ onClose }: Props) {
  const { lang } = useLang();
  const cv = CV_FILES[lang]; // CV de la langue courante (FR/EN)
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);
  // zoom / déplacement — partagé avec Lightbox. Un document se lit depuis le
  // haut et se parcourt à la molette, là où un visuel s'ouvre centré et zoome.
  // Destructuré (et non gardé en objet) : la règle react-hooks/refs interdit de lire
  // une propriété d'un objet qui contient un ref pendant le rendu.
  const {
    ref: viewerRef,
    transform,
    style: transformStyle,
    handlers: zoomHandlers,
    zoomByCenter,
    reset: resetZoom,
    canZoomIn,
    canZoomOut,
    isReset,
  } = useZoomPan({ molette: "defiler", repos: "haut" });

  // Taille de la fenêtre en état, dimensions DÉDUITES au rendu (comme Lightbox)
  const [ratio, setRatio] = useState(A4_RATIO);
  const [vp, setVp] = useState(fenetre);
  const { largeur, hauteur, zone } = dimensionsCv(ratio, vp);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  // téléphone : boutons de zoom sur l'image plutôt qu'à côté du titre
  const etroit = useEtroit();
  const zoom = (
    <ZoomControls
      zoomByCenter={zoomByCenter}
      reset={resetZoom}
      canZoomIn={canZoomIn}
      canZoomOut={canZoomOut}
      isReset={isReset}
    />
  );

  useEffect(() => {
    const maj = () => setVp(fenetre());
    window.addEventListener("resize", maj);
    window.visualViewport?.addEventListener("resize", maj);
    return () => {
      window.removeEventListener("resize", maj);
      window.visualViewport?.removeEventListener("resize", maj);
    };
  }, []);

  // Ouverture, rotation, ratio réel lu au chargement : retour en haut, sans
  // zoom. Après la mise en page, car les bornes se mesurent dessus, mais avant
  // l'affichage, sinon le CV apparaîtrait centré, le haut coupé, une image.
  useLayoutEffect(() => {
    resetZoom();
  }, [largeur, hauteur, zone, resetZoom]);

  // focus initial sur « fermer », Échap, piège du focus, scroll bloqué
  useModal(dialogRef, closeRef, onClose);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("a11y", "cvTitle", lang)}
      onMouseDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
      }}
      className="fixed inset-0 z-100 flex items-center justify-center overscroll-contain
                 touch-manipulation bg-base/80 backdrop-blur-sm p-3 sm:p-8"
    >
      <div
        className="relative flex max-w-full flex-col overflow-hidden
                   rounded-xl border border-line bg-base shadow-2xl sm:max-w-4xl"
      >
        {/* barre d'outils : (titre + télécharger) à gauche, fermer plaqué à droite.
            Comme l'agrandissement des projets : le titre reste affiché sur
            téléphone, et les boutons de zoom y passent par-dessus l'image. */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="min-w-0 truncate text-sm font-medium text-ink sm:font-mono sm:font-normal sm:text-muted">
              {t("a11y", "cvTitle", lang)}
            </span>
            <a
              href={cv.pdf}
              download
              aria-label={t("a11y", "downloadCV", lang)}
              className="inline-flex shrink-0 items-center gap-1.5 font-mono text-sm px-3 py-1.5 rounded
                         border border-line text-ink hover:border-accent hover:text-accent transition"
            >
              <Download size={14} aria-hidden />
              <span className="hidden sm:inline">{t("a11y", "downloadCV", lang)}</span>
            </a>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!error && !etroit && zoom}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t("projects", "close", lang)}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line
                         bg-base text-ink hover:border-accent hover:text-accent transition"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
        </div>

        {/* aperçu : le CV en pleine largeur, centré dans une zone qui s'arrête
            à l'écran ; plus haut qu'elle, il se fait défiler. Dimensionné dès
            l'ouverture, donc pas de cadre vide. */}
        <div className="relative p-3.5">
          <div
            ref={viewerRef}
            {...zoomHandlers}
            className="relative flex touch-none select-none items-center overflow-hidden
                       rounded shadow-md bg-white dark:bg-[#0d1418]"
            style={{
              width: largeur,
              height: zone,
              cursor: transform.scale > 1 ? "grab" : "auto",
            }}
          >
            {!error && (
              <div
                data-zoom-content
                className="relative w-full shrink-0"
                style={{ ...transformStyle, height: hauteur }}
              >
                <img
                  src={cv.light}
                  alt={t("a11y", "cvTitle", lang)}
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight)
                      setRatio(img.naturalWidth / img.naturalHeight);
                    setLoaded(true);
                  }}
                  onError={() => {
                    setError(true);
                    setLoaded(true);
                  }}
                  className="absolute inset-0 h-full w-full object-contain dark:hidden"
                />
                <img
                  src={cv.dark}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 hidden h-full w-full object-contain dark:block"
                />
              </div>
            )}

            {/* chargement */}
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center bg-surface/40">
                <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden />
                <span className="sr-only">{t("a11y", "loading", lang)}</span>
              </div>
            )}

            {/* secours si le SVG est introuvable */}
            {error && (
              <div className="absolute inset-0 grid place-items-center p-6 text-center">
                <p className="font-mono text-sm text-muted">
                  {t("a11y", "cvUnavailable", lang)}{" "}
                  <a href={cv.pdf} download className="text-accent underline">
                    {t("a11y", "downloadCV", lang)}
                  </a>
                </p>
              </div>
            )}
          </div>

          {/* posés sur l'image (coin haut droit), À CÔTÉ de la zone de zoom et
              non dedans : elle capture le pointeur pour le déplacement */}
          {!error && etroit && (
            <div className="absolute right-5.5 top-5.5 rounded-lg bg-base/85 shadow-md backdrop-blur-sm">
              {zoom}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
