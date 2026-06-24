import { lazy, Suspense } from "react";
import { useLang } from "./i18n/LangContext";
import { t } from "./i18n/translations";
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
import Footer from "./components/Footer";
import Background from "./components/Background";
import Reveal from "./components/Reveal";
import BackToTop from "./components/BackToTop";
import ScrollProgress from "./components/ScrollProgress";

export default function App() {
  const { lang } = useLang();

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
