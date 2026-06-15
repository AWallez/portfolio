import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

export default function About() {
  const { lang } = useLang();

  return (
    <section id="about" className="max-w-300 mx-auto px-5 sm:px-6 lg:px-8 py-7 w-full">
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

      <div className="space-y-4 text-ink leading-relaxed">
        <p className="text-readable w-fit">{t("about", "body", lang)}</p>
        <p className="text-muted text-readable w-fit">
          {t("about", "extra", lang)}
        </p>
      </div>
    </section>
  );
}
