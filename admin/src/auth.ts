import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import bcrypt from "bcryptjs";
import { config } from "./config";

const COOKIE_NAME = "admin_session";

// Session sans état : le cookie signé contient sa date d'expiration.
// La signature (@fastify/cookie + SESSION_SECRET) empêche toute falsification ;
// un redémarrage du serveur n'invalide donc pas la session (pas de store).
function sessionValue(): string {
  const expiry = Date.now() + config.sessionTtlHours * 3600 * 1000;
  return String(expiry);
}

export function isAuthenticated(req: FastifyRequest): boolean {
  const raw = req.cookies[COOKIE_NAME];
  if (!raw) return false;
  const unsigned = req.unsignCookie(raw);
  if (!unsigned.valid || !unsigned.value) return false;
  const expiry = Number(unsigned.value);
  return Number.isFinite(expiry) && Date.now() < expiry;
}

// Hook de garde à poser sur tout ce qui doit être protégé.
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  if (!isAuthenticated(req)) {
    return reply.code(401).send({ ok: false, error: "unauthorized" });
  }
}

export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/login",
    {
      schema: {
        body: {
          type: "object",
          required: ["password"],
          additionalProperties: false,
          properties: { password: { type: "string", maxLength: 200 } },
        },
      },
      // anti-brute-force : 5 essais / minute / IP
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (req: FastifyRequest<{ Body: { password: string } }>, reply) => {
      const ok = await bcrypt.compare(
        req.body.password,
        config.adminPasswordHash,
      );
      if (!ok) return reply.code(401).send({ ok: false, error: "bad_password" });

      return reply
        .setCookie(COOKIE_NAME, sessionValue(), {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
          signed: true,
          // secure:false assumé : servi en HTTP sur le LAN (et via VPN),
          // jamais exposé à Internet.
          secure: false,
          maxAge: config.sessionTtlHours * 3600,
        })
        .send({ ok: true });
    },
  );

  app.post("/api/logout", async (_req, reply) => {
    return reply.clearCookie(COOKIE_NAME, { path: "/" }).send({ ok: true });
  });

  // Permet au front de savoir si une session est active (au chargement).
  app.get("/api/me", async (req) => ({ ok: isAuthenticated(req) }));
}
