import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import Reveal from "./Reveal";

type Service = {
  icon: string;
  folder: string;
  name: { fr: string; en: string };
  desc: { fr: string; en: string };
  highlights: { fr: string[]; en: string[] };
};

const SERVICES: Service[] = [
  {
    icon: "🌐",
    folder: "dev-web/",
    name: { fr: "Développement Web", en: "Web Development" },
    desc: {
      fr: "Conception et développement d'applications web sur mesure, du front-end au back-end.",
      en: "Design and development of custom web applications, from front-end to back-end.",
    },
    highlights: {
      fr: [
        "Sites vitrines & landing pages",
        "Applications full-stack",
        "API & back-end Node.js",
        "Intégration & responsive design",
      ],
      en: [
        "Landing pages & showcase sites",
        "Full-stack applications",
        "API & Node.js back-end",
        "Integration & responsive design",
      ],
    },
  },
  {
    icon: "🖥️",
    folder: "pc-assembly/",
    name: { fr: "Montage PC", en: "PC Assembly" },
    desc: {
      fr: "Assemblage de configurations sur mesure adaptées à vos besoins : gaming, bureautique ou station de travail.",
      en: "Custom PC builds tailored to your needs: gaming, office or workstation.",
    },
    highlights: {
      fr: [
        "Sélection des composants",
        "Assemblage & câble management",
        "Installation OS & drivers",
        "Optimisation & tests",
      ],
      en: [
        "Component selection",
        "Assembly & cable management",
        "OS & driver installation",
        "Optimization & testing",
      ],
    },
  },
  {
    icon: "🔧",
    folder: "web-hosting-consulting/",
    name: {
      fr: "Conseil hébergement & infra",
      en: "Hosting & infrastructure consulting",
    },
    desc: {
      fr: "Accompagnement pour l'hébergement web, le self-hosting et la mise en place d'infrastructure conteneurisée.",
      en: "Guidance on web hosting, self-hosting and containerized infrastructure setup.",
    },
    highlights: {
      fr: [
        "Choix d'hébergement adapté",
        "Self-hosting & Docker",
        "Mise en place VPN & réseau",
        "Déploiement & maintenance",
      ],
      en: [
        "Hosting solution selection",
        "Self-hosting & Docker",
        "VPN & network setup",
        "Deployment & maintenance",
      ],
    },
  },
];

export default function Services() {
  const { lang } = useLang();

  return (
    <section
      id="services"
      className="section-screen max-w-300 mx-auto px-5 sm:px-6 lg:px-8 py-7"
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
            className="w-full sm:w-[calc(50%-0.625rem)] lg:w-87 flex"
          >
           <article className="w-full flex flex-col rounded-xl border border-line 
                                bg-base/45 backdrop-blur-[2px] p-5 shadow-sm overflow-hidden 
                                hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{s.icon}</span>
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
