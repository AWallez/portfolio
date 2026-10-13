// Pré-rendu du premier écran, dernière étape de `npm run build` : inscrit
// dans dist/index.html le HTML de l'en-tête, du Hero et d'À propos, rendu par
// src/prerender.ts (compilé juste avant par `vite build --ssr`).
//
// Sans lui, la page reste vide tant que le JavaScript n'a pas été téléchargé
// et exécuté (premier affichage à 2,7 s sur téléphone selon Lighthouse). Avec
// lui, le navigateur affiche ce premier écran dès l'arrivée du CSS ; React le
// remplace ensuite par la page vivante, identique à cet instant.
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SORTIE_SSR = "dist-prerender";
const INDEX = "dist/index.html";
const VIDE = '<div id="root"></div>';

const { premierEcran } = await import(
  pathToFileURL(resolve(SORTIE_SSR, "prerender.js")).href
);
let html = premierEcran();

// Attributs style retirés : la CSP n'autorise aucun style en ligne dans le
// HTML (ceux que React pose ensuite en JavaScript ne sont pas concernés). Ils
// ne servent qu'aux animations, sans effet avant le JavaScript.
const styles = [...new Set(html.match(/ style="[^"]*"/g) ?? [])];
html = html.replace(/ style="[^"]*"/g, "");

const page = readFileSync(INDEX, "utf8");
if (!page.includes(VIDE))
  throw new Error(`prerender : ${VIDE} introuvable dans ${INDEX}`);
writeFileSync(INDEX, page.replace(VIDE, `<div id="root">${html}</div>`));
rmSync(SORTIE_SSR, { recursive: true, force: true });

console.log(`prerender : ${html.length} caractères inscrits dans ${INDEX}`);
for (const s of styles) console.log(`prerender : style en ligne retiré :${s}`);
