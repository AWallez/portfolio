// Generates the Projects-section visuals — 7 cards × light/dark theme × FR/EN.
// Each card is recolored from the site tokens (src/index.css) and rendered for
// both palettes and both languages, so images match the site's colors AND its
// current language. Commands / tech terms / tool output stay in English (universal);
// only human-readable copy is translated via the `tr(fr, en)` helper.
// Output is SVG (vector), inlined in Projects.tsx (inherits the site's webfonts).
// IDs are made unique per file to avoid collisions between inlined SVGs.
//
//   node branding/generate-projects.mjs   -> 26 SVG into src/assets/projects/
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
  accent: "#006d77",
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
  accent: "#14b8a6",
  accentInk: "#07221f",
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
  s += T(48, 56, 13, p.muted, tr("Site vitrine pour artisan / indépendant", "Showcase site for craftsperson / freelancer"));
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
  s += T(48, 400, 13, p.muted, tr("App web de gestion sur mesure", "Custom web app for management"));
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
// Section Services du site (src/components/Services.tsx), montrée dans la
// fenêtre « ordinateur » du visuel Portfolio, paysage et vertical. Points forts
// abrégés pour tenir sur une ligne.
const SERVICES = [
  { dossier: { fr: "dev-web/", en: "web-dev/" }, nom: { fr: "Développement web", en: "Web Development" },
    points: { fr: "Sites vitrines · API &amp; back-end", en: "Showcase sites · API &amp; back-end" } },
  { dossier: { fr: "deploiement/", en: "deployment/" }, nom: { fr: "Déploiement &amp; mise en ligne", en: "Deployment &amp; go-live" },
    points: { fr: "Hébergement · Docker · Maintenance", en: "Hosting · Docker · Maintenance" } },
  { dossier: { fr: "montage-pc/", en: "pc-assembly/" }, nom: { fr: "Montage PC", en: "PC Assembly" },
    points: { fr: "Composants · Assemblage · Tests", en: "Components · Assembly · Testing" } },
  { dossier: { fr: "conseil/", en: "consulting/" }, nom: { fr: "Conseil &amp; accompagnement", en: "Consulting &amp; guidance" },
    points: { fr: "SEO &amp; performance · Accompagnement", en: "SEO &amp; performance · Guidance" } },
];

function portfolio(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";

  /* ---- Desktop: window + terminal hero ---- */
  s += T(48, 56, 13, p.muted, "Portfolio · React · TypeScript · Vite · Tailwind");
  s += card(48, 66, 556, 322, p, { r: 12 });
  s += `${T(70, 100, 14, p.muted, "// ", { w: "bold", mono: true })}${T(94, 100, 14, a, "alexis.wallez", { w: "bold", mono: true })}`;
  s += T(584, 99, 10, p.muted, tr("Compétences · Projets · Services · Contact", "Skills · Projects · Services · Contact"), { anchor: "end" });
  s += `<line x1="48" y1="116" x2="604" y2="116" stroke="${p.line}"/>`;
  // section Services du site (et non le terminal du haut de page)
  s += `${T(70, 148, 13, p.muted, "// ", { w: "bold", mono: true })}${T(92, 148, 13, a, "Services", { w: "bold", mono: true })}`;
  s += T(582, 148, 10.5, p.muted, "alexis@wallez:~$ cat services/README.md", { mono: true, anchor: "end" });
  SERVICES.forEach((sv, i) => {
    const x = i % 2 ? 330 : 70;
    const y = 162 + Math.floor(i / 2) * 78;
    s += `<rect x="${x}" y="${y}" width="252" height="70" rx="10" fill="${p.soft}" stroke="${p.line}"/>`;
    s += `<rect x="${x + 14}" y="${y + 12}" width="18" height="18" rx="5" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.4"/><circle cx="${x + 23}" cy="${y + 21}" r="3.5" fill="${a}"/>`;
    s += T(x + 40, y + 25, 10, p.muted, "~/" + sv.dossier[lang], { mono: true });
    s += T(x + 14, y + 48, 13, p.ink, sv.nom[lang], { w: "bold" });
    s += T(x + 14, y + 62, 10, p.muted, sv.points[lang]);
  });
  s += T(70, 344, 11.5, p.muted, tr("Accessibilité · SEO · i18n FR/EN · tests · CI/CD", "Accessibility · SEO · i18n FR/EN · tests · CI/CD"), { op: 0.85 });
  s += T(70, 368, 11.5, p.muted, tr("Full-stack, du front-end à la mise en ligne, esprit DevOps.", "Full-stack, from front-end to deployment, DevOps-minded."));

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
  s += T(860, 120, 15, p.ink, "GitHub · open source", { w: "bold" });
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

  s += `<line x1="424" y1="480" x2="482" y2="480" stroke="${p.muted}" stroke-width="2" marker-end="url(#arrow)"/>`;
  // la requête transite par le reverse proxy Caddy (HTTPS) avant d'atteindre l'API
  s += `<rect x="424" y="442" width="58" height="20" rx="10" fill="${p.base}"/><rect x="424" y="442" width="58" height="20" rx="10" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(453, 456, 10, a, "Caddy", { w: "bold", anchor: "middle", mono: true })}`;
  s += T(453, 496, 10, p.muted, "POST", { anchor: "middle" });
  s += card(488, 450, 168, 76, p, { r: 12, fill: p.chrome, stroke: p.chrome });
  s += `<circle cx="510" cy="480" r="6" fill="${a}"/>${T(524, 477, 13, p.chromeInk, "Fastify API", { w: "bold" })}`;
  s += T(506, 504, 11, p.chromeInk, "/api/contact", { mono: true, op: 0.7 });
  s += T(506, 520, 10, p.chromeInk, "PostgreSQL · validation", { op: 0.55 });

  s += `<line x1="656" y1="504" x2="715" y2="556" stroke="${p.muted}" stroke-width="2" marker-end="url(#arrow)"/>`;
  s += T(684, 492, 10, p.muted, tr("publie", "publish"), { anchor: "middle" });

  s += T(718, 452, 13, p.muted, tr("Notification push", "Push notification"));
  s += card(718, 462, 434, 156, p, { r: 14 });
  s += `<rect x="738" y="482" width="40" height="40" rx="10" fill="${a}"/>`;
  s += `<path d="M758 492 a9 9 0 0 1 9 9 v5 l2 3 h-22 l2 -3 v-5 a9 9 0 0 1 9 -9 z" fill="${p.accentInk}"/><circle cx="758" cy="514" r="2.5" fill="${p.accentInk}"/>`;
  s += T(790, 498, 13, p.ink, "ntfy", { w: "bold" });
  s += T(790, 515, 10.5, p.muted, tr("sur ton téléphone", "on your phone"));
  s += T(1134, 498, 10, p.muted, tr("maintenant", "now"), { anchor: "end", op: 0.8 });
  s += `<line x1="738" y1="536" x2="1132" y2="536" stroke="${p.line}"/>`;
  s += T(738, 560, 13, p.ink, tr("Nouveau message de Marie Dupont", "New message from Marie Dupont"), { w: "bold" });
  s += T(738, 580, 11, p.muted, tr("marie@example.com · Projet freelance", "marie@example.com · Freelance project"));
  s += T(738, 600, 11, p.muted, tr("&quot;Bonjour, j'aimerais un devis pour refondre mon site…&quot;", "&quot;Hi, I'd like a quote to redesign my website…&quot;"), { op: 0.85 });

  // ---- Back-office : mini-CRM développé SUR MESURE (React + Fastify, auth) qui
  // pilote les leads sur la même base PostgreSQL — auto-hébergé, accès sécurisé
  // (VPN), pipeline avec statuts → vitrine full-stack (remplace l'outil sur étagère).
  const won = "#22c55e"; // statut « validé » (couleur de statut universelle, hors thème)
  s += `<path d="M572 526 L572 562" stroke="${a}" stroke-width="2" stroke-dasharray="5 4" fill="none" marker-end="url(#arrow)"/>`;
  s += card(430, 566, 256, 72, p, { r: 12 });
  // en-tête : titre + pastille « sur mesure »
  s += T(446, 590, 10.5, p.ink, "Mini-CRM · leads", { w: "bold" });
  const badge = tr("sur mesure", "custom");
  const bw = Math.round(badge.length * 5 + 14);
  s += `<rect x="${674 - bw}" y="580" width="${bw}" height="15" rx="7" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(674 - bw / 2, 591, 8.5, a, badge, { anchor: "middle", mono: true })}`;
  // pipeline : quelques leads avec pastille de statut (validé / à recontacter)
  const lead = (y, name, label, col) => {
    const w = Math.round(label.length * 5 + 14);
    return `<circle cx="450" cy="${y}" r="3" fill="${col}"/>${T(462, y + 3.5, 9.5, p.muted, name)}<rect x="${674 - w}" y="${y - 7}" width="${w}" height="14" rx="4" fill="${col}" fill-opacity="0.14" stroke="${col}" stroke-opacity="0.35"/>${T(674 - w / 2, y + 3, 8.5, col, label, { anchor: "middle", mono: true })}`;
  };
  s += lead(610, "Marie Dupont", tr("validé", "validated"), won);
  s += lead(628, "Thomas Roche", tr("à recontacter", "to follow up"), a);

  return frame(p, s);
}

