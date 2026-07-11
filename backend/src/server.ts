import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import process from "node:process";
import { config } from "./config";
import { contactRoutes } from "./routes/contact";

// trustProxy : derrière Caddy → Nginx, sans ça req.ip vaudrait l'IP interne du
// proxy pour TOUS les visiteurs (rate-limit global partagé au lieu de par IP,
// colonne contacts.ip inutile, remoteip Turnstile faux). Sûr ici : l'API n'est
// joignable que par Nginx via le réseau Docker interne.
const app = Fastify({ logger: true, trustProxy: true });

await app.register(cors, { origin: config.corsOrigin, methods: ["POST"] });
await app.register(rateLimit, { global: false }); // activé route par route

app.get("/health", async () => ({ status: "ok" }));
// même healthcheck exposé sous /api/ : c'est le seul préfixe que Nginx proxifie
// vers l'API → utilisé par le badge « infra live » du footer.
app.get("/api/health", async () => ({ status: "ok" }));
await app.register(contactRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
