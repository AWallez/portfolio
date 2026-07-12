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
