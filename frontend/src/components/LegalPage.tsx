import { useEffect } from "react";
import { ArrowLeft, Languages } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { MENTIONS, PRIVACY, type LegalDoc } from "../i18n/legal";
import { LEGAL_PATHS, type LegalKind } from "../lib/routes";

// Pages légales (mentions + confidentialité), rendues par App selon le chemin.
// Autonomes comme NotFound : ni Header ni Footer du site — sa navigation pointe
// vers des ancres de l'accueil, qui n'existent pas ici. On garde donc juste le
// retour à l'accueil et le sélecteur de langue (le thème, lui, est déjà
// persisté par useTheme au niveau du document).

const DOCS: Record<LegalKind, LegalDoc> = {
  mentions: MENTIONS,
  privacy: PRIVACY,
};

const T = {
  home: { fr: "Retour à l'accueil", en: "Back to home" },
  updated: { fr: "Dernière mise à jour", en: "Last updated" },
  other: {
    mentions: { fr: "Politique de confidentialité", en: "Privacy policy" },
    privacy: { fr: "Mentions légales", en: "Legal notice" },
  },
  command: {
    mentions: "cat mentions-legales.md",
    privacy: "cat confidentialite.md",
  },
};

export default function LegalPage({ kind }: { kind: LegalKind }) {
  const { lang, toggle } = useLang();
  const doc = DOCS[kind];
  const other: LegalKind = kind === "mentions" ? "privacy" : "mentions";

  useEffect(() => {
    const prev = document.title;
    document.title = `${doc.title[lang]} · Alexis Wallez`;
    return () => {
      document.title = prev;
    };
  }, [doc, lang]);

  return (
    <div className="min-h-screen text-ink">
      <header className="border-b border-line bg-base/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-200 container-page py-4 flex items-center justify-between gap-4">
          <a
            href="/"
            className="inline-flex items-center gap-2 font-mono text-sm text-muted
                       hover:text-accent transition"
          >
            <ArrowLeft size={16} aria-hidden />
            {T.home[lang]}
          </a>
          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center gap-2 font-mono text-sm text-muted
                       hover:text-accent transition"
          >
            <Languages size={16} aria-hidden />
            {lang === "fr" ? "EN" : "FR"}
          </button>
        </div>
      </header>

      <main className="max-w-200 container-page py-12">
        <p className="font-mono text-sm text-accent mb-2">
          <span className="text-muted">$</span> {T.command[kind]}
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2">
          {doc.title[lang]}
        </h1>
        <p className="font-mono text-xs text-muted mb-10">
          {T.updated[lang]} :{" "}
          <time dateTime={doc.updated}>
            {new Date(doc.updated).toLocaleDateString(
              lang === "fr" ? "fr-FR" : "en-GB",
              { year: "numeric", month: "long", day: "numeric" },
            )}
          </time>
        </p>

        <div className="space-y-10">
          {doc.sections.map((section) => (
            <section key={section.h.fr}>
              <h2 className="text-xl font-semibold mb-3 text-ink">
                <span className="text-accent font-mono mr-2">//</span>
                {section.h[lang]}
              </h2>
              <div className="space-y-3 text-muted leading-relaxed text-justify hyphens-auto">
                {section.blocks.map((block, i) =>
                  "p" in block ? (
                    <p key={i}>{block.p[lang]}</p>
                  ) : (
                    <ul key={i} className="space-y-2">
                      {block.ul.map((item) => (
                        <li key={item.fr} className="flex gap-3">
                          <span className="text-accent shrink-0" aria-hidden>
                            —
                          </span>
                          <span>{item[lang]}</span>
                        </li>
                      ))}
                    </ul>
                  ),
                )}
              </div>
            </section>
          ))}
        </div>

        <nav className="mt-14 pt-6 border-t border-line">
          <a
            href={LEGAL_PATHS[other]}
            className="font-mono text-sm text-accent underline-offset-4 hover:underline"
          >
            → {T.other[kind][lang]}
          </a>
        </nav>
      </main>
    </div>
  );
}
