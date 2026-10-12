import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

// La CSP du site (infra/Caddyfile) n'autorise le script anti-flash d'index.html
// et l'attribut style du bloc <noscript> que par leur empreinte sha256. Modifier
// l'un sans recalculer l'autre bloquerait le script en production (thème qui
// clignote) sans qu'aucune autre vérification ne s'en aperçoive.
const lire = (chemin: string) =>
  readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), "utf8");
const html = lire("../../index.html");
const caddy = lire("../../../infra/Caddyfile");
const empreinte = (s: string) =>
  `'sha256-${createHash("sha256").update(s, "utf8").digest("base64")}'`;

describe("CSP (infra/Caddyfile) ↔ index.html", () => {
  it("autorise chaque script inline exécutable par son empreinte", () => {
    const scripts = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
      // src= : fichier externe ; ld+json : données, jamais exécutées
      .filter(([, attrs]) => !/\bsrc=|ld\+json/.test(attrs))
      .map(([, , corps]) => corps);
    expect(scripts.length).toBeGreaterThan(0);
    for (const s of scripts) expect(caddy).toContain(empreinte(s));
  });

  it("autorise chaque attribut style d'index.html par son empreinte", () => {
    const styles = [...html.matchAll(/ style="([^"]*)"/g)].map(([, v]) => v);
    for (const v of styles) expect(caddy).toContain(empreinte(v));
  });
});
