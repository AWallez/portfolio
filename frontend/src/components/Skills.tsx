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
import Tag from "./Tag";
import { TIPS } from "../lib/tips";
import { SKILL_ICONS } from "../lib/skill-icons";
import { GENERIC_ICONS } from "../lib/generic-icons";

// badges « doubles » (deux technos) → les deux logos côte à côte
const DUAL_ICONS: Record<string, string[]> = {
  "Nginx / Caddy": [SKILL_ICONS["Nginx / Caddy"], SKILL_ICONS["Caddy"]],
  "HTML / CSS": [SKILL_ICONS["HTML / CSS"], SKILL_ICONS["CSS"]],
};

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
      "systemd",
    ],
  },
  {
    key: "network",
    Icon: Network,
    items: ["WireGuard", "VLAN", "DNS", "IPv4/IPv6", "iptables", "SSH", "iSCSI", "Nginx / Caddy"],
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
      "Vitest",
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
      "GitHub Actions",
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
              className="spotlight card-bevel w-full flex flex-col justify-center rounded-2xl border border-line bg-base/60 backdrop-blur-[3px] p-7 sm:p-8
                            hover:border-accent/50 hover:-translate-y-1 transition"
            >
              <div className="mb-5 flex items-center justify-center gap-2.5 border-b border-line pb-4">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/25 bg-accent/12 text-accent">
                  <group.Icon size={16} />
                </span>
                <h3 className="font-mono text-ink">{t("skills", group.key, lang)}</h3>
                <span className="font-mono text-xs text-muted">
                  ×{group.items.length}
                </span>
              </div>
              <div className="flex flex-wrap justify-center gap-2.5">
                {group.items.map((item) => (
                  <Tag
                    key={item}
                    tip={TIPS[item]?.[lang]}
                    icon={
                      DUAL_ICONS[item] ??
                      SKILL_ICONS[item] ??
                      GENERIC_ICONS[item]
                    }
                  >
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
