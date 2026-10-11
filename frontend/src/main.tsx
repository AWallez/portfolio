import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "react-phone-number-input/style.css";
import "./index.css";
import App from "./App.tsx";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { LangProvider } from "./i18n/LangContext";
import ErrorBoundary from "./components/ErrorBoundary";

// Après un déploiement, un onglet resté ouvert réclame des fichiers JS (noms à
// empreinte) qui n'existent plus : on recharge une fois pour récupérer la
// nouvelle version. Au-delà d'un essai en 10 s, on laisse l'erreur remonter
// jusqu'à l'ErrorBoundary plutôt que de recharger en boucle.
window.addEventListener("vite:preloadError", (event) => {
  try {
    const last = Number(sessionStorage.getItem("preload-reload") ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem("preload-reload", String(Date.now()));
  } catch {
    return; // sans stockage, impossible de garantir l'absence de boucle
  }
  event.preventDefault();
  window.location.reload();
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <LangProvider>
        <App />
      </LangProvider>
    </ErrorBoundary>
  </StrictMode>,
);
