import { MapPin, Briefcase, BadgeCheck, Languages } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";

export default function About() {
  const { lang } = useLang();

  const facts = [
    { Icon: MapPin, label: "Savigny-le-Temple (77)" },
    { Icon: Briefcase, label: t("about", "factExp", lang) },
    { Icon: BadgeCheck, label: t("about", "factStatus", lang) },
    { Icon: Languages, label: t("about", "factLang", lang) },
  ];

  return (
    <section
      id="about"
      className="max-w-300 container-page py-7 w-full"
    >
      {/* titre de section, style commentaire de code */}
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("about", "title", lang)}
      </h2>

      {/* rappel terminal : la "commande" qui a produit ce texte */}
      <p className="font-mono text-xs text-muted mb-6 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("about", "command", lang)}
      </p>

      <div
        {...spotlight}
        className="spotlight rounded-xl border-l-2 border-l-accent border-y border-r border-line
                   bg-base/45 backdrop-blur-[2px] p-6 shadow-sm"
      >
        <div className="space-y-4 text-ink leading-relaxed">
          <p>{t("about", "body", lang)}</p>
          <p className="text-muted">{t("about", "extra", lang)}</p>
        </div>

        {/* faits-clés */}
        <div className="mt-6 flex flex-wrap gap-2">
          {facts.map(({ Icon, label }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono
                         bg-accent/10 text-accent border border-accent/30"
            >
              <Icon size={13} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
