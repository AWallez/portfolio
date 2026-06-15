import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { useLang } from "../i18n/LangContext";
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

  return (
    <div className="sticky top-0 z-50">
      <header className="border-b border-line bg-base/60 backdrop-blur-md">
        <div
          className="max-w-300 mx-auto px-5 sm:px-6 lg:px-8
                        flex flex-wrap items-center justify-between gap-y-2
                        py-3 xs:py-0 xs:h-16"
        >
          {/* burger (mobile) + logo, groupés à gauche */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="nav:hidden p-1.5 rounded border border-line hover:border-accent text-ink transition"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>

            <a
              href="#"
              className="group font-mono text-accent inline-flex items-center
                         hover:opacity-100 transition"
            >
              <span className="text-muted group-hover:text-accent transition mr-1">
                //
              </span>
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
          </div>

          {/* nav desktop */}
          <nav className="hidden nav:flex items-center gap-6">
            {SECTIONS.map((s) => (
              <a
                key={s}
                href={`#${s}`}
                className="font-mono text-sm text-muted hover:text-accent transition"
              >
                {t("nav", s, lang)}
              </a>
            ))}
          </nav>

          {/* actions à droite */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={toggleLang}
              aria-label="Changer de langue"
              className="font-mono text-sm px-3 py-1 rounded border border-line hover:border-accent transition"
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
              onClick={toggle}
              aria-label="Changer de thème"
              className="font-mono text-sm px-3 py-1 rounded border border-line hover:border-accent hover:text-accent transition"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>
        </div>
      </header>

      {/* menu mobile déroulant — SORTI du header, frère de celui-ci */}
      {open && (
        <nav className="nav:hidden absolute left-0 right-0 top-full border-t border-line bg-base/60 backdrop-blur-md shadow-lg">
          <div className="max-w-300 mx-auto px-5 py-4 flex flex-col gap-1">
            {SECTIONS.map((s, i) => (
              <a
                key={s}
                href={`#${s}`}
                onClick={() => setOpen(false)}
                className="group flex items-center gap-3 rounded-lg px-3 py-2.5
                       text-ink hover:bg-accent/10 transition"
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
          </div>
        </nav>
      )}
    </div>
  );
}
