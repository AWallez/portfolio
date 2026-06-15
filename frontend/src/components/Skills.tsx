import {
  Server,
  Network,
  Cloud,
  Code2,
  Database,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { spotlight } from "../lib/spotlight";
import Reveal from "./Reveal";

const GROUPS: {
  key: "systems" | "network" | "cloud" | "dev" | "data";
  Icon: LucideIcon;
  items: string[];
}[] = [
  {
    key: "systems",
    Icon: Server,
    items: [
      "Linux",
      "Debian",
      "Ubuntu",
      "Arch",
      "Docker",
      "docker-compose",
      "ESXi",
      "VMware",
    ],
  },
  {
    key: "network",
    Icon: Network,
    items: [
      "WireGuard",
      "DNS",
      "IPv4/IPv6",
      "iptables",
      "SSH",
      "10 GbE",
      "iSCSI",
    ],
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
    key: "dev",
    Icon: Code2,
    items: [
      "Python",
      "TypeScript",
      "JavaScript",
      "Node.js",
      "React",
      "Vue.js",
      "PHP",
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
      className="px-2.5 py-1 rounded-md text-xs font-medium font-mono
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

      <div className="flex flex-wrap justify-center gap-4">
        {GROUPS.map((group, i) => (
          <Reveal
            key={group.key}
            delay={i * 100}
            variant="zoom"
            className="w-full sm:w-[calc(50%-0.5rem)] lg:w-87 flex"
          >
            <div
              {...spotlight}
              className="spotlight w-full rounded-xl border border-line bg-base/45 backdrop-blur-[2px] p-5 shadow-sm
                            hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition"
            >
              <h3 className="font-mono text-sm text-ink mb-3 flex items-center justify-center gap-2">
                <group.Icon size={16} className="text-accent" />
                {t("skills", group.key, lang)}
              </h3>
              <div className="flex flex-wrap justify-center gap-2">
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
