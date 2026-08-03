import { lazy, Suspense, useEffect } from "react";
import { useLang } from "./i18n/LangContext";
import { t } from "./i18n/translations";
import NotFound from "./components/NotFound";
import { currentPath, matchLegal } from "./lib/routes";
import Header from "./components/Header";
import Hero from "./components/Hero";
import About from "./components/About";
import Skills from "./components/Skills";
import Career from "./components/Career";
import Services from "./components/Services";
// Sous la ligne de flottaison → chargés à la demande, hors du bundle initial :
// - Projects embarque 10 SVG inline (light+dark) via ?raw,
// - Contact tire react-phone-number-input (~155 ko de métadonnées).
const Projects = lazy(() => import("./components/Projects"));
const Contact = lazy(() => import("./components/Contact"));
// - LegalPage embarque toute la prose juridique : hors du bundle de l'accueil,
//   que quasiment personne ne quitte pour aller la lire.
const LegalPage = lazy(() => import("./components/LegalPage"));
import Footer from "./components/Footer";
import Background from "./components/Background";
import Reveal from "./components/Reveal";
import BackToTop from "./components/BackToTop";
import ScrollProgress from "./components/ScrollProgress";

// Nginx renvoie index.html pour toute route inconnue (fallback SPA) → c'est
// ici qu'on aiguille : l'accueil, une page légale, ou la 404.
const path = currentPath();
const isHome = ["/", "/index.html"].includes(path);
const legal = matchLegal(path);

export default function App() {
  const { lang } = useLang();

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

  return (
    <div className="min-h-screen text-ink">
      <a
        href="#main"
        className="skip-link font-mono text-sm px-4 py-2 rounded-lg bg-accent text-base shadow-lg"
      >
        {t("a11y", "skip", lang)}
      </a>
      <ScrollProgress />
      <Background />
      <Header />
      {/* overflow-x-clip ici (pas sur html/body) : contient le débordement
          horizontal des animations Reveal sans casser le sticky/fixed sur iOS.
          'clip' ne crée pas de conteneur de scroll. */}
      <main id="main" className="overflow-x-clip">
        <div className="min-h-[calc(100dvh-4rem)] flex flex-col justify-center gap-8">
          <Hero key={lang} />
          <Reveal variant="zoom">
            <About key={`about-${lang}`} />
          </Reveal>
        </div>
        <Skills key={`skills-${lang}`} />
        <Career key={`career-${lang}`} />
        <Suspense fallback={<div className="min-h-screen" />}>
          <Projects key={`projects-${lang}`} />
        </Suspense>
        <Services key={`services-${lang}`} />
        <div className="min-h-[calc(100dvh-4rem)] flex flex-col">
          <div className="grow flex flex-col justify-center">
            <Suspense fallback={<div className="min-h-125" />}>
              <Reveal variant="up">
                <Contact key={`contact-${lang}`} />
              </Reveal>
            </Suspense>
          </div>
          <Footer key={`footer-${lang}`} />
        </div>
      </main>
      <BackToTop />
    </div>
  );
}
