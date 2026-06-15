import { defineConfig } from "vitest/config";

// Config dédiée aux tests (le build utilise vite.config.ts).
// On laisse esbuild gérer le JSX en runtime automatique → pas besoin d'importer React.
export default defineConfig({
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
