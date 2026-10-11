import { Component, type ReactNode } from "react";

// Dernier filet : une erreur de rendu affichait une page blanche. Placé au-dessus
// de LangProvider pour tout attraper, il lit donc la langue sur <html lang>
// (tenue à jour par LangProvider, « fr » par défaut dans index.html).
const T = {
  fr: {
    title: "Une erreur a empêché l’affichage du site.",
    reload: "Recharger la page",
    help: "Si le problème persiste, écrivez-moi :",
  },
  en: {
    title: "An error stopped the site from displaying.",
    reload: "Reload the page",
    help: "If it keeps happening, email me:",
  },
};
const EMAIL = "wallezalexis@gmail.com";

type State = { failed: boolean };

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    const txt = document.documentElement.lang === "en" ? T.en : T.fr;
    return (
      <main className="min-h-screen grid place-items-center p-6 text-ink">
        <div className="max-w-md w-full rounded-xl border border-line bg-surface p-6 font-mono text-sm space-y-4">
          <p>
            <span className="text-accent">$ </span>
            {txt.title}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-base"
          >
            {txt.reload}
          </button>
          <p className="text-xs text-muted">
            {txt.help}{" "}
            <a
              href={`mailto:${EMAIL}`}
              className="text-accent underline underline-offset-2"
            >
              {EMAIL}
            </a>
          </p>
        </div>
      </main>
    );
  }
}
