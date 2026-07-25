import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";

// Logo ASCII « AW » (police ANSI Shadow) — donne l'aspect `neofetch` à la carte.
// Chaque ligne fait 18 caractères → aligné en police mono (JetBrains Mono).
const ASCII = ` █████╗ ██╗    ██╗
██╔══██╗██║    ██║
███████║██║ █╗ ██║
██╔══██║██║███╗██║
██║  ██║╚███╔███╔╝
╚═╝  ╚═╝ ╚══╝╚══╝ `;

export default function About() {
  const { lang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  // Bloc d'infos façon `neofetch` (libellés en anglais = universel, comme l'outil ;
  // les valeurs, elles, sont localisées).
  // Bloc d'infos façon `neofetch` (libellés en anglais = universel, comme l'outil ;
  // valeurs localisées). 3ᵉ champ optionnel = lien cliquable.
  const info: [string, string, string?][] = [
    ["Role", tr("Dév. Full-Stack & DevOps", "Full-Stack Dev & DevOps")],
    ["OS", "Linux"],
    ["Host", "Savigny-le-Temple (77)"],
    ["Uptime", tr("~4 ans", "~4 yrs")],
    ["Editor", "VS Code"],
    ["Stack", "React · TS · Node · Docker"],
    ["Lang", "FR · EN"],
    ["Status", tr("Freelance · disponible", "Freelance · available")],
    ["IRL", tr("Sapeur-pompier volontaire", "Volunteer firefighter")],
    ["GitHub", "AWallez", "https://github.com/AWallez"],
  ];

  return (
    <section id="about" className="max-w-300 container-page py-7 w-full">
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
        className="spotlight rounded-xl border border-line
                   bg-base/60 backdrop-blur-[3px] p-6 shadow-sm
                   flex flex-col gap-6 md:flex-row md:gap-8"
      >
        {/* profil « neofetch » (à gauche) : logo ASCII + infos clés */}
        <div
          className="shrink-0 flex flex-col gap-4 font-mono
                     xs:flex-row xs:items-center xs:gap-6"
        >
          <pre
            aria-hidden
            className="shrink-0 select-none text-accent leading-none text-[0.6rem] xs:text-[0.72rem]"
          >
            {ASCII}
          </pre>

          <div className="min-w-0 space-y-1 text-xs sm:text-sm">
            <p>
              <span className="text-accent font-semibold">alexis</span>
              <span className="text-muted">@</span>
              <span className="text-accent font-semibold">wallez</span>
            </p>
            <p className="text-muted select-none" aria-hidden>
              ────────────────
            </p>
            {info.map(([k, v, href]) => (
              <p key={k} className="wrap-break-word">
                <span className="inline-block w-20 text-accent">{k}</span>
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink underline-offset-2 transition hover:text-accent hover:underline"
                  >
                    {v}
                  </a>
                ) : (
                  <span className="text-ink">{v}</span>
                )}
              </p>
            ))}
          </div>
        </div>

        {/* bio (à droite) */}
        <div
          className="space-y-4 text-ink leading-relaxed border-t border-line pt-6
                     md:min-w-0 md:flex-1 md:border-t-0 md:border-l md:pt-0 md:pl-8"
        >
          <p>{t("about", "body", lang)}</p>
          <p className="text-muted">{t("about", "extra", lang)}</p>
        </div>
      </div>
    </section>
  );
}
