import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import Reveal from "./Reveal";

const GROUPS: {
  key: "systems" | "network" | "cloud" | "dev" | "data";
  items: string[];
}[] = [
  {
    key: "systems",
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
  { key: "data", items: ["PostgreSQL", "MySQL", "SQL Server", "MongoDB"] },
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
      className="section-screen max-w-300 mx-auto px-5 sm:px-6 lg:px-8 py-7 "
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
            <div className="w-full rounded-xl border border-line bg-base/45 backdrop-blur-[2px] p-5 shadow-sm
                            hover:border-accent/50 hover:-translate-y-1 hover:shadow-md transition">
              <h3 className="font-mono text-sm text-ink mb-3 text-center">
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
