import { lazy, Suspense, useEffect } from "react";
import NotFound from "./components/NotFound";
import Accueil from "./components/Accueil";
import { currentPath, matchLegal } from "./lib/routes";
// LegalPage embarque toute la prose juridique : hors du bundle de l'accueil,
// que quasiment personne ne quitte pour aller la lire.
const LegalPage = lazy(() => import("./components/LegalPage"));

// Nginx renvoie index.html pour toute route inconnue (fallback SPA) → c'est
// ici qu'on aiguille : l'accueil, une page légale, ou la 404.
const path = currentPath();
const isHome = ["/", "/index.html"].includes(path);
const legal = matchLegal(path);

export default function App() {
  // Curseur « _ » qui clignote dans le titre de l'onglet quand il passe en
  // arrière-plan (clin d'œil terminal + rappel discret). Onglet actif = titre
  // SEO d'origine intact, donc aucune incidence sur l'indexation.
  useEffect(() => {
    if (!isHome) return;
    const original = document.title;
    let timer: number | undefined;
    const onVisibility = () => {
      if (document.hidden) {
        let on = true;
        timer = window.setInterval(() => {
          document.title = on ? "// alexis.wallez_" : "// alexis.wallez";
          on = !on;
        }, 700);
      } else {
        if (timer) clearInterval(timer);
        document.title = original;
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (timer) clearInterval(timer);
      document.title = original;
    };
  }, []);

  if (legal)
    return (
      <Suspense fallback={<div className="min-h-screen" />}>
        <LegalPage kind={legal} />
      </Suspense>
    );
  if (!isHome) return <NotFound />;

  return <Accueil />;
}
