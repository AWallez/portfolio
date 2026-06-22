// Generates the Projects-section visuals — 5 cards × light/dark theme × FR/EN.
// Each card is recolored from the site tokens (src/index.css) and rendered for
// both palettes and both languages, so images match the site's colors AND its
// current language. Commands / tech terms / tool output stay in English (universal);
// only human-readable copy is translated via the `tr(fr, en)` helper.
// Output is SVG (vector), inlined in Projects.tsx (inherits the site's webfonts).
// IDs are made unique per file to avoid collisions between inlined SVGs.
//
//   node branding/generate-projects.mjs   -> 20 SVG into src/assets/projects/
//
// File name pattern: {name}-{theme}-{lang}.svg

import { writeFileSync, mkdirSync } from "node:fs";

/* ------------------------------------------------------------------ */
/* Palettes: exact copy of the tokens in src/index.css (:root and .dark) */
/* ------------------------------------------------------------------ */
const LIGHT = {
  base: "#eef3f2",
  surface: "#ffffff",
  soft: "#f4f8f7",
  ink: "#0a2229",
  muted: "#486169",
  line: "#c8d6d2",
  accent: "#0f766e",
  accentInk: "#ffffff",
  chrome: "#0a2229",
  chromeInk: "#eef3f2",
  shadow: "#0a2229",
  shadowOp: 0.16,
  dotOp: 0.7,
};
const DARK = {
  base: "#0d1418",
  surface: "#121c20",
  soft: "#0e171b",
  ink: "#e6edf3",
  muted: "#8b98a5",
  line: "#1f2a30",
  accent: "#2dd4bf",
  accentInk: "#06201d",
  chrome: "#06121a",
  chromeInk: "#e6edf3",
  shadow: "#000000",
  shadowOp: 0.45,
  dotOp: 0.8,
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const SANS = `font-family="'Inter', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif"`;
const MONO = `font-family="'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"`;

function card(x, y, w, h, p, o = {}) {
  const { r = 14, fill = p.surface, stroke = p.line, sw = 1.5, shadow = true } = o;
  return `<g${shadow ? ' filter="url(#sh)"' : ""}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;
}
function T(x, y, size, fill, str, o = {}) {
  const { w = "normal", anchor = "start", mono = false, op = 1 } = o;
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}"${op !== 1 ? ` fill-opacity="${op}"` : ""} font-weight="${w}" ${mono ? MONO : SANS}${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}>${str}</text>`;
}
function dots3(cx, cy, p, r = 4, gap = 14) {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.accent}"/><circle cx="${cx + gap}" cy="${cy}" r="${r}" fill="${p.accent}" fill-opacity="0.55"/><circle cx="${cx + 2 * gap}" cy="${cy}" r="${r}" fill="${p.muted}" fill-opacity="0.5"/>`;
}
function titlebar(x, y, w, p, label, { r = 14, h = 36 } = {}) {
  return `<path d="M${x} ${y + r} a${r} ${r} 0 0 1 ${r} -${r} h${w - 2 * r} a${r} ${r} 0 0 1 ${r} ${r} v${h - r} h-${w} z" fill="${p.chrome}"/>${dots3(x + 22, y + h / 2, { accent: p.accent, muted: p.chromeInk }, 5)}${label ? T(x + w / 2, y + h / 2 + 4, 12.5, p.chromeInk, label, { anchor: "middle", mono: true, op: 0.85 }) : ""}`;
}
function field(x, y, w, h, p, ph) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${p.soft}" stroke="${p.line}"/>${ph ? T(x + 12, y + h / 2 + 4, 10, p.muted, ph, { op: 0.85 }) : ""}`;
}
function tagRow(x, y, labels, p, gap = 8, fs = 11) {
  let cx = x;
  const ph = 10;
  return labels
    .map((l) => {
      const w = Math.round(l.length * (fs * 0.6) + ph * 2);
      const out = `<rect x="${cx}" y="${y}" width="${w}" height="22" rx="5" fill="${p.accent}" fill-opacity="0.12" stroke="${p.accent}" stroke-opacity="0.32"/>${T(cx + ph, y + 15, fs, p.accent, l, { mono: true })}`;
      cx += w + gap;
      return out;
    })
    .join("");
}
function frame(p, inner) {
  const thumb = inner.includes("url(#thumb)")
    ? `<linearGradient id="thumb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.30"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0.06"/></linearGradient>`
    : "";
  const arrow = inner.includes("url(#arrow)")
    ? `<marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="${p.muted}"/></marker>`
    : "";
  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg" ${SANS}>
  <defs>
    <pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.4" fill="${p.line}" fill-opacity="${p.dotOp}"/></pattern>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="11" flood-color="${p.shadow}" flood-opacity="${p.shadowOp}"/></filter>${thumb}${arrow}
  </defs>
  <rect width="1200" height="675" fill="${p.base}"/>
  <rect width="1200" height="675" fill="url(#dots)"/>
  ${inner}
</svg>`;
}

/* ================================================================== */
/* 1. clients (web)                                                    */
/* ================================================================== */
function clients(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";

  /* ---- Frame 1: showcase site ---- */
  s += T(48, 56, 13, p.muted, tr("Site vitrine — artisan / indépendant", "Showcase site — craftsperson / freelancer"));
  s += card(48, 66, 624, 300, p, { r: 12 });
  s += dots3(68, 83, p);
  s += `<rect x="118" y="75" width="220" height="16" rx="8" fill="${p.soft}"/>${T(130, 87, 10, p.muted, tr("menuiserie-dupont.fr", "dupont-carpentry.com"), { mono: true })}`;
  s += `<line x1="48" y1="100" x2="672" y2="100" stroke="${p.line}"/>`;
  s += `<rect x="66" y="116" width="14" height="14" rx="3" fill="${a}"/>${T(86, 128, 13, p.ink, tr("Menuiserie Dupont", "Dupont Carpentry"), { w: "bold" })}`;
  s += T(386, 128, 11, p.muted, tr("Accueil", "Home"));
  s += T(442, 128, 11, p.muted, tr("Projets", "Projects"));
  s += T(520, 128, 11, p.muted, "Services");
  s += `<rect x="584" y="116" width="70" height="22" rx="11" fill="${a}"/>${T(619, 131, 10, p.accentInk, tr("Devis", "Quote"), { w: "bold", anchor: "middle" })}`;
  s += T(66, 186, 24, p.ink, tr("Le menuisier,", "The woodworker,"), { w: "bold" });
  s += T(66, 216, 24, a, tr("sur mesure.", "made to measure."), { w: "bold" });
  s += T(66, 242, 12, p.muted, tr("Meubles sur mesure &amp; rénovation", "Custom furniture design &amp; renovation"));
  s += T(66, 259, 12, p.muted, tr("pour particuliers &amp; entreprises.", "for homes &amp; businesses."));
  s += `<rect x="66" y="276" width="168" height="38" rx="9" fill="${a}"/>${T(150, 300, 12.5, p.accentInk, tr("Demander un devis", "Request a quote"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="394" y="156" width="256" height="158" rx="10" fill="url(#thumb)" stroke="${a}" stroke-opacity="0.3"/>`;
  s += `<g stroke="${a}" stroke-opacity="0.55" fill="none" stroke-width="2"><circle cx="447" cy="202" r="13"/><path d="M414 290 L470 238 L506 270 L548 228 L620 300"/></g>`;
  s += T(66, 342, 11, a, tr("▸ Agencement", "▸ Fittings"), { op: 0.85 });
  s += T(206, 342, 11, a, tr("▸ Meubles sur mesure", "▸ Custom furniture"), { op: 0.85 });
  s += T(392, 342, 11, a, tr("▸ Rénovation", "▸ Renovation"), { op: 0.85 });

  /* ---- Frame 2: custom web app (StockApp) ---- */
  s += T(48, 400, 13, p.muted, tr("App web sur mesure — gestion", "Custom web app — management"));
  s += card(48, 410, 624, 228, p, { r: 12 });
  s += `<circle cx="68" cy="430" r="6" fill="${a}"/>${T(82, 435, 12, p.ink, "StockApp", { w: "bold" })}`;
  s += `<line x1="48" y1="446" x2="672" y2="446" stroke="${p.line}"/>`;
  s += `<rect x="48" y="446" width="120" height="192" fill="${p.soft}"/>`;
  s += `<rect x="58" y="458" width="100" height="26" rx="6" fill="${a}" fill-opacity="0.14"/>${T(70, 475, 10.5, a, tr("Tableau de bord", "Dashboard"), { w: "bold" })}`;
  const menu = tr(
    ["Clients (CRM)", "Stock", "Réservations", "Statistiques"],
    ["Customers (CRM)", "Inventory", "Bookings", "Analytics"],
  );
  menu.forEach((m, i) => (s += T(70, 508 + i * 28, 10.5, p.muted, m)));
  const stat = tr(
    [
      [184, 146, "Revenus", "8 240 €"],
      [342, 146, "Commandes", "32"],
      [500, 150, "Articles en stock", "1 320"],
    ],
    [
      [184, 146, "Revenue", "€8,240"],
      [342, 146, "Orders", "32"],
      [500, 150, "Items in stock", "1,320"],
    ],
  );
  stat.forEach(([x, w, k, v]) => {
    s += `<rect x="${x}" y="462" width="${w}" height="64" rx="8" fill="${p.surface}" stroke="${p.line}"/>`;
    s += T(x + 12, 484, 10, p.muted, k);
    s += T(x + 12, 510, 17, p.ink, v, { w: "bold" });
  });
  s += `<rect x="184" y="540" width="300" height="86" rx="8" fill="${p.surface}" stroke="${p.line}"/>`;
  const bars = [24, 40, 16, 48, 30, 56, 22, 36, 18];
  bars.forEach((hgt, i) => {
    s += `<rect x="${202 + i * 30}" y="${616 - hgt}" width="20" height="${hgt}" rx="2" fill="${a}" fill-opacity="${0.4 + 0.06 * (i % 3)}"/>`;
  });
  s += `<rect x="500" y="540" width="150" height="86" rx="8" fill="${p.surface}" stroke="${p.line}"/>`;
  ["Marie Lefevre", "Thomas Roche", "Lea Hubert"].forEach((n, i) => {
    s += `<circle cx="516" cy="${564 + i * 26}" r="8" fill="${a}" fill-opacity="0.16"/>`;
    s += T(532, 568 + i * 26, 10.5, p.muted, n);
  });

  /* ---- Frame 3: mobile responsive ---- */
  s += T(700, 56, 13, p.muted, "Mobile · Responsive");
  s += card(700, 66, 190, 360, p, { r: 24 });
  s += `<rect x="770" y="82" width="40" height="6" rx="3" fill="${p.line}"/>`;
  s += `<g stroke="${p.ink}" stroke-width="2"><line x1="716" y1="108" x2="730" y2="108"/><line x1="716" y1="114" x2="730" y2="114"/><line x1="716" y1="120" x2="730" y2="120"/></g>`;
  s += T(745, 118, 11, p.ink, tr("Menuiserie Dupont", "Dupont Carpentry"), { w: "bold" });
  s += `<rect x="716" y="134" width="158" height="104" rx="10" fill="url(#thumb)"/><circle cx="752" cy="168" r="9" fill="${a}" fill-opacity="0.4"/>`;
  s += T(716, 268, 15, p.ink, tr("Le menuisier", "The custom"), { w: "bold" });
  s += T(716, 288, 15, a, tr("sur mesure", "woodworker"), { w: "bold" });
  s += T(716, 310, 10, p.muted, tr("Meubles &amp; agencement", "Furniture &amp; fittings"));
  s += `<rect x="716" y="328" width="158" height="36" rx="9" fill="${a}"/>${T(795, 351, 12, p.accentInk, tr("Demander un devis", "Request a quote"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="716" y="380" width="74" height="30" rx="7" fill="${p.soft}"/><rect x="800" y="380" width="74" height="30" rx="7" fill="${p.soft}"/>`;

  /* ---- Frame 4: bookings module ---- */
  s += T(912, 56, 13, p.muted, tr("Module de réservations", "Bookings module"));
  s += card(912, 66, 240, 360, p, { r: 14 });
  s += T(930, 102, 14, p.ink, tr("Réservations", "Bookings"), { w: "bold" });
  s += T(1136, 102, 10, p.muted, tr("Juin 2026", "June 2026"), { anchor: "end" });
  const resa = tr(
    [
      ["Lun 09:00", "M. Dupont · Devis cuisine"],
      ["Mar 14:00", "Mme Martin · Pose dressing"],
      ["Mer 11:30", "M. Bernard · Prise de mesures"],
      ["Jeu 16:15", "Mme Roche · Livraison"],
      ["Ven 10:00", "M. Hubert · Devis terrasse"],
    ],
    [
      ["Mon 09:00", "Mr. Dupont · Kitchen quote"],
      ["Tue 14:00", "Mrs. Martin · Wardrobe install"],
      ["Wed 11:30", "Mr. Bernard · Measurement"],
      ["Thu 16:15", "Mrs. Roche · Delivery"],
      ["Fri 10:00", "Mr. Hubert · Decking quote"],
    ],
  );
  resa.forEach(([h, d], i) => {
    const y = 114 + i * 50;
    s += `<rect x="928" y="${y}" width="208" height="44" rx="8" fill="${p.soft}"/><rect x="928" y="${y}" width="4" height="44" rx="2" fill="${a}"/>`;
    s += T(944, y + 20, 11, p.ink, h, { w: "bold" });
    s += T(944, y + 35, 10, p.muted, d);
  });
  s += `<rect x="928" y="376" width="208" height="38" rx="9" fill="${a}"/>${T(1032, 400, 12.5, p.accentInk, tr("+ Nouvelle résa", "+ New booking"), { w: "bold", anchor: "middle" })}`;

  /* ---- Frame 5: contact form ---- */
  s += T(700, 456, 13, p.muted, tr("Formulaire de contact", "Contact form"));
  s += card(700, 466, 452, 172, p, { r: 12 });
  s += T(718, 494, 13, p.ink, tr("Contactez-nous", "Contact us"), { w: "bold" });
  s += field(718, 506, 205, 30, p, tr("Nom", "Name"));
  s += field(935, 506, 205, 30, p, "Email");
  s += field(718, 544, 422, 40, p, tr("Votre message…", "Your message…"));
  s += `<rect x="718" y="594" width="422" height="32" rx="8" fill="${a}"/>${T(929, 615, 12, p.accentInk, tr("Envoyer", "Send"), { w: "bold", anchor: "middle" })}`;

  return frame(p, s);
}

/* ================================================================== */
/* 2. portfolio                                                        */
/* ================================================================== */
function portfolio(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";

  /* ---- Desktop: window + terminal hero ---- */
  s += T(48, 56, 13, p.muted, "Portfolio — React · TypeScript · Vite · Tailwind");
  s += card(48, 66, 556, 322, p, { r: 12 });
  s += `${T(70, 100, 14, p.muted, "// ", { w: "bold", mono: true })}${T(94, 100, 14, a, "alexis.wallez", { w: "bold", mono: true })}`;
  s += T(584, 99, 10, p.muted, tr("Compétences · Projets · Services · Contact", "Skills · Projects · Services · Contact"), { anchor: "end" });
  s += `<line x1="48" y1="116" x2="604" y2="116" stroke="${p.line}"/>`;
  s += `<rect x="70" y="130" width="512" height="182" rx="10" fill="${p.soft}" stroke="${p.line}"/>`;
  s += dots3(90, 150, p);
  s += `${T(90, 186, 13.5, a, "$ ", { mono: true })}${T(104, 186, 13.5, p.ink, "whoami", { mono: true })}`;
  s += T(90, 206, 13.5, p.muted, "Alexis Wallez — Full-Stack &amp; DevOps", { mono: true });
  s += `${T(90, 234, 13.5, a, "$ ", { mono: true })}${T(104, 234, 13.5, p.ink, "cat stack.txt", { mono: true })}`;
  s += T(90, 254, 13.5, p.muted, "React · TypeScript · Node · Fastify · PostgreSQL", { mono: true });
  s += `${T(90, 282, 13.5, a, "$ ", { mono: true })}${T(104, 282, 13.5, p.ink, "./deploy.sh → Docker · NAS", { mono: true })}`;
  s += T(70, 344, 11.5, p.muted, tr("Accessibilité · SEO · i18n FR/EN · tests · CI/CD", "Accessibility · SEO · i18n FR/EN · tests · CI/CD"), { op: 0.85 });
  s += T(70, 368, 11.5, p.muted, tr("Full-stack, du front-end à la mise en ligne — esprit DevOps.", "Full-stack, from front-end to deployment — DevOps-minded."));

  /* ---- Mobile ---- */
  s += T(620, 76, 13, p.muted, "Responsive");
  s += card(620, 86, 160, 302, p, { r: 20 });
  s += `<rect x="678" y="100" width="44" height="6" rx="3" fill="${p.line}"/>`;
  s += `${T(638, 134, 11, p.muted, "// ", { w: "bold", mono: true })}${T(662, 134, 11, a, "alexis.w", { w: "bold", mono: true })}`;
  s += `<rect x="636" y="148" width="128" height="108" rx="8" fill="${p.soft}" stroke="${p.line}"/>`;
  s += `${T(648, 172, 10, a, "$ ", { mono: true })}${T(662, 172, 10, p.ink, "whoami", { mono: true })}`;
  s += T(648, 189, 10, p.muted, "Full-Stack", { mono: true });
  s += T(648, 204, 10, p.muted, "&amp; DevOps", { mono: true });
  s += `${T(648, 228, 10, a, "$ ", { mono: true })}${T(662, 228, 10, p.ink, "ls skills/", { mono: true })}`;
  s += T(648, 244, 10, p.muted, "Docker · Linux", { mono: true });
  s += `<rect x="636" y="338" width="128" height="34" rx="9" fill="${a}"/>${T(700, 360, 11, p.accentInk, "→ Contact", { w: "bold", anchor: "middle" })}`;

  /* ---- GitHub ---- */
  s += T(800, 76, 13, p.muted, "Open source");
  s += card(800, 86, 352, 128, p, { r: 12 });
  s += `<path transform="translate(822 108)" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="${p.ink}"/>`;
  s += T(860, 120, 15, p.ink, "GitHub — open source", { w: "bold" });
  s += T(860, 140, 12, p.muted, "AWallez / portfolio");
  s += `<circle cx="824" cy="172" r="4" fill="${a}"/>${T(836, 176, 12, a, tr("Public · CI au vert", "Public · CI passing"))}`;
  s += T(824, 200, 11, p.muted, "React · TS · Fastify · PostgreSQL · Docker");

  /* ---- Quality (tags) ---- */
  s += card(800, 234, 352, 154, p, { r: 12 });
  s += T(820, 262, 13, p.ink, tr("Soigné", "Polished"), { w: "bold" });
  s += tagRow(820, 276, tr(["Accessibilité", "SEO", "i18n FR/EN"], ["Accessibility", "SEO", "i18n FR/EN"]), p);
  s += tagRow(820, 308, tr(["Responsive", "Tests Vitest", "CI/CD Actions"], ["Responsive", "Vitest tests", "CI/CD Actions"]), p);
  s += tagRow(820, 340, tr(["Thème clair / sombre", "Conteneurisé"], ["Light / dark theme", "Containerized"]), p);

  /* ---- Flow: contact form → API → ntfy ---- */
  s += T(48, 412, 13, p.muted, tr("Formulaire → API → notification push (ntfy)", "Contact form → API → push notification (ntfy)"));
  s += card(48, 424, 372, 214, p, { r: 12 });
  s += T(66, 452, 13, p.ink, tr("Contactez-nous", "Contact us"), { w: "bold" });
  s += field(66, 462, 166, 28, p, tr("Prénom", "First name"));
  s += field(240, 462, 164, 28, p, tr("Nom", "Last name"));
  s += field(66, 498, 166, 28, p, "Email");
  s += field(240, 498, 164, 28, p, tr("Téléphone", "Phone"));
  s += field(66, 534, 338, 28, p, tr("Type de demande", "Request type"));
  s += T(390, 552, 12, p.muted, "▾", { anchor: "middle" });
  s += field(66, 570, 338, 22, p, "Message…");
  s += `<rect x="66" y="600" width="338" height="26" rx="8" fill="${a}"/>${T(235, 618, 11, p.accentInk, tr("→ Envoyer", "→ Send"), { w: "bold", anchor: "middle" })}`;

  s += `<line x1="424" y1="500" x2="482" y2="500" stroke="${p.muted}" stroke-width="2" marker-end="url(#arrow)"/>`;
  s += T(453, 492, 10, p.muted, "POST", { anchor: "middle" });
  s += card(488, 470, 168, 76, p, { r: 12, fill: p.chrome, stroke: p.chrome });
  s += `<circle cx="510" cy="500" r="6" fill="${a}"/>${T(524, 497, 13, p.chromeInk, "Fastify API", { w: "bold" })}`;
  s += T(506, 524, 11, p.chromeInk, "/api/contact", { mono: true, op: 0.7 });
  s += T(506, 540, 10, p.chromeInk, "PostgreSQL · validation", { op: 0.55 });

  s += `<line x1="656" y1="508" x2="712" y2="520" stroke="${p.muted}" stroke-width="2" marker-end="url(#arrow)"/>`;
  s += T(684, 500, 10, p.muted, tr("publie", "publish"), { anchor: "middle" });

  s += T(718, 452, 13, p.muted, tr("Notification push", "Push notification"));
  s += card(718, 462, 434, 156, p, { r: 14 });
  s += `<rect x="738" y="482" width="40" height="40" rx="10" fill="${a}"/>`;
  s += `<path d="M758 492 a9 9 0 0 1 9 9 v5 l2 3 h-22 l2 -3 v-5 a9 9 0 0 1 9 -9 z" fill="${p.accentInk}"/><circle cx="758" cy="514" r="2.5" fill="${p.accentInk}"/>`;
  s += T(790, 498, 13, p.ink, "ntfy", { w: "bold" });
  s += T(790, 515, 10.5, p.muted, tr("sur ton téléphone", "on your phone"));
  s += T(1134, 498, 10, p.muted, tr("maintenant", "now"), { anchor: "end", op: 0.8 });
  s += `<line x1="738" y1="536" x2="1132" y2="536" stroke="${p.line}"/>`;
  s += T(738, 560, 13, p.ink, tr("Nouveau message — Marie Dupont", "New message — Marie Dupont"), { w: "bold" });
  s += T(738, 580, 11, p.muted, tr("marie@example.com · Projet freelance", "marie@example.com · Freelance project"));
  s += T(738, 600, 11, p.muted, tr("&quot;Bonjour, j'aimerais un devis pour refondre mon site…&quot;", "&quot;Hi, I'd like a quote to redesign my website…&quot;"), { op: 0.85 });

  return frame(p, s);
}

/* ================================================================== */
/* 3. reseau                                                           */
/* ================================================================== */
function reseau(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";

  s += `<g stroke="${p.muted}" stroke-opacity="0.5" stroke-width="2" fill="none">
    <path d="M620 130 L620 168"/>
    <path d="M620 244 L620 296"/>
    <path d="M620 360 L225 436"/>
    <path d="M620 360 L475 436"/>
    <path d="M620 360 L725 436"/>
    <path d="M620 360 L975 436"/>
  </g>`;
  s += `<path d="M620 360 L225 436" stroke="${a}" stroke-width="4" fill="none" opacity="0.9"/>`;
  s += `<rect x="356" y="384" width="74" height="22" rx="11" fill="${p.base}"/><rect x="356" y="384" width="74" height="22" rx="11" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(393, 399, 11, a, "10 GbE", { w: "bold", anchor: "middle", mono: true })}`;
  s += `<path d="M720 205 L980 130" stroke="${a}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`;
  s += `<rect x="828" y="150" width="120" height="22" rx="11" fill="${p.base}"/><rect x="828" y="150" width="120" height="22" rx="11" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(888, 165, 11, a, "WireGuard", { w: "bold", anchor: "middle", mono: true })}`;
  s += `<path d="M325 545 C 350 580, 450 580, 475 545" stroke="${a}" stroke-width="2" stroke-dasharray="6 5" fill="none" opacity="0.7"/>`;
  s += `<rect x="358" y="566" width="84" height="20" rx="10" fill="${p.base}"/><rect x="358" y="566" width="84" height="20" rx="10" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(400, 580, 10, a, "iSCSI", { w: "bold", anchor: "middle", mono: true })}`;

  // Internet
  s += card(540, 74, 160, 56, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><circle cx="570" cy="102" r="13"/><ellipse cx="570" cy="102" rx="5.5" ry="13"/><line x1="557" y1="102" x2="583" y2="102"/></g>`;
  s += T(594, 107, 14, p.ink, "Internet", { w: "bold" });

  // Router / firewall
  s += card(500, 168, 240, 76, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><rect x="522" y="190" width="30" height="22" rx="3"/><path d="M528 190 v-8 M540 190 v-12"/></g>`;
  s += T(566, 200, 14, p.ink, tr("Routeur / Pare-feu", "Router / Firewall"), { w: "bold" });
  s += T(566, 220, 11, p.muted, "DNS · iptables · NAT", { mono: true });

  // Remote access
  s += card(980, 100, 172, 60, p, { stroke: a, sw: 2 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><rect x="1002" y="122" width="16" height="14" rx="2"/><path d="M1005 122 v-4 a5 5 0 0 1 10 0 v4"/></g>`;
  s += T(1028, 126, 12.5, p.ink, tr("Accès distant", "Remote access"), { w: "bold" });
  s += T(1028, 143, 10, p.muted, tr("VPN chiffré", "Encrypted VPN"), { mono: true });

  // Switch
  s += card(500, 296, 240, 64, p, { r: 12, fill: p.chrome, stroke: p.chrome });
  s += `<g fill="${p.chromeInk}" fill-opacity="0.3">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<rect x="${520 + i * 26}" y="332" width="20" height="12" rx="2"/>`).join("")}</g>`;
  s += T(620, 322, 14, p.chromeInk, tr("Switch managé · 10 GbE", "Managed switch · 10 GbE"), { w: "bold", anchor: "middle" });

  // VLAN boxes
  const vlan = (x, badge, title, l1, l2) => {
    let o = card(x, 436, 200, 120, p, { r: 12 });
    o += `<rect x="${x + 16}" y="452" width="74" height="22" rx="11" fill="${a}"/>${T(x + 53, 467, 11, p.accentInk, badge, { w: "bold", anchor: "middle", mono: true })}`;
    o += T(x + 16, 498, 14, p.ink, title, { w: "bold" });
    o += T(x + 16, 518, 11, p.muted, l1);
    o += T(x + 16, 538, 11, p.muted, l2);
    return o;
  };
  s += vlan(125, "VLAN 10", tr("Serveurs", "Servers"), "NAS · Postgres · ntfy", tr("jeux · stockage", "games · storage"));
  s += vlan(375, "VLAN 20", tr("Postes de travail", "Workstations"), "PC / dev", tr("machines de travail", "work machines"));
  s += vlan(625, "VLAN 30", tr("IoT / Domotique", "IoT / Smart home"), tr("objets connectés", "connected devices"), tr("isolé du LAN", "isolated from LAN"));
  s += vlan(875, "VLAN 40", tr("Invités / Wi-Fi", "Guests / Wi-Fi"), tr("accès limité", "limited access"), tr("aucun accès interne", "no internal access"));

  return frame(p, s);
}

/* ================================================================== */
/* 4. homelab (nas)                                                    */
/* ================================================================== */
function homelab(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";

  s += `<g stroke="${p.muted}" stroke-opacity="0.5" stroke-width="2" fill="none">
    <path d="M150 196 L150 300"/>
    <path d="M236 336 L380 336"/>
    <path d="M822 250 L928 192"/>
    <path d="M822 320 L928 292"/>
    <path d="M822 392 L928 392"/>
  </g>`;
  s += `<path d="M601 558 L601 610 L1013 610 L1013 538" stroke="${a}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`;
  s += `<rect x="690" y="598" width="170" height="24" rx="12" fill="${p.base}"/><rect x="690" y="598" width="170" height="24" rx="12" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(775, 614, 12, a, "WireGuard VPN", { w: "bold", anchor: "middle", mono: true })}`;

  // Internet
  s += card(80, 138, 150, 64, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><circle cx="112" cy="170" r="14"/><ellipse cx="112" cy="170" rx="6" ry="14"/><line x1="98" y1="170" x2="126" y2="170"/></g>`;
  s += T(138, 175, 14, p.ink, "Internet", { w: "bold" });

  // Router
  s += card(80, 300, 150, 72, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><rect x="100" y="326" width="26" height="20" rx="3"/><line x1="106" y1="326" x2="106" y2="314"/><line x1="120" y1="326" x2="120" y2="318"/></g>`;
  s += T(138, 332, 13, p.ink, tr("Routeur", "Router"), { w: "bold" });
  s += T(138, 350, 11, p.muted, tr("pare-feu", "firewall"), { mono: true });

  // NAS
  s += card(380, 120, 442, 424, p, { r: 14 });
  s += `<path d="M380 134 a14 14 0 0 1 14 -14 h414 a14 14 0 0 1 14 14 v30 h-442 z" fill="${p.chrome}"/>`;
  s += T(400, 150, 15, p.chromeInk, "NAS UGREEN DXP480T", { w: "bold" });
  s += `<rect x="724" y="130" width="82" height="22" rx="11" fill="${a}"/>${T(765, 145, 11, p.accentInk, "Docker", { w: "bold", anchor: "middle", mono: true })}`;
  s += T(400, 190, 12, p.muted, tr("Services conteneurisés", "Containerized services"), { w: "bold" });

  const services = tr(
    [
      [400, 202, "PostgreSQL", "base de données"],
      [606, 202, "ntfy", "notifications push"],
      [400, 278, "WireGuard", "VPN auto-hébergé"],
      [606, 278, "Serveurs de jeux", "multijoueur"],
      [400, 354, "Stockage RAID", "données &amp; sauvegardes"],
      [606, 354, "Nginx", "reverse proxy / HTTPS"],
    ],
    [
      [400, 202, "PostgreSQL", "database"],
      [606, 202, "ntfy", "push notifications"],
      [400, 278, "WireGuard", "self-hosted VPN"],
      [606, 278, "Game servers", "multiplayer"],
      [400, 354, "RAID storage", "data &amp; backups"],
      [606, 354, "Nginx", "reverse proxy / HTTPS"],
    ],
  );
  services.forEach(([x, y, name, sub]) => {
    s += card(x, y, 196, 62, p, { r: 10, fill: p.soft, shadow: false });
    s += `<circle cx="${x + 22}" cy="${y + 31}" r="7" fill="${a}" fill-opacity="0.18" stroke="${a}" stroke-opacity="0.5"/><circle cx="${x + 22}" cy="${y + 31}" r="3" fill="${a}"/>`;
    s += T(x + 38, y + 28, 13, p.ink, name, { w: "bold" });
    s += T(x + 38, y + 44, 10, p.muted, sub, { mono: true });
  });
  s += T(400, 448, 11, p.muted, tr("+ docker-compose · Linux · durcissement · monitoring", "+ docker-compose · Linux · hardening · monitoring"), { op: 0.85 });
  s += `<rect x="400" y="462" width="402" height="64" rx="10" fill="${p.soft}"/>`;
  s += T(416, 486, 11, p.muted, "$ docker compose up -d", { mono: true });
  s += `<circle cx="420" cy="504" r="4" fill="${a}"/>${T(432, 508, 11, a, tr("6 services actifs", "6 services running"), { mono: true })}`;

  // clients
  const cl = (y, label, icon, secure = false) => {
    let o = card(928, y, 184, 64, p, { r: 12, stroke: secure ? a : p.line, sw: secure ? 2 : 1.5 });
    o += icon;
    o += T(secure ? 978 : 988, y + 37, 13, p.ink, label, { w: "bold" });
    return o;
  };
  s += cl(160, "PC / Dev", `<g stroke="${a}" stroke-width="2" fill="none"><rect x="948" y="180" width="30" height="22" rx="3"/><line x1="958" y1="208" x2="968" y2="208"/></g>`);
  s += cl(260, "Mobile", `<g stroke="${a}" stroke-width="2" fill="none"><rect x="950" y="278" width="18" height="28" rx="3"/></g>`);
  s += cl(360, "TV / Consoles", `<g stroke="${a}" stroke-width="2" fill="none"><rect x="948" y="378" width="30" height="20" rx="3"/></g>`);
  s += card(928, 474, 184, 64, p, { r: 12, stroke: a, sw: 2 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><rect x="950" y="496" width="16" height="14" rx="2"/><path d="M953 496 v-4 a5 5 0 0 1 10 0 v4"/></g>`;
  s += T(978, 504, 12.5, p.ink, tr("Accès distant", "Remote access"), { w: "bold" });
  s += T(978, 521, 10, p.muted, tr("chiffré / sécurisé", "encrypted / secured"), { mono: true });

  return frame(p, s);
}

/* ================================================================== */
/* 5. lab (perso) — DevOps terminal (commands & tool output: EN only)  */
/* ================================================================== */
function lab(p) {
  const a = p.accent;
  let s = "";
  s += card(88, 64, 1024, 548, p, { r: 14 });
  s += titlebar(88, 64, 1024, p, "alexis@homelab : ~/lab", { h: 44 });

  const L = (x, y, str, fill, o = {}) => T(x, y, 17, fill, str, { mono: true, ...o });
  const prompt = (y, cmd) =>
    L(120, y, "alexis@homelab:~$", a, { w: "bold" }) + L(308, y, cmd, p.ink);

  s += prompt(146, "docker compose ps");
  s += L(120, 173, "NAME", p.muted) + L(380, 173, "STATUS", p.muted) + L(600, 173, "PORTS", p.muted);
  const games = [
    ["minecraft-server", "Up 6 days", "25565/tcp"],
    ["skyrim-server", "Up 3 days", "10578/udp"],
    ["subnautica-server", "Up 12 hours", "11000/udp"],
  ];
  games.forEach(([n, st, po], i) => {
    const y = 200 + i * 27;
    s += L(120, y, n, p.ink) + L(380, y, st, a) + L(600, y, po, p.muted);
  });

  s += prompt(308, "kubectl get nodes");
  s += L(120, 335, "NAME", p.muted) + L(320, 335, "STATUS", p.muted) + L(470, 335, "ROLES", p.muted) + L(720, 335, "AGE", p.muted);
  const nodes = [
    ["lab-cp1", "Ready", "control-plane", "14d"],
    ["lab-w1", "Ready", "worker", "14d"],
    ["lab-w2", "Ready", "worker", "14d"],
  ];
  nodes.forEach(([n, st, ro, ag], i) => {
    const y = 362 + i * 27;
    s += L(120, y, n, p.ink) + L(320, y, st, a) + L(470, y, ro, p.muted) + L(720, y, ag, p.muted);
  });

  s += prompt(470, "terraform apply -auto-approve");
  s += L(120, 497, "Apply complete! Resources: 3 added, 0 changed.", a);

  s += prompt(524, "ansible-playbook site.yml");
  s += L(120, 551, "PLAY RECAP", p.muted) + L(280, 551, "ok=18", a) + L(392, 551, "changed=3", p.ink) + L(540, 551, "failed=0", a);

  s += L(120, 578, "alexis@homelab:~$", a, { w: "bold" });

  return frame(p, s);
}

/* ------------------------------------------------------------------ */
const BUILDERS = {
  "web-clients": clients,
  portfolio,
  reseau,
  homelab,
  perso: lab,
};

function uniquify(svg, uid) {
  return svg
    .replace(/id="(dots|sh|thumb|arrow)"/g, `id="${uid}-$1"`)
    .replace(/url\(#(dots|sh|thumb|arrow)\)/g, `url(#${uid}-$1)`);
}

// Visuels sans texte traduisible (terminal pur) → une seule version par thème.
const NO_LANG = new Set(["perso"]);

for (const [name, build] of Object.entries(BUILDERS)) {
  const dir = `src/assets/projects/${name}`;
  mkdirSync(dir, { recursive: true });
  for (const [theme, palette] of [
    ["light", LIGHT],
    ["dark", DARK],
  ]) {
    if (NO_LANG.has(name)) {
      const uid = `${name}-${theme}`;
      writeFileSync(`${dir}/${theme}.svg`, uniquify(build(palette, "en"), uid));
      console.log("ok", `${name}/${theme}.svg`);
    } else {
      for (const lang of ["fr", "en"]) {
        const uid = `${name}-${theme}-${lang}`;
        writeFileSync(
          `${dir}/${theme}-${lang}.svg`,
          uniquify(build(palette, lang), uid),
        );
        console.log("ok", `${name}/${theme}-${lang}.svg`);
      }
    }
  }
}
console.log("done");
