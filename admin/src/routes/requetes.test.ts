import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";

// Un faux pg qui note chaque requête : on regarde ce qui partirait vers
// PostgreSQL, sans base.
const faux = vi.hoisted(() => {
  const requetes: { sql: string; params?: unknown[] }[] = [];
  const query = async (sql: string, params?: unknown[]) => {
    requetes.push({ sql, params });
    return { rows: [{ n: 0, table_name: "contacts" }], rowCount: 1 };
  };
  class Pool {
    query = query;
    connect = async () => ({ query, release() {} });
    on() {}
  }
  return { requetes, Pool };
});
vi.mock("pg", () => ({ default: { Pool: faux.Pool } }));
vi.mock("../config", () => ({
  config: {
    databases: { crm: { label: "CRM", crm: true, url: "postgres://test" } },
    crmDb: "crm",
  },
}));

const { contactRoutes } = await import("./contacts");
const { explorerRoutes } = await import("./explorer");
const { getPool } = await import("../db");

async function monter() {
  const app = Fastify();
  await app.register(contactRoutes);
  await app.register(explorerRoutes);
  return app;
}

const lire = async (url: string) => (await monter()).inject({ method: "GET", url });

function requete(motif: string) {
  const r = faux.requetes.find((q) => q.sql.includes(motif));
  if (!r) throw new Error(`aucune requête avec « ${motif} »`);
  return r;
}

// délai large : le premier test paie le démarrage à froid de Fastify
describe("requêtes de l'admin", { timeout: 20_000 }, () => {
  beforeEach(() => {
    faux.requetes.length = 0;
  });

  it("liste des contacts : LIMIT et OFFSET partent en paramètres", async () => {
    const res = await lire("/api/contacts?page=3&limit=10");
    expect(res.statusCode).toBe(200);
    const r = requete("ORDER BY created_at");
    expect(r.sql).toContain("LIMIT $1 OFFSET $2");
    expect(r.params).toEqual([10, 20]);
  });

  it("liste des contacts : leurs numéros suivent ceux des filtres", async () => {
    const res = await lire("/api/contacts?status=non_lu&q=dupont&page=2&limit=5");
    expect(res.statusCode).toBe(200);
    const r = requete("ORDER BY created_at");
    expect(r.sql).toContain("LIMIT $3 OFFSET $4");
    expect(r.params).toEqual(["non_lu", "%dupont%", 5, 5]);
    // le comptage ne reçoit que les filtres
    expect(requete("count(*)::int AS n FROM contacts WHERE").params).toEqual(["non_lu", "%dupont%"]);
  });

  it("explorateur : LIMIT et OFFSET partent en paramètres", async () => {
    const res = await lire("/api/explorer/dbs/crm/tables/contacts/rows?page=2&limit=10");
    expect(res.statusCode).toBe(200);
    const r = requete("SELECT t.*");
    expect(r.sql).toContain("LIMIT $1 OFFSET $2");
    expect(r.params).toEqual([10, 10]);
  });

  it("explorateur : leurs numéros suivent celui de la recherche", async () => {
    const res = await lire("/api/explorer/dbs/crm/tables/contacts/rows?q=dupont&limit=10");
    expect(res.statusCode).toBe(200);
    const r = requete("SELECT t.*");
    expect(r.sql).toContain("LIMIT $2 OFFSET $3");
    expect(r.params).toEqual(["%dupont%", 10, 0]);
  });

  it("refuse une page au-delà du maximum, sans interroger la base", async () => {
    const res = await lire("/api/explorer/dbs/crm/tables/contacts/rows?page=10001");
    expect(res.statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it("refuse une limite qui n'est pas un entier", async () => {
    const res = await lire("/api/contacts?limit=1;DROP");
    expect(res.statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it("ne prend pas une propriété héritée pour une base déclarée", async () => {
    expect((await lire("/api/explorer/dbs/constructor/tables")).statusCode).toBe(404);
    expect((await lire("/api/explorer/dbs/constructor/tables/contacts/rows")).statusCode).toBe(404);
    expect(() => getPool("constructor")).toThrow("Base inconnue");
    expect(faux.requetes).toEqual([]);
  });
});
