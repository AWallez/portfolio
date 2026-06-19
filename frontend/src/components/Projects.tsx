import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
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
    name: "clients",
    title: { fr: "Projets web clients", en: "Client web projects" },
    desc: {
      fr: "Sites vitrines et applications web sur mesure pour artisans et indépendants : du front-end au déploiement. Dashboards de gestion (CRM, stock, réservations), espaces client et formulaires.",
      en: "Showcase sites and custom web apps for craftspeople and freelancers: from front-end to deployment. Management dashboards (CRM, stock, bookings), client areas and forms.",
    },
    tags: ["React", "Node.js", "PostgreSQL", "Responsive", "Docker"],
    image: "/projects/web-clients.png",
  },
  {
    name: "portfolio",
    title: { fr: "Ce portfolio", en: "This portfolio" },
    desc: {
      fr: "Site full-stack React + TypeScript, API Node (Fastify) + PostgreSQL pour le formulaire de contact, conteneurisé (Docker) et auto-hébergé sur mon NAS. Accessibilité, SEO, tests et CI/CD.",
      en: "Full-stack React + TypeScript site, Node (Fastify) API + PostgreSQL for the contact form, containerized (Docker) and self-hosted on my NAS. Accessibility, SEO, tests and CI/CD.",
    },
    tags: ["React", "TypeScript", "Fastify", "PostgreSQL", "Docker"],
    image: "/projects/portfolio.png",
    code: "https://github.com/AWallez/portfolio",
  },
  {
    name: "reseau",
    title: { fr: "Réseau domestique avancé", en: "Advanced home network" },
    desc: {
      fr: "Segmentation VLAN, pare-feu, DNS, VPN et SSH ; liaison 10 GbE et stockage iSCSI ; administration et durcissement Linux.",
      en: "VLAN segmentation, firewall, DNS, VPN and SSH; 10 GbE link and iSCSI storage; Linux administration and hardening.",
    },
    tags: ["Réseau", "VLAN", "10 GbE", "iSCSI", "iptables"],
    image: "/projects/reseau.png",
  },
  {
    name: "homelab",
    title: {
      fr: "Infrastructure auto-hébergée (NAS)",
      en: "Self-hosted infrastructure (NAS)",
    },
    desc: {
      fr: "Serveur NAS Linux : services conteneurisés via Docker / docker-compose — PostgreSQL, ntfy, VPN WireGuard, serveurs de jeux, reverse proxy et stockage.",
      en: "Linux NAS server: containerized services via Docker / docker-compose — PostgreSQL, ntfy, WireGuard VPN, game servers, reverse proxy and storage.",
    },
    tags: ["Docker", "Linux", "WireGuard", "self-hosting"],
    image: "/projects/homelab.png",
  },
  {
    name: "lab",
    title: {
      fr: "Projets perso & lab DevOps",
      en: "Personal projects & DevOps lab",
    },
    desc: {
      fr: "Serveurs de jeux multijoueurs auto-hébergés (Docker) et lab DevOps pour monter en compétences : Kubernetes, Terraform et Ansible en environnement de test.",
      en: "Self-hosted multiplayer game servers (Docker) and a DevOps lab to level up: Kubernetes, Terraform and Ansible in a test environment.",
    },
    tags: ["Docker", "Kubernetes", "Terraform", "Ansible", "Bash"],
    image: "/projects/perso.png",
  },
];

function Tag({ children }: { children: string }) {
  return (
    <span
      className="badge-hover px-2 py-0.5 rounded text-xs font-mono
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
      className="section-screen max-w-300 container-page py-7"
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
            className="w-full sm:w-[calc(50%-0.625rem)] flex"
          >
            <article
              {...spotlight}
              className="spotlight w-full flex flex-col rounded-xl border border-line
                                bg-base/60 backdrop-blur-[3px] p-5 shadow-sm overflow-hidden
                                hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition"
            >
              {p.image && (
                <div className="-m-5 mb-4 border-b border-line overflow-hidden">
                  <img
                    src={p.image}
                    alt={p.title[lang]}
                    loading="lazy"
                    className="w-full aspect-video object-cover"
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
