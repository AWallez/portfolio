import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import ProjectVisual from "./ProjectVisual";

type Props = {
  /** SVG bruts inline (mêmes que la carte), une version par thème */
  light: string;
  dark: string;
  title: string;
  onClose: () => void;
};

/**
 * Aperçu agrandi d'un visuel projet.
 * Rendu via portail sur <body> pour échapper au transform de <Reveal> et à
 * l'overflow-clip de <main> (un position:fixed y serait rogné/mal placé).
 */
export default function Lightbox({ light, dark, title, onClose }: Props) {
  const { lang } = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pressedBackdrop = useRef(false);

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

    // bloque le scroll de l'arrière-plan. <html> est le conteneur de scroll
    // (il a overflow-x: clip), donc on verrouille documentElement, pas <body>.
    // On compense la largeur de la scrollbar pour éviter un saut horizontal.
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
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8
                 bg-base/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-5xl">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t("projects", "close", lang)}
          className="absolute -right-3 -top-3 z-10 grid h-9 w-9 place-items-center
                     rounded-full border border-line bg-base text-ink shadow-md
                     hover:border-accent hover:text-accent transition"
        >
          <X size={18} aria-hidden />
        </button>

        <div className="overflow-hidden rounded-xl border border-line shadow-2xl">
          <ProjectVisual light={light} dark={dark} />
        </div>
      </div>
    </div>,
    document.body,
  );
}
