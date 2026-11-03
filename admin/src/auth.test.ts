import { afterEach, describe, expect, it, vi } from "vitest";
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

  it("refuse une session expirée, et l'oublie", async () => {
    const app = await monter();
    const c = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(Date.now() + 12 * 3600 * 1000 - 1000);
    expect((await contacts(app, c)).statusCode).toBe(200);
    vi.setSystemTime(Date.now() + 2000);
    expect((await contacts(app, c)).statusCode).toBe(401);
    const me = await app.inject({ method: "GET", url: "/api/me", headers: { cookie: c } });
    expect(me.json()).toEqual({ ok: false });
    // revenir avant l'échéance ne la ressuscite pas : elle a été effacée
    vi.setSystemTime(Date.now() - 3600 * 1000);
    expect((await contacts(app, c)).statusCode).toBe(401);
  });

  it("refuse un identifiant de session non signé, même authentique", async () => {
    const app = await monter();
    const c = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    // valeur signée = id.signature (encodée) : on retire la signature
    const [nom, valeur] = c.split("=");
    const id = decodeURIComponent(valeur).replace(/\.[^.]*$/, "");
    expect(app.signCookie(id)).toBe(decodeURIComponent(valeur)); // c'est bien le vrai id
    expect((await contacts(app, `${nom}=${id}`)).statusCode).toBe(401);
    expect((await contacts(app, c)).statusCode).toBe(200);
  });

  it("refuse un cookie signé dont la session n'a jamais existé", async () => {
    const app = await monter();
    const forge = app.signCookie("identifiant-invente");
    expect((await contacts(app, `__Host-admin_session=${encodeURIComponent(forge)}`)).statusCode).toBe(401);
  });

  it("chaque connexion a sa session : la déconnexion de l'une laisse l'autre", async () => {
    const app = await monter();
    const a = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    const b = cookieDe((await connexion(app, "correct-horse")).headers["set-cookie"]);
    expect(a).not.toBe(b);
    await app.inject({ method: "POST", url: "/api/logout", headers: { cookie: a } });
    expect((await contacts(app, a)).statusCode).toBe(401);
    expect((await contacts(app, b)).statusCode).toBe(200);
  });

  it("déconnexion sans session : réponse normale, cookie effacé", async () => {
    const app = await monter();
    const res = await app.inject({ method: "POST", url: "/api/logout" });
    expect(res.statusCode).toBe(200);
    expect(String(res.headers["set-cookie"])).toMatch(/^__Host-admin_session=;/);
  });

  it("valide le corps de /api/login", async () => {
    const app = await monter();
    const post = (payload: unknown) =>
      app.inject({ method: "POST", url: "/api/login", payload: payload as object });
    expect((await post({})).statusCode).toBe(400);
    expect((await post({ password: "x".repeat(201) })).statusCode).toBe(400);
  });

  it("limite les essais de mot de passe à 5 par minute", async () => {
    const app = await monter();
    for (let i = 0; i < 5; i++) expect((await connexion(app, "faux")).statusCode).toBe(401);
    expect((await connexion(app, "faux")).statusCode).toBe(429);
  });

  it("le bon mot de passe est lui aussi bloqué une fois la limite atteinte", async () => {
    const app = await monter();
    for (let i = 0; i < 5; i++) await connexion(app, "faux");
    const res = await connexion(app, "correct-horse");
    expect(res.statusCode).toBe(429);
    expect(res.headers["set-cookie"]).toBeUndefined();
  });

  it("compte les essais par adresse IP", async () => {
    const app = await monter();
    const depuis = (ip: string) =>
      app.inject({ method: "POST", url: "/api/login", remoteAddress: ip, payload: { password: "faux" } });
    for (let i = 0; i < 5; i++) await depuis("203.0.113.1");
    expect((await depuis("203.0.113.1")).statusCode).toBe(429);
    expect((await depuis("203.0.113.2")).statusCode).toBe(401);
  });

  it("rouvre les essais une fois la minute écoulée", async () => {
    vi.useFakeTimers({ toFake: ["Date", "setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    const app = await monter();
    for (let i = 0; i < 5; i++) await connexion(app, "faux");
    expect((await connexion(app, "faux")).statusCode).toBe(429);
    vi.advanceTimersByTime(61_000);
    expect((await connexion(app, "faux")).statusCode).toBe(401);
  });
});

afterEach(() => {
  vi.useRealTimers();
});
