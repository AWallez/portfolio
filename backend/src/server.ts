import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import process from "node:process";
import { config } from "./config";
import { contactRoutes } from "./routes/contact";

const app = Fastify({ logger: true });

await app.register(cors, { origin: config.corsOrigin, methods: ["POST"] });
await app.register(rateLimit, { global: false }); // activé route par route

app.get("/health", async () => ({ status: "ok" }));
await app.register(contactRoutes);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
