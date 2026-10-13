import { describe, expect, it } from "vitest";
import Fastify from "fastify";
import { TRUST_PROXY } from "./proxy";

// Adresse du visiteur telle que l'API la voit derrière Caddy puis Nginx :
// c'est elle qui sert au rate-limit, à contacts.ip et à Turnstile.
async function ipVue(remoteAddress: string, xff?: string) {
  const app = Fastify({ trustProxy: TRUST_PROXY });
  app.get("/ip", (req) => ({ ip: req.ip }));
  const res = await app.inject({
    method: "GET",
    url: "/ip",
    remoteAddress,
    headers: xff ? { "x-forwarded-for": xff } : {},
  });
  return (res.json() as { ip: string }).ip;
}

describe("proxys de confiance", () => {
  it("retrouve le visiteur derrière Caddy", async () => {
    expect(await ipVue("172.18.0.2", "203.0.113.7")).toBe("203.0.113.7");
  });

  it("retrouve le visiteur derrière Caddy puis Nginx", async () => {
    expect(await ipVue("172.18.0.4", "203.0.113.7, 172.18.0.2")).toBe(
      "203.0.113.7",
    );
  });

  it("ignore une adresse inventée par le client dans X-Forwarded-For", async () => {
    // le bot écrit 127.0.0.1, Caddy ajoute la vraie adresse à droite
    expect(await ipVue("172.18.0.2", "127.0.0.1, 203.0.113.7")).toBe(
      "203.0.113.7",
    );
  });

  it("ne croit pas l'en-tête d'un client qui n'est pas un proxy", async () => {
    expect(await ipVue("198.51.100.9", "127.0.0.1")).toBe("198.51.100.9");
  });
});
