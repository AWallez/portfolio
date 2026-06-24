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

function Tag({ children }: { children: string }) {
  return (
    <span
      className="badge-hover px-3 py-1.5 rounded-md text-sm font-medium font-mono
                     bg-accent/10 text-accent border border-accent/30"
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
                  <Tag key={item}>{item}</Tag>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
