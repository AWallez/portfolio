import type { FastifyInstance, FastifyRequest } from "fastify";
import { config } from "../config";
import { queryReadOnly } from "../db";

// Explorateur générique : LECTURE SEULE, quelle que soit la base.
// Double garde-fou : requêtes construites uniquement côté serveur (le client ne
// fournit jamais de SQL) + transaction READ ONLY (PostgreSQL refuse toute écriture).

const dbParam = {
  type: "object",
  required: ["db"],
  properties: { db: { type: "string", maxLength: 100 } },
};

// Vérifie que la table demandée existe réellement dans la base (introspection),
// puis renvoie son nom sûr à interpoler (identifiant quoté).
async function resolveTable(db: string, table: string): Promise<string | null> {
  const res = await queryReadOnly<{ table_name: string }>(
    db,
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
        AND table_name = $1`,
    [table],
  );
  if (res.rowCount === 0) return null;
  return `"${res.rows[0].table_name.replaceAll(`"`, `""`)}"`;
}

export async function explorerRoutes(app: FastifyInstance) {
  // Bases déclarées dans databases.json (et dont l'URL est fournie en env).
  app.get("/api/explorer/dbs", async () =>
    Object.entries(config.databases).map(([name, e]) => ({
      name,
      label: e.label,
      crm: Boolean(e.crm),
    })),
  );

  // Tables du schéma public + estimation du nombre de lignes (pg_class :
  // instantané, contrairement à un count(*) par table).
  app.get(
    "/api/explorer/dbs/:db/tables",
    { schema: { params: dbParam } },
    async (req: FastifyRequest<{ Params: { db: string } }>, reply) => {
      if (!config.databases[req.params.db]) {
        return reply.code(404).send({ ok: false, error: "unknown_db" });
      }
      const res = await queryReadOnly(
        req.params.db,
        `SELECT t.table_name AS name,
                GREATEST(c.reltuples, 0)::bigint AS approx_rows
           FROM information_schema.tables t
           JOIN pg_class c ON c.relname = t.table_name
           JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
          WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
          ORDER BY t.table_name`,
      );
      return res.rows;
    },
  );

  // Lignes paginées d'une table (colonnes + données).
  app.get(
    "/api/explorer/dbs/:db/tables/:table/rows",
    {
      schema: {
        params: {
          type: "object",
          required: ["db", "table"],
          properties: {
            db: { type: "string", maxLength: 100 },
            table: { type: "string", maxLength: 200 },
          },
        },
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
            q: { type: "string", maxLength: 200 },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{
        Params: { db: string; table: string };
        Querystring: { page?: number; limit?: number; q?: string };
      }>,
      reply,
    ) => {
      const { db, table } = req.params;
      const { page = 1, limit = 25, q } = req.query;
      if (!config.databases[db]) {
        return reply.code(404).send({ ok: false, error: "unknown_db" });
      }
      const safeTable = await resolveTable(db, table);
      if (!safeTable) {
        return reply.code(404).send({ ok: false, error: "unknown_table" });
      }

      // Recherche générique : la ligne entière sérialisée en JSON, comparée en
      // ILIKE — marche sur n'importe quelle table sans connaître ses colonnes.
      // (Pas d'index possible, mais tables petites + outil mono-utilisateur.)
      const params: unknown[] = [];
      let where = "";
      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        where = ` WHERE to_jsonb(t)::text ILIKE $1`;
      }

      const [columns, total, rows] = await Promise.all([
        queryReadOnly(
          db,
          `SELECT column_name AS name, data_type AS type
             FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position`,
          [table],
        ),
        queryReadOnly<{ n: string }>(
          db,
          `SELECT count(*)::bigint AS n FROM ${safeTable} t${where}`,
          params,
        ),
        queryReadOnly(
          db,
          `SELECT t.* FROM ${safeTable} t${where}
            ORDER BY 1 DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
          params,
        ),
      ]);

      return {
        columns: columns.rows,
        rows: rows.rows,
        total: Number(total.rows[0].n),
        page,
        limit,
      };
    },
  );
}
