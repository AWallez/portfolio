import { useEffect } from "react";
import { useLang } from "../i18n/LangContext";

// Page 404 façon terminal : rendue par App quand le chemin n'est pas la racine
// (Nginx renvoie index.html pour toute route inconnue → le SPA fait le tri).
// Textes localisés en dur ici, comme les lignes du Hero.
const T = {
  fr: {
    title: "404 — introuvable · Alexis Wallez",
    error: "Aucun fichier ou dossier de ce type",
    hint: "Le portfolio tient sur une seule page — tout est sur l'accueil.",
    home: "cd ~  (retour à l'accueil)",
  },
  en: {
    title: "404 — not found · Alexis Wallez",
    error: "No such file or directory",
    hint: "This portfolio is a single page — everything lives on the home page.",
    home: "cd ~  (back to home)",
  },
};

export default function NotFound() {
  const { lang } = useLang();
  const path = window.location.pathname;

  useEffect(() => {
    const prev = document.title;
    document.title = T[lang].title;
    return () => {
      document.title = prev;
    };
  }, [lang]);

  return (
    <main className="min-h-screen flex items-center justify-center container-page">
      <div className="w-full max-w-130 rounded-xl border border-line bg-base/60 backdrop-blur-[3px] shadow-lg overflow-hidden">
        {/* barre de titre, même style que le terminal du Hero */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 font-mono text-xs text-muted">
            alexis@wallez:~$
          </span>
        </div>

        <div className="p-5 font-mono text-sm leading-relaxed">
          <p className="wrap-break-word">
            <span className="text-accent">alexis@wallez</span>
            <span className="text-muted">:</span>
            <span className="text-sky-500 dark:text-sky-400">~</span>
            <span className="text-muted">$ </span>
            <span className="text-ink">cd {path}</span>
          </p>
          <p className="text-muted wrap-break-word">
            bash : cd : {path} : {T[lang].error}
          </p>
          <p className="text-muted mt-3">{T[lang].hint}</p>

          <p className="mt-5 wrap-break-word">
            <span className="text-accent">alexis@wallez</span>
            <span className="text-muted">:</span>
            <span className="text-sky-500 dark:text-sky-400">~</span>
            <span className="text-muted">$ </span>
            <a
              href="/"
              className="text-accent font-medium underline-offset-4 hover:underline"
            >
              {T[lang].home}
            </a>
            <span className="inline-block w-2 h-4 bg-accent animate-pulse motion-reduce:animate-none align-middle ml-1" />
          </p>
        </div>
      </div>
    </main>
  );
}
