import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Loader2 } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { PDFPageProxy, RenderTask } from "pdfjs-dist";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

// worker PDF.js (rendu hors thread principal). Bundlé par Vite (?url).
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const CV_URL = "/cv-alexis-wallez.pdf";
const A4_RATIO = 0.7071; // largeur / hauteur (≈ 1/√2), avant lecture de la page

// Dimensions d'affichage du CV (px CSS) calculées depuis la fenêtre + un ratio donné.
// Pure (ratio en paramètre) → utilisable à l'init sans lire de ref pendant le rendu.
function computeSizeFor(ratio: number) {
  const vw = window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const availW = Math.min(vw * 0.95, 896) - 28; // - padding viewer (p-3.5)
  const availH = Math.min(vh * 0.92, 1200) - 56 - 28; // - barre - padding
  let h = Math.max(availH, 0);
  let w = h * ratio;
  if (w > availW) {
    w = Math.max(availW, 0);
    h = w / ratio;
  }
  return { w: Math.floor(w), h: Math.floor(h) };
}

type Props = { onClose: () => void };

/**
 * Aperçu plein écran du CV (PDF) rendu via PDF.js sur <canvas> : aucune barre du
 * navigateur, rendu identique partout (iOS compris). La taille est calculée en
 * React d'après l'écran (hauteur + largeur) et le ratio réel de la page → la
 * modale épouse le CV au format A4 et s'adapte en temps réel au redimensionnement.
 * Même mécanique de modale que <Lightbox> (portail, focus-trap, Échap, scroll-lock).
 */
export default function CvModal({ onClose }: Props) {
  const { lang } = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pageRef = useRef<PDFPageProxy | null>(null);
  const taskRef = useRef<RenderTask | null>(null);
  const ratioRef = useRef(A4_RATIO);
  const pressedBackdrop = useRef(false);

  // version qui lit le ratio réel (cantonnée aux effets, jamais au rendu)
  const computeSize = useCallback(() => computeSizeFor(ratioRef.current), []);

  const [size, setSize] = useState(() => computeSizeFor(A4_RATIO));
  const [loading, setLoading] = useState(true);
  const [pageReady, setPageReady] = useState(false);

  // chargement du PDF (une fois) → lit le ratio réel, ajuste la taille, signale prêt
  useEffect(() => {
    const loadingTask = pdfjsLib.getDocument({ url: CV_URL });
    let cancelled = false;
    loadingTask.promise
      .then(async (pdf) => {
        const page = await pdf.getPage(1);
        if (cancelled) return;
        pageRef.current = page;
        const base = page.getViewport({ scale: 1 });
        ratioRef.current = base.width / base.height; // ratio exact de la page
        setSize(computeSize());
        setPageReady(true);
      })
      .catch((e) => {
        if (!cancelled) console.error("Rendu PDF échoué:", e);
      });
    return () => {
      cancelled = true;
      taskRef.current?.cancel();
      loadingTask.destroy();
    };
  }, [computeSize]);

  // rend la page dès qu'elle est prête, puis à chaque changement de taille
  useEffect(() => {
    const page = pageRef.current;
    const canvas = canvasRef.current;
    if (!pageReady || !page || !canvas || size.w <= 0) return;
    taskRef.current?.cancel();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: (size.w / base.width) * dpr });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    const task = page.render({ canvas, viewport });
    taskRef.current = task;
    task.promise.then(() => setLoading(false)).catch(() => {
      /* rendu annulé (resize/fermeture) */
    });
  }, [size.w, size.h, pageReady]);

  // recalcule la taille au redimensionnement / zoom / rotation
  useEffect(() => {
    const onResize = () => setSize(computeSize());
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
    };
  }, [computeSize]);

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
        className="relative flex max-h-[92dvh] max-w-[95vw] flex-col overflow-hidden
                   rounded-xl border border-line bg-base shadow-2xl sm:max-w-4xl"
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

        {/* aperçu : zone dimensionnée au format A4 dès l'ouverture (pas de cadre vide) */}
        <div className="flex items-center justify-center p-3.5">
          <div
            className="relative shrink-0 overflow-hidden rounded shadow-md"
            style={{ width: size.w, height: size.h }}
          >
            <canvas ref={canvasRef} className="block h-full w-full" />
            {loading && (
              <div className="absolute inset-0 grid place-items-center bg-surface/40">
                <Loader2 className="h-7 w-7 animate-spin text-accent" aria-hidden />
                <span className="sr-only">{t("a11y", "loading", lang)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
