import { Briefcase, GraduationCap } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { useScrollProgress } from "../hooks/useScrollProgress";
import Reveal from "./Reveal";

type Item = {
  type: "exp" | "edu";
  date: { fr: string; en: string };
  role: { fr: string; en: string };
  place: string;
  desc: { fr: string; en: string };
};

const TIMELINE: Item[] = [
  {
    type: "exp",
    date: { fr: "2023 — Maintenant", en: "2023 — Now" },
    place: "Indépendant · Savigny-le-Temple (77)",
    role: { fr: "Développeur freelance", en: "Freelance Developer" },
    desc: {
      fr: "Applications web full-stack (front, back, base de données, SEO, mise en ligne) ; conseils techniques montage de PC.",
      en: "Full-stack web apps (front, back, database, SEO, deployment); technical advice and PC builds.",
    },
  },
  {
    type: "exp",
    date: { fr: "2020 — Maintenant", en: "2020 — Now" },
    place: "Caserne de Savigny-le-Temple (77)",
    role: { fr: "Sapeur-pompier volontaire", en: "Volunteer Firefighter" },
    desc: {
      fr: "Interventions de secours et d'assistance : rigueur, sang-froid, gestion du stress et esprit d'équipe.",
      en: "Emergency and rescue operations: rigor, composure, stress management and teamwork.",
    },
  },
  {
    type: "edu",
    date: { fr: "2021 — 2023", en: "2021 — 2023" },
    place: "IPSSI Paris · Lycée Jacques Prévert",
    role: {
      fr: "BTS SIO SLAM — Solutions Logicielles & Applications Métiers",
      en: "BTS SIO SLAM — Software Solutions & Business Applications",
    },
    desc: {
      fr: "Conception et développement d'applications, bases de données et programmation orientée objet.",
      en: "Application design and development, databases and object-oriented programming.",
    },
  },
  {
    type: "exp",
    date: { fr: "2023 — 2024", en: "2023 — 2024" },
    place: "Picnic Fulfilment Center · Moissy-Cramayel (77)",
    role: {
      fr: "Gestionnaire de stock (CDI)",
      en: "Stock Manager (permanent)",
    },
    desc: {
      fr: "Rigueur, contrôle qualité et résolution de problèmes en environnement logistique exigeant.",
      en: "Rigor, quality control and problem-solving in a demanding logistics environment.",
    },
  },
  {
    type: "exp",
    date: { fr: "2021 — 2022", en: "2021 — 2022" },
    place: "LessonSharing · Saint-Pierre-du-Perray (91)",
    role: {
      fr: "Développeur Full-Stack Junior (alternance)",
      en: "Junior Full-Stack Developer (work-study)",
    },
    desc: {
      fr: "Développement de fonctionnalités full-stack, gestion de base de données et d'hébergement.",
      en: "Full-stack feature development, database and hosting management.",
    },
  },
  {
    type: "edu",
    date: { fr: "2019 — 2020", en: "2019 — 2020" },
    place: "Lycée de la Mare Carrée · Moissy-Cramayel (77)",
    role: {
      fr: "Bac STI2D SIN — Systèmes d'Information et Numérique",
      en: "STI2D Baccalaureate SIN — Information & Digital Systems",
    },
    desc: {
      fr: "Bases du développement, des réseaux et des systèmes numériques ; premiers pas en programmation.",
      en: "Foundations of development, networking and digital systems; first steps in programming.",
    },
  },
];

export default function Career() {
  const { lang } = useLang();
  const { ref, progress } = useScrollProgress<HTMLOListElement>();

  return (
    <section
      id="career"
      className="section-screen max-w-300 container-page py-7 "
    >
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("career", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("career", "command", lang)}
      </p>

      <div className="max-w-250">
        <ol ref={ref} className="relative">
          {/* la ligne verticale centrale (rail gris) */}
          <div className="absolute left-27.5 sm:left-32.5 top-0 bottom-0 w-px bg-line" />
          {/* la ligne d'accent qui se dessine au scroll */}
          <div
            className="absolute left-27.5 sm:left-32.5 top-0 w-px bg-accent origin-top h-full"
            style={{ transform: `scaleY(${progress})` }}
          />

          {TIMELINE.map((item, i) => (
            <Reveal
              key={i}
              delay={i * 120}
              variant="right"
              className="w-full block pb-8 last:pb-0"
            >
              <li className="flex">
                {/* côté gauche : date + badge */}
                <div className="flex flex-col items-center w-25 sm:w-30 shrink-0 pt-1">
                  {" "}
                  <span className="font-mono text-xs text-muted block mb-1.25 text-center w-fit">
                    {item.date[lang]}
                  </span>
                  <span
                    className="badge-hover font-mono text-[10px] px-1.5 py-0.5  rounded
                             bg-accent/10 text-accent border border-accent/30 text-center"
                  >
                    {item.type === "exp"
                      ? t("career", "exp", lang)
                      : t("career", "edu", lang)}
                  </span>
                </div>

                {/* le badge sur la ligne (icône exp / formation) */}
                <div className="relative shrink-0 w-5 flex justify-center">
                  <span className="z-10 flex items-center justify-center w-7 h-7 -mt-0.5 rounded-full bg-base border-2 border-accent text-accent">
                    {item.type === "exp" ? (
                      <Briefcase size={13} />
                    ) : (
                      <GraduationCap size={14} />
                    )}
                  </span>
                </div>

                {/* côté droit : contenu */}
                <div className="pl-4 grow">
                  <h3 className="text-ink font-semibold text-readable w-fit">
                    {item.role[lang]}
                  </h3>
                  <p className="text-sm text-accent mb-1 text-readable w-fit">
                    {item.place}
                  </p>
                  <p className="text-sm text-muted leading-relaxed text-readable w-fit">
                    {item.desc[lang]}
                  </p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
