// Génère le visuel d'architecture pour LinkedIn (1200×675).
//
//   node branding/linkedin-archi.mjs  -> branding/linkedin-archi{,-clair}.svg
//
// Reprend le schéma du README (visiteur → box → Caddy → Nginx → API → PG/ntfy)
// aux couleurs du site, en thème sombre ET clair.
//
// Conversion PNG : cf. branding/README.md (resvg).
//
// ⚠️ Lisibilité : LinkedIn affiche l'image du fil à ~50 % de sa largeur →
// aucun texte en dessous de 16 px, et les libellés de nœuds à 22 px.

import { writeFileSync } from "node:fs";

/* Palettes : copie exacte des tokens de src/index.css (.dark et :root) */
const DARK = {
  base: "#0d1418",
  surface: "#121c20",
  ink: "#e6edf3",
  muted: "#8b98a5",
  line: "#1f2a30",
  accent: "#14b8a6",
  glow: 0.18,
};
const LIGHT = {
  base: "#eef3f2",
  surface: "#ffffff",
  ink: "#0a2229",
  muted: "#486169",
  line: "#c8d6d2",
  accent: "#006d77",
  glow: 0.12,
};
// palette courante (fixée par la boucle de sortie)
let P = DARK;

const W = 1200;
const H = 675;
const MONO = `font-family="'JetBrains Mono', Consolas, 'Courier New', monospace"`;
const SANS = `font-family="'Inter', Arial, Helvetica, sans-serif"`;

// échappe les caractères réservés XML (`&` non échappé = SVG invalide)
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function T(x, y, size, fill, str, o = {}) {
  const { w = "normal", anchor = "start", mono = true } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${w}" ${
    mono ? MONO : SANS
  }${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}>${esc(str)}</text>`;
}

/** Nœud : rectangle arrondi + titre, et sous-titre optionnel. */
function node(x, y, w, h, title, sub, o = {}) {
  const { dashed = false, strong = false } = o;
  const cx = x + w / 2;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"
    fill="${dashed ? "none" : P.surface}" stroke="${strong ? P.accent : P.line}"
    stroke-width="${strong ? 2.5 : 2}"${dashed ? ` stroke-dasharray="7 6"` : ""}/>`;
  // sans sous-titre le titre est centré verticalement, sinon les deux se partagent la hauteur
  s += T(cx, y + (sub ? h / 2 - 3 : h / 2 + 7), 20, strong ? P.accent : P.ink, title, {
    anchor: "middle",
    w: "bold",
  });
  if (sub) s += T(cx, y + h / 2 + 22, 15, P.muted, sub, { anchor: "middle" });
  return s;
}

/** Flèche droite horizontale, avec libellé optionnel au-dessus. */
function arrow(x1, x2, y, label, accent = true) {
  const c = accent ? P.accent : P.muted;
  let s = `<path d="M${x1} ${y} H${x2 - 9}" stroke="${c}" stroke-width="2.5" fill="none"
    marker-end="url(#ah-${accent ? "a" : "m"})"/>`;
  if (label) {
    // libellé mono 15 px, sur une pastille de fond (il peut tomber sur la
    // bordure du panneau NAS) ; un tableau empile plusieurs lignes vers le haut
    const lines = Array.isArray(label) ? label : [label];
    const cx = (x1 + x2) / 2;
    const LH = 19;
    const w = Math.max(...lines.map((l) => l.length)) * 9 + 12;
    const first = y - 14 - (lines.length - 1) * LH;
    s += `<rect x="${cx - w / 2}" y="${first - 15}" width="${w}"
      height="${(lines.length - 1) * LH + 21}" fill="${P.base}"/>`;
    lines.forEach((l, i) => {
      s += T(cx, first + i * LH, 15, P.muted, l, { anchor: "middle" });
    });
  }
  return s;
}

