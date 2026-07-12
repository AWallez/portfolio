import {
  Container,
  Network,
  Cloud,
  MonitorSmartphone,
  Server,
  Database,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

// Info-bulle = DÉFINITION de la techno (ce que c'est), pas mon usage. Une par
// compétence, FR + EN. Bonus (survol desktop / tap mobile) ; le tag reste l'info.
const TIPS: Record<string, { fr: string; en: string }> = {
  // Systèmes & conteneurs
  Linux: {
    fr: "Système d'exploitation libre, socle des serveurs et du DevOps.",
    en: "Free operating system, the backbone of servers and DevOps.",
  },
  Debian: {
    fr: "Distribution Linux réputée pour sa stabilité, très utilisée sur serveurs.",
    en: "Linux distribution known for its stability, widely used on servers.",
  },
  Ubuntu: {
    fr: "Distribution Linux dérivée de Debian, populaire poste et serveur.",
    en: "Debian-based Linux distribution, popular on desktop and server.",
  },
  Arch: {
    fr: "Distribution Linux minimaliste, mise à jour en continu (rolling release).",
    en: "Minimalist, rolling-release Linux distribution.",
  },
  Kali: {
    fr: "Distribution Linux dédiée à la sécurité et aux tests d'intrusion.",
    en: "Linux distribution focused on security and penetration testing.",
  },
  Docker: {
    fr: "Conteneurise une application et ses dépendances pour la faire tourner partout à l'identique.",
    en: "Containerizes an app and its dependencies to run identically anywhere.",
  },
  "docker-compose": {
    fr: "Décrit et lance plusieurs conteneurs Docker via un seul fichier YAML.",
    en: "Describes and runs multiple Docker containers from a single YAML file.",
  },
  ESXi: {
    fr: "Hyperviseur bare-metal de VMware pour virtualiser des serveurs.",
    en: "VMware's bare-metal hypervisor for virtualizing servers.",
  },
  VMware: {
    fr: "Solution professionnelle de virtualisation (machines virtuelles).",
    en: "Professional virtualization solution (virtual machines).",
  },
  VirtualBox: {
    fr: "Logiciel libre pour créer des machines virtuelles sur son poste.",
    en: "Free software to run virtual machines on your own machine.",
  },
  Bash: {
    fr: "Shell et langage de script Unix pour automatiser des tâches.",
    en: "Unix shell and scripting language to automate tasks.",
  },
  // Réseau & sécurité
  WireGuard: {
    fr: "VPN moderne, simple et rapide, basé sur un chiffrement récent.",
    en: "Modern, simple and fast VPN built on state-of-the-art cryptography.",
  },
  DNS: {
    fr: "Annuaire d'Internet : traduit les noms de domaine en adresses IP.",
    en: "The Internet's directory: translates domain names into IP addresses.",
  },
  "IPv4/IPv6": {
    fr: "Protocoles d'adressage qui identifient les machines sur un réseau.",
    en: "Addressing protocols that identify machines on a network.",
  },
  iptables: {
    fr: "Pare-feu du noyau Linux : filtre le trafic réseau.",
    en: "The Linux kernel firewall: filters network traffic.",
  },
  SSH: {
    fr: "Protocole d'accès distant sécurisé (terminal chiffré).",
    en: "Secure remote-access protocol (encrypted terminal).",
  },
  iSCSI: {
    fr: "Protocole d'accès à du stockage disque à travers le réseau.",
    en: "Protocol to access block storage over the network.",
  },
  "Nginx / Caddy": {
    fr: "Serveurs web et reverse proxies (Caddy gère le HTTPS automatiquement).",
    en: "Web servers and reverse proxies (Caddy handles HTTPS automatically).",
  },
  // Front-end
  "HTML / CSS": {
    fr: "Langages de structure et de mise en forme des pages web.",
    en: "The languages for structuring and styling web pages.",
  },
  "Tailwind CSS": {
    fr: "Framework CSS « utility-first » : on style directement dans le HTML.",
    en: "Utility-first CSS framework: style right in the markup.",
  },
  JavaScript: {
    fr: "Langage de programmation du web, exécuté dans le navigateur.",
    en: "The web's programming language, running in the browser.",
  },
  TypeScript: {
    fr: "JavaScript typé : détecte les erreurs avant l'exécution.",
    en: "Typed JavaScript: catches errors before runtime.",
  },
  React: {
    fr: "Bibliothèque JavaScript pour bâtir des interfaces à base de composants.",
    en: "JavaScript library for building component-based interfaces.",
  },
  "Vue.js": {
    fr: "Framework JavaScript progressif pour créer des interfaces web.",
    en: "Progressive JavaScript framework for building web interfaces.",
  },
  Angular: {
    fr: "Framework front-end complet de Google, en TypeScript.",
    en: "Google's full-featured front-end framework, in TypeScript.",
  },
  "Next.js": {
    fr: "Framework React avec rendu serveur et routing intégrés.",
    en: "React framework with built-in server rendering and routing.",
  },
  Vite: {
    fr: "Outil de build moderne et ultra-rapide pour le développement front.",
    en: "Modern, ultra-fast build tool for front-end development.",
  },
  "Responsive design": {
    fr: "Adapter l'affichage à toutes les tailles d'écran (mobile → desktop).",
    en: "Adapting layouts to every screen size (mobile → desktop).",
  },
  SEO: {
    fr: "Optimisation du référencement dans les moteurs de recherche.",
    en: "Optimizing a site's ranking in search engines.",
  },
  // Back-end & API
  "Node.js": {
    fr: "Environnement qui exécute du JavaScript côté serveur.",
    en: "Runtime that executes JavaScript on the server.",
  },
  Fastify: {
    fr: "Framework web Node.js rapide, orienté création d'API.",
    en: "Fast Node.js web framework, geared toward building APIs.",
  },
  Express: {
    fr: "Framework web Node.js minimaliste, très répandu.",
    en: "Minimalist, widely-used Node.js web framework.",
  },
  "API REST": {
    fr: "Style d'API basé sur HTTP : des ressources et des verbes (GET, POST…).",
    en: "HTTP-based API style: resources and verbs (GET, POST…).",
  },
  Python: {
    fr: "Langage polyvalent : scripts, back-end, données, automatisation.",
    en: "Versatile language: scripting, back-end, data, automation.",
  },
  PHP: {
    fr: "Langage back-end historique du web dynamique.",
    en: "Long-standing back-end language for the dynamic web.",
  },
  Postman: {
    fr: "Outil pour tester, explorer et documenter des API.",
    en: "Tool to test, explore and document APIs.",
  },
  // Cloud / CI-CD / IaC
  AWS: {
    fr: "Plateforme cloud d'Amazon : serveurs, stockage et services à la demande.",
    en: "Amazon's cloud platform: on-demand servers, storage and services.",
  },
  Git: {
    fr: "Système de gestion de versions du code (historique, branches).",
    en: "Version-control system for code (history, branches).",
  },
  GitLab: {
    fr: "Plateforme d'hébergement de dépôts Git avec CI/CD intégrée.",
    en: "Git repository hosting platform with built-in CI/CD.",
  },
  "CI/CD": {
    fr: "Automatisation des tests et du déploiement à chaque changement de code.",
    en: "Automating tests and deployment on every code change.",
  },
  Kubernetes: {
    fr: "Orchestrateur qui déploie et gère des conteneurs à grande échelle.",
    en: "Orchestrator that deploys and manages containers at scale.",
  },
  Terraform: {
    fr: "Infrastructure-as-code : provisionne l'infrastructure à partir de code.",
    en: "Infrastructure-as-code: provisions infrastructure from code.",
  },
  Ansible: {
    fr: "Automatise la configuration des serveurs via des playbooks.",
    en: "Automates server configuration through playbooks.",
  },
  // Bases de données
  PostgreSQL: {
    fr: "Base de données relationnelle open-source, robuste et avancée.",
    en: "Robust, advanced open-source relational database.",
  },
  MySQL: {
    fr: "Base de données relationnelle open-source très répandue.",
    en: "Widely-used open-source relational database.",
  },
  "SQL Server": {
    fr: "Base de données relationnelle de Microsoft.",
    en: "Microsoft's relational database.",
  },
  MongoDB: {
    fr: "Base de données NoSQL orientée documents (format JSON).",
    en: "Document-oriented NoSQL database (JSON-like).",
  },
};

const TAG_CLASS =
  "badge-hover px-3 py-1.5 rounded-md text-sm font-medium font-mono " +
  "bg-accent/10 text-accent border border-accent/30";

function Tag({ children, tip }: { children: string; tip?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>();

  // positionne l'info-bulle en `fixed` : centrée sur le tag mais BORNÉE à l'écran
  // (jamais coupée par un bord) ; au-dessus si la place le permet, sinon en dessous.
  const place = useCallback(() => {
    const el = ref.current;
    const tipEl = tipRef.current;
    if (!el || !tipEl) return;
    const r = el.getBoundingClientRect();
    const w = tipEl.offsetWidth;
    const h = tipEl.offsetHeight;
    const m = 10; // marge mini avec le bord de l'écran
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(m, Math.min(left, window.innerWidth - w - m));
    const above = r.top > h + 16;
    setStyle({ top: above ? r.top - h - 8 : r.bottom + 8, left });
  }, []);

  // mesure/positionne après rendu de la bulle ; ferme au scroll / clic extérieur
  useLayoutEffect(() => {
    if (!open) return;
    place();
    const close = () => setOpen(false);
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", place);
    document.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", place);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open, place]);

  // desktop = survol ; tactile = tap (les deux gérés sans double-déclenchement)
  const canHover = () =>
    typeof matchMedia !== "undefined" && matchMedia("(hover: hover)").matches;

  if (!tip) return <span className={TAG_CLASS}>{children}</span>;

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-label={`${children} : ${tip}`}
        // garde l'anim « survol » du badge tant que la bulle est ouverte (mobile)
        data-active={open}
        onMouseEnter={() => canHover() && setOpen(true)}
        onMouseLeave={() => canHover() && setOpen(false)}
        onClick={() => !canHover() && setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
        className={TAG_CLASS + " cursor-help"}
      >
        {children}
      </button>
      {open &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={style}
            className="fixed left-0 top-0 z-[100] w-max max-w-[min(17rem,calc(100vw-1.25rem))]
                       rounded-lg border border-line bg-surface px-2.5 py-1.5
                       text-[11px] leading-snug text-muted text-center
                       shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)] pointer-events-none"
          >
            {tip}
          </div>,
          document.body,
        )}
    </>
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
            className="w-full sm:w-[calc(50%-0.75rem)] flex"
          >
            <div
              {...spotlight}
              className="spotlight w-full flex flex-col justify-center rounded-2xl border border-line bg-base/60 backdrop-blur-[3px] p-7 sm:p-8 shadow-sm
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
