// Configuration centralisée, lue depuis les variables d'environnement (.env).
import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export type DbEntry = {
  label: string;
  driver: "pg";
  urlEnv: string;
  crm?: boolean;
};

const here = dirname(fileURLToPath(import.meta.url));

// Registre des bases : le fichier déclare QUELLES bases existent, l'env fournit
// les URLs (secrets hors du dépôt). Une base déclarée sans URL en env est
// simplement ignorée (permet de versionner des entrées optionnelles).
const registry = JSON.parse(
  readFileSync(join(here, "..", "databases.json"), "utf8"),
) as { databases: Record<string, DbEntry> };

const databases: Record<string, DbEntry & { url: string }> = {};
for (const [name, entry] of Object.entries(registry.databases)) {
  const url = process.env[entry.urlEnv];
  if (url) databases[name] = { ...entry, url };
}

const crmDb = Object.keys(databases).find((n) => databases[n].crm);
if (!crmDb) {
  throw new Error(
    "Aucune base CRM configurée (databases.json: crm=true + URL en env).",
  );
}

export const config = {
  port: Number(process.env.PORT ?? 3002),
  host: process.env.HOST ?? "0.0.0.0",
  // hash bcrypt du mot de passe admin (générer via : npm run hash-password)
  adminPasswordHash: required("ADMIN_PASSWORD_HASH"),
  // secret de signature du cookie de session (64 car. aléatoires)
  sessionSecret: required("SESSION_SECRET"),
  sessionTtlHours: Number(process.env.SESSION_TTL_HOURS ?? 12),
  databases,
  crmDb,
};
