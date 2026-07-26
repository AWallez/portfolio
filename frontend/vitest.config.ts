import { defineConfig } from "vitest/config";

// Config dédiée aux tests (le build utilise vite.config.ts).
// Le JSX est transformé en runtime automatique (pas besoin d'importer React) :
// depuis Vitest 4 c'est oxc qui s'en charge, avec ce comportement par défaut —
// les anciennes options `esbuild` étaient ignorées (et le signalaient).
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
