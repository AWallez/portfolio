// Applique le schéma SQL (idempotent) — à lancer une fois pour créer la table.
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";
import { pool } from "./db";

const here = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = await readFile(join(here, "..", "db", "schema.sql"), "utf8");
  await pool.query(sql);
  console.log("✓ Schéma appliqué — table 'contacts' prête.");
  await pool.end();
}

migrate().catch((err) => {
  console.error("✗ Échec de la migration :", err);
  process.exit(1);
});
