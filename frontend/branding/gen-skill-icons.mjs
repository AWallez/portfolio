// Génère src/lib/skill-icons.ts = { compétence: chemin SVG } depuis `simple-icons`
// (devDependency). On n'embarque QUE les chemins (pas les objets complets) → bundle
// minimal. Régénérer après ajout/retrait de compétence :
//   node branding/gen-skill-icons.mjs   (cwd = frontend)
import { writeFileSync } from "node:fs";
import * as si from "simple-icons";

// compétence (nom exact dans Skills.tsx) -> nom d'export simple-icons
const MAP = {
  Linux: "siLinux",
  Debian: "siDebian",
  Ubuntu: "siUbuntu",
  Arch: "siArchlinux",
  Kali: "siKalilinux",
  Docker: "siDocker",
  "docker-compose": "siDocker",
  VMware: "siVmware",
  VirtualBox: "siVirtualbox",
  Bash: "siGnubash",
  WireGuard: "siWireguard",
  "Nginx / Caddy": "siNginx",
  "HTML / CSS": "siHtml5",
  CSS: "siCss", // 2ᵉ logo du badge double « HTML / CSS »
  "Tailwind CSS": "siTailwindcss",
  JavaScript: "siJavascript",
  TypeScript: "siTypescript",
  React: "siReact",
  "Vue.js": "siVuedotjs",
  Angular: "siAngular",
  "Next.js": "siNextdotjs",
  Vite: "siVite",
  Vitest: "siVitest",
  "Node.js": "siNodedotjs",
  Fastify: "siFastify",
  Express: "siExpress",
  Python: "siPython",
  PHP: "siPhp",
  Postman: "siPostman",
  Git: "siGit",
  GitLab: "siGitlab",
  "GitHub Actions": "siGithubactions",
  Kubernetes: "siKubernetes",
  Terraform: "siTerraform",
  Ansible: "siAnsible",
  PostgreSQL: "siPostgresql",
  MySQL: "siMysql",
  MongoDB: "siMongodb",
  // ---- badges de la section Projets ----
  AdGuard: "siAdguard",
  Caddy: "siCaddy",
  Vaultwarden: "siVaultwarden",
  "Uptime Kuma": "siUptimekuma",
  ntfy: "siNtfy",
};

const rows = Object.entries(MAP)
  .map(([skill, key]) => {
    const icon = si[key];
    if (!icon?.path) throw new Error(`icône introuvable : ${key} (pour ${skill})`);
    return `  ${JSON.stringify(skill)}: ${JSON.stringify(icon.path)},`;
  })
  .join("\n");

const out = `// Chemins SVG (viewBox 0 0 24 24) des logos de marque par compétence.
// GÉNÉRÉ depuis simple-icons — NE PAS éditer à la main.
// Régénérer : node branding/gen-skill-icons.mjs  (cwd = frontend)
export const SKILL_ICONS: Record<string, string> = {
${rows}
};
`;

writeFileSync("src/lib/skill-icons.ts", out);
console.log(`généré src/lib/skill-icons.ts (${Object.keys(MAP).length} logos)`);
