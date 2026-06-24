// Copie les drapeaux SVG de country-flag-icons (dépendance de
// react-phone-number-input) vers public/flags/, pour les SERVIR depuis notre
// propre domaine au lieu de l'hôte tiers GitHub Pages (par défaut) — qui ajoutait
// une requête externe peu fiable. Lancé en predev/prebuild (cf. package.json).
import { mkdir, readdir, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "country-flag-icons", "3x2");
const dest = join(root, "public", "flags");

await mkdir(dest, { recursive: true });
const files = (await readdir(src)).filter((f) => f.endsWith(".svg"));
await Promise.all(files.map((f) => copyFile(join(src, f), join(dest, f))));
console.log(`copy-flags : ${files.length} drapeaux -> public/flags/`);
