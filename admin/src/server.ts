import Fastify, { type FastifyError } from "fastify";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import process from "node:process";
import { config } from "./config";
import { authRoutes, requireAuth } from "./auth";
import { contactRoutes } from "./routes/contacts";
import { explorerRoutes } from "./routes/explorer";

const here = dirname(fileURLToPath(import.meta.url));

// Outil interne servi par Caddy (crm.alexiswallez.fr), réseau local et VPN
// seulement. trustProxy sur les proxys internes, comme l'API : sans lui, toutes
// les requêtes viendraient de l'IP de Caddy et partageraient un seul compteur
// anti-brute-force sur /api/login.
const app = Fastify({
  logger: true,
  trustProxy: ["loopback", "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"],
});

await app.register(cookie, { secret: config.sessionSecret });
await app.register(rateLimit, { global: false }); // activé route par route

// En-têtes de sécurité : l'admin n'en envoyait aucun. Pas de cadre (anti
// clickjacking), pas de devinette de type, pas de Referer vers l'extérieur, et
// aucune réponse de l'API gardée en cache (elles contiennent les contacts).
app.addHook("onSend", async (req, reply, payload) => {
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("X-Frame-Options", "DENY");
  reply.header("Referrer-Policy", "no-referrer");
  if (req.url.startsWith("/api/")) reply.header("Cache-Control", "no-store");
  return payload;
});

// Réponses d'erreur génériques : un PATCH mal formé renvoyait le message SQL
// complet dans le corps du 500. Le détail ne va que dans le journal.
app.setErrorHandler((err: FastifyError, req, reply) => {
  const status =
    err.statusCode && err.statusCode >= 400 && err.statusCode < 500
      ? err.statusCode
      : 500;
  if (status === 500) req.log.error({ err }, "erreur interne");
  const error =
    status === 429
      ? "rate_limited"
      : err.validation
        ? "invalid"
        : status === 500
          ? "internal"
          : "bad_request";
  return reply.code(status).send({ ok: false, error });
});

app.get("/api/health", { logLevel: "warn" }, async () => ({ status: "ok" }));
await app.register(authRoutes);

// Tout le reste de l'API est derrière la session. `onRequest` et non
// `preHandler` : la session est vérifiée AVANT la validation du corps, sinon
// un visiteur non connecté lisait les erreurs de schéma (noms des champs…).
await app.register(async (secured) => {
  secured.addHook("onRequest", requireAuth);
  await secured.register(contactRoutes);
  await secured.register(explorerRoutes);
});

// Sert le build du front (web/dist) + fallback SPA pour les routes client.
await app.register(fastifyStatic, {
  root: join(here, "..", "web", "dist"),
});
app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith("/api/")) {
    return reply.code(404).send({ ok: false, error: "not_found" });
  }
  return reply.sendFile("index.html");
});

// Arrêt propre : `docker stop` envoie SIGTERM. Node lancé directement (PID 1)
// n'a pas de comportement par défaut pour ce signal : Docker attendait 10 s puis
// tuait le processus, requêtes en cours comprises.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.once(signal, () => {
    app.close().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  });
}

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
