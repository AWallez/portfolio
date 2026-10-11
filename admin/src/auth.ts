import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { config } from "./config";

const COOKIE_NAME = "admin_session";

// Sessions côté serveur : le cookie (signé) ne porte qu'un identifiant
// aléatoire, la date d'expiration reste ici. Avant, le cookie contenait sa date
// d'expiration : impossible de le révoquer, la déconnexion n'effaçait que la
// copie du navigateur, et un cookie copié restait valable 12 h.
// En mémoire, volontairement : outil mono-utilisateur, et un redémarrage de
// l'admin (mise à jour) ne coûte qu'une reconnexion.
const sessions = new Map<string, number>(); // id → expiration (ms)

function newSession(): string {
  const now = Date.now();
  for (const [id, expiry] of sessions) if (expiry <= now) sessions.delete(id);
  const id = randomBytes(32).toString("base64url");
  sessions.set(id, now + config.sessionTtlHours * 3600 * 1000);
  return id;
}

function sessionId(req: FastifyRequest): string | null {
  const raw = req.cookies[COOKIE_NAME];
  if (!raw) return null;
  const unsigned = req.unsignCookie(raw);
  return unsigned.valid && unsigned.value ? unsigned.value : null;
}

export function isAuthenticated(req: FastifyRequest): boolean {
  const id = sessionId(req);
  if (!id) return false;
  const expiry = sessions.get(id);
  if (expiry === undefined) return false;
  if (Date.now() >= expiry) {
    sessions.delete(id);
    return false;
  }
  return true;
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
        .setCookie(COOKIE_NAME, newSession(), {
          path: "/",
          httpOnly: true,
          // strict : jamais envoyé depuis un autre site, même par un lien
          // (l'admin s'ouvre au clavier ou en favori, rien n'y mène de dehors)
          sameSite: "strict",
          signed: true,
          // secure:false assumé : servi en HTTP sur le LAN (et via VPN),
          // jamais exposé à Internet.
          secure: false,
          maxAge: config.sessionTtlHours * 3600,
        })
        .send({ ok: true });
    },
  );

  app.post("/api/logout", async (req, reply) => {
    // la session meurt côté serveur : une copie du cookie ne sert plus à rien
    const id = sessionId(req);
    if (id) sessions.delete(id);
    return reply.clearCookie(COOKIE_NAME, { path: "/" }).send({ ok: true });
  });

  // Permet au front de savoir si une session est active (au chargement).
  app.get("/api/me", async (req) => ({ ok: isAuthenticated(req) }));
}
