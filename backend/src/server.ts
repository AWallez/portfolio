import "dotenv/config";
import Fastify, { type FastifyError } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import process from "node:process";
import { config } from "./config";
import { contactRoutes } from "./routes/contact";
import { cspReportRoutes } from "./routes/csp-report";
import { schedulePurge } from "./retention";
import { pool } from "./db";
import { TRUST_PROXY } from "./proxy";

const app = Fastify({
  logger: {
    // Aucune adresse IP dans les journaux. La politique de confidentialité ne
    // la fait conserver qu'avec un message envoyé (contacts.ip, effacée au bout
    // d'un an) ; Fastify la journalisait pourtant à chaque requête, y compris
    // pour /api/health, appelé à chaque visite du site.
    serializers: {
      req: (req) => ({ method: req.method, url: req.url }),
    },
  },
  trustProxy: TRUST_PROXY, // cf. proxy.ts
});

await app.register(cors, { origin: config.corsOrigin, methods: ["POST"] });
await app.register(rateLimit, { global: false }); // activé route par route

// Réponses d'erreur génériques : jamais le message interne (texte SQL, chemin
// de fichier…), qui partait tel quel dans le corps des 500. Les 4xx gardent
// leur statut ; le détail ne va que dans le journal.
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

// Sondes de santé : `warn` = pas une ligne de journal par appel (le
// healthcheck Docker et le badge du pied de page les appellent sans cesse).
app.get("/health", { logLevel: "warn" }, async () => ({ status: "ok" }));
// même healthcheck exposé sous /api/ : c'est le seul préfixe que Nginx proxifie
// vers l'API → utilisé par le badge « infra live » du footer.
app.get("/api/health", { logLevel: "warn" }, async () => ({ status: "ok" }));
await app.register(contactRoutes);
await app.register(cspReportRoutes);

// durées de conservation RGPD appliquées par l'API elle-même : pas de cron à
// maintenir sur le NAS, et la purge suit le conteneur partout où il tourne.
const stopPurge = schedulePurge(app.log);
app.addHook("onClose", async () => {
  stopPurge();
  await pool.end();
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
