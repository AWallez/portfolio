import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

const btn =
  "grid h-8 w-8 place-items-center rounded-md text-ink hover:text-accent " +
  "disabled:opacity-40 disabled:hover:text-ink transition";

type Props = {
  zoomByCenter: (factor: number) => void;
  reset: () => void;
  canZoomIn: boolean;
  canZoomOut: boolean;
  isReset: boolean;
};

/** Trio de boutons zoom −/réinitialiser/+ partagé par les aperçus (CV, projets). */
export default function ZoomControls({
  zoomByCenter,
  reset,
  canZoomIn,
  canZoomOut,
  isReset,
}: Props) {
  const { lang } = useLang();
  return (
    <div className="flex items-center rounded-lg border border-line">
      <button
        type="button"
        onClick={() => zoomByCenter(1 / 1.3)}
        disabled={!canZoomOut}
        aria-label={t("a11y", "zoomOut", lang)}
        className={btn}
      >
        <ZoomOut size={16} aria-hidden />
      </button>
      <button
        type="button"
        onClick={reset}
        disabled={isReset}
        aria-label={t("a11y", "zoomReset", lang)}
        className={btn}
      >
        <Maximize2 size={15} aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => zoomByCenter(1.3)}
        disabled={!canZoomIn}
        aria-label={t("a11y", "zoomIn", lang)}
        className={btn}
      >
        <ZoomIn size={16} aria-hidden />
      </button>
    </div>
  );
}