/** Flèche coudée : horizontal, vertical, horizontal. */
function elbow(x1, y1, x2, y2, accent = true) {
  const c = accent ? P.accent : P.muted;
  const mx = (x1 + x2) / 2;
  return `<path d="M${x1} ${y1} H${mx} V${y2} H${x2 - 9}" stroke="${c}" stroke-width="2.5"
    fill="none" stroke-linejoin="round" marker-end="url(#ah-${accent ? "a" : "m"})"/>`;
}

function build() {
  const head = (c) =>
    `<marker id="ah-${c === P.accent ? "a" : "m"}" viewBox="0 0 10 10" refX="9" refY="5"
      markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10 z" fill="${c}"/></marker>`;

  let s = "";

  /* --- en-tête --- */
  s += T(48, 62, 20, P.accent, "alexis@wallez:~$ docker compose ps", {});
  s += T(48, 108, 34, P.ink, "Architecture — alexiswallez.fr", {
    w: "bold",
    mono: false,
  });
  s += T(48, 146, 20, P.muted, "Auto-hébergé · Docker Compose · HTTPS Let's Encrypt", {
    mono: false,
  });

  /* --- panneau NAS --- */
  // sa bordure gauche est posée après le libellé « redirection de port », qui
  // sinon percerait les pointillés avec sa pastille de fond
  s += `<rect x="452" y="196" width="723" height="338" rx="16" fill="none"
    stroke="${P.line}" stroke-width="2.5" stroke-dasharray="10 7"/>`;
  s += T(482, 236, 19, P.muted, "NAS · Docker Compose", {});

  /* --- nœuds --- */
  // la chaîne principale est centrée entre PostgreSQL (haut) et ntfy (bas) ;
  // les écarts laissent au moins 9 px entre un libellé de flèche et un bloc
  const y = 338;
  const h = 68;
  const cy = y + h / 2;

  s += node(24, y, 110, h, "Visiteur", null, { dashed: true });
  s += node(206, y, 100, h, "Box", "NAT", { dashed: true });
  s += node(482, y, 140, h, "Caddy", "reverse proxy", { strong: true });
  s += node(662, y, 120, h, "Nginx", "SPA React");
  s += node(860, y, 105, h, "API", "Fastify");
  s += node(1005, 250, 140, h, "PostgreSQL", "contacts");
  s += node(1005, 426, 140, h, "ntfy", "push iOS");

  /* --- liens --- */
  s += arrow(134, 206, cy, "HTTPS");
  s += arrow(306, 452, cy, ["redirection", "de port"]);
  s += arrow(622, 662, cy);
  s += arrow(782, 860, cy, "/api");
  s += elbow(965, cy - 14, 1005, 284);
  s += elbow(965, cy + 14, 1005, 460);

  /* --- pied : le point qui compte --- */
  s += T(
    48,
    624,
    21,
    P.muted,
    "Seul Caddy est exposé — l'API et la base restent sur le réseau Docker interne.",
    { mono: false },
  );

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <pattern id="dots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.3" fill="${P.line}"/>
    </pattern>
    <radialGradient id="glow">
      <stop offset="0" stop-color="${P.accent}" stop-opacity="${P.glow}"/>
      <stop offset="1" stop-color="${P.accent}" stop-opacity="0"/>
    </radialGradient>
    ${head(P.accent)}${head(P.muted)}
  </defs>
  <rect width="${W}" height="${H}" fill="${P.base}"/>
  <rect width="${W}" height="${H}" fill="url(#dots)"/>
  <circle cx="1050" cy="80" r="320" fill="url(#glow)"/>
  ${s}
</svg>`;
}

/* ------------------------------------------------------------------ */
for (const [theme, palette] of [
  ["", DARK],
  ["-clair", LIGHT],
]) {
  P = palette; // la palette courante est lue par toutes les fonctions de dessin
  const file = `branding/linkedin-archi${theme}.svg`;
  writeFileSync(file, build());
  console.log("ok", file);
}
