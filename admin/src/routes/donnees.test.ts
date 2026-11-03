import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";

// Faux pg : chaque requête est notée avec sa provenance (pool direct, ou client
// numéroté obtenu par connect()), et la réponse peut être choisie par test.
type Requete = { via: string; sql: string; params?: unknown[] };
type Reponse = { rows: unknown[]; rowCount: number };
const faux = vi.hoisted(() => {
  const requetes: Requete[] = [];
  const parDefaut = (sql: string): Reponse => {
    void sql;
    return { rows: [{ n: 0, table_name: "contacts" }], rowCount: 1 };
  };
  const etat = { repondre: parDefaut, clients: 0 };
  const executer = (via: string) => async (sql: string, params?: unknown[]) => {
    requetes.push({ via, sql, params });
    return etat.repondre(sql);
  };
  class Pool {
    query = executer("pool");
    connect = async () => {
      const via = `client${++etat.clients}`;
      return { query: executer(via), release() {} };
    };
    on() {}
  }
  return { requetes, Pool, etat, parDefaut };
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

async function monter() {
  const app = Fastify();
  await app.register(contactRoutes);
  await app.register(explorerRoutes);
  return app;
}

type Methode = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
const appeler = async (method: Methode, url: string, payload?: unknown) =>
  (await monter()).inject({ method, url, payload: payload as object | undefined });

const ECRITURE = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT)\b/i;

describe("contacts : validation des entrées", { timeout: 20_000 }, () => {
  beforeEach(() => {
    faux.requetes.length = 0;
    faux.etat.repondre = faux.parDefaut;
  });

  it.each([
    ["status inconnu", "/api/contacts?status=supprime"],
    ["page nulle", "/api/contacts?page=0"],
    ["limite au-delà de 100", "/api/contacts?limit=101"],
    ["recherche trop longue", `/api/contacts?q=${"a".repeat(201)}`],
  ])("liste : refuse %s, sans requête", async (_, url) => {
    expect((await appeler("GET", url)).statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it("liste : un paramètre inconnu est écarté, il n'atteint pas le SQL", async () => {
    expect((await appeler("GET", "/api/contacts?tri=email&sql=DROP")).statusCode).toBe(200);
    for (const r of faux.requetes) expect(r.sql + JSON.stringify(r.params)).not.toMatch(/tri|DROP/);
  });

  it.each(["abc", "1;DROP", "-1", "1.5"])("refuse l'identifiant « %s »", async (id) => {
    const url = `/api/contacts/${encodeURIComponent(id)}`;
    expect((await appeler("GET", url)).statusCode).toBe(400);
    expect((await appeler("DELETE", url)).statusCode).toBe(400);
    expect((await appeler("PATCH", url, { status: "valide" })).statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it.each([
    ["sans prénom", { lastname: "B", type: "Malt" }],
    ["sans type", { firstname: "A", lastname: "B" }],
    ["prénom vide", { firstname: "", lastname: "B", type: "Malt" }],
    ["email mal formé", { firstname: "A", lastname: "B", type: "Malt", email: "pas-un-email" }],
    ["message trop long", { firstname: "A", lastname: "B", type: "Malt", message: "x".repeat(5001) }],
  ])("création : refuse %s, sans requête", async (_, corps) => {
    expect((await appeler("POST", "/api/contacts", corps)).statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it("création : statut et origine imposés par le serveur, champs inconnus écartés", async () => {
    const res = await appeler("POST", "/api/contacts", {
      firstname: "A",
      lastname: "B",
      type: "Malt",
      phone: "   ",
      status: "valide",
      manual: false,
    });
    expect(res.statusCode).toBe(201);
    const r = faux.requetes.find((q) => q.sql.includes("INSERT INTO contacts"))!;
    expect(r.sql).toContain("'non_lu', true");
    // téléphone blanc → NULL ; status/manual du client ne partent nulle part
    expect(r.params).toEqual(["A", "B", null, "Malt", null, null, null]);
  });

  it.each([
    ["corps vide", {}],
    ["status inconnu", { status: "supprime" }],
    ["prénom vide", { firstname: "" }],
    ["email mal formé", { email: "a@b" }],
    ["note trop longue", { note: "x".repeat(5001) }],
  ])("mise à jour : refuse %s, sans requête", async (_, corps) => {
    expect((await appeler("PATCH", "/api/contacts/1", corps)).statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it("mise à jour : un corps fait seulement de champs inconnus est refusé", async () => {
    const res = await appeler("PATCH", "/api/contacts/1", { x: 1 });
    expect(res.statusCode).toBe(400);
    expect(res.json()).toEqual({ ok: false, error: "empty_update" });
    expect(faux.requetes).toEqual([]);
  });

  it("mise à jour : seuls les champs du schéma deviennent des colonnes", async () => {
    const res = await appeler("PATCH", "/api/contacts/7", {
      status: "valide",
      "id = 1; DROP TABLE contacts; --": "x",
      manual: true,
    });
    expect(res.statusCode).toBe(200);
    const [r] = faux.requetes;
    expect(r.sql).toMatch(/SET status = \$1, updated_at = now\(\)\s+WHERE id = \$2/);
    expect(r.params).toEqual(["valide", "7"]);
  });

  it("mise à jour : chaîne vide ou null effacent les champs facultatifs", async () => {
    const res = await appeler("PATCH", "/api/contacts/1", { email: null, phone: "", note: "" });
    expect(res.statusCode).toBe(200);
    expect(faux.requetes[0].params).toEqual([null, null, null, "1"]);
  });

  it("mise à jour : un email non vide doit rester bien formé", async () => {
    for (const email of [" ", "a@b", "a b@c.fr", "@c.fr"]) {
      expect((await appeler("PATCH", "/api/contacts/1", { email })).statusCode, email).toBe(400);
    }
    expect(faux.requetes).toEqual([]);
  });

  it("contact absent : 404 en lecture, mise à jour et suppression", async () => {
    faux.etat.repondre = () => ({ rows: [], rowCount: 0 });
    expect((await appeler("GET", "/api/contacts/9")).statusCode).toBe(404);
    expect((await appeler("PATCH", "/api/contacts/9", { status: "valide" })).statusCode).toBe(404);
    expect((await appeler("DELETE", "/api/contacts/9")).statusCode).toBe(404);
  });

  it("suppression : l'identifiant part en paramètre", async () => {
    expect((await appeler("DELETE", "/api/contacts/42")).statusCode).toBe(204);
    expect(faux.requetes).toEqual([{ via: "pool", sql: "DELETE FROM contacts WHERE id = $1", params: ["42"] }]);
  });
});

describe("explorateur : strictement en lecture seule", { timeout: 20_000 }, () => {
  beforeEach(() => {
    faux.requetes.length = 0;
    faux.etat.repondre = faux.parDefaut;
  });

  // Chaque requête de l'explorateur doit passer par un client dédié, ouvert en
  // transaction READ ONLY, puis refermée — jamais par le pool en direct.
  function verifierLectureSeule() {
    expect(faux.requetes.length).toBeGreaterThan(0);
    const parClient = new Map<string, string[]>();
    for (const { via, sql } of faux.requetes) {
      expect(via, sql).not.toBe("pool");
      parClient.set(via, [...(parClient.get(via) ?? []), sql]);
    }
    for (const sqls of parClient.values()) {
      expect(sqls[0]).toBe("BEGIN TRANSACTION READ ONLY");
      expect(sqls).toHaveLength(3);
      expect(["COMMIT", "ROLLBACK"]).toContain(sqls[2]);
      expect(sqls[1]).not.toMatch(ECRITURE);
    }
  }

  it.each([
    "/api/explorer/dbs/crm/tables",
    "/api/explorer/dbs/crm/tables/contacts/rows",
    "/api/explorer/dbs/crm/tables/contacts/rows?q=dupont&page=2",
  ])("GET %s : tout passe en transaction READ ONLY", async (url) => {
    expect((await appeler("GET", url)).statusCode).toBe(200);
    verifierLectureSeule();
  });

  it("la liste des bases ne touche aucune base et ne livre pas les URL", async () => {
    const res = await appeler("GET", "/api/explorer/dbs");
    expect(res.json()).toEqual([{ name: "crm", label: "CRM", crm: true }]);
    expect(res.body).not.toContain("postgres://");
    expect(faux.requetes).toEqual([]);
  });

  it.each(["POST", "PUT", "PATCH", "DELETE"] as const)("aucune route %s", async (method) => {
    for (const url of [
      "/api/explorer/dbs",
      "/api/explorer/dbs/crm/tables",
      "/api/explorer/dbs/crm/tables/contacts/rows",
    ]) {
      expect((await appeler(method, url, {})).statusCode, url).toBe(404);
    }
    expect(faux.requetes).toEqual([]);
  });

  it("une table inexistante : 404, aucune lecture de données", async () => {
    faux.etat.repondre = () => ({ rows: [], rowCount: 0 });
    const res = await appeler("GET", "/api/explorer/dbs/crm/tables/contacts;DROP/rows");
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ ok: false, error: "unknown_table" });
    // seule la vérification d'existence est partie, le nom en paramètre
    const sansTransaction = faux.requetes.filter((q) => !/^(BEGIN|COMMIT|ROLLBACK)/.test(q.sql));
    expect(sansTransaction).toHaveLength(1);
    expect(sansTransaction[0].params).toEqual(["contacts;DROP"]);
    verifierLectureSeule();
  });

  it("le nom de table interpolé est celui de la base, guillemets doublés", async () => {
    faux.etat.repondre = (sql) =>
      sql.includes("information_schema.tables")
        ? { rows: [{ table_name: 'a"b' }], rowCount: 1 }
        : { rows: [{ n: "0" }], rowCount: 1 };
    expect((await appeler("GET", "/api/explorer/dbs/crm/tables/x/rows")).statusCode).toBe(200);
    const r = faux.requetes.find((q) => q.sql.includes("SELECT t.*"))!;
    expect(r.sql).toContain(`FROM "a""b" t`);
  });

  it("la recherche part en paramètre, jamais dans le SQL", async () => {
    const q = "'; DELETE FROM contacts; --";
    const url = `/api/explorer/dbs/crm/tables/contacts/rows?q=${encodeURIComponent(q)}`;
    expect((await appeler("GET", url)).statusCode).toBe(200);
    for (const r of faux.requetes) expect(r.sql).not.toContain("DELETE");
    expect(faux.requetes.find((r) => r.sql.includes("SELECT t.*"))!.params![0]).toBe(`%${q}%`);
  });

  it("une erreur PostgreSQL annule la transaction", async () => {
    faux.etat.repondre = (sql) => {
      if (sql.includes("pg_class")) throw new Error("panne");
      return faux.parDefaut(sql);
    };
    expect((await appeler("GET", "/api/explorer/dbs/crm/tables")).statusCode).toBe(500);
    expect(faux.requetes.map((r) => r.sql.split("\n")[0].trim())).toEqual([
      "BEGIN TRANSACTION READ ONLY",
      "SELECT t.table_name AS name,",
      "ROLLBACK",
    ]);
  });

  it.each([
    ["page au-delà du maximum", "?page=10001"],
    ["limite au-delà de 100", "?limit=101"],
  ])("refuse %s, sans requête", async (_, qs) => {
    expect((await appeler("GET", `/api/explorer/dbs/crm/tables/contacts/rows${qs}`)).statusCode).toBe(400);
    expect(faux.requetes).toEqual([]);
  });

  it("un paramètre inconnu est écarté, il n'atteint pas le SQL", async () => {
    const url = "/api/explorer/dbs/crm/tables/contacts/rows?sql=DROP%20TABLE%20contacts";
    expect((await appeler("GET", url)).statusCode).toBe(200);
    for (const r of faux.requetes) expect(r.sql + JSON.stringify(r.params)).not.toContain("DROP");
    verifierLectureSeule();
  });

  it("base inconnue : 404, sans requête", async () => {
    expect((await appeler("GET", "/api/explorer/dbs/autre/tables")).statusCode).toBe(404);
    expect((await appeler("GET", "/api/explorer/dbs/autre/tables/contacts/rows")).statusCode).toBe(404);
    expect(faux.requetes).toEqual([]);
  });
});
