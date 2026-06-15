// Configuration centralisée, lue depuis les variables d'environnement (.env).
import process from "node:process";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  host: process.env.HOST ?? "0.0.0.0",
  // une ou plusieurs origines autorisées pour le CORS
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((s) => s.trim()),
  databaseUrl: required("DATABASE_URL"),
  ntfy: {
    url: required("NTFY_URL"),
    topic: required("NTFY_TOPIC"),
  },
};
