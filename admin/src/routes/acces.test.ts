import { beforeEach, describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import bcrypt from "bcryptjs";

// Montage identique à server.ts (garde `onRequest` sur les routes du CRM), avec
// un faux pg qui note chaque requête : on vérifie qu'un visiteur sans session
// n'atteint jamais la base.
const faux = vi.hoisted(() => {
  const requetes: string[] = [];
  const query = async (sql: string) => {
    requetes.push(sql);
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

const cfg = vi.hoisted(() => ({
  config: {
    adminPasswordHash: "",
    sessionTtlHours: 12,
    databases: { crm: { label: "CRM", crm: true, url: "postgres://test" } },
    crmDb: "crm",
  },
}));
cfg.config.adminPasswordHash = bcrypt.hashSync("correct-horse", 4);
vi.mock("../config", () => cfg);

const { authRoutes, requireAuth } = await import("../auth");
const { contactRoutes } = await import("./contacts");
const { explorerRoutes } = await import("./explorer");

async function monter() {
  const app = Fastify();
  await app.register(cookie, { secret: "secret-de-test-assez-long-0123456789" });
  await app.register(rateLimit, { global: false });
  await app.register(authRoutes);
  await app.register(async (secured) => {
    secured.addHook("onRequest", requireAuth);
    await secured.register(contactRoutes);
    await secured.register(explorerRoutes);
  });
  return app;
}

type Methode = "GET" | "POST" | "PATCH" | "DELETE";
const ROUTES: [Methode, string, object?][] = [
  ["GET", "/api/contacts"],
  ["GET", "/api/contacts/types"],
  ["GET", "/api/contacts/1"],
  ["PATCH", "/api/contacts/1", { status: "valide" }],
  ["DELETE", "/api/contacts/1"],
  ["POST", "/api/contacts", { firstname: "A", lastname: "B", type: "Malt" }],
  ["GET", "/api/explorer/dbs"],
  ["GET", "/api/explorer/dbs/crm/tables"],
  ["GET", "/api/explorer/dbs/crm/tables/contacts/rows"],
];

const cookieDe = (sc: string | string[] | undefined) =>
  String(Array.isArray(sc) ? sc[0] : sc).split(";")[0];

describe("accès aux routes du CRM", { timeout: 20_000 }, () => {
  beforeEach(() => {
    faux.requetes.length = 0;
  });

  it.each(ROUTES)("%s %s : 401 sans session, sans toucher la base", async (method, url, payload) => {
    const app = await monter();
    const res = await app.inject({ method, url, payload });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ ok: false, error: "unauthorized" });
    expect(faux.requetes).toEqual([]);
  });

  it.each(ROUTES)("%s %s : passe avec une session", async (method, url, payload) => {
    const app = await monter();
    const login = await app.inject({ method: "POST", url: "/api/login", payload: { password: "correct-horse" } });
    const res = await app.inject({ method, url, payload, headers: { cookie: cookieDe(login.headers["set-cookie"]) } });
    expect(res.statusCode).toBeLessThan(300);
  });

  it("sans session, un corps invalide reçoit 401 et non l'erreur de schéma", async () => {
    const app = await monter();
    const res = await app.inject({ method: "POST", url: "/api/contacts", payload: { inconnu: 1 } });
    expect(res.statusCode).toBe(401);
    expect(res.body).not.toMatch(/firstname|required/);
  });

  it("refuse toutes les routes après la déconnexion", async () => {
    const app = await monter();
    const login = await app.inject({ method: "POST", url: "/api/login", payload: { password: "correct-horse" } });
    const c = cookieDe(login.headers["set-cookie"]);
    await app.inject({ method: "POST", url: "/api/logout", headers: { cookie: c } });
    faux.requetes.length = 0;
    for (const [method, url, payload] of ROUTES) {
      const res = await app.inject({ method, url, payload, headers: { cookie: c } });
      expect(res.statusCode, `${method} ${url}`).toBe(401);
    }
    expect(faux.requetes).toEqual([]);
  });

  it("refuse toutes les routes une fois la session expirée", async () => {
    const app = await monter();
    const login = await app.inject({ method: "POST", url: "/api/login", payload: { password: "correct-horse" } });
    const c = cookieDe(login.headers["set-cookie"]);
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(Date.now() + 12 * 3600 * 1000);
      faux.requetes.length = 0;
      for (const [method, url, payload] of ROUTES) {
        const res = await app.inject({ method, url, payload, headers: { cookie: c } });
        expect(res.statusCode, `${method} ${url}`).toBe(401);
      }
      expect(faux.requetes).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
