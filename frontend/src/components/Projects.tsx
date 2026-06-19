import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
import Reveal from "./Reveal";
import Lightbox from "./Lightbox";
// Visuels inlinés (SVG bruts) : héritent des webfonts du site (JetBrains Mono / Inter).
// Générés par branding/generate-projects.mjs.
import clientsLight from "../assets/projects/web-clients-light.svg?raw";
import clientsDark from "../assets/projects/web-clients-dark.svg?raw";
import portfolioLight from "../assets/projects/portfolio-light.svg?raw";
import portfolioDark from "../assets/projects/portfolio-dark.svg?raw";
import reseauLight from "../assets/projects/reseau-light.svg?raw";
import reseauDark from "../assets/projects/reseau-dark.svg?raw";
import homelabLight from "../assets/projects/homelab-light.svg?raw";
import homelabDark from "../assets/projects/homelab-dark.svg?raw";
import persoLight from "../assets/projects/perso-light.svg?raw";
import persoDark from "../assets/projects/perso-dark.svg?raw";

type Project = {
  name: string;
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
  tags: string[];
  image?: { light: string; dark: string }; // SVG inline brut · 16:9 1200×675 · une version par thème
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
    image: { light: clientsLight, dark: clientsDark },
  },
  {
    name: "portfolio",
    title: { fr: "Ce portfolio", en: "This portfolio" },
    desc: {
      fr: "Site full-stack React + TypeScript, API Node (Fastify) + PostgreSQL pour le formulaire de contact, conteneurisé (Docker) et auto-hébergé sur mon NAS. Accessibilité, SEO, tests et CI/CD.",
      en: "Full-stack React + TypeScript site, Node (Fastify) API + PostgreSQL for the contact form, containerized (Docker) and self-hosted on my NAS. Accessibility, SEO, tests and CI/CD.",
    },
    tags: ["React", "TypeScript", "Fastify", "PostgreSQL", "Docker"],
    image: { light: portfolioLight, dark: portfolioDark },
  },
  {
    name: "reseau",
    title: { fr: "Réseau domestique avancé", en: "Advanced home network" },
    desc: {
      fr: "Segmentation VLAN, pare-feu, DNS, VPN et SSH ; liaison 10 GbE et stockage iSCSI ; administration et durcissement Linux.",
      en: "VLAN segmentation, firewall, DNS, VPN and SSH; 10 GbE link and iSCSI storage; Linux administration and hardening.",
    },
    tags: ["Réseau", "VLAN", "10 GbE", "iSCSI", "iptables"],
    image: { light: reseauLight, dark: reseauDark },
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
    image: { light: homelabLight, dark: homelabDark },
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
    image: { light: persoLight, dark: persoDark },
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
  const [zoomed, setZoomed] = useState<Project | null>(null);

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
            variant="zoom-out"
            className="w-full sm:w-[calc(50%-0.625rem)] flex"
          >
            <article
              {...spotlight}
              className="spotlight group relative w-full flex flex-col rounded-xl border border-line
                                bg-base/60 backdrop-blur-[3px] p-5 shadow-sm overflow-hidden
                                hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition"
            >
              {p.image && (
                <div className="relative -m-5 mb-4 border-b border-line overflow-hidden">
                  {/* SVG inline : hérite des webfonts du site. Une version par thème,
                      clair masqué en sombre et inversement. */}
                  <div
                    aria-hidden
                    className="dark:hidden [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: p.image.light }}
                  />
                  <div
                    aria-hidden
                    className="hidden dark:block [&>svg]:block [&>svg]:w-full [&>svg]:h-auto"
                    dangerouslySetInnerHTML={{ __html: p.image.dark }}
                  />
                  {/* badge d'agrandissement, visible au survol de la carte */}
                  <span
                    className="pointer-events-none absolute right-2 top-2 z-20 grid h-8 w-8
                               place-items-center rounded-lg border border-line bg-base/80
                               text-ink opacity-0 backdrop-blur-sm transition
                               group-hover:opacity-100"
                  >
                    <Maximize2 size={15} aria-hidden />
                  </span>
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

              {/* clic n'importe où sur la carte -> agrandir l'image */}
              {p.image && (
                <button
                  type="button"
                  onClick={() => setZoomed(p)}
                  aria-label={`${t("projects", "zoom", lang)} — ${p.title[lang]}`}
                  className="absolute inset-0 z-10 cursor-zoom-in"
                />
              )}
            </article>
          </Reveal>
        ))}
      </div>

      {zoomed?.image && (
        <Lightbox
          light={zoomed.image.light}
          dark={zoomed.image.dark}
          title={zoomed.title[lang]}
          onClose={() => setZoomed(null)}
        />
      )}
    </section>
  );
}
