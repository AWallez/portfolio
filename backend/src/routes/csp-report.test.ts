import { describe, it, expect } from "vitest";
import Fastify from "fastify";
import rateLimit from "@fastify/rate-limit";
import { cspReportRoutes } from "./csp-report";

// Le journal est capturé pour vérifier ce qui y part (et ce qui n'y part pas).
async function buildApp() {
  const lignes: Record<string, unknown>[] = [];
  const app = Fastify({
    logger: {
      level: "warn",
      stream: { write: (l: string) => void lignes.push(JSON.parse(l)) },
    },
  });
  await app.register(rateLimit, { global: false });
  await app.register(cspReportRoutes);
  return { app, lignes };
}

const ANCIEN = {
  "csp-report": {
    "document-uri": "https://alexiswallez.fr/",
    "effective-directive": "script-src-elem",
    "blocked-uri": "https://evil.example/x.js",
    "line-number": 12,
  },
};

describe("POST /api/csp-report", () => {
  it("journalise un rapport au format report-uri", async () => {
    const { app, lignes } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/csp-report",
      headers: { "content-type": "application/csp-report" },
      payload: JSON.stringify(ANCIEN),
    });
    expect(res.statusCode).toBe(204);
    const l = lignes.find((x) => x.msg === "violation CSP");
    expect(l?.csp).toMatchObject({
      directive: "script-src-elem",
      bloque: "https://evil.example/x.js",
      ligne: 12,
    });
  });

  it("journalise les rapports de l'API Reporting (report-to)", async () => {
    const { app, lignes } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/csp-report",
      headers: { "content-type": "application/reports+json" },
      payload: JSON.stringify([
        { type: "csp-violation", body: { effectiveDirective: "style-src-attr", blockedURL: "inline" } },
        { type: "deprecation", body: { id: "x" } },
      ]),
    });
    expect(res.statusCode).toBe(204);
    const violations = lignes.filter((x) => x.msg === "violation CSP");
    expect(violations).toHaveLength(1); // le rapport d'un autre type est ignoré
    expect(violations[0].csp).toMatchObject({ directive: "style-src-attr" });
  });

  it("refuse un corps trop gros", async () => {
    const { app } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/csp-report",
      headers: { "content-type": "application/csp-report" },
      payload: JSON.stringify({ "csp-report": { "script-sample": "x".repeat(20_000) } }),
    });
    expect(res.statusCode).toBe(413);
  });

  it("ignore un JSON qui n'est pas un rapport", async () => {
    const { app, lignes } = await buildApp();
    const res = await app.inject({
      method: "POST",
      url: "/api/csp-report",
      headers: { "content-type": "application/csp-report" },
      payload: JSON.stringify({ bonjour: 1 }),
    });
    expect(res.statusCode).toBe(204);
    expect(lignes.filter((x) => x.msg === "violation CSP")).toHaveLength(0);
  });
});
