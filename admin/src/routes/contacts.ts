import type { FastifyInstance, FastifyRequest } from "fastify";
import { crmPool } from "../db";

// Statuts du pipeline CRM (validation applicative — la colonne reste TEXT).
export const STATUSES = [
  "non_lu",
  "en_attente",
  "a_recontacter",
  "valide",
  "annule",
] as const;
type Status = (typeof STATUSES)[number];

type ListQuery = {
  status?: Status;
  q?: string;
  page?: number;
  limit?: number;
};

type PatchBody = {
  status?: Status;
  note?: string | null;
  firstname?: string;
  lastname?: string;
  email?: string | null;
  phone?: string | null;
  type?: string;
  message?: string | null;
};

type CreateBody = {
  firstname: string;
  lastname: string;
  email?: string;
  phone?: string;
  // provenance d'un lead ajouté à la main (Malt, LinkedIn, téléphone…)
  type: string;
  message?: string;
  note?: string;
};

const idParam = {
  type: "object",
  required: ["id"],
  properties: { id: { type: "string", pattern: "^\\d+$" } },
};

export async function contactRoutes(app: FastifyInstance) {
  // Liste paginée + filtre statut + recherche plein texte simple.
  app.get(
    "/api/contacts",
    {
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            status: { type: "string", enum: [...STATUSES] },
            q: { type: "string", maxLength: 200 },
            page: { type: "integer", minimum: 1, default: 1 },
            limit: { type: "integer", minimum: 1, maximum: 100, default: 25 },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Querystring: ListQuery }>) => {
      const { status, q, page = 1, limit = 25 } = req.query;
      const where: string[] = [];
      const params: unknown[] = [];

      if (status) {
        params.push(status);
        where.push(`status = $${params.length}`);
      }
      if (q && q.trim()) {
        params.push(`%${q.trim()}%`);
        const p = `$${params.length}`;
        where.push(
          `(firstname ILIKE ${p} OR lastname ILIKE ${p} OR email ILIKE ${p} OR message ILIKE ${p})`,
        );
      }
      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const pool = crmPool();
      const [items, total, counts] = await Promise.all([
        pool.query(
          `SELECT id, firstname, lastname, email, type, phone, message,
                  status, note, created_at, updated_at, (ip IS NULL) AS manual
             FROM contacts ${whereSql}
            ORDER BY created_at DESC
            LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
          params,
        ),
        pool.query(`SELECT count(*)::int AS n FROM contacts ${whereSql}`, params),
        // compteurs globaux par statut (badges), indépendants du filtre courant
        pool.query(
          `SELECT status, count(*)::int AS n FROM contacts GROUP BY status`,
        ),
      ]);

      const byStatus: Record<string, number> = {};
      for (const s of STATUSES) byStatus[s] = 0;
      for (const row of counts.rows) byStatus[row.status] = row.n;

      return {
        items: items.rows,
        total: total.rows[0].n,
        page,
        limit,
        counts: byStatus,
      };
    },
  );

  // Types présents en base (alimente le menu déroulant, évolue avec les données).
  app.get("/api/contacts/types", async () => {
    const res = await crmPool().query<{ type: string }>(
      `SELECT DISTINCT type FROM contacts WHERE type IS NOT NULL AND type <> '' ORDER BY type`,
    );
    return res.rows.map((r) => r.type);
  });

  // Détail complet (inclut ip / user_agent, utiles pour repérer le spam).
  app.get(
    "/api/contacts/:id",
    { schema: { params: idParam } },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const res = await crmPool().query(
        `SELECT *, (ip IS NULL) AS manual FROM contacts WHERE id = $1`,
        [req.params.id],
      );
      if (res.rowCount === 0) {
        return reply.code(404).send({ ok: false, error: "not_found" });
      }
      return res.rows[0];
    },
  );

  // Mise à jour partielle : statut, note, et/ou n'importe quel champ du contact.
  app.patch(
    "/api/contacts/:id",
    {
      schema: {
        params: idParam,
        body: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            status: { type: "string", enum: [...STATUSES] },
            note: { type: ["string", "null"], maxLength: 5000 },
            firstname: { type: "string", minLength: 1, maxLength: 100 },
            lastname: { type: "string", minLength: 1, maxLength: 100 },
            // pattern JSON Schema : ignoré quand la valeur est null → un email
            // effacé (null) reste valide, un email non vide doit être bien formé
            email: {
              type: ["string", "null"],
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
              maxLength: 200,
            },
            phone: { type: ["string", "null"], maxLength: 40 },
            // type libre (la liste du front vient de SELECT DISTINCT en base)
            type: { type: "string", minLength: 1, maxLength: 60 },
            message: { type: ["string", "null"], maxLength: 5000 },
          },
        },
      },
    },
    async (
      req: FastifyRequest<{ Params: { id: string }; Body: PatchBody }>,
      reply,
    ) => {
      const sets: string[] = [];
      const params: unknown[] = [];
      // champs texte optionnels : chaîne vide = effacement (NULL)
      const NULLABLE = new Set(["note", "email", "phone", "message"]);
      for (const [key, raw] of Object.entries(req.body)) {
        if (raw === undefined) continue;
        const value = NULLABLE.has(key) && raw === "" ? null : raw;
        params.push(value);
        sets.push(`${key} = $${params.length}`);
      }
      params.push(req.params.id);

      const res = await crmPool().query(
        `UPDATE contacts SET ${sets.join(", ")}, updated_at = now()
          WHERE id = $${params.length}
          RETURNING *, (ip IS NULL) AS manual`,
        params,
      );
      if (res.rowCount === 0) {
        return reply.code(404).send({ ok: false, error: "not_found" });
      }
      return res.rows[0];
    },
  );

  app.delete(
    "/api/contacts/:id",
    { schema: { params: idParam } },
    async (req: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const res = await crmPool().query(`DELETE FROM contacts WHERE id = $1`, [
        req.params.id,
      ]);
      if (res.rowCount === 0) {
        return reply.code(404).send({ ok: false, error: "not_found" });
      }
      return reply.code(204).send();
    },
  );

  // Ajout manuel d'un lead (prospect venu de Malt, LinkedIn, téléphone…).
  // ip/user_agent restent NULL → c'est le marqueur « ajouté à la main ».
  app.post(
    "/api/contacts",
    {
      schema: {
        body: {
          type: "object",
          required: ["firstname", "lastname", "type"],
          additionalProperties: false,
          properties: {
            firstname: { type: "string", minLength: 1, maxLength: 100 },
            lastname: { type: "string", minLength: 1, maxLength: 100 },
            email: {
              type: "string",
              pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
              maxLength: 200,
            },
            phone: { type: "string", maxLength: 40 },
            // type libre (créer un nouveau type à la volée depuis le front)
            type: { type: "string", minLength: 1, maxLength: 60 },
            message: { type: "string", maxLength: 5000 },
            note: { type: "string", maxLength: 5000 },
          },
        },
      },
    },
    async (req: FastifyRequest<{ Body: CreateBody }>, reply) => {
      const b = req.body;
      const res = await crmPool().query(
        `INSERT INTO contacts (firstname, lastname, email, type, phone, message, note, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'non_lu')
         RETURNING *, (ip IS NULL) AS manual`,
        [
          b.firstname,
          b.lastname,
          b.email ?? null,
          b.type,
          b.phone?.trim() || null,
          b.message ?? null,
          b.note ?? null,
        ],
      );
      return reply.code(201).send(res.rows[0]);
    },
  );
}
