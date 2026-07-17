import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // en dev local, l'API admin tourne sur :3002 (npm run dev côté admin/)
    proxy: { "/api": "http://localhost:3002" },
  },
});
