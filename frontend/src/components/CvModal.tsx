import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Download } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

// worker PDF.js (rendu hors thread principal). Bundlé par Vite (?url).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const CV_URL = "/cv-alexis-wallez.pdf";

type Props = { onClose: () => void };

/**
 * Aperçu plein écran du CV (PDF) rendu nous-mêmes via PDF.js sur <canvas> :
 * aucune barre du lecteur du navigateur, rendu identique partout (iOS compris).
 * Même mécanique de modale que <Lightbox> (portail, focus-trap, Échap, scroll-lock).
 */
export default function CvModal({ onClose }: Props) {
  const { lang } = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pressedBackdrop = useRef(false);

  // --- modale : focus-trap (WCAG 2.4.3), Échap, scroll-lock de l'arrière-plan ---
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

  // --- rendu du PDF sur canvas (PDF.js), refait à chaque changement de taille ---
  useEffect(() => {
    const container = viewerRef.current;
    if (!container) return;
    let cancelled = false;
    let gen = 0;
    let pdf: PDFDocumentProxy | null = null;
    let raf = 0;
    const tasks: RenderTask[] = [];

    const render = async () => {
      if (!pdf || cancelled) return;
      const myGen = ++gen;
      tasks.forEach((task) => {
        try {
          task.cancel();
        } catch {
          /* noop */
        }
      });
      tasks.length = 0;
      container.innerHTML = "";
      // 1 page → centrée verticalement ; plusieurs → empilées depuis le haut
      container.classList.toggle("justify-center", pdf.numPages === 1);
      container.classList.toggle("justify-start", pdf.numPages > 1);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const availW = container.clientWidth - 32; // padding p-4 (16px × 2)
      const availH = container.clientHeight - 32;
      if (availW <= 0 || availH <= 0) return; // pas encore dimensionné

      for (let n = 1; n <= pdf.numPages; n++) {
        const page = await pdf.getPage(n);
        if (cancelled || myGen !== gen) return;
        const base = page.getViewport({ scale: 1 });
        // « contain » : la page entière tient dans la zone (pas de scroll par page)
        const fit = Math.min(availW / base.width, availH / base.height);
        const viewport = page.getViewport({ scale: fit * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${Math.floor(base.width * fit)}px`;
        canvas.style.height = `${Math.floor(base.height * fit)}px`;
        canvas.className = "rounded shadow-md";
        container.appendChild(canvas);
        const task = page.render({ canvas, viewport });
        tasks.push(task);
        try {
          await task.promise;
        } catch {
          /* rendu annulé (resize/fermeture) */
        }
        if (cancelled || myGen !== gen) return;
      }
    };

    const schedule = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(render);
    };

    const loadingTask = pdfjsLib.getDocument({ url: CV_URL });
    loadingTask.promise
      .then((doc) => {
        if (cancelled) return;
        pdf = doc;
        render();
      })
      .catch((e) => {
        if (!cancelled) console.error("Rendu PDF échoué:", e);
      });

    const ro = new ResizeObserver(schedule);
    ro.observe(container);

    return () => {
      cancelled = true;
      ro.disconnect();
      cancelAnimationFrame(raf);
      tasks.forEach((task) => {
        try {
          task.cancel();
        } catch {
          /* noop */
        }
      });
      loadingTask.destroy();
    };
  }, []);

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

        {/* aperçu du PDF rendu sur canvas (le bouton Télécharger reste le secours) */}
        <div
          ref={viewerRef}
          aria-label={t("a11y", "cvTitle", lang)}
          className="min-h-0 flex-1 w-full overflow-auto p-4 flex flex-col items-center gap-4"
        />
      </div>
    </div>,
    document.body,
  );
}
