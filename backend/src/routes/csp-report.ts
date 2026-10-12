import type { FastifyInstance } from "fastify";

// Collecte des violations de la Content-Security-Policy.
//
// La CSP est d'abord posée en mode « rapport seul » (Caddyfile) : le navigateur
// n'y bloque rien, il signale ici ce qu'il AURAIT bloqué. Une ligne de journal
// par violation, en `warn`, sans adresse IP (cf. server.ts) : de quoi corriger
// la politique avant de l'appliquer pour de bon, sans casser le site.
//
// Deux formats coexistent selon les navigateurs :
//  - l'ancien (`report-uri`) : { "csp-report": { "violated-directive", … } },
//    en application/csp-report ;
//  - l'API Reporting (`report-to`) : [{ type: "csp-violation", body: { … } }],
//    en application/reports+json.

type Ancien = Record<string, unknown>;
type Rapport = { type?: string; body?: Record<string, unknown> };

const texte = (v: unknown) => (typeof v === "string" ? v.slice(0, 300) : undefined);

function resume(r: Ancien) {
  const ligne = r["line-number"] ?? r.lineNumber;
  return {
    page: texte(r["document-uri"] ?? r.documentURL),
    directive: texte(
      r["effective-directive"] ?? r.effectiveDirective ?? r["violated-directive"],
    ),
    bloque: texte(r["blocked-uri"] ?? r.blockedURL),
    source: texte(r["source-file"] ?? r.sourceFile),
    ligne: typeof ligne === "number" ? ligne : undefined,
    extrait: texte(r["script-sample"] ?? r.sample),
  };
}

export async function cspReportRoutes(app: FastifyInstance) {
  // Les deux types MIME des rapports, lus comme du JSON (16 Ko au plus)
  app.addContentTypeParser(
    ["application/csp-report", "application/reports+json"],
    { parseAs: "string", bodyLimit: 16_384 },
    (_req, body, done) => {
      try {
        done(null, JSON.parse(body as string));
      } catch (err) {
        done(err as Error, undefined);
      }
    },
  );

  app.post(
    "/api/csp-report",
    {
      bodyLimit: 16_384,
      // seule la ligne « violation CSP » compte, pas la paire requête/réponse
      logLevel: "warn",
      // une page qui viole la politique peut émettre des dizaines de rapports
      // d'un coup : on en garde assez pour comprendre, pas de quoi remplir le disque
      config: { rateLimit: { max: 30, timeWindow: "1 minute" } },
    },
    async (req, reply) => {
      const corps = req.body as unknown;
      const rapports: Ancien[] = Array.isArray(corps)
        ? (corps as Rapport[])
            .filter((r) => r?.type === "csp-violation" && r.body)
            .map((r) => r.body as Ancien)
        : corps && typeof corps === "object" && "csp-report" in corps
          ? [(corps as Record<string, Ancien>)["csp-report"]]
          : [];
      for (const r of rapports) req.log.warn({ csp: resume(r) }, "violation CSP");
      return reply.code(204).send();
    },
  );
}
