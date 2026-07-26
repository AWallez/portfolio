import { describe, it, expect, vi, beforeEach } from "vitest";
import Fastify from "fastify";
import type { LightMyRequestResponse } from "fastify";
import rateLimit from "@fastify/rate-limit";

// Dépendances externes simulées : aucun PostgreSQL, aucun ntfy, aucun appel
// réseau vers Cloudflare. On teste la LOGIQUE de la route (validation, honeypot,
// anti-bot, enregistrement, notification non bloquante, rate-limit).
const query = vi.fn();
const notifyContact = vi.fn();
const verifyTurnstile = vi.fn();

vi.mock("../db", () => ({ pool: { query: (...a: unknown[]) => query(...a) } }));
vi.mock("../notifier", () => ({
  notifyContact: (...a: unknown[]) => notifyContact(...a),
}));
vi.mock("../turnstile", () => ({
  verifyTurnstile: (...a: unknown[]) => verifyTurnstile(...a),
}));

const { contactRoutes } = await import("./contact");

const VALID = {
  firstname: "Marie",
  lastname: "Dupont",
  email: "marie@example.com",
  type: "project",
  message: "Bonjour, j'aimerais un devis.",
};

async function buildApp() {
  const app = Fastify();
  await app.register(rateLimit, { global: false });
  await app.register(contactRoutes);
  return app;
}

// `payload: object` (et non `unknown`) + type de retour explicite : sans ça,
// TypeScript choisit la surcharge chaînable d'inject(), sur laquelle
// `statusCode` / `json()` n'existent pas.
const post = async (
  app: Awaited<ReturnType<typeof buildApp>>,
  payload: object,
): Promise<LightMyRequestResponse> =>
  await app.inject({ method: "POST", url: "/api/contact", payload });

beforeEach(() => {
  vi.clearAllMocks();
  query.mockResolvedValue({ rows: [] });
  notifyContact.mockResolvedValue(undefined);
  verifyTurnstile.mockResolvedValue(true);
});

describe("POST /api/contact", () => {
  it("enregistre le message et envoie la notification", async () => {
    const app = await buildApp();
    const res = await post(app, VALID);

    expect(res.statusCode).toBe(201);
    expect(query).toHaveBeenCalledTimes(1);
    expect(notifyContact).toHaveBeenCalledTimes(1);
    // les valeurs du formulaire partent bien en paramètres liés (anti-injection)
    const params = query.mock.calls[0][1] as string[];
    expect(params.slice(0, 4)).toEqual([
      VALID.firstname,
      VALID.lastname,
      VALID.email,
      VALID.type,
    ]);
  });

  it("normalise un téléphone vide en NULL", async () => {
    const app = await buildApp();
    const res = await post(app, { ...VALID, phone: "   " });

    expect(res.statusCode).toBe(201);
    expect((query.mock.calls[0][1] as unknown[])[4]).toBeNull();
  });

  describe("validation (JSON Schema)", () => {
    const cases: [string, object][] = [
      ["champ requis manquant", { ...VALID, message: undefined }],
      ["email invalide", { ...VALID, email: "pas-un-email" }],
      ["type hors énumération", { ...VALID, type: "spam" }],
      ["message vide", { ...VALID, message: "" }],
    ];

    it.each(cases)("refuse : %s", async (_label, payload) => {
      const app = await buildApp();
      const res = await post(app, payload);

      expect(res.statusCode).toBe(400);
      expect(query).not.toHaveBeenCalled();
      expect(notifyContact).not.toHaveBeenCalled();
    });
  });

  it("retire les propriétés inconnues au lieu de les enregistrer", async () => {
    const app = await buildApp();
    const res = await post(app, { ...VALID, isAdmin: true });

    // Fastify/AJV est configuré en `removeAdditional` : la propriété inconnue est
    // ÉLAGUÉE (pas de 400), donc elle n'atteint jamais la requête SQL.
    expect(res.statusCode).toBe(201);
    const params = query.mock.calls[0][1] as unknown[];
    expect(params).toHaveLength(8); // les 8 colonnes attendues, ni plus ni moins
    expect(params).not.toContain(true);
  });

  it("honeypot rempli : répond OK sans rien enregistrer ni notifier", async () => {
    const app = await buildApp();
    const res = await post(app, { ...VALID, company: "bot inc." });

    // 201 volontaire : le bot ne doit pas deviner qu'il a été filtré
    expect(res.statusCode).toBe(201);
    expect(query).not.toHaveBeenCalled();
    expect(notifyContact).not.toHaveBeenCalled();
  });

  it("anti-bot refusé : 400 et aucun enregistrement (fail-closed)", async () => {
    verifyTurnstile.mockResolvedValue(false);
    const app = await buildApp();
    const res = await post(app, VALID);

    expect(res.statusCode).toBe(400);
    expect(res.json()).toMatchObject({ error: "captcha" });
    expect(query).not.toHaveBeenCalled();
  });

  it("une notification en échec ne fait pas échouer la requête", async () => {
    notifyContact.mockRejectedValue(new Error("ntfy down"));
    const app = await buildApp();
    const res = await post(app, VALID);

    expect(res.statusCode).toBe(201);
    expect(query).toHaveBeenCalledTimes(1); // le message est bien enregistré
  });

  it("limite à 5 requêtes par minute et par IP", async () => {
    const app = await buildApp();
    for (let i = 0; i < 5; i++) {
      expect((await post(app, VALID)).statusCode).toBe(201);
    }
    expect((await post(app, VALID)).statusCode).toBe(429);
  });
});
