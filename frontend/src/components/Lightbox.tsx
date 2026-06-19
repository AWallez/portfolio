import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

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
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);

    // bloque le scroll de l'arrière-plan tant que la lightbox est ouverte
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 sm:p-8
                 bg-base/80 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl"
      >
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
          <div
            aria-hidden
            className="dark:hidden [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: light }}
          />
          <div
            aria-hidden
            className="hidden dark:block [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: dark }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
