import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

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
const MIN_SCALE = 1;
const MAX_SCALE = 5;

// Dimensions d'affichage (px CSS) calculées depuis la fenêtre + un ratio donné.
function computeSizeFor(ratio: number) {
  const vw = window.innerWidth;
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const availW = Math.min(vw * 0.95, 896) - 28; // - padding (p-3.5)
  const availH = Math.min(vh * 0.92, 1200) - 56 - 28; // - barre - padding
  let h = Math.max(availH, 0);
  let w = h * ratio;
  if (w > availW) {
    w = Math.max(availW, 0);
    h = w / ratio;
  }
  return { w: Math.floor(w), h: Math.floor(h) };
}

const clamp = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

type Transform = { scale: number; tx: number; ty: number };
const IDENTITY: Transform = { scale: 1, tx: 0, ty: 0 };

type Props = { onClose: () => void };

/**
 * Aperçu plein écran du CV en SVG (vectoriel) : zoom net à l'infini, sans pdfjs.
 * Zoom à la molette / au pinch / aux boutons, déplacement au drag. La taille de la
 * modale épouse le format A4 (ratio réel du SVG) et s'adapte à l'écran en temps réel.
 * Même mécanique de modale que <Lightbox> (portail, focus-trap, Échap, scroll-lock).
 */
export default function CvModal({ onClose }: Props) {
  const { lang } = useLang();
  const cv = CV_FILES[lang]; // CV de la langue courante (FR/EN)
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const ratioRef = useRef(A4_RATIO);
  const pressedBackdrop = useRef(false);

  const computeSize = useCallback(() => computeSizeFor(ratioRef.current), []);
  const [size, setSize] = useState(() => computeSizeFor(A4_RATIO));
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // transform (zoom/déplacement) : ref = source de vérité, state = rendu
  const [transform, setTransform] = useState<Transform>(IDENTITY);
  const transformRef = useRef<Transform>(IDENTITY);
  const apply = useCallback((next: Transform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);
  const reset = useCallback(() => apply(IDENTITY), [apply]);

  // zoom centré sur un point (coords écran) en le gardant fixe
  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const el = viewerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = clientX - rect.left - rect.width / 2;
      const py = clientY - rect.top - rect.height / 2;
      const cur = transformRef.current;
      const ns = clamp(cur.scale * factor);
      if (ns === cur.scale) return;
      if (ns === 1) {
        apply(IDENTITY);
        return;
      }
      const r = ns / cur.scale;
      apply({ scale: ns, tx: px - r * (px - cur.tx), ty: py - r * (py - cur.ty) });
    },
    [apply],
  );

  const zoomByCenter = useCallback(
    (factor: number) => {
      const el = viewerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
    },
    [zoomAt],
  );

  // --- gestes : molette (zoom), drag (déplacement), pinch (zoom tactile) ---
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef(0);

  const onWheel = (e: React.WheelEvent) => {
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.12 : 1 / 1.12);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    viewerRef.current?.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    if (pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist.current > 0)
        zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, dist / pinchDist.current);
      pinchDist.current = dist;
    } else if (transformRef.current.scale > 1) {
      const cur = transformRef.current;
      apply({ ...cur, tx: cur.tx + dx, ty: cur.ty + dy });
    }
  };
  const onPointerUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = 0;
  };

  // --- recalcule la taille au redimensionnement / zoom / rotation ---
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

  const zoomBtn =
    "grid h-8 w-8 place-items-center rounded-md text-ink hover:text-accent " +
    "disabled:opacity-40 disabled:hover:text-ink transition";

  const transformStyle = {
    transform: `translate(${transform.tx}px, ${transform.ty}px) scale(${transform.scale})`,
    transformOrigin: "center" as const,
  };

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
              href={cv.pdf}
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

        {/* aperçu : zone A4 dimensionnée dès l'ouverture (pas de cadre vide) */}
        <div className="p-3.5">
          <div
            ref={viewerRef}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onDoubleClick={(e) =>
              zoomAt(e.clientX, e.clientY, transform.scale > 1 ? 1 / transform.scale : 2.2)
            }
            className="relative touch-none select-none overflow-hidden rounded shadow-md
                       bg-white dark:bg-[#0d1418]"
            style={{
              width: size.w,
              height: size.h,
              cursor: transform.scale > 1 ? "grab" : "auto",
            }}
          >
            {!error && (
              <>
                <img
                  src={cv.light}
                  alt={t("a11y", "cvTitle", lang)}
                  draggable={false}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    if (img.naturalWidth && img.naturalHeight) {
                      ratioRef.current = img.naturalWidth / img.naturalHeight;
                      setSize(computeSize());
                    }
                    setLoaded(true);
                  }}
                  onError={() => {
                    setError(true);
                    setLoaded(true);
                  }}
                  className="absolute inset-0 h-full w-full object-contain dark:hidden"
                  style={transformStyle}
                />
                <img
                  src={cv.dark}
                  alt=""
                  aria-hidden
                  draggable={false}
                  className="absolute inset-0 hidden h-full w-full object-contain dark:block"
                  style={transformStyle}
                />
              </>
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

            {/* contrôles de zoom flottants */}
            {!error && (
              <div
                onPointerDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1
                           rounded-lg border border-line bg-base/90 px-1.5 py-1 shadow-md backdrop-blur-xs"
              >
                <button
                  type="button"
                  onClick={() => zoomByCenter(1 / 1.3)}
                  disabled={transform.scale <= MIN_SCALE}
                  aria-label={t("a11y", "zoomOut", lang)}
                  className={zoomBtn}
                >
                  <ZoomOut size={16} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={reset}
                  disabled={transform.scale === 1 && transform.tx === 0 && transform.ty === 0}
                  aria-label={t("a11y", "zoomReset", lang)}
                  className={zoomBtn}
                >
                  <Maximize2 size={15} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => zoomByCenter(1.3)}
                  disabled={transform.scale >= MAX_SCALE}
                  aria-label={t("a11y", "zoomIn", lang)}
                  className={zoomBtn}
                >
                  <ZoomIn size={16} aria-hidden />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
