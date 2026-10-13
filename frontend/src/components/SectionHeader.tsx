import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

type Section = "about" | "skills" | "career" | "projects" | "services" | "contact";

// En-tête commun des sections : titre en commentaire de code, puis la
// « commande » qui a produit le contenu, façon invite de terminal.
export default function SectionHeader({
  section,
  className = "mb-8",
}: {
  section: Section;
  /** marge sous la commande (À propos est plus serré) */
  className?: string;
}) {
  const { lang } = useLang();
  return (
    <>
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t(section, "title", lang)}
      </h2>
      <p className={`font-mono text-xs text-muted text-readable w-fit ${className}`}>
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t(section, "command", lang)}
      </p>
    </>
  );
}
