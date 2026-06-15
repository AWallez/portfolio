import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import Reveal from "./Reveal";

type Project = {
  name: string;
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
  tags: string[];
  image?: string; // WebP · 16:9 · 1200×675px
  code?: string;
  live?: string;
};

const PROJECTS: Project[] = [
  {
    name: "mon-ancien-site",
    title: { fr: "Projet web (démo)", en: "Web project (demo)" },
    desc: { fr: "Carte de test avec image.", en: "Test card with image." },
    tags: ["React", "Node.js"],
    image: "https://placehold.co/1200x675",
  },
  {
    name: "homelab-nas",
    title: {
      fr: "Infrastructure auto-hébergée (NAS)",
      en: "Self-hosted infrastructure (NAS)",
    },
    desc: {
      fr: "Serveur NAS sous Linux : déploiement de services conteneurisés via Docker / docker-compose (VPN WireGuard, serveurs de jeux multijoueurs, stockage, services réseau).",
      en: "Linux NAS server: containerized services deployed with Docker / docker-compose (WireGuard VPN, multiplayer game servers, storage, network services).",
    },
    tags: ["Docker", "docker-compose", "Linux", "WireGuard", "self-hosting"],
  },
  {
    name: "home-network",
    title: { fr: "Réseau domestique avancé", en: "Advanced home network" },
    desc: {
      fr: "Segmentation réseau, VPN, DNS, pare-feu et SSH ; liaison 10 GbE et stockage iSCSI ; administration et durcissement Linux.",
      en: "Network segmentation, VPN, DNS, firewall and SSH; 10 GbE link and iSCSI storage; Linux administration and hardening.",
    },
    tags: ["Networking", "10 GbE", "iSCSI", "DNS", "iptables"],
  },
  {
    name: "portfolio",
    title: { fr: "Ce portfolio", en: "This portfolio" },
    desc: {
      fr: "Site full-stack React + TypeScript, conteneurisé avec Docker et auto-hébergé sur mon NAS (API Node + PostgreSQL pour le formulaire de contact).",
      en: "Full-stack React + TypeScript site, containerized with Docker and self-hosted on my NAS (Node API + PostgreSQL for the contact form).",
    },
    tags: ["React", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
    code: "https://github.com/AWallez",
  },
];

function Tag({ children }: { children: string }) {
  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-mono
                     bg-accent/10 text-accent border border-accent/30"
    >
      {children}
    </span>
  );
}

export default function Projects() {
  const { lang } = useLang();

  return (
    <section
      id="projects"
      className="section-screen max-w-300 mx-auto px-5 sm:px-6 lg:px-8 py-7"
    >
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("projects", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("projects", "command", lang)}
      </p>

      <div className="flex flex-wrap justify-center gap-5">
        {PROJECTS.map((p, i) => (
          <Reveal
            key={p.name}
            delay={i * 100}
            variant="up-lg"
            className="w-full sm:w-[calc(50%-0.625rem)] lg:w-87 flex"
          >
            <article className="w-full flex flex-col rounded-xl border border-line 
                                bg-base/45 backdrop-blur-[2px] p-5 shadow-sm overflow-hidden 
                                hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition">
              {p.image && (
                <div className="-m-5 mb-4 border-b border-line overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title[lang]}
                    loading="lazy"
                    className="w-full h-44 object-cover"
                  />
                </div>
              )}
              {/* nom de dossier en mono, clin d'œil terminal */}
              <p className="font-mono text-xs text-muted mb-2">~/{p.name}/</p>

              <h3 className="text-ink font-semibold mb-2">{p.title[lang]}</h3>
              <p className="text-sm text-muted leading-relaxed mb-4 grow">
                {p.desc[lang]}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {p.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>

              <div className="flex gap-4 text-sm font-mono">
                {p.code && (
                  <a
                    href={p.code}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline underline-offset-4"
                  >
                    → {t("projects", "code", lang)}
                  </a>
                )}
                {p.live && (
                  <a
                    href={p.live}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline underline-offset-4"
                  >
                    → {t("projects", "live", lang)}
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
