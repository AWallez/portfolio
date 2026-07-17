import Fastify from "fastify";
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

// Outil interne servi en LAN/VPN uniquement (port non exposé à Internet).
// trustProxy inutile : pas de reverse proxy devant, l'IP client est directe.
const app = Fastify({ logger: true });

await app.register(cookie, { secret: config.sessionSecret });
await app.register(rateLimit, { global: false }); // activé route par route

app.get("/api/health", async () => ({ status: "ok" }));
await app.register(authRoutes);

// Tout le reste de l'API est derrière la session.
await app.register(async (secured) => {
  secured.addHook("preHandler", requireAuth);
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

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
