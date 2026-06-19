import { Globe, Cpu, Server, Lightbulb, type LucideIcon } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
import Reveal from "./Reveal";

type Service = {
  Icon: LucideIcon;
  folder: string;
  name: { fr: string; en: string };
  desc: { fr: string; en: string };
  highlights: { fr: string[]; en: string[] };
};

const SERVICES: Service[] = [
  {
    Icon: Globe,
    folder: "dev-web/",
    name: { fr: "Développement web", en: "Web Development" },
    desc: {
      fr: "Conception et développement d'applications web sur mesure, du front-end au back-end.",
      en: "Design and development of custom web applications, from front-end to back-end.",
    },
    highlights: {
      fr: [
        "Sites vitrines",
        "Applications full-stack sur mesure",
        "API & back-end (Node.js)",
        "Intégration responsive (maquette → code)",
        "Refonte & modernisation de site",
      ],
      en: [
        "Showcase websites",
        "Custom full-stack applications",
        "API & back-end (Node.js)",
        "Responsive integration (design → code)",
        "Website redesign & modernization",
      ],
    },
  },
  {
    Icon: Server,
    folder: "deploiement/",
    name: {
      fr: "Déploiement & mise en ligne",
      en: "Deployment & go-live",
    },
    desc: {
      fr: "Je vous oriente vers un hébergement reconnu et adapté, puis je vous accompagne — ou je m'occupe de tout — pour la mise en ligne.",
      en: "I guide you toward a reputable hosting solution that fits your needs, then assist you — or handle everything — to take it live.",
    },
    highlights: {
      fr: [
        "Conseil au choix de l'hébergement",
        "Mise en ligne (accompagnée ou clé en main)",
        "Conteneurisation (Docker)",
        "Maintenance & support (TMA)",
      ],
      en: [
        "Hosting selection advice",
        "Go-live (assisted or turnkey)",
        "Containerization (Docker)",
        "Maintenance & support",
      ],
    },
  },
  {
    Icon: Cpu,
    folder: "pc-assembly/",
    name: { fr: "Montage PC", en: "PC Assembly" },
    desc: {
      fr: "Assemblage de configurations sur mesure adaptées à vos besoins : gaming, bureautique ou station de travail.",
      en: "Custom PC builds tailored to your needs: gaming, office or workstation.",
    },
    highlights: {
      fr: [
        "Conseil & choix des composants",
        "Assemblage & câble management",
        "Installation OS & pilotes",
        "Optimisation & tests",
      ],
      en: [
        "Advice & component selection",
        "Assembly & cable management",
        "OS & driver installation",
        "Optimization & testing",
      ],
    },
  },
  {
    Icon: Lightbulb,
    folder: "conseil/",
    name: {
      fr: "Conseil & accompagnement",
      en: "Consulting & guidance",
    },
    desc: {
      fr: "Accompagnement technique et optimisation pour donner vie à vos projets web.",
      en: "Technical guidance and optimization to bring your web projects to life.",
    },
    highlights: {
      fr: [
        "Conseil & accompagnement technique",
        "Optimisation SEO & performance",
        "Aide aux choix techniques (stack, archi)",
      ],
      en: [
        "Technical guidance & support",
        "SEO & performance optimization",
        "Help with technical choices (stack, architecture)",
      ],
    },
  },
];

export default function Services() {
  const { lang } = useLang();

  return (
    <section
      id="services"
      className="section-screen max-w-300 container-page py-7"
    >
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("services", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("services", "command", lang)}
      </p>

      <div className="flex flex-wrap justify-center gap-5">
        {SERVICES.map((s, i) => (
          <Reveal
            key={s.folder}
            delay={i * 100}
            variant={i % 2 === 0 ? "left" : "right"}
            className="w-full sm:w-[calc(50%-0.625rem)] flex"
          >
           <article
              {...spotlight}
              className="spotlight w-full flex flex-col rounded-xl border border-line
                                bg-base/60 backdrop-blur-[3px] p-5 shadow-sm overflow-hidden
                                hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 border border-accent/30 text-accent">
                  <s.Icon size={20} />
                </span>
                <span className="font-mono text-xs text-muted">{s.folder}</span>
              </div>

              <h3 className="text-ink font-semibold mb-2">{s.name[lang]}</h3>
              <p className="text-sm text-muted leading-relaxed mb-4">
                {s.desc[lang]}
              </p>

              {/* liste des prestations */}
              <ul className="text-sm text-ink space-y-1.5 mb-5 grow">
                {s.highlights[lang].map((h) => (
                  <li key={h} className="flex items-start gap-2">
                    <span className="text-accent mt-0.5">▸</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              {/* CTA vers le formulaire de contact */}
              <a
                href="#contact"
                className="block text-center font-mono text-sm px-4 py-2 rounded-lg
                         border border-accent text-accent
                         hover:bg-accent hover:text-base transition"
              >
                {t("services", "cta", lang)}
              </a>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
