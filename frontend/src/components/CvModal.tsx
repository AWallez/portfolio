import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

const CV_URL = "/cv-alexis-wallez.pdf";

type Props = { onClose: () => void };

/**
 * Aperçu plein écran du CV (PDF) avec bouton de téléchargement.
 * Même mécanique que <Lightbox> : portail sur <body>, focus-trap (WCAG 2.4.3),
 * fermeture Échap/clic-fond, et verrouillage du scroll de l'arrière-plan.
 */
export default function CvModal({ onClose }: Props) {
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

    // verrouille le scroll de l'arrière-plan (<html> est le conteneur de scroll),
    // en compensant la largeur de la scrollbar pour éviter un saut horizontal.
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
      aria-label={t("a11y", "cvTitle", lang)}
      onMouseDown={(e) => {
        pressedBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressedBackdrop.current) onClose();
      }}
      className="fixed inset-0 z-100 overscroll-contain touch-manipulation
                 bg-base/80 backdrop-blur-sm p-0 sm:p-8
                 sm:flex sm:items-center sm:justify-center"
    >
      <div
        className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-base shadow-2xl
                   sm:h-[90dvh] sm:max-w-4xl sm:rounded-xl sm:border sm:border-line"
      >
        {/* barre d'outils : (titre + télécharger) à gauche, fermer plaqué à droite */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden sm:inline font-mono text-sm text-muted truncate">
              {t("a11y", "cvTitle", lang)}
            </span>
            <a
              href={CV_URL}
              download
              aria-label={t("a11y", "downloadCV", lang)}
              className="inline-flex shrink-0 items-center gap-1.5 font-mono text-sm px-3 py-1.5 rounded
                         border border-line text-ink hover:border-accent hover:text-accent transition"
            >
              <Download size={14} aria-hidden />
              <span className="hidden xs:inline">{t("a11y", "downloadCV", lang)}</span>
            </a>
          </div>
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

        {/* aperçu du PDF (le bouton Télécharger reste le secours si le rendu inline
            n'est pas supporté, notamment sur certains navigateurs mobiles) */}
        <iframe
          src={`${CV_URL}#toolbar=0&navpanes=0&view=Fit`}
          title={t("a11y", "cvTitle", lang)}
          className="min-h-0 flex-1 w-full bg-white"
        />
      </div>
    </div>,
    document.body,
  );
}
