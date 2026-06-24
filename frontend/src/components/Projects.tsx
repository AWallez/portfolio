import { lazy, Suspense, useCallback, useState } from "react";
import { Maximize2 } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
import Reveal from "./Reveal";
import ProjectVisual from "./ProjectVisual";
// chargée à la demande : seulement quand on agrandit une image
const Lightbox = lazy(() => import("./Lightbox"));
// Visuels inlinés (SVG bruts) : héritent des webfonts du site (JetBrains Mono / Inter).
// Générés par branding/generate-projects.mjs (5 projets × clair/sombre × FR/EN).
const SVGS = import.meta.glob("../assets/projects/**/*.svg", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
// variante {thème}-{langue}, ou {thème} seul (perso : terminal pur, sans langue)
const svg = (asset: string, theme: "light" | "dark", lang: "fr" | "en") =>
  SVGS[`../assets/projects/${asset}/${theme}-${lang}.svg`] ??
  SVGS[`../assets/projects/${asset}/${theme}.svg`];

type Project = {
  name: string;
  folder: { fr: string; en: string }; // libellé ~/dossier/ affiché sous l'image
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
  tags: string[];
  asset?: string; // préfixe de fichier dans assets/projects (ex. "web-clients")
};

const PROJECTS: Project[] = [
  {
    name: "clients",
    folder: { fr: "clients", en: "clients" },
    title: { fr: "Projets web clients", en: "Client web projects" },
    desc: {
      fr: "Sites vitrines et applications web sur mesure pour artisans et indépendants, du cahier des charges à la mise en ligne : front-end React, back-end, base de données, dashboards de gestion (CRM, stock, réservations) et espaces client. Soin particulier porté aux performances, au SEO et au responsive.",
      en: "Showcase sites and custom web apps for craftspeople and freelancers, from brief to launch: React front-end, back-end, database, management dashboards (CRM, stock, bookings) and client areas. Strong focus on performance, SEO and responsive design.",
    },
    tags: ["React", "Node.js", "PostgreSQL", "Responsive", "Docker"],
    asset: "web-clients",
  },
  {
    name: "portfolio",
    folder: { fr: "portfolio", en: "portfolio" },
    title: { fr: "Ce portfolio", en: "This portfolio" },
    desc: {
      fr: "Site full-stack React + TypeScript, API Node (Fastify) + PostgreSQL pour le contact, conteneurisé (Docker) et auto-hébergé sur mon NAS derrière un reverse proxy (HTTPS automatique). Résultat : Lighthouse 100 SEO / 100 accessibilité / 100 bonnes pratiques et ~98 de performance, avec tests et CI/CD.",
      en: "Full-stack React + TypeScript site, Node (Fastify) API + PostgreSQL for the contact form, containerized (Docker) and self-hosted on my NAS behind a reverse proxy (automatic HTTPS). Result: Lighthouse 100 SEO / 100 accessibility / 100 best practices and ~98 performance, with tests and CI/CD.",
    },
    tags: ["React", "TypeScript", "Fastify", "PostgreSQL", "Docker"],
    asset: "portfolio",
  },
  {
    name: "reseau",
    folder: { fr: "reseau", en: "network" },
    title: { fr: "Réseau domestique avancé", en: "Advanced home network" },
    desc: {
      fr: "Réseau domestique de niveau pro : segmentation VLAN, pare-feu, DNS, VPN et SSH durcis, liaison 10 GbE et stockage iSCSI. Objectif atteint : un réseau cloisonné, sécurisé et performant, administré sous Linux.",
      en: "Pro-grade home network: VLAN segmentation, firewall, DNS, hardened VPN and SSH, 10 GbE link and iSCSI storage. Outcome: a segmented, secure and high-throughput network, administered on Linux.",
    },
    tags: ["Réseau", "VLAN", "10 GbE", "iSCSI", "iptables"],
    asset: "reseau",
  },
  {
    name: "homelab",
    folder: { fr: "homelab", en: "homelab" },
    title: {
      fr: "Infrastructure auto-hébergée (NAS)",
      en: "Self-hosted infrastructure (NAS)",
    },
    desc: {
      fr: "Infrastructure auto-hébergée sur NAS Linux : une dizaine de services conteneurisés (Docker / docker-compose) — PostgreSQL, ntfy, VPN WireGuard, serveurs de jeux, reverse proxy — déployés et supervisés de façon reproductible, comme en production.",
      en: "Self-hosted infrastructure on a Linux NAS: a dozen containerized services (Docker / docker-compose) — PostgreSQL, ntfy, WireGuard VPN, game servers, reverse proxy — deployed and monitored reproducibly, production-style.",
    },
    tags: ["Docker", "Linux", "WireGuard", "self-hosting"],
    asset: "homelab",
  },
  {
    name: "lab",
    folder: { fr: "lab", en: "lab" },
    title: {
      fr: "Projets perso & lab DevOps",
      en: "Personal projects & DevOps lab",
    },
    desc: {
      fr: "Lab DevOps pour monter en compétences sur des outils de production : Kubernetes, Terraform et Ansible en environnement de test, plus des serveurs de jeux multijoueurs auto-hébergés (Docker). Apprentissage par la pratique, de l'infra-as-code à l'orchestration.",
      en: "DevOps lab to level up on production tooling: Kubernetes, Terraform and Ansible in a test environment, plus self-hosted multiplayer game servers (Docker). Hands-on learning, from infrastructure-as-code to orchestration.",
    },
    tags: ["Docker", "Kubernetes", "Terraform", "Ansible", "Bash"],
    asset: "perso",
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
  const closeZoom = useCallback(() => setZoomed(null), []);

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
              className="spotlight w-full flex flex-col rounded-xl border border-line
                                bg-base/60 backdrop-blur-[3px] p-5 shadow-sm overflow-hidden
                                hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition"
            >
              {p.asset && (
                <div className="-m-5 mb-4 border-b border-line overflow-hidden">
                  {/* clic sur l'image (ou le badge) -> agrandir */}
                  <button
                    type="button"
                    onClick={() => setZoomed(p)}
                    aria-label={`${t("projects", "zoom", lang)} — ${p.title[lang]}`}
                    className="group/img relative block w-full cursor-zoom-in p-0"
                  >
                    <ProjectVisual
                      light={svg(p.asset, "light", lang)}
                      dark={svg(p.asset, "dark", lang)}
                    />
                    {/* badge d'agrandissement : toujours visible, accentué au survol */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute right-2 top-2 grid h-8 w-8
                                 place-items-center rounded-lg border border-line bg-base/80
                                 text-muted backdrop-blur-sm transition
                                 group-hover/img:border-accent group-hover/img:text-accent
                                 group-hover/img:scale-110"
                    >
                      <Maximize2 size={15} />
                    </span>
                  </button>
                </div>
              )}
              {/* nom de dossier en mono, clin d'œil terminal */}
              <p className="font-mono text-xs text-muted mb-2">~/{p.folder[lang]}/</p>

              <h3 className="text-ink font-semibold mb-2">{p.title[lang]}</h3>
              <p className="text-sm text-muted leading-relaxed mb-4 grow">
                {p.desc[lang]}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {p.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {zoomed?.asset && (
        <Suspense fallback={null}>
          <Lightbox
            light={svg(zoomed.asset, "light", lang)}
            dark={svg(zoomed.asset, "dark", lang)}
            title={zoomed.title[lang]}
            onClose={closeZoom}
          />
        </Suspense>
      )}
    </section>
  );
}
