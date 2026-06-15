import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

export default function BackToTop() {
  const { lang } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toTop() {
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    <button
      type="button"
      onClick={toTop}
      aria-label={t("a11y", "backToTop", lang)}
      title={t("a11y", "backToTop", lang)}
      className={
        "fixed bottom-5 right-5 z-50 p-2.5 rounded-lg border border-line " +
        "bg-base/70 backdrop-blur-md text-accent shadow-lg " +
        "hover:border-accent hover:-translate-y-0.5 transition " +
        (visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none")
      }
    >
      <ArrowUp size={18} />
    </button>
  );
}
