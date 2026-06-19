import { useEffect, useRef, useState } from "react";
import { Menu, X, Download } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/LangContext";
import { useActiveSection } from "../hooks/useActiveSection";
import { t } from "../i18n/translations";

const SECTIONS = [
  "skills",
  "career",
  "projects",
  "services",
  "contact",
] as const;

export default function Header() {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLang();
  const [open, setOpen] = useState(false);
  const active = useActiveSection(SECTIONS);
  const wrapRef = useRef<HTMLDivElement>(null);

  // ferme le menu mobile sur Échap et au clic en dehors
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  const linkClass = (s: string) =>
    "font-mono text-sm transition " +
    (active === s ? "text-accent" : "text-muted hover:text-accent");

  return (
    <div ref={wrapRef} className="sticky top-0 z-50">
      <header className="border-b border-line bg-base/60 backdrop-blur-md">
        <div
          className="max-w-300 container-page
                        flex flex-wrap items-center justify-between gap-y-2
                        py-3 xs:min-h-16"
        >
          {/* burger (mobile) + logo, groupés à gauche */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label={t("a11y", open ? "closeMenu" : "openMenu", lang)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              className="nav:hidden p-1.5 rounded border border-line hover:border-accent text-ink transition"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>

            <a
              href="#"
              aria-current={active === "" ? "true" : undefined}
              className={
                "group font-mono inline-flex items-center transition " +
                (active === "" ? "text-accent" : "text-muted hover:text-accent")
              }
            >
              <span className="mr-1">//</span>
              <span className="relative">
                alexis.wallez
                {/* soulignement animé qui se déploie au survol */}
                <span
                  className="absolute left-0 -bottom-0.5 h-px w-full bg-accent
                                 scale-x-0 group-hover:scale-x-100 origin-left transition"
                />
              </span>
              {/* curseur clignotant qui apparaît au survol */}
              <span className="ml-0.5 opacity-0 group-hover:opacity-100 animate-pulse transition">
                _
              </span>
            </a>

            {/* indicateur de disponibilité : pastille toujours visible, texte en desktop */}
            <span
              title={t("a11y", "availableLong", lang)}
              aria-label={t("a11y", "availableLong", lang)}
              className="inline-flex items-center gap-1.5 font-mono text-xs text-muted"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75 animate-ping motion-reduce:animate-none" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="hidden nav:inline">{t("a11y", "available", lang)}</span>
            </span>
          </div>

          {/* nav desktop */}
          <nav
            aria-label={t("a11y", "primaryNav", lang)}
            className="hidden nav:flex items-center gap-6"
          >
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                aria-current={active === s ? "true" : undefined}
                className={linkClass(s)}
              >
                {t("nav", s, lang)}
              </a>
            ))}
          </nav>

          {/* actions à droite */}
          <div className="text-muted flex flex-wrap items-center gap-2">
            <a
              href="/cv-alexis-wallez.pdf"
              download
              aria-label={t("a11y", "downloadCV", lang)}
              title={t("a11y", "downloadCV", lang)}
              className="hidden nav:inline-flex items-center gap-1.5 font-mono text-sm px-3 py-1 rounded border border-line hover:border-accent hover:text-accent transition"
            >
              <Download size={14} />
              CV
            </a>
            <button
              onClick={toggleLang}
              aria-label={t("a11y", "switchLang", lang)}
              className="hidden nav:inline-flex font-mono text-sm px-3 py-1 rounded border border-line hover:border-accent transition"
            >
              <span className={lang === "fr" ? "text-accent" : "text-muted"}>
                FR
              </span>
              <span className="text-muted mx-1">/</span>
              <span className={lang === "en" ? "text-accent" : "text-muted"}>
                EN
              </span>
            </button>
            <button
              onClick={(e) => toggle(e)}
              aria-label={t("a11y", theme === "dark" ? "toLight" : "toDark", lang)}
              className="font-mono text-sm px-3 py-1 rounded border border-line hover:border-accent hover:text-accent transition"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>

      {/* menu mobile déroulant — toujours monté pour animer ouverture ET fermeture */}
      <nav
          id="mobile-menu"
          aria-label={t("a11y", "primaryNav", lang)}
          aria-hidden={!open}
          className={
            "nav:hidden absolute left-0 right-0 top-full border-t border-line bg-base/60 backdrop-blur-md shadow-lg " +
            "origin-top transition-all duration-200 ease-out motion-reduce:transition-none " +
            (open
              ? "opacity-100 translate-y-0 visible"
              : "opacity-0 -translate-y-3 invisible pointer-events-none")
          }
        >
          <div className="max-w-300 container-page py-4 flex flex-col gap-1">
            {SECTIONS.map((s, i) => (
              <a
                key={s}
                href={`#${s}`}
                onClick={() => setOpen(false)}
                aria-current={active === s ? "true" : undefined}
                className={
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 transition " +
                  (active === s
                    ? "bg-accent/10 text-accent"
                    : "text-ink hover:bg-accent/10")
                }
              >
                {/* numéro façon terminal - toujours visible */}
                <span className="font-mono text-xs text-accent w-6">
                  0{i + 1}
                </span>

                {/* barre d'accent - toujours visible */}
                <span className="h-4 w-0.5 rounded bg-accent" />

                {/* libellé */}
                <span className="font-mono text-sm group-hover:text-accent transition">
                  {t("nav", s, lang)}
                </span>

                {/* flèche à droite - toujours visible */}
                <span className="ml-auto font-mono text-accent">▸</span>
              </a>
            ))}

            {/* langue + téléchargement du CV, côte à côte */}
            <div className="flex items-center gap-2 mt-2 border-t border-line pt-3">
              <button
                onClick={toggleLang}
                aria-label={t("a11y", "switchLang", lang)}
                className="flex-1 font-mono text-sm px-3 py-2 rounded-lg border border-line hover:border-accent transition"
              >
                <span className={lang === "fr" ? "text-accent" : "text-muted"}>
                  FR
                </span>
                <span className="text-muted mx-1">/</span>
                <span className={lang === "en" ? "text-accent" : "text-muted"}>
                  EN
                </span>
              </button>
              <a
                href="/cv-alexis-wallez.pdf"
                download
                onClick={() => setOpen(false)}
                aria-label={t("a11y", "downloadCV", lang)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 font-mono text-sm px-3 py-2 rounded-lg border border-line text-ink hover:border-accent hover:text-accent transition"
              >
                <Download size={15} className="text-accent" />
                CV
              </a>
            </div>
          </div>
        </nav>
    </div>
  );
}