/* ================================================================== */
/* 3. reseau                                                           */
/* ================================================================== */
// ⚠️ LE RÉSEAU TEL QU'IL EST (11/10/2026). L'ancien visuel montrait 4 VLAN
// derrière un switch administrable : le LAN est en réalité unique et à plat, et
// le switch n'est pas administrable. Une affirmation fausse en entretien fait
// douter de toutes les vraies ; on dessine donc l'existant, pannes comprises.
// Aucune adresse IP réelle (même règle que l'historique Git).
function reseau(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const pill = (cx, cy, w, label) =>
    `<rect x="${cx - w / 2}" y="${cy - 11}" width="${w}" height="22" rx="11" fill="${p.base}"/><rect x="${cx - w / 2}" y="${cy - 11}" width="${w}" height="22" rx="11" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(cx, cy + 4, 11, a, label, { w: "bold", anchor: "middle", mono: true })}`;
  // Une carte à en-tête sombre et ses lignes « nom + précision ».
  const machine = (x, w, title, rows) => {
    let o = card(x, 340, w, 220, p, { r: 14 });
    o += `<path d="M${x} 354 a14 14 0 0 1 14 -14 h${w - 28} a14 14 0 0 1 14 14 v20 h-${w} z" fill="${p.chrome}"/>`;
    o += T(x + 20, 362, 13.5, p.chromeInk, title, { w: "bold" });
    rows.forEach(([nm, sub], i) => {
      const y = 386 + i * 42;
      o += card(x + 18, y, w - 36, 36, p, { r: 8, fill: p.soft, shadow: false });
      o += `<circle cx="${x + 36}" cy="${y + 18}" r="4" fill="${a}"/>`;
      o += T(x + 50, y + 16, 11.5, p.ink, nm, { mono: true, w: "bold" });
      o += T(x + 50, y + 30, 9.5, p.muted, sub);
    });
    return o;
  };
  let s = "";

  // Liaisons
  s += `<g stroke="${p.muted}" stroke-opacity="0.5" stroke-width="2" fill="none">
    <path d="M240 90 L300 90"/>
    <path d="M450 130 L450 200"/>
    <path d="M560 130 C 700 170, 960 220, 970 340"/>
  </g>`;
  s += `<g stroke="${a}" stroke-width="4" fill="none" opacity="0.9"><path d="M430 264 L230 340"/><path d="M600 264 L600 340"/></g>`;
  s += pill(330, 302, 74, "10 GbE") + pill(600, 302, 74, "10 GbE");
  s += `<path d="M860 95 L600 95" stroke="${a}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`;
  s += pill(730, 95, 110, "WireGuard");
  s += `<path d="M330 560 C 360 615, 560 615, 590 560" stroke="${a}" stroke-width="2" stroke-dasharray="6 5" fill="none" opacity="0.7"/>`;
  s += pill(460, 601, 70, "iSCSI");

  // Internet
  s += card(60, 62, 180, 56, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><circle cx="92" cy="90" r="13"/><ellipse cx="92" cy="90" rx="5.5" ry="13"/><line x1="79" y1="90" x2="105" y2="90"/></g>`;
  s += T(116, 95, 14, p.ink, "Internet", { w: "bold" });

  // Box de l'opérateur
  s += card(300, 50, 300, 80, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><rect x="322" y="78" width="30" height="22" rx="3"/><path d="M328 78 v-8 M340 78 v-12"/></g>`;
  s += T(366, 80, 14, p.ink, tr("Box fibre", "Fibre box"), { w: "bold" });
  s += T(366, 100, 11, p.muted, "NAT 443 / 80 → Caddy", { mono: true });
  s += T(366, 117, 10, p.muted, tr("IP fixe · DNS imposé", "static IP · fixed DNS"), { mono: true, op: 0.85 });

  // Accès à distance
  s += card(860, 50, 280, 104, p, { stroke: a, sw: 2 });
  s += `<g stroke="${a}" stroke-width="2" fill="none"><rect x="880" y="70" width="16" height="14" rx="2"/><path d="M883 70 v-4 a5 5 0 0 1 10 0 v4"/></g>`;
  s += T(906, 82, 13.5, p.ink, tr("Accès à distance", "Remote access"), { w: "bold" });
  s += T(880, 106, 11, p.muted, "WireGuard · MTU 1350", { mono: true });
  s += T(880, 124, 11, p.muted, "AllowedIPs /32", { mono: true });
  s += T(880, 142, 10, a, tr("→ réveil du PC, puis RDP ou Moonlight", "→ wake the PC, then RDP or Moonlight"), { mono: true });

  // Switch : 2 ports 10 GbE (accent) et les autres
  s += card(390, 200, 290, 64, p, { r: 12, fill: p.chrome, stroke: p.chrome });
  s += T(535, 224, 14, p.chromeInk, tr("Switch 10 GbE", "10 GbE switch"), { w: "bold", anchor: "middle" });
  s += [0, 1, 2, 3, 4, 5].map((i) => `<rect x="${410 + i * 30}" y="236" width="20" height="12" rx="2" fill="${i < 2 ? a : p.chromeInk}" fill-opacity="${i < 2 ? 0.9 : 0.3}"/>`).join("");
  s += T(600, 246, 10, p.chromeInk, "2 × 10 GbE", { mono: true, op: 0.8 });

  // NAS et PC, reliés au switch en 10 GbE
  s += machine(60, 340, tr("NAS · services réseau", "NAS · network services"), [
    ["Caddy", tr("seul service exposé · HTTPS", "only exposed service · HTTPS")],
    ["AdGuard Home", tr("DNS filtrant · réglé par appareil", "filtering DNS · set per device")],
    ["WireGuard", tr("VPN d'accès à distance", "remote access VPN")],
    [tr("Pare-feu", "Firewall"), tr("liste blanche · règles Docker", "allowlist · Docker rules")],
  ]);
  s += machine(440, 300, tr("PC · poste de travail", "PC · workstation"), [
    ["iSCSI", tr("disque de jeux hébergé sur le NAS", "games disk hosted on the NAS")],
    ["Wake-on-LAN", tr("allumé à distance depuis le portail", "powered on remotely from the portal")],
    ["RDP · Moonlight", tr("bureau et jeux à distance, par le VPN", "desktop and games, over the VPN")],
  ]);

  // Le Wi-Fi de la box : même réseau, dit tel quel
  s += card(800, 340, 340, 110, p, { r: 12 });
  s += `<g stroke="${a}" stroke-width="2" fill="none" stroke-linecap="round"><path d="M820 372 a22 22 0 0 1 30 0"/><path d="M826 379 a13 13 0 0 1 18 0"/></g><circle cx="835" cy="386" r="2.5" fill="${a}"/>`;
  s += T(862, 378, 14, p.ink, tr("Wi-Fi de la box", "Box Wi-Fi"), { w: "bold" });
  s += T(820, 410, 11, p.muted, tr("téléphones · TV · invités", "phones · TV · guests"));
  s += T(820, 430, 11, p.muted, tr("même réseau, à plat", "same flat network"), { mono: true });

  // Les deux pannes résolues en chemin
  s += card(800, 476, 340, 90, p, { r: 12, stroke: a, sw: 2 });
  s += T(822, 502, 13, p.ink, tr("2 pannes résolues", "2 outages fixed"), { w: "bold" });
  s += T(822, 526, 11, p.muted, tr("trou noir de MTU → 1350", "MTU black hole → 1350"), { mono: true });
  s += T(822, 546, 11, p.muted, tr("collision de /24 → AllowedIPs /32", "/24 clash → AllowedIPs /32"), { mono: true });

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

  // rendu d'une tuile de service (halo accent + nom + sous-titre)
  const svc = (x, y, name, sub) => {
    let o = card(x, y, 196, 54, p, { r: 10, fill: p.soft, shadow: false });
    o += `<circle cx="${x + 22}" cy="${y + 27}" r="7" fill="${a}" fill-opacity="0.18" stroke="${a}" stroke-opacity="0.5"/><circle cx="${x + 22}" cy="${y + 27}" r="3" fill="${a}"/>`;
    o += T(x + 38, y + 24, 13, p.ink, name, { w: "bold" });
    o += T(x + 38, y + 40, 10, p.muted, sub, { mono: true });
    return o;
  };

  // grille 2×4 : 8 conteneurs (Supervision = Uptime Kuma + Dockge fusionnés), Jellyfin en dernier
  const services = tr(
    [
      [400, 202, "PostgreSQL", "base de données"],
      [606, 202, "ntfy", "notifications push"],
      [400, 264, "WireGuard", "VPN auto-hébergé"],
      [606, 264, "Caddy", "reverse proxy / HTTPS"],
      [400, 326, "Vaultwarden", "mots de passe"],
      [606, 326, "AdGuard", "filtrage DNS"],
      [400, 388, "Umami", "statistiques"],
      [606, 388, "Jellyfin", "streaming média"],
    ],
    [
      [400, 202, "PostgreSQL", "database"],
      [606, 202, "ntfy", "push notifications"],
      [400, 264, "WireGuard", "self-hosted VPN"],
      [606, 264, "Caddy", "reverse proxy / HTTPS"],
      [400, 326, "Vaultwarden", "password manager"],
      [606, 326, "AdGuard", "DNS filtering"],
      [400, 388, "Umami", "analytics"],
      [606, 388, "Jellyfin", "media streaming"],
    ],
  );
  services.forEach(([x, y, name, sub]) => {
    s += svc(x, y, name, sub);
  });
  s += T(400, 458, 11, p.muted, tr("+ Uptime Kuma · Dockge · tableau de bord maison · durcissement", "+ Uptime Kuma · Dockge · home-made dashboard · hardening"), { op: 0.85 });
  s += `<rect x="400" y="470" width="402" height="56" rx="10" fill="${p.soft}"/>`;
  s += T(416, 492, 11, p.muted, "$ docker compose up -d", { mono: true });
  s += `<circle cx="420" cy="510" r="4" fill="${a}"/>${T(432, 514, 11, a, tr("tous les services actifs", "all services running"), { mono: true })}`;

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

/* ================================================================== */
/* 6. monitoring — supervision & observabilité                        */
/* ================================================================== */
function monitoring(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const up = "#22c55e"; // statut OK (couleurs de statut universelles, hors thème)
  const down = "#ef4444"; // statut hors ligne
  let s = "";

  const dx = 64,
    dy = 84,
    dw = 700;
  const rx = 792,
    rw = 344;

  // connecteur : la sonde en panne (5ᵉ ligne) déclenche l'alerte ntfy
  s += `<path d="M740 428 C 766 428, 770 432, 792 432" stroke="${a}" stroke-width="2.5" stroke-dasharray="7 6" fill="none"/>`;

  // ---- Dashboard Uptime Kuma ----
  s += card(dx, dy, dw, 512, p, { r: 16 });
  s += titlebar(dx, dy, dw, p, "uptime-kuma", { h: 40 });
  s += T(dx + 24, dy + 74, 14, p.ink, tr("État des services", "Service health"), { w: "bold" });
  s += `<rect x="${dx + dw - 172}" y="${dy + 56}" width="148" height="26" rx="13" fill="${up}" fill-opacity="0.14" stroke="${up}" stroke-opacity="0.42"/>`;
  s += `<circle cx="${dx + dw - 154}" cy="${dy + 69}" r="4.5" fill="${up}"/>`;
  s += T(dx + dw - 142, dy + 73, 12, up, tr("14 / 15 en ligne", "14 / 15 up"), { mono: true, w: "bold" });

  const rows = tr(
    [
      ["portfolio · web", true, "99,98 %", "42 ms"],
      ["api · contact", true, "99,95 %", "31 ms"],
      ["postgres", true, "100 %", "3 ms"],
      ["caddy · reverse proxy", true, "100 %", "11 ms"],
      ["wireguard", false, "hors ligne", "—"],
    ],
    [
      ["portfolio · web", true, "99.98%", "42 ms"],
      ["api · contact", true, "99.95%", "31 ms"],
      ["postgres", true, "100%", "3 ms"],
      ["caddy · reverse proxy", true, "100%", "11 ms"],
      ["wireguard", false, "offline", "—"],
    ],
  );
  let ry = dy + 96;
  rows.forEach(([name, ok, uptime, lat]) => {
    const c = ok ? up : down;
    s += card(dx + 24, ry, dw - 48, 48, p, { r: 10, fill: p.soft, shadow: false });
    s += `<circle cx="${dx + 48}" cy="${ry + 24}" r="6.5" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-opacity="0.55"/><circle cx="${dx + 48}" cy="${ry + 24}" r="3" fill="${c}"/>`;
    s += T(dx + 66, ry + 29, 13, p.ink, name, { w: "bold" });
    // historique de disponibilité (barres)
    const bx = dx + 372;
    for (let i = 0; i < 20; i++) {
      const bad = !ok && i >= 17;
      s += `<rect x="${bx + i * 8}" y="${ry + 15}" width="5" height="18" rx="1.5" fill="${bad ? down : up}" fill-opacity="${bad ? 0.85 : 0.5}"/>`;
    }
    s += T(dx + dw - 150, ry + 29, 11.5, c, uptime, { mono: true, w: "bold" });
    s += T(dx + dw - 40, ry + 29, 11, p.muted, lat, { mono: true, anchor: "end" });
    ry += 56;
  });
  // ---- Sondes externes : ce qu'Uptime Kuma ne peut pas voir de l'intérieur.
  // (Les métriques système sont déjà sur le visuel du tableau de bord.)
  // y=460 : même écart de 8 px qu'entre les sondes (la 5ᵉ finit à 452) ----
  s += card(dx + 24, 460, dw - 48, 92, p, { r: 10, fill: p.soft, shadow: false });
  s += T(dx + 40, 482, 11.5, p.ink, tr("Sondes externes", "External checks"), { w: "bold" });
  s += T(dx + dw - 40, 482, 10, p.muted, tr("hors du NAS", "outside the NAS"), { anchor: "end", mono: true });
  const externe = (x, titre, sous, val, col) =>
    `<rect x="${x}" y="494" width="306" height="46" rx="8" fill="${p.surface}" stroke="${p.line}"/>` +
    `<circle cx="${x + 18}" cy="517" r="4.5" fill="${up}"/>` +
    T(x + 32, 513, 12, p.ink, titre, { w: "bold" }) +
    T(x + 32, 530, 10, p.muted, sous, { mono: true }) +
    (val ? T(x + 294, 522, 12, col, val, { mono: true, w: "bold", anchor: "end" }) : "");
  s += externe(dx + 40, "UptimeRobot", tr("depuis Internet · alexiswallez.fr", "from the internet · alexiswallez.fr"), "100 %", up);
  s += externe(dx + 354, "Push · compose-auto-update", tr("dernier signal de vie : 07:12", "last heartbeat: 07:12"), "", up);
  s += T(dx + 24, dy + 490, 11, p.muted, tr("Socket Docker · sondes conteneurs · watchdog externe (UptimeRobot)", "Docker socket · container checks · external watchdog (UptimeRobot)"), { mono: true, op: 0.85 });

  // ---- Dockge, comme son interface : les stacks à gauche, la stack choisie
  // à droite avec ses boutons et son compose.yaml ----
  s += card(rx, dy, rw, 200, p, { r: 16 });
  s += titlebar(rx, dy, rw, p, "dockge", { h: 36 });
  s += `<rect x="${rx}" y="${dy + 36}" width="120" height="148" fill="${p.soft}"/>`;
  s += T(rx + 12, dy + 56, 10, p.muted, "Stacks", { w: "bold" });
  [["portfolio", "6"], ["arr", "10"], ["monitoring", "2"]].forEach(([nm, cnt], i) => {
    const y = dy + 66 + i * 34;
    if (i === 0) s += `<rect x="${rx + 6}" y="${y}" width="108" height="28" rx="6" fill="${a}" fill-opacity="0.14"/>`;
    s += `<circle cx="${rx + 18}" cy="${y + 14}" r="4" fill="${up}"/>`;
    s += T(rx + 28, y + 18, 11.5, p.ink, nm, { w: i === 0 ? "bold" : "normal" });
    s += T(rx + 108, y + 18, 10, p.muted, cnt, { mono: true, anchor: "end" });
  });
  const ox = rx + 132;
  s += T(ox, dy + 58, 13, p.ink, "portfolio", { w: "bold" });
  s += `<rect x="${rx + rw - 64}" y="${dy + 45}" width="50" height="18" rx="9" fill="${up}" fill-opacity="0.14" stroke="${up}" stroke-opacity="0.42"/>${T(rx + rw - 39, dy + 58, 10, up, tr("actif", "active"), { mono: true, w: "bold", anchor: "middle" })}`;
  s += `<rect x="${ox}" y="${dy + 70}" width="88" height="22" rx="6" fill="none" stroke="${a}" stroke-opacity="0.6"/>${T(ox + 44, dy + 85, 10, a, tr("Redémarrer", "Restart"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="${ox + 96}" y="${dy + 70}" width="104" height="22" rx="6" fill="${a}"/>${T(ox + 148, dy + 85, 10, p.accentInk, tr("Mettre à jour", "Update"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="${ox}" y="${dy + 100}" width="200" height="84" rx="8" fill="${p.soft}" stroke="${p.line}"/>`;
  [["# compose.yaml", p.muted], ["services:", p.ink], ["  web · api · admin", a], ["  postgres · ntfy", a], ["  caddy", a]].forEach(([l, c], i) => {
    s += T(ox + 10, dy + 116 + i * 14, 9.5, c, l, { mono: true });
  });

  // ---- Alerte ntfy (push mobile) ----
  const ay = dy + 224;
  s += card(rx, ay, rw, 288, p, { r: 16 });
  s += `<rect x="${rx + 20}" y="${ay + 20}" width="40" height="40" rx="10" fill="${a}"/>`;
  s += `<path d="M${rx + 40} ${ay + 30} a9 9 0 0 1 9 9 v5 l2 3 h-22 l2 -3 v-5 a9 9 0 0 1 9 -9 z" fill="${p.accentInk}"/><circle cx="${rx + 40}" cy="${ay + 52}" r="2.5" fill="${p.accentInk}"/>`;
  s += T(rx + 72, ay + 37, 14, p.ink, "ntfy", { w: "bold" });
  s += T(rx + 72, ay + 54, 11, p.muted, tr("sur ton téléphone", "on your phone"), { mono: true });
  s += T(rx + rw - 20, ay + 37, 10, p.muted, tr("maintenant", "now"), { anchor: "end" });
  s += `<line x1="${rx + 20}" y1="${ay + 74}" x2="${rx + rw - 20}" y2="${ay + 74}" stroke="${p.line}"/>`;
  s += `<rect x="${rx + 20}" y="${ay + 88}" width="${rw - 40}" height="134" rx="10" fill="${down}" fill-opacity="0.08" stroke="${down}" stroke-opacity="0.3"/>`;
  s += `<circle cx="${rx + 44}" cy="${ay + 116}" r="5" fill="${down}"/>`;
  s += T(rx + 58, ay + 121, 13.5, p.ink, "wireguard", { w: "bold" });
  s += `<rect x="${rx + rw - 96}" y="${ay + 106}" width="66" height="22" rx="6" fill="${down}"/>${T(rx + rw - 63, ay + 121, 11, "#ffffff", "DOWN", { w: "bold", anchor: "middle", mono: true })}`;
  s += T(rx + 40, ay + 150, 12, p.muted, tr("Le conteneur ne répond plus", "Container is not responding"));
  s += T(rx + 40, ay + 172, 10.5, p.muted, tr("Sonde « Docker » · échec depuis 60 s", "“Docker” probe · failing 60 s"), { mono: true });
  s += `<rect x="${rx + 40}" y="${ay + 188}" width="128" height="22" rx="5" fill="${down}" fill-opacity="0.12" stroke="${down}" stroke-opacity="0.32"/>${T(rx + 54, ay + 203, 11, down, tr("priorité urgente", "urgent priority"), { mono: true })}`;
  s += T(rx + 20, ay + 252, 10.5, p.muted, tr("Relais APNs → push même app fermée", "APNs relay → push even when app closed"), { mono: true, op: 0.85 });

  return frame(p, s);
}

/* ================================================================== */
/* 7. resilience — sauvegardes                                         */
/* ================================================================== */
function resilience(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const up = "#22c55e";
  let s = "";

  // flux horizontal : NAS -> restic -> PC de la maison
  // ⚠️ PAS DE « PRA », PAS DE « HORS SITE », PAS DE « RAID1 » (11/10/2026) : la
  // seconde copie va sur un PC de la maison, qui doit être allumé, et le groupe
  // RAID1 du NAS n'a qu'un seul SSD, donc aucun miroir. On dit la limite.
  s += `<g stroke="${p.muted}" stroke-opacity="0.6" stroke-width="2.5" fill="none">
    <path d="M370 275 L468 275" marker-end="url(#arrow)"/>
    <path d="M730 275 L828 275" marker-end="url(#arrow)"/>
  </g>`;
  s += T(419, 262, 11, p.muted, "restic", { anchor: "middle", mono: true });
  // l'écart restic→PC (100 px) est trop étroit pour le libellé complet : pastille
  // « SFTP » au-dessus de la flèche + précision « à l'allumage » juste en dessous
  // (l'ancien badge de 170 px, centré à 829, passait sous la carte PC → tronqué).
  s += `<rect x="748" y="242" width="64" height="24" rx="12" fill="${p.base}"/><rect x="748" y="242" width="64" height="24" rx="12" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(780, 258, 11, a, "SFTP", { anchor: "middle", mono: true, w: "bold" })}`;
  s += T(780, 296, 10, p.muted, tr("à l'allumage", "on power-on"), { anchor: "middle", mono: true });

  // dead-man's-switch : branche descendante depuis restic
  s += `<path d="M600 348 L600 470" stroke="${a}" stroke-width="2.5" stroke-dasharray="7 6" fill="none" marker-end="url(#arrow)"/>`;

  // ---- NAS (source à sauvegarder) ----
  s += card(70, 150, 300, 252, p, { r: 14 });
  s += `<path d="M70 164 a14 14 0 0 1 14 -14 h272 a14 14 0 0 1 14 14 v30 h-300 z" fill="${p.chrome}"/>`;
  s += T(92, 182, 14, p.chromeInk, tr("NAS · à sauvegarder", "NAS · source"), { w: "bold" });
  const src = tr(
    [
      ["/volume1/docker", "services &amp; configs"],
      ["volumes nommés", "ntfy · caddy · wireguard"],
      ["pg_dump", "base PostgreSQL"],
    ],
    [
      ["/volume1/docker", "services &amp; configs"],
      ["named volumes", "ntfy · caddy · wireguard"],
      ["pg_dump", "PostgreSQL database"],
    ],
  );
  let sy = 216;
  src.forEach(([nm, sub]) => {
    s += card(90, sy, 260, 44, p, { r: 8, fill: p.soft, shadow: false });
    s += `<circle cx="112" cy="${sy + 22}" r="4" fill="${a}"/>`;
    s += T(126, sy + 19, 11.5, p.ink, nm, { mono: true, w: "bold" });
    s += T(126, sy + 34, 9.5, p.muted, sub);
    sy += 52;
  });
  s += T(90, 388, 10.5, p.muted, tr("limite : pas encore de copie hors site", "limit: no off-site copy yet"), { mono: true, op: 0.9 });

  // ---- restic (moteur de sauvegarde) ----
  s += card(470, 208, 260, 140, p, { r: 14, fill: p.chrome, stroke: p.chrome });
  s += `<rect x="583" y="240" width="34" height="26" rx="5" fill="none" stroke="${a}" stroke-width="2.5"/><path d="M589 240 v-8 a11 11 0 0 1 22 0 v8" fill="none" stroke="${a}" stroke-width="2.5"/><circle cx="600" cy="252" r="3" fill="${a}"/>`;
  s += T(600, 296, 15, p.chromeInk, "restic", { w: "bold", anchor: "middle" });
  s += T(600, 315, 10.5, p.chromeInk, tr("chiffré · dédupliqué", "encrypted · deduplicated"), { anchor: "middle", op: 0.75 });
  s += T(600, 333, 10, a, tr("7 j · 4 sem · 6 mois", "7 d · 4 wk · 6 mo"), { anchor: "middle", mono: true });

  // ---- PC (seconde copie, dans la maison) ----
  s += card(830, 150, 300, 252, p, { r: 14 });
  s += `<path d="M830 164 a14 14 0 0 1 14 -14 h272 a14 14 0 0 1 14 14 v30 h-300 z" fill="${p.chrome}"/>`;
  s += T(852, 182, 14, p.chromeInk, tr("PC · seconde copie", "PC · second copy"), { w: "bold" });
  const snaps = [
    ["2026-07-12 08:14", "1.49 GiB"],
    ["2026-07-11 22:03", "1.48 GiB"],
    ["2026-07-11 08:07", "1.47 GiB"],
  ];
  let py = 216;
  snaps.forEach(([d, sz], i) => {
    s += card(850, py, 260, 40, p, { r: 8, fill: p.soft, shadow: false });
    s += `<circle cx="872" cy="${py + 20}" r="4" fill="${i === 0 ? up : a}"/>`;
    s += T(886, py + 24, 11, p.ink, d, { mono: true });
    s += T(1096, py + 24, 10.5, p.muted, sz, { mono: true, anchor: "end" });
    py += 48;
  });
  s += `<circle cx="861" cy="388" r="5" fill="${up}"/>${T(874, 392, 11, up, tr("restauration testée ✓", "restore tested ✓"), { mono: true, w: "bold" })}`;

  // ---- dead-man's-switch (alerte si backup manquant) ----
  s += card(456, 470, 288, 118, p, { r: 14, stroke: a, sw: 2 });
  s += T(600, 500, 13, p.ink, "Dead-man's-switch", { w: "bold", anchor: "middle" });
  s += T(600, 522, 11, p.muted, tr("aucune sauvegarde depuis 48 h", "no backup for 48 h"), { anchor: "middle" });
  s += `<rect x="512" y="540" width="176" height="30" rx="8" fill="${a}" fill-opacity="0.12" stroke="${a}" stroke-opacity="0.32"/>${T(600, 560, 11, a, tr("→ alerte ntfy / Kuma", "→ ntfy / Kuma alert"), { anchor: "middle", mono: true, w: "bold" })}`;

  return frame(p, s);
}

/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/* 8. dashboard — le portail maison du homelab (dépôt public + démo)    */
/* ------------------------------------------------------------------ */
function dashboard(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const up = "#22c55e"; // statut OK (couleurs de statut universelles, hors thème)
  const warn = "#f59e0b";
  let s = "";

  // Une fenêtre de navigateur : ce projet est une PAGE, pas un service de fond.
  const wx = 64,
    wy = 68,
    ww = 1072,
    wh = 544,
    ix = wx + 24,
    iw = ww - 48;
  s += card(wx, wy, ww, wh, p, { r: 16 });
  s += titlebar(wx, wy, ww, p, "awallez.github.io/homelab", { h: 40 });

  // ---- barre du haut : valeurs ABSOLUES (un pourcentage seul ne dit rien :
  // « 72 % » ne se compare à rien, « 5,4 / 7,5 Go » se lit d'un coup d'œil) ----
  const mes = tr(
    [
      ["Processeur", "2,1 / 12 cœurs", 0.17],
      ["Mémoire", "5,4 / 7,5 Go", 0.72],
      ["Stockage", "4,3 / 8,0 To", 0.54],
      ["Température", "54 °C", 0.54],
    ],
    [
      ["Processor", "2.1 / 12 cores", 0.17],
      ["Memory", "5.4 / 7.5 GB", 0.72],
      ["Storage", "4.3 / 8.0 TB", 0.54],
      ["Temperature", "54 °C", 0.54],
    ],
  );
  const mw = (iw - 3 * 16) / 4;
  mes.forEach(([lab, val, pct], i) => {
    const x = ix + i * (mw + 16),
      y = wy + 56;
    s += T(x, y + 16, 15, p.ink, val, { w: "bold", mono: true });
    s += `<rect x="${x}" y="${y + 26}" width="${mw}" height="5" rx="2.5" fill="${p.line}"/>`;
    s += `<rect x="${x}" y="${y + 26}" width="${(mw * pct).toFixed(0)}" height="5" rx="2.5" fill="${a}"/>`;
    s += T(x, y + 47, 11, p.muted, lab);
  });
  s += `<line x1="${ix}" y1="${wy + 122}" x2="${ix + iw}" y2="${wy + 122}" stroke="${p.line}"/>`;

  /* Grille bento : cinq natures de données, cinq formes. Les afficher toutes
     avec une rangée de nombres était le défaut de la version précédente. */
  const gy = wy + 142,
    gh = 186,
    c2 = 504,
    c1 = 244;

  const tile = (x, y, w, h, title) =>
    card(x, y, w, h, p, { r: 12, fill: p.soft, shadow: false }) +
    T(x + 16, y + 24, 12, p.muted, title, { w: "bold" });

  // anneau : une proportion
  const ring = (cx, cy, r, pct, col, val, lab) => {
    const c = 2 * Math.PI * r;
    return (
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.line}" stroke-width="7"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-dasharray="${(c * pct).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>` +
      T(cx, cy + 5, 13.5, p.ink, val, { anchor: "middle", w: "bold", mono: true }) +
      T(cx, cy + r + 20, 10.5, p.muted, lab, { anchor: "middle" })
    );
  };

  // courbe : une série continue
  const graphe = (x, y, w, h, pts, col) => {
    const mx = Math.max(...pts),
      mn = Math.min(...pts);
    const sx = w / (pts.length - 1),
      sy = h / (mx - mn || 1);
    const d = pts
      .map(
        (v, i) =>
          `${i ? "L" : "M"}${(x + i * sx).toFixed(1)} ${(y + h - (v - mn) * sy).toFixed(1)}`,
      )
      .join(" ");
    const ly = (y + h - (pts[pts.length - 1] - mn) * sy).toFixed(1);
    return (
      `<path d="${d}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round"/>` +
      `<circle cx="${x + w}" cy="${ly}" r="3" fill="${col}"/>`
    );
  };

  // (1) Système : trois anneaux + la courbe des 24 h
  s += tile(ix, gy, c2, gh, tr("Système", "System"));
  s += ring(ix + 78, gy + 88, 30, 0.17, a, "17 %", tr("processeur", "processor"));
  s += ring(ix + 176, gy + 88, 30, 0.72, warn, "72 %", tr("mémoire", "memory"));
  s += ring(ix + 274, gy + 88, 30, 0.54, a, "54°", tr("température", "temperature"));
  s += T(ix + 336, gy + 52, 10.5, p.muted, "24 h", { mono: true });
  s += graphe(ix + 336, gy + 62, 150, 76, [22, 19, 27, 24, 33, 29, 41, 36, 30, 26, 31, 28, 24, 17], a);
  s += T(ix + 336, gy + 158, 10.5, p.muted, tr("charge 0,9 → 1,2 → 1,1", "load 0.9 → 1.2 → 1.1"), { mono: true, op: 0.9 });

  /* (2) Disponibilité : battements Uptime Kuma en vert SOURD. Quarante-huit
     barres en vert vif forment un aplat qui crie plus fort que le reste et
     noie la seule barre rouge, qui est pourtant la seule information. */
  const kx = ix + c2 + 16;
  s += tile(kx, gy, c2, gh, tr("Disponibilité", "Availability"));
  s += `<rect x="${kx + c2 - 132}" y="${gy + 12}" width="116" height="22" rx="11" fill="${up}" fill-opacity="0.14" stroke="${up}" stroke-opacity="0.4"/>`;
  s += `<circle cx="${kx + c2 - 116}" cy="${gy + 23}" r="4" fill="${up}"/>`;
  s += T(kx + c2 - 106, gy + 27, 11, up, tr("tout en ligne", "all up"), { mono: true, w: "bold" });
  for (let i = 0; i < 48; i++) {
    const bad = i === 31;
    s += `<rect x="${(kx + 16 + i * 9.6).toFixed(1)}" y="${gy + 46}" width="6" height="44" rx="2" fill="${bad ? "#ef4444" : up}" fill-opacity="${bad ? 0.9 : 0.62}"/>`;
  }
  const svcs = tr(
    [["portfolio", "99,98 %"], ["api · contact", "99,95 %"], ["postgres", "100 %"]],
    [["portfolio", "99.98%"], ["api · contact", "99.95%"], ["postgres", "100%"]],
  );
  svcs.forEach(([n, v], i) => {
    const y = gy + 112 + i * 24;
    s += `<circle cx="${kx + 20}" cy="${y - 4}" r="3.5" fill="${up}"/>`;
    s += T(kx + 32, y, 11.5, p.ink, n, { mono: true });
    s += T(kx + c2 - 16, y, 11.5, p.muted, v, { mono: true, anchor: "end" });
  });

  // (3) Mémoire et swap : le swap en vedette, c'est la donnée qui décide
  const by = gy + gh + 16;
  s += tile(ix, by, c1, gh, tr("Mémoire et swap", "Memory and swap"));
  s += T(ix + 16, by + 72, 34, p.ink, "1,2", { w: "bold", mono: true });
  s += T(ix + 76, by + 72, 14, p.muted, tr("Go évacués", "GB swapped"), { mono: true });
  s += graphe(ix + 16, by + 94, c1 - 32, 50, [0.4, 0.5, 0.7, 0.6, 0.9, 1.1, 1.0, 1.2, 1.4, 1.3, 1.2], warn);
  s += T(ix + 16, by + 168, 10.5, p.muted, tr("compressé par le noyau", "compressed by the kernel"), { mono: true, op: 0.9 });

  /* (4) Mémoire par pile, et non par service : la question qu'on pose à cette
     fenêtre est « où part la mémoire », et aucun conteneur seul ne domine. */
  const cx2 = ix + c1 + 16;
  s += tile(cx2, by, c2, gh, tr("Mémoire par pile", "Memory per stack"));
  const stacks = tr(
    [["Stack *arr", 563, 1], ["Infrastructure", 533, 0.95], ["Umami", 128, 0.23], ["Portfolio", 122, 0.22]],
    [["*arr stack", 563, 1], ["Infrastructure", 533, 0.95], ["Umami", 128, 0.23], ["Portfolio", 122, 0.22]],
  );
  stacks.forEach(([n, mo, rel], i) => {
    const y = by + 52 + i * 30;
    s += T(cx2 + 16, y + 4, 11.5, p.ink, n);
    s += `<rect x="${cx2 + 150}" y="${y - 8}" width="${c2 - 226}" height="12" rx="6" fill="${p.line}" fill-opacity="0.6"/>`;
    s += `<rect x="${cx2 + 150}" y="${y - 8}" width="${((c2 - 226) * rel).toFixed(0)}" height="12" rx="6" fill="${a}" fill-opacity="${(0.35 + 0.5 * rel).toFixed(2)}"/>`;
    s += T(cx2 + c2 - 16, y + 4, 11, p.muted, `${mo} Mo`, { mono: true, anchor: "end" });
  });
  s += T(cx2 + 16, by + 172, 10.5, p.muted, tr("déduit du préfixe du conteneur", "derived from the container prefix"), { mono: true, op: 0.9 });

  // (5) Tunnel VPN : un état, pas un nombre
  const vx = cx2 + c2 + 16;
  s += tile(vx, by, c1, gh, tr("Tunnel VPN", "VPN tunnel"));
  s += `<circle cx="${vx + c1 / 2}" cy="${by + 96}" r="34" fill="${up}" fill-opacity="0.12" stroke="${up}" stroke-opacity="0.45" stroke-width="2"/>`;
  s += `<path d="M${vx + c1 / 2 - 14} ${by + 95} l10 11 l19 -21" fill="none" stroke="${up}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += T(vx + c1 / 2, by + 152, 13, p.ink, tr("Tunnel actif", "Tunnel up"), { anchor: "middle", w: "bold" });
  s += T(vx + c1 / 2, by + 172, 10.5, p.muted, tr("trafic sortant vérifié", "egress verified"), { anchor: "middle", mono: true, op: 0.9 });

  return frame(p, s);
}

/* ================================================================== */
/* VERSIONS VERTICALES : écrans étroits, cartes et agrandissement       */
/* ================================================================== */
/* En portrait, un visuel en largeur de 1200 px tombe à 335 px : ses textes
   font 4 à 6 px. Ces versions reprennent TOUT le contenu du visuel paysage,
   réagencé en hauteur sur 480 px de large (textes de 10 à 15 px). Choisies
   par Projects.tsx sous 640 px de large ; sinon, le visuel horizontal. */
function vframe(p, inner, h) {
  const thumb = inner.includes("url(#thumb)")
    ? `<linearGradient id="thumb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.accent}" stop-opacity="0.30"/><stop offset="1" stop-color="${p.accent}" stop-opacity="0.06"/></linearGradient>`
    : "";
  const arrow = inner.includes("url(#arrow)")
    ? `<marker id="arrow" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="${p.muted}"/></marker>`
    : "";
  // même pointe, à la couleur d'accent : pour les traits verts (pointillés)
  const arrowA = inner.includes("url(#arrowA)")
    ? `<marker id="arrowA" markerUnits="userSpaceOnUse" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0 0 L9 4.5 L0 9 z" fill="${p.accent}"/></marker>`
    : "";
  return `<svg width="480" height="${h}" viewBox="0 0 480 ${h}" xmlns="http://www.w3.org/2000/svg" ${SANS}>
  <defs>
    <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.2" fill="${p.line}" fill-opacity="${p.dotOp}"/></pattern>
    <filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="${p.shadow}" flood-opacity="${p.shadowOp}"/></filter>${thumb}${arrow}${arrowA}
  </defs>
  <rect width="480" height="${h}" fill="${p.base}"/>
  <rect width="480" height="${h}" fill="url(#dots)"/>
  ${inner}
</svg>`;
}
const vtrait = (x1, y1, x2, y2, p, o = {}) =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.accent ? p.accent : p.muted}" stroke-opacity="${o.accent ? 1 : 0.6}" stroke-width="2"${o.dash ? ' stroke-dasharray="6 5"' : ""}/>`;
// pastille de texte posée sur un trait (fond plein pour ne pas être barrée)
function vpastille(cx, cy, label, p) {
  const w = Math.round(label.length * 11 * 0.6 + 18);
  return `<rect x="${cx - w / 2}" y="${cy - 10}" width="${w}" height="20" rx="10" fill="${p.base}"/><rect x="${cx - w / 2}" y="${cy - 10}" width="${w}" height="20" rx="10" fill="${p.accent}" fill-opacity="0.14" stroke="${p.accent}" stroke-opacity="0.35"/>${T(cx, cy + 4, 11, p.accent, label, { w: "bold", anchor: "middle", mono: true })}`;
}

function homelabV(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";
  // traits d'abord, cartes par-dessus
  s += vtrait(148, 40, 170, 40, p) + vtrait(232, 64, 232, 108, p);
  s += vtrait(386, 64, 386, 108, p, { accent: true, dash: true });
  [92, 240, 388].forEach((x) => (s += vtrait(x, 476, x, 500, p)));

  // Internet → routeur ; accès distant, relié au NAS par le VPN
  s += card(24, 16, 124, 48, p, { r: 12 });
  s += T(86, 45, 14, p.ink, "Internet", { w: "bold", anchor: "middle" });
  s += card(170, 16, 124, 48, p, { r: 12 });
  s += T(232, 37, 14, p.ink, tr("Routeur", "Router"), { w: "bold", anchor: "middle" });
  s += T(232, 54, 11, p.muted, tr("pare-feu", "firewall"), { anchor: "middle", mono: true });
  s += card(316, 16, 140, 48, p, { r: 12, stroke: a, sw: 2 });
  s += T(386, 37, 13, p.ink, tr("Accès distant", "Remote access"), { w: "bold", anchor: "middle" });
  s += T(386, 54, 10.5, p.muted, tr("chiffré / sécurisé", "encrypted / secured"), { anchor: "middle", mono: true });
  // libellé À CÔTÉ du pointillé : posé dessus, il le masquait
  s += T(378, 90, 10.5, p.accent, "WireGuard VPN", { anchor: "end", mono: true, w: "bold" });

  // NAS
  s += card(24, 108, 432, 368, p, { r: 14 });
  s += `<path d="M24 122 a14 14 0 0 1 14 -14 h404 a14 14 0 0 1 14 14 v20 h-432 z" fill="${p.chrome}"/>`;
  s += T(40, 131, 14, p.chromeInk, "NAS UGREEN DXP480T", { w: "bold" });
  s += `<rect x="376" y="116" width="66" height="20" rx="10" fill="${a}"/>${T(409, 130, 11, p.accentInk, "Docker", { w: "bold", anchor: "middle", mono: true })}`;
  s += T(40, 164, 12, p.muted, tr("Services conteneurisés", "Containerized services"), { w: "bold" });
  const services = tr(
    [["PostgreSQL", "base de données"], ["ntfy", "notifications push"], ["WireGuard", "VPN auto-hébergé"], ["Caddy", "reverse proxy / HTTPS"],
     ["Vaultwarden", "mots de passe"], ["AdGuard", "filtrage DNS"], ["Umami", "statistiques"], ["Jellyfin", "streaming média"]],
    [["PostgreSQL", "database"], ["ntfy", "push notifications"], ["WireGuard", "self-hosted VPN"], ["Caddy", "reverse proxy / HTTPS"],
     ["Vaultwarden", "password manager"], ["AdGuard", "DNS filtering"], ["Umami", "analytics"], ["Jellyfin", "media streaming"]],
  );
  services.forEach(([name, sub], i) => {
    const x = i % 2 ? 244 : 40;
    const y = 174 + Math.floor(i / 2) * 52;
    s += card(x, y, 196, 44, p, { r: 9, fill: p.soft, shadow: false });
    s += `<circle cx="${x + 16}" cy="${y + 22}" r="6" fill="${a}" fill-opacity="0.18" stroke="${a}" stroke-opacity="0.5"/><circle cx="${x + 16}" cy="${y + 22}" r="2.5" fill="${a}"/>`;
    s += T(x + 30, y + 19, 13, p.ink, name, { w: "bold" });
    s += T(x + 30, y + 35, 10.5, p.muted, sub, { mono: true });
  });
  s += T(40, 402, 11, p.muted, tr("+ Uptime Kuma · Dockge · tableau de bord maison · durcissement", "+ Uptime Kuma · Dockge · home-made dashboard · hardening"));
  s += `<rect x="40" y="414" width="400" height="48" rx="9" fill="${p.soft}"/>`;
  s += T(54, 434, 11.5, p.muted, "$ docker compose up -d", { mono: true });
  s += `<circle cx="58" cy="449" r="3.5" fill="${a}"/>${T(68, 453, 11.5, a, tr("tous les services actifs", "all services running"), { mono: true })}`;

  // appareils du réseau
  [["PC / Dev", 24], ["Mobile", 172], ["TV / Consoles", 320]].forEach(([n, x]) => {
    s += card(x, 500, 136, 40, p, { r: 10 });
    s += T(x + 68, 525, 13, p.ink, n, { w: "bold", anchor: "middle" });
  });
  return vframe(p, s, 560);
}

function reseauV(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";
  // pastille plus petite que vpastille : posée dans un espace étroit
  const mini = (cx, cy, label) => {
    const w = Math.round(label.length * 9.5 * 0.6 + 14);
    return `<rect x="${cx - w / 2}" y="${cy - 8}" width="${w}" height="16" rx="8" fill="${p.base}"/><rect x="${cx - w / 2}" y="${cy - 8}" width="${w}" height="16" rx="8" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.35"/>${T(cx, cy + 3.5, 9.5, a, label, { w: "bold", anchor: "middle", mono: true })}`;
  };
  // traits d'abord, cartes par-dessus
  s += vtrait(134, 46, 155, 46, p) + vtrait(240, 76, 240, 112, p);
  s += vtrait(190, 160, 130, 208, p, { accent: true }) + vtrait(290, 160, 350, 208, p, { accent: true });
  s += `<path d="M130 384 C 130 414, 350 414, 350 384" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="6 5"/>`;

  s += card(24, 26, 110, 40, p, { r: 12 });
  s += T(79, 51, 14, p.ink, "Internet", { w: "bold", anchor: "middle" });
  s += card(155, 16, 170, 60, p, { r: 12 });
  s += T(240, 36, 14, p.ink, tr("Box fibre", "Fibre box"), { w: "bold", anchor: "middle" });
  s += T(240, 53, 11, p.muted, "NAT 443 / 80 → Caddy", { mono: true, anchor: "middle" });
  s += T(240, 68, 10.5, p.muted, tr("IP fixe · DNS imposé", "static IP · fixed DNS"), { mono: true, op: 0.85, anchor: "middle" });

  s += card(155, 112, 170, 48, p, { r: 12, fill: p.chrome, stroke: p.chrome });
  s += T(240, 133, 13, p.chromeInk, tr("Switch 10 GbE", "10 GbE switch"), { w: "bold", anchor: "middle" });
  s += T(240, 150, 10.5, p.chromeInk, "2 × 10 GbE", { anchor: "middle", mono: true, op: 0.8 });

  const machine = (x, titre, lignes) => {
    let o = card(x, 208, 212, 176, p, { r: 12 });
    o += T(x + 14, 231, 12.5, p.ink, titre, { w: "bold" });
    lignes.forEach(([nm, sub], i) => {
      const y = 242 + i * 34;
      o += `<circle cx="${x + 15}" cy="${y + 10}" r="3" fill="${a}"/>`;
      o += T(x + 24, y + 14, 12, p.ink, nm, { mono: true, w: "bold" });
      o += T(x + 24, y + 28, 9.5, p.muted, sub);
    });
    return o;
  };
  s += machine(24, tr("NAS · services réseau", "NAS · network services"), [
    ["Caddy", tr("seul service exposé · HTTPS", "only exposed service · HTTPS")],
    ["AdGuard Home", tr("DNS filtrant · réglé par appareil", "filtering DNS · set per device")],
    ["WireGuard", tr("VPN d'accès à distance", "remote access VPN")],
    [tr("Pare-feu", "Firewall"), tr("liste blanche · règles Docker", "allowlist · Docker rules")],
  ]);
  s += machine(244, tr("PC · poste de travail", "PC · workstation"), [
    ["iSCSI", tr("disque de jeux hébergé sur le NAS", "games disk hosted on the NAS")],
    ["Wake-on-LAN", tr("allumé à distance depuis le portail", "powered on remotely from the portal")],
    ["RDP · Moonlight", tr("bureau et jeux à distance, par le VPN", "desktop and games, over the VPN")],
  ]);
  s += mini(160, 184, "10 GbE") + mini(320, 184, "10 GbE");
  s += mini(240, 406, "iSCSI");

  s += card(24, 430, 432, 50, p, { r: 12 });
  s += T(44, 451, 13, p.ink, tr("Wi-Fi de la box", "Box Wi-Fi"), { w: "bold" });
  s += T(44, 469, 11, p.muted, tr("téléphones · TV · invités", "phones · TV · guests"));
  s += T(436, 469, 11, p.muted, tr("même réseau, à plat", "same flat network"), { anchor: "end", mono: true });

  s += card(24, 494, 432, 78, p, { r: 12, stroke: a, sw: 2 });
  s += T(44, 516, 13, p.ink, tr("Accès à distance", "Remote access"), { w: "bold" });
  s += T(44, 536, 11, p.muted, "WireGuard · MTU 1350 · AllowedIPs /32", { mono: true });
  s += T(44, 556, 11, a, tr("→ réveil du PC, puis RDP ou Moonlight", "→ wake the PC, then RDP or Moonlight"), { mono: true });

  s += card(24, 586, 432, 74, p, { r: 12, stroke: a, sw: 2 });
  s += T(44, 608, 13, p.ink, tr("2 pannes résolues", "2 outages fixed"), { w: "bold" });
  s += T(44, 628, 11, p.muted, tr("trou noir de MTU → 1350", "MTU black hole → 1350"), { mono: true });
  s += T(44, 646, 11, p.muted, tr("collision de /24 → AllowedIPs /32", "/24 clash → AllowedIPs /32"), { mono: true });
  return vframe(p, s, 676);
}

function dashboardV(p, lang) {
  const a = p.accent;
  const up = "#22c55e"; // statut OK (couleurs de statut universelles, hors thème)
  const warn = "#f59e0b";
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";
  /* Une seule règle d'espacement : 10 px entre les blocs, 16 px de marge dans
     la fenêtre, et DANS chaque bloc 12 px de marge (haut, bas, côtés), titre à
     la même hauteur partout, 12 px entre le titre et le contenu. */
  const G = 10, X0 = 32, X1 = 448, P = 12, TITRE = 21;
  const demi = (X1 - X0 - G) / 2; // largeur d'une demi-tuile
  const X2 = X0 + demi + G; // abscisse de la colonne de droite
  const tuile = (x, y, w, h, titre) =>
    card(x, y, w, h, p, { r: 11, fill: p.soft, shadow: false }) + T(x + P, y + TITRE, 11.5, p.muted, titre, { w: "bold" });

  // valeurs absolues, 2 × 2
  const mes = tr(
    [["Processeur", "2,1 / 12 cœurs", 0.17], ["Mémoire", "5,4 / 7,5 Go", 0.72], ["Stockage", "4,3 / 8,0 To", 0.54], ["Température", "54 °C", 0.54]],
    [["Processor", "2.1 / 12 cores", 0.17], ["Memory", "5.4 / 7.5 GB", 0.72], ["Storage", "4.3 / 8.0 TB", 0.54], ["Temperature", "54 °C", 0.54]],
  );
  const MY = 56, MH = 61;
  mes.forEach(([lab, val, f], i) => {
    const x = i % 2 ? X2 : X0;
    const y = MY + Math.floor(i / 2) * (MH + G);
    const bw = demi - 2 * P;
    s += card(x, y, demi, MH, p, { r: 10, fill: p.soft, shadow: false });
    s += T(x + P, y + 20, 10.5, p.muted, lab);
    s += T(x + P, y + 38, 13.5, p.ink, val, { w: "bold", mono: true });
    s += `<rect x="${x + P}" y="${y + 46}" width="${bw}" height="3" rx="1.5" fill="${p.line}"/><rect x="${x + P}" y="${y + 46}" width="${Math.round(bw * f)}" height="3" rx="1.5" fill="${f > 0.7 ? warn : a}"/>`;
  });

  // système : trois jauges + courbe 24 h
  const gy = MY + 2 * MH + 2 * G;
  const GH = 108;
  s += tuile(X0, gy, X1 - X0, GH, tr("Système", "System"));
  const ring = (cx, f, col, val, lab) => {
    const r = 22, c = 2 * Math.PI * r, cy = gy + 57;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.line}" stroke-width="6"/>` +
      `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(c * f).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 ${cx} ${cy})"/>` +
      T(cx, cy + 4.5, 11.5, p.ink, val, { w: "bold", anchor: "middle", mono: true }) +
      T(cx, gy + GH - P, 10, p.muted, lab, { anchor: "middle" });
  };
  s += ring(76, 0.17, a, "17 %", tr("processeur", "processor"));
  s += ring(154, 0.72, warn, "72 %", tr("mémoire", "memory"));
  s += ring(232, 0.54, a, "54°", tr("température", "temperature"));
  s += T(290, gy + TITRE, 10, p.muted, "24 h", { mono: true });
  const pts = [26, 30, 24, 34, 31, 42, 36, 32, 44, 39, 46, 37, 41];
  s += `<path d="${pts.map((v, i) => `${i ? "L" : "M"}${290 + i * 12} ${(gy + 82 - (v - 20) * 1.85).toFixed(1)}`).join(" ")}" fill="none" stroke="${a}" stroke-width="2" stroke-linejoin="round"/>`;
  s += T(X1 - P, gy + GH - P, 9.5, p.muted, tr("charge 0,9 → 1,2 → 1,1", "load 0.9 → 1.2 → 1.1"), { anchor: "end", mono: true });

  // disponibilité : 48 battements, un seul rouge, et trois services
  const dy = gy + GH + G;
  const DH = 116;
  s += tuile(X0, dy, X1 - X0, DH, tr("Disponibilité", "Availability"));
  s += `<rect x="${X1 - P - 106}" y="${dy + 8}" width="106" height="18" rx="9" fill="${up}" fill-opacity="0.14" stroke="${up}" stroke-opacity="0.4"/><circle cx="${X1 - P - 93}" cy="${dy + 17}" r="3.5" fill="${up}"/>`;
  s += T(X1 - P - 84, dy + 21, 10, up, tr("tout en ligne", "all up"), { mono: true, w: "bold" });
  const pas = (X1 - X0 - 2 * P - 5) / 47;
  for (let i = 0; i < 48; i++) {
    const bad = i === 31;
    s += `<rect x="${(X0 + P + i * pas).toFixed(1)}" y="${dy + 33}" width="5" height="26" rx="1.5" fill="${bad ? "#ef4444" : up}" fill-opacity="${bad ? 0.9 : 0.62}"/>`;
  }
  const svcs = tr(
    [["portfolio", "99,98 %"], ["api · contact", "99,95 %"], ["postgres", "100 %"]],
    [["portfolio", "99.98%"], ["api · contact", "99.95%"], ["postgres", "100%"]],
  );
  svcs.forEach(([n, v], i) => {
    const y = dy + DH - P - (2 - i) * 14;
    s += `<circle cx="${X0 + P + 3}" cy="${y - 3.5}" r="3" fill="${up}"/>`;
    s += T(X0 + P + 12, y, 10.5, p.ink, n, { mono: true });
    s += T(X1 - P, y, 10.5, p.muted, v, { mono: true, anchor: "end" });
  });

  // mémoire et swap | tunnel VPN
  const by = dy + DH + G;
  const BH = 100;
  s += tuile(X0, by, demi, BH, tr("Mémoire et swap", "Memory and swap"));
  s += T(X0 + P, by + 47, 22, p.ink, "1,2", { w: "bold", mono: true });
  s += T(X0 + P + 46, by + 47, 11, p.muted, tr("Go évacués", "GB swapped"), { mono: true });
  const sw = [0.4, 0.5, 0.7, 0.6, 0.9, 1.1, 1.0, 1.2, 1.4, 1.3, 1.2];
  const pasSw = (demi - 2 * P) / (sw.length - 1);
  s += `<path d="${sw.map((v, i) => `${i ? "L" : "M"}${(X0 + P + i * pasSw).toFixed(1)} ${(by + 74 - (v - 0.4) * 18).toFixed(1)}`).join(" ")}" fill="none" stroke="${warn}" stroke-width="2" stroke-linejoin="round"/>`;
  s += T(X0 + P, by + BH - P, 9.5, p.muted, tr("compressé par le noyau", "compressed by the kernel"), { mono: true });
  const vc = X2 + demi / 2;
  s += tuile(X2, by, demi, BH, tr("Tunnel VPN", "VPN tunnel"));
  s += `<circle cx="${vc}" cy="${by + 46}" r="15" fill="${up}" fill-opacity="0.12" stroke="${up}" stroke-opacity="0.45" stroke-width="2"/>`;
  s += `<path d="M${vc - 7} ${by + 46} l5 5 l9 -10" fill="none" stroke="${up}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
  s += T(vc, by + 76, 12, p.ink, tr("Tunnel actif", "Tunnel up"), { anchor: "middle", w: "bold" });
  s += T(vc, by + BH - P, 9.5, p.muted, tr("trafic sortant vérifié", "egress verified"), { anchor: "middle", mono: true });

  // mémoire par pile
  const py = by + BH + G;
  const PH = 112;
  s += tuile(X0, py, X1 - X0, PH, tr("Mémoire par pile", "Memory per stack"));
  const stacks = tr(
    [["Stack *arr", 563, 1], ["Infrastructure", 533, 0.95], ["Umami", 128, 0.23], ["Portfolio", 122, 0.22]],
    [["*arr stack", 563, 1], ["Infrastructure", 533, 0.95], ["Umami", 128, 0.23], ["Portfolio", 122, 0.22]],
  );
  stacks.forEach(([n, mo, rel], i) => {
    const y = py + 36 + i * 16;
    s += T(X0 + P, y + 4, 10.5, p.ink, n);
    s += `<rect x="150" y="${y - 4}" width="220" height="8" rx="4" fill="${p.line}" fill-opacity="0.6"/>`;
    s += `<rect x="150" y="${y - 4}" width="${(220 * rel).toFixed(0)}" height="8" rx="4" fill="${a}" fill-opacity="${(0.35 + 0.5 * rel).toFixed(2)}"/>`;
    s += T(X1 - P, y + 4, 10, p.muted, `${mo} Mo`, { mono: true, anchor: "end" });
  });
  s += T(X0 + P, py + PH - P, 9.5, p.muted, tr("déduit du préfixe du conteneur", "derived from the container prefix"), { mono: true });

  // fenêtre du portail, tracée dessous : sa hauteur suit le contenu
  const bas = py + PH + 16;
  const fenetre = card(16, 12, 448, bas - 12, p, { r: 14 }) + titlebar(16, 12, 448, p, "awallez.github.io/homelab", { r: 14, h: 32 });
  return vframe(p, fenetre + s, bas + 16);
}

function clientsV(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  let s = "";
  /* Deux colonnes (8 px d'écart), cadres deux par deux. Le site vitrine prend
     la place que le téléphone, plus étroit, laisse libre. */

  // ---- site vitrine (élargi) | mobile ----
  s += T(16, 22, 9.5, p.muted, tr("Site vitrine pour artisan / indépendant", "Showcase site for craftsperson / freelancer"));
  s += card(16, 30, 290, 232, p, { r: 12 });
  s += dots3(30, 44, p, 3, 10);
  s += `<rect x="66" y="37" width="228" height="14" rx="7" fill="${p.soft}"/>${T(74, 47, 8, p.muted, tr("menuiserie-dupont.fr", "dupont-carpentry.com"), { mono: true })}`;
  s += `<line x1="16" y1="58" x2="306" y2="58" stroke="${p.line}"/>`;
  s += `<rect x="28" y="66" width="10" height="10" rx="2.5" fill="${a}"/>${T(42, 75, 10, p.ink, tr("Menuiserie Dupont", "Dupont Carpentry"), { w: "bold" })}`;
  s += `<rect x="252" y="65" width="42" height="14" rx="7" fill="${a}"/>${T(273, 75, 8, p.accentInk, tr("Devis", "Quote"), { w: "bold", anchor: "middle" })}`;
  s += T(28, 92, 8.5, p.muted, tr("Accueil · Projets · Services", "Home · Projects · Services"));
  s += T(28, 120, 15, p.ink, tr("Le menuisier,", "The woodworker,"), { w: "bold" });
  s += T(28, 138, 15, a, tr("sur mesure.", "made to measure."), { w: "bold" });
  s += T(28, 156, 8.5, p.muted, tr("Meubles sur mesure &amp; rénovation", "Custom furniture design &amp; renovation"));
  s += T(28, 168, 8.5, p.muted, tr("pour particuliers &amp; entreprises.", "for homes &amp; businesses."));
  s += `<rect x="28" y="180" width="110" height="22" rx="6" fill="${a}"/>${T(83, 195, 9, p.accentInk, tr("Demander un devis", "Request a quote"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="200" y="100" width="94" height="110" rx="8" fill="url(#thumb)" stroke="${a}" stroke-opacity="0.3"/>`;
  s += `<g stroke="${a}" stroke-opacity="0.55" fill="none" stroke-width="1.6"><circle cx="222" cy="122" r="7"/><path d="M206 200 L232 172 L250 186 L268 166 L290 196"/></g>`;
  s += T(28, 238, 8.5, a, tr("▸ Agencement", "▸ Fittings"), { op: 0.85 });
  s += T(100, 238, 8.5, a, tr("▸ Meubles sur mesure", "▸ Custom furniture"), { op: 0.85 });
  s += T(206, 238, 8.5, a, tr("▸ Rénovation", "▸ Renovation"), { op: 0.85 });

  s += T(314, 22, 9.5, p.muted, "Mobile · Responsive");
  s += card(314, 30, 150, 232, p, { r: 18 });
  s += `<rect x="369" y="40" width="40" height="5" rx="2.5" fill="${p.line}"/>`;
  s += `<g stroke="${p.ink}" stroke-width="1.6"><line x1="326" y1="58" x2="336" y2="58"/><line x1="326" y1="62" x2="336" y2="62"/><line x1="326" y1="66" x2="336" y2="66"/></g>`;
  s += T(343, 66, 9.5, p.ink, tr("Menuiserie Dupont", "Dupont Carpentry"), { w: "bold" });
  s += `<rect x="326" y="76" width="126" height="64" rx="8" fill="url(#thumb)"/><circle cx="350" cy="98" r="7" fill="${a}" fill-opacity="0.4"/>`;
  s += T(326, 160, 12, p.ink, tr("Le menuisier", "The custom"), { w: "bold" });
  s += T(326, 175, 12, a, tr("sur mesure", "woodworker"), { w: "bold" });
  s += T(326, 189, 8.5, p.muted, tr("Meubles &amp; agencement", "Furniture &amp; fittings"));
  s += `<rect x="326" y="198" width="126" height="24" rx="7" fill="${a}"/>${T(389, 214, 9, p.accentInk, tr("Demander un devis", "Request a quote"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="326" y="230" width="60" height="22" rx="6" fill="${p.soft}"/><rect x="392" y="230" width="60" height="22" rx="6" fill="${p.soft}"/>`;

  // ---- app de gestion | réservations ----
  s += T(16, 288, 9.5, p.muted, tr("App web de gestion sur mesure", "Custom web app for management"));
  s += card(16, 296, 220, 236, p, { r: 12 });
  s += `<circle cx="28" cy="309" r="4" fill="${a}"/>${T(38, 313, 10, p.ink, "StockApp", { w: "bold" })}`;
  s += `<line x1="16" y1="322" x2="236" y2="322" stroke="${p.line}"/>`;
  s += `<rect x="16" y="322" width="80" height="198" fill="${p.soft}"/>`;
  s += `<rect x="20" y="330" width="72" height="16" rx="4" fill="${a}" fill-opacity="0.14"/>${T(25, 341, 8, a, tr("Tableau de bord", "Dashboard"), { w: "bold" })}`;
  tr(["Clients (CRM)", "Stock", "Réservations", "Statistiques"], ["Customers (CRM)", "Inventory", "Bookings", "Analytics"])
    .forEach((m, i) => (s += T(25, 362 + i * 16, 8, p.muted, m)));
  ["Marie Lefevre", "Thomas Roche", "Lea Hubert"].forEach((n, i) => {
    s += `<circle cx="28" cy="${446 + i * 20}" r="5" fill="${a}" fill-opacity="0.16"/>`;
    s += T(37, 449 + i * 20, 8, p.muted, n);
  });
  tr([["Revenus", "8 240 €"], ["Commandes", "32"], ["Articles en stock", "1 320"]],
     [["Revenue", "€8,240"], ["Orders", "32"], ["Items in stock", "1,320"]])
    .forEach(([k, v], i) => {
      const y = 330 + i * 38;
      s += `<rect x="104" y="${y}" width="124" height="32" rx="6" fill="${p.surface}" stroke="${p.line}"/>`;
      s += T(112, y + 12, 8, p.muted, k);
      s += T(112, y + 26, 11, p.ink, v, { w: "bold" });
    });
  s += `<rect x="104" y="446" width="124" height="74" rx="6" fill="${p.surface}" stroke="${p.line}"/>`;
  [24, 40, 16, 48, 30, 56, 22, 36, 18].forEach((hgt, i) => {
    const h = Math.round(hgt * 1.05);
    s += `<rect x="${112 + i * 12.4}" y="${512 - h}" width="8" height="${h}" rx="1.5" fill="${a}" fill-opacity="${0.4 + 0.06 * (i % 3)}"/>`;
  });

  s += T(244, 288, 9.5, p.muted, tr("Module de réservations", "Bookings module"));
  s += card(244, 296, 220, 236, p, { r: 12 });
  s += T(258, 318, 11, p.ink, tr("Réservations", "Bookings"), { w: "bold" });
  s += T(452, 318, 8, p.muted, tr("Juin 2026", "June 2026"), { anchor: "end" });
  tr([["Lun 09:00", "M. Dupont · Devis cuisine"], ["Mar 14:00", "Mme Martin · Pose dressing"], ["Mer 11:30", "M. Bernard · Prise de mesures"], ["Jeu 16:15", "Mme Roche · Livraison"], ["Ven 10:00", "M. Hubert · Devis terrasse"]],
     [["Mon 09:00", "Mr. Dupont · Kitchen quote"], ["Tue 14:00", "Mrs. Martin · Wardrobe install"], ["Wed 11:30", "Mr. Bernard · Measurement"], ["Thu 16:15", "Mrs. Roche · Delivery"], ["Fri 10:00", "Mr. Hubert · Decking quote"]])
    .forEach(([h, d], i) => {
      const y = 328 + i * 33;
      s += `<rect x="256" y="${y}" width="196" height="28" rx="6" fill="${p.soft}"/><rect x="256" y="${y}" width="3" height="28" rx="1.5" fill="${a}"/>`;
      s += T(266, y + 12, 9, p.ink, h, { w: "bold" });
      s += T(266, y + 23, 8, p.muted, d);
    });
  s += `<rect x="256" y="496" width="196" height="26" rx="7" fill="${a}"/>${T(354, 513, 9.5, p.accentInk, tr("+ Nouvelle résa", "+ New booking"), { w: "bold", anchor: "middle" })}`;

  // ---- formulaire de contact, sur toute la largeur ----
  s += T(16, 558, 9.5, p.muted, tr("Formulaire de contact", "Contact form"));
  s += card(16, 566, 448, 90, p, { r: 12 });
  s += T(32, 586, 11, p.ink, tr("Contactez-nous", "Contact us"), { w: "bold" });
  s += field(32, 594, 200, 22, p, tr("Nom", "Name"));
  s += field(240, 594, 208, 22, p, "Email");
  s += field(32, 624, 308, 22, p, tr("Votre message…", "Your message…"));
  s += `<rect x="348" y="624" width="100" height="22" rx="6" fill="${a}"/>${T(398, 639, 9.5, p.accentInk, tr("Envoyer", "Send"), { w: "bold", anchor: "middle" })}`;
  return vframe(p, s, 672);
}

function portfolioV(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const won = "#22c55e"; // statut « validé » (couleur de statut universelle, hors thème)
  let s = "";
  const fleche = (x1, y1, x2, y2, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.accent ? a : p.muted}" stroke-width="2"${o.dash ? ' stroke-dasharray="5 4"' : ""} marker-end="url(#${o.accent ? "arrowA" : "arrow"})"/>`;
  // pastilles de techno, plus serrées que tagRow
  const pastilles = (x, y, labels) => {
    let cx = x;
    return labels.map((l) => {
      const w = Math.round(l.length * 8.5 * 0.6 + 12);
      const o = `<rect x="${cx}" y="${y}" width="${w}" height="18" rx="5" fill="${a}" fill-opacity="0.12" stroke="${a}" stroke-opacity="0.32"/>${T(cx + 6, y + 12.5, 8.5, a, l, { mono: true })}`;
      cx += w + 5;
      return o;
    }).join("");
  };

  // ---- le site sur ordinateur, sur toute la largeur ----
  s += T(16, 22, 9.5, p.muted, "Portfolio · React · TypeScript · Vite · Tailwind");
  s += card(16, 30, 448, 166, p, { r: 12 });
  s += `${T(30, 50, 11, p.muted, "// ", { w: "bold", mono: true })}${T(48, 50, 11, a, "alexis.wallez", { w: "bold", mono: true })}`;
  s += T(450, 50, 8.5, p.muted, tr("Compétences · Projets · Services · Contact", "Skills · Projects · Services · Contact"), { anchor: "end" });
  s += `<line x1="16" y1="60" x2="464" y2="60" stroke="${p.line}"/>`;
  // section Services du site (et non le terminal du haut de page)
  s += `${T(28, 78, 9.5, p.muted, "// ", { w: "bold", mono: true })}${T(44, 78, 9.5, a, "Services", { w: "bold", mono: true })}`;
  s += T(452, 78, 8, p.muted, "cat services/README.md", { mono: true, anchor: "end" });
  SERVICES.forEach((sv, i) => {
    const x = i % 2 ? 244 : 28;
    const y = 86 + Math.floor(i / 2) * 38;
    s += `<rect x="${x}" y="${y}" width="208" height="34" rx="7" fill="${p.soft}" stroke="${p.line}"/>`;
    s += `<circle cx="${x + 12}" cy="${y + 12}" r="3.5" fill="${a}"/>`;
    s += T(x + 21, y + 15, 9.5, p.ink, sv.nom[lang], { w: "bold" });
    s += T(x + 21, y + 27, 8, p.muted, sv.points[lang]);
  });
  s += T(28, 177, 8.5, p.muted, tr("Accessibilité · SEO · i18n FR/EN · tests · CI/CD", "Accessibility · SEO · i18n FR/EN · tests · CI/CD"), { op: 0.85 });
  s += T(28, 189, 8.5, p.muted, tr("Full-stack, du front-end à la mise en ligne, esprit DevOps.", "Full-stack, from front-end to deployment, DevOps-minded."));

  // ---- mobile | GitHub + qualité ----
  s += T(16, 218, 9.5, p.muted, "Responsive");
  s += T(178, 218, 9.5, p.muted, "Open source");
  s += card(16, 226, 150, 206, p, { r: 18 });
  s += `<rect x="71" y="236" width="40" height="5" rx="2.5" fill="${p.line}"/>`;
  s += `${T(28, 260, 9.5, p.muted, "// ", { w: "bold", mono: true })}${T(44, 260, 9.5, a, "alexis.w", { w: "bold", mono: true })}`;
  s += `<rect x="28" y="268" width="126" height="108" rx="8" fill="${p.soft}" stroke="${p.line}"/>`;
  s += `${T(38, 288, 9, a, "$ ", { mono: true })}${T(50, 288, 9, p.ink, "whoami", { mono: true })}`;
  s += T(38, 303, 9, p.muted, "Full-Stack", { mono: true });
  s += T(38, 317, 9, p.muted, "&amp; DevOps", { mono: true });
  s += `${T(38, 340, 9, a, "$ ", { mono: true })}${T(50, 340, 9, p.ink, "ls skills/", { mono: true })}`;
  s += T(38, 355, 9, p.muted, "Docker · Linux", { mono: true });
  s += `<rect x="28" y="388" width="126" height="28" rx="8" fill="${a}"/>${T(91, 406, 10, p.accentInk, "→ Contact", { w: "bold", anchor: "middle" })}`;

  s += card(178, 226, 286, 96, p, { r: 12 });
  s += `<path transform="translate(192 240) scale(0.8)" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="${p.ink}"/>`;
  s += T(220, 250, 11.5, p.ink, "GitHub · open source", { w: "bold" });
  s += T(220, 264, 9, p.muted, "AWallez / portfolio");
  s += `<circle cx="196" cy="284" r="3" fill="${a}"/>${T(205, 287, 9, a, tr("Public · CI au vert", "Public · CI passing"))}`;
  s += T(192, 309, 8.5, p.muted, "React · TS · Fastify · PostgreSQL · Docker");
  s += card(178, 330, 286, 102, p, { r: 12 });
  s += T(192, 349, 11, p.ink, tr("Soigné", "Polished"), { w: "bold" });
  s += pastilles(192, 358, tr(["Accessibilité", "SEO", "i18n FR/EN"], ["Accessibility", "SEO", "i18n FR/EN"]));
  s += pastilles(192, 382, tr(["Responsive", "Tests Vitest", "CI/CD Actions"], ["Responsive", "Vitest tests", "CI/CD Actions"]));
  s += pastilles(192, 406, tr(["Thème clair / sombre", "Conteneurisé"], ["Light / dark theme", "Containerized"]));

  // ---- formulaire + mini-CRM | API + notification ----
  s += T(16, 454, 9.5, p.muted, tr("Formulaire → API → notification push (ntfy)", "Contact form → API → push notification (ntfy)"));
  s += card(16, 462, 212, 176, p, { r: 12 });
  s += T(28, 480, 10.5, p.ink, tr("Contactez-nous", "Contact us"), { w: "bold" });
  const champ = (x, y, w, h, txt) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${p.soft}" stroke="${p.line}"/>${T(x + 7, y + h / 2 + 3, 8, p.muted, txt, { op: 0.85 })}`;
  s += champ(28, 488, 92, 20, tr("Prénom", "First name")) + champ(124, 488, 92, 20, tr("Nom", "Last name"));
  s += champ(28, 514, 92, 20, "Email") + champ(124, 514, 92, 20, tr("Téléphone", "Phone"));
  s += champ(28, 540, 188, 20, tr("Type de demande", "Request type")) + T(208, 553, 9, p.muted, "▾", { anchor: "middle" });
  s += champ(28, 566, 188, 32, "Message…");
  s += `<rect x="28" y="606" width="188" height="22" rx="6" fill="${a}"/>${T(122, 621, 9.5, p.accentInk, tr("→ Envoyer", "→ Send"), { w: "bold", anchor: "middle" })}`;

  // la requête passe par Caddy (HTTPS) avant d'atteindre l'API
  s += fleche(230, 490, 257, 490);
  s += card(260, 462, 204, 74, p, { r: 12, fill: p.chrome, stroke: p.chrome });
  s += `<circle cx="274" cy="480" r="4.5" fill="${a}"/>${T(284, 484, 11, p.chromeInk, "Fastify API", { w: "bold" })}`;
  s += T(274, 500, 9, p.chromeInk, "/api/contact", { mono: true, op: 0.7 });
  s += T(274, 514, 8.5, p.chromeInk, "PostgreSQL · validation", { op: 0.55 });
  s += T(274, 528, 8.5, a, tr("via Caddy (HTTPS) · POST", "via Caddy (HTTPS) · POST"), { mono: true });

  // API → notification push
  s += fleche(362, 536, 362, 560);
  s += T(372, 552, 8.5, p.muted, tr("publie", "publish"));
  s += card(260, 562, 204, 144, p, { r: 12 });
  s += `<rect x="272" y="574" width="26" height="26" rx="7" fill="${a}"/>`;
  s += `<path d="M285 580 a5.5 5.5 0 0 1 5.5 5.5 v3 l1.3 2 h-13.6 l1.3 -2 v-3 a5.5 5.5 0 0 1 5.5 -5.5 z" fill="${p.accentInk}"/><circle cx="285" cy="594" r="1.6" fill="${p.accentInk}"/>`;
  s += T(306, 585, 10.5, p.ink, "ntfy", { w: "bold" });
  s += T(306, 597, 8, p.muted, tr("sur ton téléphone", "on your phone"));
  s += T(452, 585, 8, p.muted, tr("maintenant", "now"), { anchor: "end", op: 0.8 });
  s += `<line x1="272" y1="608" x2="452" y2="608" stroke="${p.line}"/>`;
  s += T(272, 624, 9.5, p.ink, tr("Nouveau message de Marie Dupont", "New message from Marie Dupont"), { w: "bold" });
  s += T(272, 638, 8, p.muted, tr("marie@example.com · Projet freelance", "marie@example.com · Freelance project"));
  s += T(272, 654, 8, p.muted, tr("&quot;Bonjour, j'aimerais un devis", "&quot;Hi, I'd like a quote"), { op: 0.85 });
  s += T(272, 666, 8, p.muted, tr("pour refondre mon site…&quot;", "to redesign my website…&quot;"), { op: 0.85 });

  // API → mini-CRM (même base PostgreSQL, accès par le VPN), par la marge
  s += `<path d="M260 524 L245 524 L245 672 L230 672" fill="none" stroke="${a}" stroke-width="2" stroke-dasharray="5 4" marker-end="url(#arrowA)"/>`;
  s += card(16, 646, 212, 60, p, { r: 12 });
  s += T(28, 664, 9.5, p.ink, "Mini-CRM · leads", { w: "bold" });
  const badge = tr("sur mesure", "custom");
  const bw = Math.round(badge.length * 4.6 + 12);
  s += `<rect x="${216 - bw}" y="654" width="${bw}" height="14" rx="7" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(216 - bw / 2, 664, 8, a, badge, { anchor: "middle", mono: true })}`;
  const lead = (y, name, label, col) => {
    const w = Math.round(label.length * 4.6 + 12);
    return `<circle cx="30" cy="${y}" r="2.5" fill="${col}"/>${T(38, y + 3, 8.5, p.muted, name)}<rect x="${216 - w}" y="${y - 6}" width="${w}" height="12" rx="4" fill="${col}" fill-opacity="0.14" stroke="${col}" stroke-opacity="0.35"/>${T(216 - w / 2, y + 2.5, 8, col, label, { anchor: "middle", mono: true })}`;
  };
  s += lead(682, "Marie Dupont", tr("validé", "validated"), won);
  s += lead(696, "Thomas Roche", tr("à recontacter", "to follow up"), a);
  return vframe(p, s, 722);
}

function monitoringV(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const up = "#22c55e"; // statut OK (couleurs de statut universelles, hors thème)
  const down = "#ef4444"; // statut hors ligne
  let s = "";

  // connecteur : la sonde en panne (5ᵉ ligne) déclenche l'alerte ntfy, en bas
  // à gauche ; il passe par la marge gauche
  s += `<path d="M30 266 C 8 266, 8 282, 8 300 L 8 432 C 8 440, 11 442, 16 442" stroke="${a}" stroke-width="2" stroke-dasharray="6 5" fill="none"/>`;

  // ---- tableau Uptime Kuma ----
  s += card(16, 12, 448, 388, p, { r: 14 });
  s += titlebar(16, 12, 448, p, "uptime-kuma", { r: 14, h: 32 });
  s += T(32, 68, 12.5, p.ink, tr("État des services", "Service health"), { w: "bold" });
  s += `<rect x="316" y="54" width="118" height="20" rx="10" fill="${up}" fill-opacity="0.14" stroke="${up}" stroke-opacity="0.42"/><circle cx="330" cy="64" r="3.5" fill="${up}"/>`;
  s += T(340, 68, 10, up, tr("14 / 15 en ligne", "14 / 15 up"), { mono: true, w: "bold" });
  const rows = tr(
    [["portfolio · web", true, "99,98 %", "42 ms"], ["api · contact", true, "99,95 %", "31 ms"], ["postgres", true, "100 %", "3 ms"], ["caddy · reverse proxy", true, "100 %", "11 ms"], ["wireguard", false, "hors ligne", "—"]],
    [["portfolio · web", true, "99.98%", "42 ms"], ["api · contact", true, "99.95%", "31 ms"], ["postgres", true, "100%", "3 ms"], ["caddy · reverse proxy", true, "100%", "11 ms"], ["wireguard", false, "offline", "—"]],
  );
  rows.forEach(([name, ok, uptime, lat], i) => {
    const y = 80 + i * 42;
    const c = ok ? up : down;
    s += card(30, y, 420, 36, p, { r: 8, fill: p.soft, shadow: false });
    s += `<circle cx="46" cy="${y + 18}" r="5.5" fill="${c}" fill-opacity="0.2" stroke="${c}" stroke-opacity="0.55"/><circle cx="46" cy="${y + 18}" r="2.5" fill="${c}"/>`;
    s += T(60, y + 22, 11, p.ink, name, { w: "bold" });
    for (let k = 0; k < 20; k++) {
      const bad = !ok && k >= 17;
      s += `<rect x="${206 + k * 6}" y="${y + 11}" width="4" height="14" rx="1" fill="${bad ? down : up}" fill-opacity="${bad ? 0.85 : 0.5}"/>`;
    }
    s += T(394, y + 22, 10, c, uptime, { mono: true, w: "bold", anchor: "end" });
    s += T(436, y + 22, 9.5, p.muted, lat, { mono: true, anchor: "end" });
  });
  // sondes externes (les métriques système sont déjà sur le tableau de bord)
  s += card(30, 294, 420, 74, p, { r: 8, fill: p.soft, shadow: false });
  s += T(44, 312, 10.5, p.ink, tr("Sondes externes", "External checks"), { w: "bold" });
  s += T(436, 312, 8.5, p.muted, tr("hors du NAS", "outside the NAS"), { anchor: "end", mono: true });
  const externe = (x, titre, sous, val) =>
    `<rect x="${x}" y="322" width="196" height="38" rx="7" fill="${p.surface}" stroke="${p.line}"/>` +
    `<circle cx="${x + 12}" cy="${336}" r="3.5" fill="${up}"/>` +
    T(x + 22, 339, 10, p.ink, titre, { w: "bold" }) +
    T(x + 22, 353, 8, p.muted, sous, { mono: true }) +
    (val ? T(x + 188, 339, 10, up, val, { mono: true, w: "bold", anchor: "end" }) : "");
  s += externe(40, "UptimeRobot", tr("depuis Internet · alexiswallez.fr", "from the internet · alexiswallez.fr"), "100 %");
  s += externe(244, "Push · compose-auto-update", tr("dernier signal de vie : 07:12", "last heartbeat: 07:12"), "");
  s += T(30, 388, 9, p.muted, tr("Socket Docker · sondes conteneurs · watchdog externe (UptimeRobot)", "Docker socket · container checks · external watchdog (UptimeRobot)"), { mono: true, op: 0.85 });

  // ---- alerte ntfy | Dockge, côte à côte ----
  s += card(16, 412, 220, 250, p, { r: 14 });
  s += `<rect x="28" y="424" width="28" height="28" rx="8" fill="${a}"/>`;
  s += `<path d="M42 430 a6 6 0 0 1 6 6 v3.5 l1.4 2 h-14.8 l1.4 -2 v-3.5 a6 6 0 0 1 6 -6 z" fill="${p.accentInk}"/><circle cx="42" cy="445" r="1.8" fill="${p.accentInk}"/>`;
  s += T(64, 437, 11.5, p.ink, "ntfy", { w: "bold" });
  s += T(64, 450, 8.5, p.muted, tr("sur ton téléphone", "on your phone"), { mono: true });
  s += T(224, 437, 8, p.muted, tr("maintenant", "now"), { anchor: "end" });
  s += `<line x1="28" y1="462" x2="224" y2="462" stroke="${p.line}"/>`;
  s += `<rect x="28" y="472" width="196" height="150" rx="9" fill="${down}" fill-opacity="0.08" stroke="${down}" stroke-opacity="0.3"/>`;
  s += `<circle cx="42" cy="490" r="4" fill="${down}"/>${T(52, 494, 11, p.ink, "wireguard", { w: "bold" })}`;
  s += `<rect x="170" y="482" width="46" height="16" rx="4" fill="${down}"/>${T(193, 494, 8.5, "#ffffff", "DOWN", { w: "bold", anchor: "middle", mono: true })}`;
  s += T(40, 518, 9.5, p.muted, tr("Le conteneur ne répond plus", "Container is not responding"));
  s += T(40, 536, 8, p.muted, tr("Sonde « Docker »", "“Docker” probe"), { mono: true });
  s += T(40, 548, 8, p.muted, tr("échec depuis 60 s", "failing 60 s"), { mono: true });
  s += `<rect x="40" y="560" width="108" height="18" rx="4" fill="${down}" fill-opacity="0.12" stroke="${down}" stroke-opacity="0.32"/>${T(48, 572, 8.5, down, tr("priorité urgente", "urgent priority"), { mono: true })}`;
  s += T(28, 646, 8, p.muted, tr("Relais APNs → push même app fermée", "APNs relay → push even when app closed"), { mono: true, op: 0.85 });

  // Dockge, comme son interface : la liste des stacks, puis la stack choisie
  s += card(244, 412, 220, 250, p, { r: 14 });
  s += titlebar(244, 412, 220, p, "dockge", { r: 14, h: 28 });
  [["portfolio", "6"], ["arr", "10"], ["monitoring", "2"]].forEach(([nm, cnt], i) => {
    const y = 448 + i * 28;
    if (i === 0) s += `<rect x="252" y="${y}" width="204" height="24" rx="6" fill="${a}" fill-opacity="0.14"/>`;
    s += `<circle cx="264" cy="${y + 12}" r="3.5" fill="${up}"/>`;
    s += T(274, y + 16, 10, p.ink, nm, { w: i === 0 ? "bold" : "normal" });
    s += T(448, y + 16, 9, p.muted, cnt, { mono: true, anchor: "end" });
  });
  s += `<line x1="252" y1="538" x2="456" y2="538" stroke="${p.line}"/>`;
  s += T(256, 558, 11, p.ink, "portfolio", { w: "bold" });
  s += `<rect x="404" y="547" width="46" height="16" rx="8" fill="${up}" fill-opacity="0.14" stroke="${up}" stroke-opacity="0.42"/>${T(427, 559, 8.5, up, tr("actif", "active"), { mono: true, w: "bold", anchor: "middle" })}`;
  s += `<rect x="256" y="568" width="92" height="20" rx="5" fill="none" stroke="${a}" stroke-opacity="0.6"/>${T(302, 581.5, 9, a, tr("Redémarrer", "Restart"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="354" y="568" width="98" height="20" rx="5" fill="${a}"/>${T(403, 581.5, 9, p.accentInk, tr("Mettre à jour", "Update"), { w: "bold", anchor: "middle" })}`;
  s += `<rect x="256" y="596" width="196" height="54" rx="7" fill="${p.soft}" stroke="${p.line}"/>`;
  [["services:", p.ink], ["  web · api · admin", a], ["  postgres · ntfy · caddy", a]].forEach(([l, c], i) => {
    s += T(266, 612 + i * 14, 8.5, c, l, { mono: true });
  });
  return vframe(p, s, 678);
}

function resilienceV(p, lang) {
  const a = p.accent;
  const tr = (fr, en) => (lang === "fr" ? fr : en);
  const up = "#22c55e";
  let s = "";
  const fleche = (x1, y1, x2, y2, o = {}) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${o.accent ? a : p.muted}" stroke-opacity="${o.accent ? 1 : 0.7}" stroke-width="2.5"${o.dash ? ' stroke-dasharray="6 5"' : ""} marker-end="url(#${o.accent ? "arrowA" : "arrow"})"/>`;

  // ---- NAS (source) ----
  // ⚠️ PAS DE « PRA », PAS DE « HORS SITE », PAS DE « RAID1 » (cf. resilience)
  s += card(16, 12, 448, 210, p, { r: 14 });
  s += `<path d="M16 26 a14 14 0 0 1 14 -14 h420 a14 14 0 0 1 14 14 v16 h-448 z" fill="${p.chrome}"/>`;
  s += T(32, 33, 13, p.chromeInk, tr("NAS · à sauvegarder", "NAS · source"), { w: "bold" });
  tr([["/volume1/docker", "services &amp; configs"], ["volumes nommés", "ntfy · caddy · wireguard"], ["pg_dump", "base PostgreSQL"]],
     [["/volume1/docker", "services &amp; configs"], ["named volumes", "ntfy · caddy · wireguard"], ["pg_dump", "PostgreSQL database"]])
    .forEach(([nm, sub], i) => {
      const y = 54 + i * 44;
      s += card(32, y, 416, 38, p, { r: 8, fill: p.soft, shadow: false });
      s += `<circle cx="50" cy="${y + 19}" r="3.5" fill="${a}"/>`;
      s += T(62, y + 17, 11, p.ink, nm, { mono: true, w: "bold" });
      s += T(62, y + 31, 9.5, p.muted, sub);
    });
  s += T(32, 206, 10, p.muted, tr("limite : pas encore de copie hors site", "limit: no off-site copy yet"), { mono: true, op: 0.9 });

  // NAS → restic
  s += fleche(116, 222, 116, 262);
  s += T(128, 246, 10, p.muted, "restic", { mono: true });

  // ---- restic | dead-man's-switch ----
  s += card(16, 266, 200, 120, p, { r: 14, fill: p.chrome, stroke: p.chrome });
  s += `<rect x="103" y="282" width="26" height="20" rx="4" fill="none" stroke="${a}" stroke-width="2.2"/><path d="M108 282 v-6 a8 8 0 0 1 16 0 v6" fill="none" stroke="${a}" stroke-width="2.2"/><circle cx="116" cy="292" r="2.5" fill="${a}"/>`;
  s += T(116, 334, 14, p.chromeInk, "restic", { w: "bold", anchor: "middle" });
  s += T(116, 352, 10, p.chromeInk, tr("chiffré · dédupliqué", "encrypted · deduplicated"), { anchor: "middle", op: 0.75 });
  s += T(116, 370, 9.5, a, tr("7 j · 4 sem · 6 mois", "7 d · 4 wk · 6 mo"), { anchor: "middle", mono: true });
  s += fleche(218, 326, 260, 326, { accent: true, dash: true });
  s += card(264, 266, 200, 120, p, { r: 14, stroke: a, sw: 2 });
  s += T(364, 294, 12, p.ink, "Dead-man's-switch", { w: "bold", anchor: "middle" });
  s += T(364, 314, 10, p.muted, tr("aucune sauvegarde depuis 48 h", "no backup for 48 h"), { anchor: "middle" });
  s += `<rect x="280" y="330" width="168" height="26" rx="7" fill="${a}" fill-opacity="0.12" stroke="${a}" stroke-opacity="0.32"/>${T(364, 347, 10, a, tr("→ alerte ntfy / Kuma", "→ ntfy / Kuma alert"), { anchor: "middle", mono: true, w: "bold" })}`;

  // restic → PC, par SFTP, quand le PC s'allume
  s += fleche(116, 386, 116, 436);
  const w = Math.round(4 * 9.5 * 0.6 + 14);
  s += `<rect x="${116 - w / 2}" y="396" width="${w}" height="16" rx="8" fill="${p.base}"/><rect x="${116 - w / 2}" y="396" width="${w}" height="16" rx="8" fill="${a}" fill-opacity="0.14" stroke="${a}" stroke-opacity="0.32"/>${T(116, 407.5, 9.5, a, "SFTP", { anchor: "middle", mono: true, w: "bold" })}`;
  s += T(128, 428, 9.5, p.muted, tr("à l'allumage", "on power-on"), { mono: true });

  // ---- PC (seconde copie, dans la maison) ----
  s += card(16, 440, 448, 200, p, { r: 14 });
  s += `<path d="M16 454 a14 14 0 0 1 14 -14 h420 a14 14 0 0 1 14 14 v16 h-448 z" fill="${p.chrome}"/>`;
  s += T(32, 461, 13, p.chromeInk, tr("PC · seconde copie", "PC · second copy"), { w: "bold" });
  [["2026-07-12 08:14", "1.49 GiB"], ["2026-07-11 22:03", "1.48 GiB"], ["2026-07-11 08:07", "1.47 GiB"]].forEach(([d, sz], i) => {
    const y = 482 + i * 40;
    s += card(32, y, 416, 34, p, { r: 8, fill: p.soft, shadow: false });
    s += `<circle cx="50" cy="${y + 17}" r="3.5" fill="${i === 0 ? up : a}"/>`;
    s += T(64, y + 21, 10.5, p.ink, d, { mono: true });
    s += T(434, y + 21, 10, p.muted, sz, { mono: true, anchor: "end" });
  });
  s += `<circle cx="40" cy="618" r="4.5" fill="${up}"/>${T(52, 622, 10.5, up, tr("restauration testée ✓", "restore tested ✓"), { mono: true, w: "bold" })}`;
  return vframe(p, s, 656);
}

function labV(p) {
  const a = p.accent;
  let s = "";
  /* Texte en 14 px : en 11, les lignes les plus longues s'arrêtaient aux deux
     tiers du terminal et laissaient un vide à droite. */
  s += card(16, 12, 448, 472, p, { r: 14 });
  s += titlebar(16, 12, 448, p, "alexis@homelab : ~/lab", { r: 14, h: 32 });
  const L = (x, y, str, fill, o = {}) => T(x, y, 14, fill, str, { mono: true, ...o });
  const prompt = (y, cmd) => L(32, y, "alexis@homelab:~$", a, { w: "bold" }) + L(183, y, cmd, p.ink);

  s += prompt(76, "docker compose ps");
  s += L(32, 100, "NAME", p.muted) + L(214, 100, "STATUS", p.muted) + L(350, 100, "PORTS", p.muted);
  [["minecraft-server", "Up 6 days", "25565/tcp"], ["skyrim-server", "Up 3 days", "10578/udp"], ["subnautica-server", "Up 12 hours", "11000/udp"]]
    .forEach(([n, st, po], i) => {
      const y = 124 + i * 24;
      s += L(32, y, n, p.ink) + L(214, y, st, a) + L(350, y, po, p.muted);
    });

  s += prompt(208, "kubectl get nodes");
  s += L(32, 232, "NAME", p.muted) + L(136, 232, "STATUS", p.muted) + L(224, 232, "ROLES", p.muted) + L(398, 232, "AGE", p.muted);
  [["lab-cp1", "Ready", "control-plane", "14d"], ["lab-w1", "Ready", "worker", "14d"], ["lab-w2", "Ready", "worker", "14d"]]
    .forEach(([n, st, ro, ag], i) => {
      const y = 256 + i * 24;
      s += L(32, y, n, p.ink) + L(136, y, st, a) + L(224, y, ro, p.muted) + L(398, y, ag, p.muted);
    });

  s += prompt(340, "terraform apply -auto-approve");
  s += L(32, 364, "Apply complete! Resources: 3 added, 0 changed.", a);

  s += prompt(400, "ansible-playbook site.yml");
  s += L(32, 424, "PLAY RECAP", p.muted) + L(150, 424, "ok=18", a) + L(236, 424, "changed=3", p.ink) + L(360, 424, "failed=0", a);

  s += L(32, 460, "alexis@homelab:~$", a, { w: "bold" });
  return vframe(p, s, 500);
}

const VERTICAUX = {
  "web-clients": clientsV,
  portfolio: portfolioV,
  homelab: homelabV,
  dashboard: dashboardV,
  monitoring: monitoringV,
  reseau: reseauV,
  resilience: resilienceV,
  perso: labV,
};

const BUILDERS = {
  "web-clients": clients,
  portfolio,
  reseau,
  homelab,
  monitoring,
  resilience,
  dashboard,
  perso: lab,
};

function uniquify(svg, uid) {
  return svg
    .replace(/id="(dots|sh|thumb|arrowA|arrow)"/g, `id="${uid}-$1"`)
    .replace(/url\(#(dots|sh|thumb|arrowA|arrow)\)/g, `url(#${uid}-$1)`);
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
// Versions verticales (écrans étroits) : {thème}-v-{langue}.svg, ou
// {thème}-v.svg pour perso (terminal pur, sans texte traduisible)
for (const [name, build] of Object.entries(VERTICAUX)) {
  const dir = `src/assets/projects/${name}`;
  for (const [theme, palette] of [
    ["light", LIGHT],
    ["dark", DARK],
  ]) {
    for (const lang of NO_LANG.has(name) ? [null] : ["fr", "en"]) {
      const suffixe = lang ? `${theme}-v-${lang}` : `${theme}-v`;
      writeFileSync(
        `${dir}/${suffixe}.svg`,
        uniquify(build(palette, lang ?? "en"), `${name}-${suffixe}`),
      );
      console.log("ok", `${name}/${suffixe}.svg`);
    }
  }
}
console.log("done");
