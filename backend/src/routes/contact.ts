import type { FastifyInstance, FastifyRequest } from "fastify";
import { pool } from "../db";
import { notifyContact } from "../notifier";
import { verifyTurnstile } from "../turnstile";

type ContactBody = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  phone?: string; // optionnel
  message: string;
  company?: string; // honeypot anti-spam (doit rester vide)
  cfTurnstileToken?: string; // jeton anti-bot Cloudflare Turnstile
};

// Validation côté serveur (JSON Schema natif Fastify → renvoie 400 automatiquement).
const bodySchema = {
  type: "object",
  required: ["firstname", "lastname", "email", "type", "message"],
  additionalProperties: false,
  properties: {
    firstname: { type: "string", minLength: 1, maxLength: 100 },
    lastname: { type: "string", minLength: 1, maxLength: 100 },
    email: {
      type: "string",
      pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
      maxLength: 200,
    },
    type: { type: "string", enum: ["project", "hiring", "other"] },
    phone: { type: "string", maxLength: 40 }, // optionnel
    message: { type: "string", minLength: 1, maxLength: 5000 },
    company: { type: "string" }, // honeypot
    cfTurnstileToken: { type: "string", maxLength: 4000 }, // jeton Turnstile
  },
};

export async function contactRoutes(app: FastifyInstance) {
  app.post(
    "/api/contact",
    {
      schema: { body: bodySchema },
      // anti-spam : 5 requêtes / minute / IP sur cette route
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
    },
    async (req: FastifyRequest<{ Body: ContactBody }>, reply) => {
      const { firstname, lastname, email, type, phone, message, company } =
        req.body;

      // honeypot rempli → bot : on répond OK sans rien enregistrer ni notifier
      if (company && company.trim() !== "") {
        return reply.code(201).send({ ok: true });
      }

      // anti-bot Turnstile (si un secret est configuré côté serveur)
      const captchaOk = await verifyTurnstile(req.body.cfTurnstileToken, req.ip);
      if (!captchaOk) {
        return reply.code(400).send({ ok: false, error: "captcha" });
      }

      const cleanPhone = phone?.trim() || null;

      await pool.query(
        `INSERT INTO contacts (firstname, lastname, email, type, phone, message, ip, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          firstname,
          lastname,
          email,
          type,
          cleanPhone,
          message,
          req.ip,
          req.headers["user-agent"] ?? null,
        ],
      );

      // la notif ne doit pas faire échouer la requête si ntfy est indisponible
      try {
        await notifyContact({
          firstname,
          lastname,
          email,
          type,
          phone: cleanPhone,
          message,
        });
      } catch (err) {
        req.log.error({ err }, "notification ntfy échouée");
      }

      return reply.code(201).send({ ok: true });
    },
  );
}
