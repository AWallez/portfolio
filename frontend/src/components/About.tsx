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
        {/* profil « neofetch » (à gauche) — 40 % de la carte */}
        <div
          className="min-w-0 shrink-0 font-mono text-xs sm:text-sm
                     md:flex md:flex-col md:justify-center"
        >
          {/* Bloc neofetch centré dans la colonne (w-fit + mx-auto) : l'en-tête,
              le séparateur et les infos partagent donc la MÊME largeur — celle
              des infos, la plus large. Le titre se cale sur le bord gauche et le
              logo sur le bord droit, tous deux alignés avec les lignes d'infos. */}
          <div className="mx-auto w-fit">
            {/* en-tête : titre à gauche, logo ASCII à droite, centrés en hauteur */}
            <div className="flex items-center justify-between gap-6">
              <p className="self-end">
                <span className="text-accent font-semibold">alexis</span>
                <span className="text-muted">@</span>
                <span className="text-accent font-semibold">wallez</span>
              </p>
              <pre
                aria-hidden
                className="shrink-0 select-none leading-none text-accent dark:text-accent/50
                           text-[0.34rem] xs:text-[0.4rem]"
              >
                {ASCII}
              </pre>
            </div>
            {/* séparateur : filet 1px, sur toute la largeur du bloc */}
            <div aria-hidden className="my-3 border-t border-muted/40" />
            {/* contenu aligné à gauche → Role / OS / Host… sur la même verticale.
                Chaque ligne en flex : le libellé garde sa colonne (w-20) et la
                valeur s'aligne sur elle-même quand elle revient à la ligne. */}
            <div className="space-y-1">
              {info.map(([k, v, href]) => (
                <p key={k} className="flex">
                  <span className="w-20 shrink-0 text-accent">{k}</span>
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 wrap-break-word text-ink underline-offset-2 transition hover:text-accent hover:underline"
                    >
                      {v}
                    </a>
                  ) : (
                    <span className="min-w-0 wrap-break-word text-ink">{v}</span>
                  )}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* bio (à droite) */}
        <div
          className="space-y-4 text-ink leading-relaxed text-justify
                     border-t border-line pt-6
                     md:min-w-0 md:flex-1 md:border-t-0 md:border-l md:pt-0 md:pl-8
                     md:flex md:flex-col md:justify-center"
        >
          <p>{t("about", "body", lang)}</p>
          <p className="text-muted">{t("about", "extra", lang)}</p>
        </div>
      </div>
    </section>
  );
}
