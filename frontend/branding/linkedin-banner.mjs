// Génère les bannières LinkedIn (1584×396) aux couleurs du site.
//
//   node branding/linkedin-banner.mjs  -> branding/linkedin-banner-facettes{,-clair}.svg
//
// Accroche + les 5 facettes d'Alexis (code, infrastructure, sapeur-pompier,
// rugby, plongée), rendues en thème sombre ET clair.
//
// Conversion PNG : cf. branding/README.md (resvg).
//
// ⚠️ Zone de sécurité : la photo de profil recouvre le coin INFÉRIEUR GAUCHE
// (~430 px de large). Rien d'important ne doit y figurer.
// ⚠️ Lisibilité : la bannière est souvent affichée à ~50 % de sa taille →
// aucun texte en dessous de 22 px.

import { writeFileSync } from "node:fs";
import { userIcon } from "./user-icons.mjs";

/* Palettes : copie exacte des tokens de src/index.css (.dark et :root) */
const DARK = {
  base: "#0d1418",
  ink: "#e6edf3",
  muted: "#8b98a5",
  line: "#1f2a30",
  accent: "#14b8a6",
  glow: 0.18,
};
const LIGHT = {
  base: "#eef3f2",
  ink: "#0a2229",
  muted: "#486169",
  line: "#c8d6d2",
  accent: "#006d77",
  glow: 0.12,
};
// palette courante (fixée par build())
let P = DARK;

const W = 1584;
const H = 396;
const MONO = `font-family="'JetBrains Mono', Consolas, 'Courier New', monospace"`;
const SANS = `font-family="'Inter', Arial, Helvetica, sans-serif"`;

// échappe les caractères réservés XML (`&` non échappé = SVG invalide)
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function T(x, y, size, fill, str, o = {}) {
  const { w = "normal", anchor = "start", mono = true, op = 1 } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${
    op !== 1 ? ` fill-opacity="${op}"` : ""
  } font-weight="${w}" ${mono ? MONO : SANS}${
    anchor !== "start" ? ` text-anchor="${anchor}"` : ""
  }>${esc(str)}</text>`;
}

const frame = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.3" fill="${P.line}"/>
    </pattern>
    <radialGradient id="glow">
      <stop offset="0" stop-color="${P.accent}" stop-opacity="${P.glow}"/>
      <stop offset="1" stop-color="${P.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${P.base}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <circle cx="1400" cy="30" r="280" fill="url(#glow)"/>
  ${inner}
</svg>`;

/* ------------------------------------------------------------------ */
/* Pictos des 5 facettes                                                */
/* ------------------------------------------------------------------ */
const G = (x, y, inner, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${P.accent}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;

// Pompier / rugby / plongée : icônes dessinées par Alexis (branding/icons/*.svg),
// inlinées et recolorées. Code et serveurs sont dessinés ici, au même style.
const ICON = {
  // chevrons de code
  code: (x, y) =>
    `${T(x, y + 16, 50, P.accent, "</>", { anchor: "middle", w: "bold" })}`,
  // baie de serveurs
  servers: (x, y) =>
    G(
      x,
      y,
      `<rect x="-28" y="-32" width="56" height="19" rx="3"/>
       <rect x="-28" y="-9" width="56" height="19" rx="3"/>
       <rect x="-28" y="14" width="56" height="19" rx="3"/>
       <path d="M-17 -22.5 h0 M-17 0.5 h0 M-17 23.5 h0" stroke-width="5.5"/>`,
    ),
  // Le 7e argument est un faux-gras (en px) : ces deux dessins sont au trait
  // fin et paraissaient délavés à côté des pictos en aplats. Les valeurs calent
  // leur intensité d'encre sur celle du rugby, pris comme étalon (cf. user-icons.mjs).
  pompier: (x, y) => userIcon("pompier.svg", x, y, 82, P.accent, P.base, 1.1),
  rugby: (x, y) => userIcon("rugby.svg", x, y, 74, P.accent, P.base),
  plongee: (x, y) =>
    userIcon("tuba-et-masque.svg", x, y, 74, P.accent, P.base, 1.4),
};

function facettes() {
  let s = "";

  // Accroche placée en HAUT à gauche : la photo de profil ne recouvre que le bas
  // de cette zone, le haut reste visible → on comble le vide sans risque.
  s += T(330, 96, 22, P.accent, "alexis@wallez:~$ whoami", {});
  s += T(330, 148, 34, P.ink, "Développeur Full-Stack & DevOps", {
    w: "bold",
    mono: false,
  });
  s += T(330, 186, 23, P.muted, "Du code à la production — et un peu plus.", {
    mono: false,
  });

  // bande des 5 facettes
  // icônes remontées et libellés descendus → respiration entre les deux
  const y = 286;
  const xs = [560, 770, 980, 1190, 1400];
  const items = [
    ["code", "Code"],
    ["servers", "Infrastructure"],
    ["pompier", "Sapeur-pompier"],
    ["rugby", "Rugby"],
    ["plongee", "Plongée"],
  ];

  // séparateurs discrets entre les facettes
  for (let i = 0; i < xs.length - 1; i++) {
    const mx = (xs[i] + xs[i + 1]) / 2;
    s += `<line x1="${mx}" y1="${y - 56}" x2="${mx}" y2="${y + 20}" stroke="${P.line}" stroke-width="2"/>`;
  }

  items.forEach(([icon, label], i) => {
    s += ICON[icon](xs[i], y - 16);
    s += T(xs[i], y + 66, 20, P.muted, label, { anchor: "middle" });
  });

  return frame(s);
}

/* ------------------------------------------------------------------ */
const BUILDERS = { facettes };
for (const [name, build] of Object.entries(BUILDERS)) {
  for (const [theme, palette] of [["", DARK], ["-clair", LIGHT]]) {
    P = palette; // la palette courante est lue par toutes les fonctions de dessin
    const file = `branding/linkedin-banner-${name}${theme}.svg`;
    writeFileSync(file, build());
    console.log("ok", file);
  }
}
