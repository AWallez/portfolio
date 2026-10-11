// Configuration centralisée, lue depuis les variables d'environnement (.env).
import process from "node:process";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

// Turnstile (anti-bot) : sans secret, la vérification est sautée. Toléré en
// développement, pas en production : un secret perdu au détour d'un .env
// désactivait l'anti-bot sans que rien ne le signale. On refuse alors de
// démarrer, sauf choix explicite (TURNSTILE_OPTIONAL=1, pile locale de test).
const turnstileSecret = process.env.TURNSTILE_SECRET || undefined;
if (
  !turnstileSecret &&
  process.env.NODE_ENV === "production" &&
  process.env.TURNSTILE_OPTIONAL !== "1"
) {
  throw new Error(
    "TURNSTILE_SECRET manquant en production (TURNSTILE_OPTIONAL=1 pour s'en passer volontairement)",
  );
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",
  // une ou plusieurs origines autorisées pour le CORS
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  databaseUrl: required("DATABASE_URL"),
  // secret Turnstile (anti-bot). Absent = vérif sautée (hors production, cf. plus haut)
  turnstileSecret,
  ntfy: {
    url: required("NTFY_URL"),
    topic: required("NTFY_TOPIC"),
    // optionnel : présent quand l'auth ntfy est activée (token de publication)
    token: process.env.NTFY_TOKEN,
  },
};
