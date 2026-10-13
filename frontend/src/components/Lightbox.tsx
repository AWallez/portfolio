import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { RotateCw, X } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import ProjectVisual from "./ProjectVisual";
import { useZoomPan } from "../hooks/useZoomPan";
import { useModal } from "../hooks/useModal";
import { useEtroit } from "../hooks/useEtroit";
import ZoomControls from "./ZoomControls";

type Props = {
  /** SVG bruts inline (mêmes que la carte), une version par thème */
  light: string;
  dark: string;
  title: string;
  onClose: () => void;
};

// hauteur de la barre d'outils (py-2.5 + bouton de 36 px + bordure)
const BARRE = 57;

/** Proportions du visuel, lues dans son viewBox (1200 × 675 pour les projets). */
function proportions(svg: string) {
  const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  return m ? Number(m[1]) / Number(m[2]) : 16 / 9;
}

/**
 * Hauteur de la zone d'affichage : celle du visuel en pleine largeur, dans la
 * limite de l'écran. Téléphone en paysage, le visuel est plus haut que l'écran :
 * il garde toute sa largeur (le réduire pour le faire tenir entier le rendait
 * minuscule), et on le fait glisser pour en voir le bas, sans avoir à zoomer
 * d'abord (cf. useZoomPan).
 */
type Fenetre = { w: number; h: number };
const fenetre = (): Fenetre => ({
  w: window.innerWidth,
  h: window.visualViewport?.height ?? window.innerHeight,
});

function hauteurZone(ratio: number, { w: vw, h: vh }: Fenetre) {
  const marge = vw < 640 ? 16 : 32; // p-4, p-8 au-delà
  const largeur = Math.min(vw - 2 * marge, 1280) - 2; // - bordures
  const dispo = vh - 2 * marge - BARRE - 2;
  return Math.max(0, Math.floor(Math.min(largeur / ratio, dispo)));
}

// Téléphone tenu en portrait : un visuel en largeur y reste petit, la seule
// façon de l'agrandir est de tourner l'écran. On le dit, quelques secondes.
const portraitTactile = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(pointer: coarse)").matches &&
  window.innerHeight > window.innerWidth;

/**
 * Aperçu agrandi d'un visuel projet, avec zoom (molette / pinch / double-clic /
 * double-tap / boutons) et déplacement au drag — même mécanique que <CvModal>
 * (useZoomPan). Rendu via portail sur <body> pour échapper au transform de
 * <Reveal> et à l'overflow-clip de <main> (un position:fixed y serait rogné).
 */
export default function Lightbox({ light, dark, title, onClose }: Props) {
  const { lang } = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);
  // destructuré : react-hooks/refs interdit de lire une propriété d'un objet
  // contenant un ref pendant le rendu
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
  } = useZoomPan();

  const ratio = useMemo(() => proportions(light), [light]);
  // téléphone : boutons de zoom sur l'image plutôt qu'à côté du titre
  const etroit = useEtroit();
  // Taille de la fenêtre en état, et hauteur DÉDUITE au rendu : à la rotation,
  // le visuel change aussi (vertical ↔ horizontal, cf. Projects) ; calculée
  // dans l'écouteur, elle partait avec les proportions de l'ancien visuel.
  const [vp, setVp] = useState(fenetre);
  const hauteur = hauteurZone(ratio, vp);
  const [astuce, setAstuce] = useState(portraitTactile);

  // focus initial sur « fermer », Échap, piège du focus, scroll bloqué
  useModal(dialogRef, closeRef, onClose);

  // rotation, redimensionnement : nouvelle taille, zoom remis à zéro (ses
  // bornes dépendaient de l'ancienne), astuce retirée en paysage
  useEffect(() => {
    const maj = () => {
      setVp(fenetre());
      resetZoom();
      if (!portraitTactile()) setAstuce(false);
    };
    window.addEventListener("resize", maj);
    window.visualViewport?.addEventListener("resize", maj);
    return () => {
      window.removeEventListener("resize", maj);
      window.visualViewport?.removeEventListener("resize", maj);
    };
  }, [resetZoom]);

  useEffect(() => {
    if (!astuce) return;
    const id = window.setTimeout(() => setAstuce(false), 4000);
    return () => window.clearTimeout(id);
  }, [astuce]);

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        // ne ferme que si le geste a COMMENCÉ sur le fond (évite la fermeture
        // quand on relâche sur le fond après un appui/glissé depuis le contenu)
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
      }}
      className="fixed inset-0 z-100 flex items-center justify-center overscroll-contain
                 touch-manipulation p-4 sm:p-8 bg-base/80 backdrop-blur-sm"
    >
      <div
        className="relative flex w-full max-w-7xl flex-col overflow-hidden
                   rounded-xl border border-line bg-base shadow-2xl"
      >
        {/* barre d'outils : titre à gauche, zoom + fermer à droite (comme le CV).
            Le titre reste affiché sur téléphone (sinon rien ne dit de quel
            projet il s'agit) ; faute de place à côté de lui, les boutons de
            zoom y passent par-dessus l'image (cf. plus bas). */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <span className="min-w-0 truncate text-sm font-medium text-ink sm:font-mono sm:font-normal sm:text-muted">
            {title}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            {!etroit && (
              <ZoomControls
                zoomByCenter={zoomByCenter}
                reset={resetZoom}
                canZoomIn={canZoomIn}
                canZoomOut={canZoomOut}
                isReset={isReset}
              />
            )}
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

        <div className="relative">
          {/* zone de zoom : le visuel y est centré, transformé (translate +
              scale) et clippé ; plus haut que la zone, il se fait glisser */}
          <div
            ref={viewerRef}
            {...zoomHandlers}
            onPointerDown={(e) => {
              setAstuce(false);
              zoomHandlers.onPointerDown(e);
            }}
            className="relative flex touch-none select-none items-center overflow-hidden"
            style={{
              height: hauteur,
              cursor: transform.scale > 1 ? "grab" : "auto",
            }}
          >
            <div data-zoom-content className="w-full shrink-0" style={transformStyle}>
              <ProjectVisual light={light} dark={dark} />
            </div>

            {/* astuce réservée aux visuels en largeur : un visuel vertical
                occupe déjà l'écran du téléphone tenu droit */}
            {astuce && ratio >= 1 && (
              <p
                className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto flex w-fit items-center
                           gap-2 rounded-full border border-line bg-base/90 px-3 py-1.5 font-mono
                           text-xs text-ink shadow-md backdrop-blur-sm"
              >
                <RotateCw size={14} aria-hidden className="text-accent" />
                {t("projects", "rotateHint", lang)}
              </p>
            )}
          </div>

          {/* Téléphone : boutons de zoom posés sur l'image, en haut à droite,
              comme le bouton d'agrandissement des cartes ; ils disent qu'on
              peut zoomer. Placés À CÔTÉ de la zone de zoom et non dedans : elle
              capture le pointeur pour le déplacement, un appui n'y atteindrait
              pas les boutons. */}
          {etroit && (
            <div className="absolute right-2 top-2 rounded-lg bg-base/85 shadow-md backdrop-blur-sm">
              <ZoomControls
                zoomByCenter={zoomByCenter}
                reset={resetZoom}
                canZoomIn={canZoomIn}
                canZoomOut={canZoomOut}
                isReset={isReset}
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
