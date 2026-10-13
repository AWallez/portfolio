import { lazy, Suspense, useCallback, useState } from "react";
import { Code2, ExternalLink, Maximize2 } from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
import Reveal from "./Reveal";
import ProjectVisual from "./ProjectVisual";
import { useEtroit } from "../hooks/useEtroit";
import { useProjectSvgs } from "../hooks/useProjectSvgs";
import { proportion } from "../lib/projectSvgs";
import Tag from "./Tag";
import { TIPS } from "../lib/tips";
import { SKILL_ICONS } from "../lib/skill-icons";
import { GENERIC_ICONS } from "../lib/generic-icons";
import SectionHeader from "./SectionHeader";
// chargée à la demande : seulement quand on agrandit une image
const Lightbox = lazy(() => import("./Lightbox"));

type Project = {
  name: string;
  folder: { fr: string; en: string }; // libellé ~/dossier/ affiché sous l'image
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
  tags: string[];
  asset?: string; // préfixe de fichier dans assets/projects (ex. "web-clients")
  // visuel d'illustration (maquette), signalé comme tel sur la carte
  mock?: boolean;
  // liens externes sous les badges : "code" -> dépôt public, "demo" -> site en ligne
  links?: { kind: "code" | "demo"; href: string }[];
};

const LINK_ICON = { code: Code2, demo: ExternalLink } as const;

