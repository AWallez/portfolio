import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import ProjectVisual from "./ProjectVisual";
import { useZoomPan } from "../hooks/useZoomPan";
import ZoomControls from "./ZoomControls";

type Props = {
  /** SVG bruts inline (mêmes que la carte), une version par thème */
  light: string;
  dark: string;
  title: string;
  onClose: () => void;
};

/**
 * Aperçu agrandi d'un visuel projet, avec zoom (molette / pinch / double-clic /
 * boutons) et déplacement au drag — même mécanique que <CvModal> (useZoomPan).
 * Rendu via portail sur <body> pour échapper au transform de <Reveal> et à
 * l'overflow-clip de <main> (un position:fixed y serait rogné/mal placé).
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

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      // piège le focus dans le modal (WCAG 2.4.3) : Tab/Shift+Tab bouclent
      // sur les éléments focusables du dialogue (ici, le seul bouton fermer).
      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);

    // bloque le scroll de l'arrière-plan en verrouillant documentElement
    // (l'élément qui défile). On compense la largeur de la scrollbar pour
    // éviter un saut horizontal au moment du verrouillage.
    const docEl = document.documentElement;
    const scrollbarW = window.innerWidth - docEl.clientWidth;
    const prevOverflow = docEl.style.overflow;
    const prevPad = docEl.style.paddingRight;
    docEl.style.overflow = "hidden";
    if (scrollbarW > 0) docEl.style.paddingRight = `${scrollbarW}px`;

    return () => {
      document.removeEventListener("keydown", onKey);
      docEl.style.overflow = prevOverflow;
      docEl.style.paddingRight = prevPad;
      prevFocus?.focus?.();
    };
  }, [onClose]);

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
        className="relative flex max-h-[92dvh] w-full max-w-7xl flex-col
                   overflow-hidden rounded-xl border border-line bg-base shadow-2xl"
      >
        {/* barre d'outils : titre à gauche, zoom + fermer à droite (comme le CV) */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <span className="hidden sm:inline truncate font-mono text-sm text-muted">
            {title}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <ZoomControls
              zoomByCenter={zoomByCenter}
              reset={resetZoom}
              canZoomIn={canZoomIn}
              canZoomOut={canZoomOut}
              isReset={isReset}
            />
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

        {/* zone de zoom : le visuel est transformé (translate + scale) et clippé ici */}
        <div
          ref={viewerRef}
          {...zoomHandlers}
          className="relative min-h-0 touch-none select-none overflow-hidden"
          style={{ cursor: transform.scale > 1 ? "grab" : "auto" }}
        >
          <div style={transformStyle}>
            <ProjectVisual light={light} dark={dark} />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
