import {
  Container,
  Network,
  Cloud,
  MonitorSmartphone,
  Server,
  Database,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
import Reveal from "./Reveal";

const GROUPS: {
  key: "systems" | "network" | "cloud" | "frontend" | "backend" | "data";
  Icon: LucideIcon;
  items: string[];
}[] = [
  {
    key: "systems",
    Icon: Container,
    items: [
      "Linux",
      "Debian",
      "Ubuntu",
      "Arch",
      "Kali",
      "Docker",
      "docker-compose",
      "ESXi",
      "VMware",
      "VirtualBox",
      "Bash",
    ],
  },
  {
    key: "network",
    Icon: Network,
    items: ["WireGuard", "DNS", "IPv4/IPv6", "iptables", "SSH", "iSCSI", "Nginx / Caddy"],
  },
  {
    key: "frontend",
    Icon: MonitorSmartphone,
    items: [
      "HTML / CSS",
      "Tailwind CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Vue.js",
      "Angular",
      "Next.js",
      "Vite",
      "Responsive design",
      "SEO",
    ],
  },
  {
    key: "backend",
    Icon: Server,
    items: ["Node.js", "Fastify", "Express", "API REST", "Python", "PHP", "Postman"],
  },
  {
    key: "cloud",
    Icon: Cloud,
    items: [
      "AWS",
      "Git",
      "GitLab",
      "CI/CD",
      "Kubernetes",
      "Terraform",
      "Ansible",
    ],
  },
  {
    key: "data",
    Icon: Database,
    items: ["PostgreSQL", "MySQL", "SQL Server", "MongoDB"],
  },
];

// Info-bulle au survol pour les technos où j'ai quelque chose de concret à
// dire (usage réel, mise en prod…). Les tags absents de cette table n'en ont
// pas. Purement bonus (hover desktop) : l'info essentielle reste le tag.
const TIPS: Record<string, { fr: string; en: string }> = {
  Linux: {
    fr: "Usage quotidien — serveurs, NAS et lab",
    en: "Daily driver — servers, NAS and lab",
  },
  Docker: {
    fr: "10+ services en production sur mon NAS",
    en: "10+ services in production on my NAS",
  },
  "docker-compose": {
    fr: "Toute mon infra est décrite en fichiers compose",
    en: "My whole infra is described as compose files",
  },
  WireGuard: {
    fr: "VPN self-hosted pour l'accès distant à mon réseau",
    en: "Self-hosted VPN for remote access to my network",
  },
  SSH: {
    fr: "Administration distante durcie (clés, pare-feu)",
    en: "Hardened remote administration (keys, firewall)",
  },
  iptables: {
    fr: "Pare-feu du NAS et règles réseau Docker",
    en: "NAS firewall and Docker network rules",
  },
  "Nginx / Caddy": {
    fr: "Reverse proxy + HTTPS automatique, en production sur ce site",
    en: "Reverse proxy + automatic HTTPS, in production on this site",
  },
  React: {
    fr: "Framework principal — ce portfolio en est la vitrine",
    en: "Main framework — this portfolio is the showcase",
  },
  TypeScript: {
    fr: "Typage strict sur mes projets récents (dont ce site)",
    en: "Strict typing on my recent projects (incl. this site)",
  },
  "Tailwind CSS": {
    fr: "Utilisé sur ce site (v4)",
    en: "Used on this site (v4)",
  },
  "Node.js": {
    fr: "API et outillage côté serveur",
    en: "Server-side APIs and tooling",
  },
  Fastify: {
    fr: "Motorise l'API de contact de ce site",
    en: "Powers this site's contact API",
  },
  PostgreSQL: {
    fr: "En production sur mon NAS (formulaire de contact)",
    en: "In production on my NAS (contact form)",
  },
  "CI/CD": {
    fr: "GitHub Actions sur ce repo : lint, typecheck, build, tests",
    en: "GitHub Actions on this repo: lint, typecheck, build, tests",
  },
  Kubernetes: {
    fr: "Cluster d'apprentissage en environnement de lab",
    en: "Learning cluster in a lab environment",
  },
  Terraform: {
    fr: "Infrastructure-as-code en environnement de lab",
    en: "Infrastructure-as-code in a lab environment",
  },
  Ansible: {
    fr: "Playbooks de configuration en lab",
    en: "Configuration playbooks in a lab",
  },
  Bash: {
    fr: "Scripts d'admin et de déploiement au quotidien",
    en: "Daily admin and deployment scripting",
  },
};

function Tag({ children, tip }: { children: string; tip?: string }) {
  return (
    <span
      data-tip={tip}
      className={
        "badge-hover px-3 py-1.5 rounded-md text-sm font-medium font-mono " +
        "bg-accent/10 text-accent border border-accent/30" +
        (tip ? " tag-tip" : "")
      }
    >
      {children}
    </span>
  );
}

export default function Skills() {
  const { lang } = useLang();

  return (
    <section
      id="skills"
      className="section-screen max-w-300 container-page py-7 "
    >
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("skills", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("skills", "command", lang)}
      </p>

      <div className="flex flex-wrap justify-center gap-6">
        {GROUPS.map((group, i) => (
          <Reveal
            key={group.key}
            delay={i * 100}
            variant="zoom"
            // relative + hover:z-40 : chaque wrapper Reveal crée un contexte
            // d'empilement (translate) → sans ça, l'info-bulle d'une carte
            // passerait DERRIÈRE les cartes voisines
            className="w-full sm:w-[calc(50%-0.75rem)] flex relative hover:z-40"
          >
            <div
              {...spotlight}
              className="spotlight w-full rounded-2xl border border-line bg-base/60 backdrop-blur-[3px] p-7 sm:p-8 shadow-sm
                            hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition"
            >
              <h3 className="font-mono text-ink mb-5 flex items-center justify-center gap-2.5">
                <group.Icon size={20} className="text-accent" />
                {t("skills", group.key, lang)}
              </h3>
              <div className="flex flex-wrap justify-center gap-2.5">
                {group.items.map((item) => (
                  <Tag key={item} tip={TIPS[item]?.[lang]}>
                    {item}
                  </Tag>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