const PROJECTS: Project[] = [
  {
    name: "clients",
    folder: { fr: "clients", en: "clients" },
    title: { fr: "Projets web clients", en: "Client web projects" },
    desc: {
      fr: "Sites vitrines et applications web sur mesure pour artisans et indépendants, du cahier des charges à la mise en ligne : front-end React, back-end, base de données, dashboards de gestion (CRM, stock, réservations) et espaces client. Je soigne les performances, le SEO et l'affichage mobile.",
      en: "Showcase sites and custom web apps for craftspeople and freelancers, from brief to launch: React front-end, back-end, database, management dashboards (CRM, stock, bookings) and client areas. I put real work into performance, SEO and how it looks on mobile.",
    },
    tags: ["React", "Node.js", "PostgreSQL", "Responsive", "Docker"],
    asset: "web-clients",
    mock: true,
  },
  {
    name: "portfolio",
    folder: { fr: "portfolio", en: "portfolio" },
    title: { fr: "Ce portfolio", en: "This portfolio" },
    desc: {
      fr: "Site full-stack React + TypeScript, API Node (Fastify) + PostgreSQL pour le contact, conteneurisé (Docker) et auto-hébergé sur mon NAS derrière un reverse proxy Caddy (HTTPS automatique Let's Encrypt).",
      en: "Full-stack React + TypeScript site, Node (Fastify) API + PostgreSQL for the contact form, containerized (Docker) and self-hosted on my NAS behind a Caddy reverse proxy (automatic HTTPS via Let's Encrypt).",
    },
    tags: ["React", "TypeScript", "Fastify", "PostgreSQL", "Docker"],
    asset: "portfolio",
    links: [{ kind: "code", href: "https://github.com/AWallez/portfolio" }],
  },
  {
    name: "homelab",
    folder: { fr: "homelab", en: "homelab" },
    title: {
      fr: "Infrastructure auto-hébergée (NAS)",
      en: "Self-hosted infrastructure (NAS)",
    },
    desc: {
      fr: "Infrastructure auto-hébergée sur NAS Linux : un parc de services conteneurisés (Docker / docker-compose) exposés en HTTPS sur leurs propres sous-domaines derrière un reverse proxy Caddy unique (certificats Let's Encrypt automatiques, en-têtes de sécurité, rate-limiting anti-brute-force). En production : gestionnaire de mots de passe (Vaultwarden), filtrage DNS (AdGuard), streaming média (Jellyfin), VPN WireGuard, PostgreSQL et notifications ntfy. Les mises à jour passent par compose-auto-update, un outil que j'ai écrit : il vérifie chaque service après la mise à jour et revient à l'ancienne version en cas d'échec. Les bases de données et les accès critiques restent volontairement manuels.",
      en: "Self-hosted infrastructure on a Linux NAS: a fleet of containerized services (Docker / docker-compose) served over HTTPS on their own subdomains behind a single Caddy reverse proxy (automatic Let's Encrypt certificates, security headers, anti-brute-force rate limiting). In production: a password manager (Vaultwarden), DNS filtering (AdGuard), media streaming (Jellyfin), a WireGuard VPN, PostgreSQL and ntfy notifications. Updates go through compose-auto-update, a tool I wrote: it checks each service after updating and rolls back to the previous version if it fails. Databases and critical access are deliberately left manual.",
    },
    tags: ["Docker", "Linux", "Caddy", "Let's Encrypt", "Vaultwarden", "AdGuard", "WireGuard", "self-hosting"],
    asset: "homelab",
  },
  {
    name: "dashboard",
    folder: { fr: "dashboard", en: "dashboard" },
    title: {
      fr: "Tableau de bord du homelab",
      en: "Homelab dashboard",
    },
    desc: {
      fr: "Portail maison du NAS. Des collecteurs shell et Python, lancés par cron, interrogent Docker, le noyau, SMART et les API des services, puis publient chacun leur fichier JSON. Une page statique servie par nginx les relit, sans framework ni base de données. Les valeurs vivantes arrivent en 4 secondes, contre 80 au départ. La page garde 7 jours d'historique et pilote les mises à jour des conteneurs. Elle m'alerte sur mon téléphone quand le processeur, la mémoire, le disque ou une température reste au-dessus de son seuil pendant au moins dix minutes (une tendance, pas un pic), ou quand un collecteur s'arrête. Un veilleur répare seul la panne la plus fréquente : 24 secondes au lieu de 90 minutes à la main.",
      en: "Home-made NAS portal. Shell and Python collectors, run by cron, query Docker, the kernel, SMART and the services' APIs, then each publish their own JSON file. A static page served by nginx reads them back, with no framework and no database. Live values arrive within 4 seconds, down from 80 at the start. The page keeps 7 days of history and drives the container updates. It alerts my phone when the CPU, memory, disk or a temperature stays above its threshold for at least ten minutes (a trend, not a spike), or when a collector stops. A watchdog fixes the most frequent outage on its own: 24 seconds instead of 90 minutes by hand.",
    },
    tags: ["Bash", "Shell", "Python", "JavaScript", "Docker", "GitHub Actions", "self-hosting"],
    asset: "dashboard",
    links: [
      { kind: "code", href: "https://github.com/AWallez/homelab" },
      { kind: "demo", href: "https://awallez.github.io/homelab/" },
    ],
  },
  {
    name: "monitoring",
    folder: { fr: "Supervision", en: "monitoring" },
    title: {
      fr: "Supervision & observabilité",
      en: "Monitoring & observability",
    },
    desc: {
      fr: "Supervision temps réel de l'infrastructure auto-hébergée : Uptime Kuma surveille chaque conteneur via le socket Docker, et toute panne déclenche une alerte push sur mobile (ntfy, canaux dédiés). Un watchdog externe (UptimeRobot) double la surveillance depuis Internet, parce qu'une alerte « mon infra est morte » ne doit pas transiter par l'infra en question. Les métriques système, leur historique et les seuils d'alerte viennent de scripts maison plutôt que d'un outil du commerce : un outil sur mesure et léger, qui suit aussi la santé SMART des SSD.",
      en: "Real-time monitoring of the self-hosted infrastructure: Uptime Kuma watches every container through the Docker socket, and any failure fires a mobile push alert (ntfy, dedicated channels). An external watchdog (UptimeRobot) doubles the check from the internet, because an alert saying my infrastructure is down should not travel through that same infrastructure. System metrics, their history and the alert thresholds come from my own scripts rather than an off-the-shelf tool: something lightweight and built to fit, which also tracks SMART health on the SSDs.",
    },
    tags: ["Uptime Kuma", "ntfy", "UptimeRobot", "Bash", "Alerting"],
    asset: "monitoring",
  },
  {
    name: "reseau",
    folder: { fr: "reseau", en: "network" },
    title: { fr: "Réseau domestique et accès à distance", en: "Home network & remote access" },
    desc: {
      fr: "Le réseau tel qu'il est : un LAN unique derrière la box fibre, un switch 10 GbE entre le NAS et le PC (stockage iSCSI pour les jeux), un filtrage DNS AdGuard Home réglé appareil par appareil et un seul service exposé, Caddy. L'accès à distance passe par WireGuard : il réveille le PC, puis RDP ou Moonlight prennent le relais. Deux pannes résolues en chemin : un trou noir de MTU, ramené à 1350, et une collision de sous-réseau, réglée par des AllowedIPs en /32.",
      en: "The network as it really is: a single LAN behind the fibre box, a 10 GbE switch between the NAS and the PC (iSCSI storage for games), AdGuard Home DNS filtering set device by device, and a single exposed service, Caddy. Remote access goes through WireGuard: it wakes the PC, then RDP or Moonlight take over. Two outages fixed along the way: an MTU black hole, brought down to 1350, and a subnet clash, solved with /32 AllowedIPs.",
    },
    tags: ["WireGuard", "AdGuard", "10 GbE", "iSCSI", "iptables"],
    asset: "reseau",
  },
  {
    name: "resilience",
    folder: { fr: "sauvegardes", en: "backups" },
    title: {
      fr: "Résilience & sauvegardes",
      en: "Resilience & backups",
    },
    desc: {
      fr: "Snapshots restic chiffrés et dédupliqués du NAS (services, volumes, dumps PostgreSQL), poussés vers le PC de la maison et déclenchés automatiquement à son allumage. Rétention 7 j / 4 sem / 6 mois et dead-man's-switch (alerte si une sauvegarde manque). Limite assumée : la seconde copie reste dans la maison, il manque encore une copie hors site. Restauration testée, pas seulement configurée.",
      en: "Encrypted, deduplicated restic snapshots of the NAS (services, volumes, PostgreSQL dumps), pushed to the PC at home and triggered automatically when it powers on. 7-day / 4-week / 6-month retention and a dead-man's-switch (alert if a backup is missing). Known limit: the second copy stays in the house, and an off-site copy is still missing. The restore is tested, not just configured.",
    },
    tags: ["restic", "Chiffrement", "Automatisation", "PostgreSQL"],
    asset: "resilience",
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

const ASSETS = PROJECTS.flatMap((p) => (p.asset ? [p.asset] : []));

export default function Projects() {
  const { lang } = useLang();
  const etroit = useEtroit();
  // visuels chargés à la demande (thème, langue et format affichés)
  const visuel = useProjectSvgs(ASSETS, etroit);
  const [zoomed, setZoomed] = useState<Project | null>(null);
  const closeZoom = useCallback(() => setZoomed(null), []);

  return (
    <section
      id="projects"
      className="section-screen max-w-300 container-page py-7"
    >
      <SectionHeader section="projects" />

      <div className="flex flex-wrap justify-center gap-5">
        {PROJECTS.map((p, i) => (
          <Reveal
            key={p.name}
            delay={(i % 2) * 80} // décalage par colonne, pas par rang
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
                    aria-label={`${t("projects", "zoom", lang)} : ${p.title[lang]}`}
                    className="group/img relative block w-full cursor-zoom-in p-0"
                  >
                    <ProjectVisual
                      svg={visuel(p.asset)}
                      ratio={proportion(p.asset, etroit)}
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
              {/* nom de dossier en mono, clin d'œil terminal ; un visuel
                  d'illustration le dit sur la même ligne, sans couvrir l'image */}
              <p className="font-mono text-xs text-muted mb-2 flex items-center justify-between gap-2">
                <span>~/{p.folder[lang]}/</span>
                {p.mock && (
                  <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px]">
                    {t("projects", "mock", lang)}
                  </span>
                )}
              </p>

              <h3 className="text-ink font-semibold mb-2">{p.title[lang]}</h3>
              <p className="text-sm text-muted leading-relaxed text-justify mb-4 grow">
                {p.desc[lang]}
              </p>

              {/* Les liens AVANT les badges : les badges finissent ainsi au même
                  niveau sur toutes les cartes d'une rangée, liens ou pas. */}
              {p.links && (
                <div className="flex flex-wrap items-center gap-4 mb-3">
                  {p.links.map(({ kind, href }) => {
                    const Icon = LINK_ICON[kind];
                    return (
                      <a
                        key={kind}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${t("projects", kind, lang)} : ${p.title[lang]}`}
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted
                                   underline decoration-line underline-offset-4 transition
                                   hover:text-accent hover:decoration-accent"
                      >
                        <Icon size={13} aria-hidden />
                        {t("projects", kind, lang)}
                      </a>
                    );
                  })}
                </div>
              )}

              {/* badges étirés : chaque rangée occupe toute la largeur de la carte */}
              <div className="flex flex-wrap gap-2 *:grow *:justify-center">
                {p.tags.map((tag) => (
                  <Tag
                    key={tag}
                    size="sm"
                    tip={TIPS[tag]?.[lang]}
                    icon={SKILL_ICONS[tag] ?? GENERIC_ICONS[tag]}
                  >
                    {tag}
                  </Tag>
                ))}
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      {zoomed?.asset && (
        <Suspense fallback={null}>
          <Lightbox
            svg={visuel(zoomed.asset)}
            ratio={proportion(zoomed.asset, etroit)}
            title={zoomed.mock ? `${zoomed.title[lang]} · ${t("projects", "mock", lang)}` : zoomed.title[lang]}
            onClose={closeZoom}
          />
        </Suspense>
      )}
    </section>
  );
}
