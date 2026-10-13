import { lazy, Suspense } from "react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import Header from "./Header";
import Hero from "./Hero";
import About from "./About";
import Skills from "./Skills";
import Career from "./Career";
import Services from "./Services";
import Footer from "./Footer";
import Background from "./Background";
import Reveal from "./Reveal";
import QuandProche from "./QuandProche";
import BackToTop from "./BackToTop";
import ScrollProgress from "./ScrollProgress";
// Sous la ligne de flottaison → chargés à la demande, hors du bundle initial :
// - Projects embarque 10 SVG inline (light+dark) via ?raw,
// - Contact tire react-phone-number-input (~155 ko de métadonnées) ; il
//   n'est même monté qu'à l'approche (cf. QuandProche).
const Projects = lazy(() => import("./Projects"));
const Contact = lazy(() => import("./Contact"));

/**
 * Page d'accueil.
 *
 * `statique` : seulement le premier écran (en-tête, Hero, À propos), sans les
 * décors animés. C'est ce que le pré-rendu (src/prerender.tsx) inscrit dans
 * index.html au build : le navigateur l'affiche dès l'arrivée du CSS, sans
 * attendre le JavaScript, puis React le remplace par la page vivante,
 * identique à cet instant (rien ne bouge).
 */
export default function Accueil({ statique = false }: { statique?: boolean }) {
  const { lang } = useLang();

  return (
    <div className="min-h-screen text-ink">
      <a
        href="#main"
        className="skip-link font-mono text-sm px-4 py-2 rounded-lg bg-accent text-base shadow-lg"
      >
        {t("a11y", "skip", lang)}
      </a>
      {!statique && <ScrollProgress />}
      {!statique && <Background />}
      <Header />
      {/* overflow-x-clip ici (pas sur html/body) : contient le débordement
          horizontal des animations Reveal sans casser le sticky/fixed sur iOS.
          'clip' ne crée pas de conteneur de scroll. */}
      <main id="main" className="overflow-x-clip">
        <div className="min-h-[calc(100dvh-4rem)] flex flex-col justify-center gap-8">
          {/* Seul le Hero est recréé au changement de langue : sa frappe animée
              rejoue dans la nouvelle langue. Les autres sections suivent la
              langue sans être recréées (une clé par langue vidait le
              formulaire et figeait la surbrillance du menu). */}
          <Hero key={lang} />
          <Reveal variant="zoom">
            <About />
          </Reveal>
        </div>
        {!statique && (
          <>
            <Skills />
            <Career />
            <Suspense fallback={<div className="min-h-screen" />}>
              <Projects />
            </Suspense>
            <Services />
            <div className="min-h-[calc(100dvh-4rem)] flex flex-col">
              <div className="grow flex flex-col justify-center">
                {/* monté seulement à l'approche (cf. QuandProche) */}
                <QuandProche id="contact" reserve="min-h-125">
                  <Suspense fallback={<div className="min-h-125" />}>
                    <Reveal variant="up">
                      <Contact />
                    </Reveal>
                  </Suspense>
                </QuandProche>
              </div>
              <Footer />
            </div>
          </>
        )}
      </main>
      {!statique && <BackToTop />}
    </div>
  );
}
