import pg from "pg";
import { config } from "./config";

// pool de connexions PostgreSQL (réutilise les connexions, plus performant)
const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl,
  // une base injoignable doit échouer vite, pas faire attendre le visiteur
  connectionTimeoutMillis: 5_000,
  query_timeout: 10_000,
});

// Sans écouteur, une connexion inactive coupée par PostgreSQL (redémarrage du
// conteneur par compose-auto-update, par exemple) émet une erreur non gérée qui
// fait tomber tout le process. Le pool remplace la connexion tout seul.
pool.on("error", (err) => {
  console.error("PostgreSQL : connexion inactive perdue :", err.message);
});
