// Variante sombre d'un CV : remap des 6 couleurs de la charte, en une passe.
//
//   node branding/cv-dark.mjs public/cv-alexis-wallez.svg public/cv-alexis-wallez-dark.svg
//
// Les SVG des CV sont produits par `pdftocairo -svg` (cf. branding/README.md),
// qui écrit les couleurs en pourcentages haute précision. La version sombre
// n'est pas une re-génération : c'est le MÊME fichier avec 6 couleurs
// substituées. D'où la table ci-dessous, qui doit rester synchronisée avec les
// tokens de src/index.css.
//
// ⚠️ Cette table avait été perdue une fois (elle ne vivait que dans un script
// PowerShell jamais versionné) et a dû être reconstituée en comparant un SVG
// clair et son homologue sombre. Elle est ici pour de bon.

import { readFileSync, writeFileSync } from "node:fs";

const MAP = {
  "rgb(7.841492%, 19.607544%, 23.136902%)": "rgb(90.196%, 92.941%, 94.902%)", // --ink
  "rgb(4.31366%, 49.01886%, 44.313049%)": "rgb(7.843%, 72.157%, 65.098%)", // --accent
  "rgb(35.68573%, 44.313049%, 47.058105%)": "rgb(56.078%, 63.922%, 65.882%)", // --muted
  "rgb(5.488586%, 60.783386%, 54.901123%)": "rgb(21.569%, 76.863%, 69.412%)", // accent clair
  "rgb(22.744751%, 31.764221%, 34.117126%)": "rgb(76.863%, 81.569%, 83.137%)", // filets
  "rgb(81.175232%, 90.586853%, 88.233948%)": "rgb(8.627%, 13.725%, 16.863%)", // --base
};
// Volontairement NON remappés, comme dans les fichiers d'origine :
// `rgb(84.70459%, 90.194702%, 88.626099%)` (filet clair, lisible sur les deux
// fonds) et `rgb(0%, 0%, 0%)`.

const [src, dst] = process.argv.slice(2);
if (!src || !dst) {
  console.error("usage: node branding/cv-dark.mjs <source.svg> <sortie.svg>");
  process.exit(1);
}

// Une seule passe, pas de substitutions successives : la cible d'une règle
// pourrait sinon être re-capturée par la source d'une autre.
const re = new RegExp(
  Object.keys(MAP)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

let hits = 0;
writeFileSync(
  dst,
  readFileSync(src, "utf8").replace(re, (m) => (hits++, MAP[m])),
);
console.log(`ok ${dst} — ${hits} couleurs remplacées`);
