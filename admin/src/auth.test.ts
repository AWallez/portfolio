import { describe, expect, it, vi } from "vitest";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import bcrypt from "bcryptjs";

// mot de passe « correct-horse » haché à coût bas (test rapide)
const cfg = vi.hoisted(() => ({
  config: { adminPasswordHash: "", sessionTtlHours: 12 },
}));
cfg.config.adminPasswordHash = bcrypt.hashSync("correct-horse", 4);
vi.mock("./config", () => cfg);

const { authRoutes, requireAuth } = await import("./auth");

async function monter() {
  const app = Fastify();
  await app.register(cookie, { secret: "secret-de-test-assez-long-0123456789" });
  await app.register(rateLimit, { global: false });
  await app.register(authRoutes);
  // une route protégée, comme celles du CRM
  await app.register(async (protege) => {
    protege.addHook("preHandler", requireAuth);
    protege.get("/api/contacts", async () => ({ ok: true }));
  });
  return app;
}

type App = Awaited<ReturnType<typeof monter>>;

async function connexion(app: App, password: string) {
  return app.inject({ method: "POST", url: "/api/login", payload: { password } });
}

// valeur à renvoyer dans l'en-tête Cookie (nom=valeur, sans les attributs)
const cookieDe = (setCookie: string | string[] | undefined) =>
  String(Array.isArray(setCookie) ? setCookie[0] : setCookie).split(";")[0];

const contacts = (app: App, c?: string) =>
  app.inject({
    method: "GET",
    url: "/api/contacts",
    headers: c ? { cookie: c } : {},
  });

// délai large : le premier test paie le démarrage à froid (Fastify, bcrypt)
describe("authentification du CRM", { timeout: 20_000 }, () => {
  it("refuse un mauvais mot de passe", async () => {
    const app = await monter();
    const res = await connexion(app, "faux");
    expect(res.statusCode).toBe(401);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("pose un cookie de session __Host-, HttpOnly, Secure, SameSite=Strict", async () => {
    const app = await monter();
    const res = await connexion(app, "correct-horse");
    expect(res.statusCode).toBe(200);
    const sc = String(res.headers["set-cookie"]);
    expect(sc).toMatch(/^__Host-admin_session=/);
    expect(sc).toMatch(/HttpOnly/);
    expect(sc).toMatch(/Secure/);
    expect(sc).toMatch(/SameSite=Strict/);
    expect(sc).toMatch(/Path=\//);
  });

  it("ouvre les routes protégées avec la session, et seulement avec elle", async () => {
    const app = await monter();
    const c = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    expect((await contacts(app)).statusCode).toBe(401);
    expect((await contacts(app, c)).statusCode).toBe(200);
    const me = await app.inject({ method: "GET", url: "/api/me", headers: { cookie: c } });
    expect(me.json()).toEqual({ ok: true });
  });

  it("révoque la session à la déconnexion : une copie du cookie ne sert plus", async () => {
    const app = await monter();
    const c = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    await app.inject({ method: "POST", url: "/api/logout", headers: { cookie: c } });
    expect((await contacts(app, c)).statusCode).toBe(401);
  });

  it("refuse un cookie falsifié", async () => {
    const app = await monter();
    const c = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    const falsifie = c.replace(/.$/, (x) => (x === "A" ? "B" : "A"));
    expect((await contacts(app, falsifie)).statusCode).toBe(401);
  });

  it("limite les essais de mot de passe à 5 par minute", async () => {
    const app = await monter();
    for (let i = 0; i < 5; i++) expect((await connexion(app, "faux")).statusCode).toBe(401);
    expect((await connexion(app, "faux")).statusCode).toBe(429);
  });
});
