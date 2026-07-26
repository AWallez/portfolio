import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // `config.ts` exige ces variables au chargement. Valeurs bidon : les modules
    // qui s'en servent (db, notifier, turnstile) sont simulés dans les tests,
    // aucune connexion n'est réellement ouverte.
    env: {
      DATABASE_URL: "postgres://test:test@127.0.0.1:5432/test",
      NTFY_URL: "http://ntfy.test",
      NTFY_TOPIC: "test",
    },
  },
});
