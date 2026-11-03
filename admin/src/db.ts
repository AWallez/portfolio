import pg from "pg";
import { config } from "./config";

const { Pool } = pg;

// Un pool par base déclarée (créé paresseusement au premier accès).
const pools = new Map<string, pg.Pool>();

// Object.hasOwn : `config.databases[nom]` prendrait aussi « constructor » pour une base.
export const baseDeclaree = (dbName: string) => Object.hasOwn(config.databases, dbName);

export function getPool(dbName: string): pg.Pool {
  if (!baseDeclaree(dbName)) throw new Error(`Base inconnue : ${dbName}`);
  const entry = config.databases[dbName];
  let pool = pools.get(dbName);
  if (!pool) {
    // max:3 — outil mono-utilisateur, inutile d'ouvrir plus de connexions
    pool = new Pool({
      connectionString: entry.url,
      max: 3,
      connectionTimeoutMillis: 5_000,
    });
    // sans écouteur, une connexion inactive coupée par PostgreSQL (redémarrage
    // du conteneur) fait tomber tout le process ; le pool la remplace seul
    pool.on("error", (err) => {
      console.error("PostgreSQL (%s) : connexion inactive perdue : %s", dbName, err.message);
    });
    pools.set(dbName, pool);
  }
  return pool;
}

// Pool de la base CRM (celle qui porte la table contacts).
export const crmPool = () => getPool(config.crmDb);

// Exécute une requête en transaction LECTURE SEULE : même si une requête
// d'écriture se glissait dans l'explorateur, PostgreSQL la refuserait.
export async function queryReadOnly<T extends pg.QueryResultRow>(
  dbName: string,
  sql: string,
  params: unknown[] = [],
): Promise<pg.QueryResult<T>> {
  const client = await getPool(dbName).connect();
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    const res = await client.query<T>(sql, params as never[]);
    await client.query("COMMIT");
    return res;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
