import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "react-phone-number-input/style.css";
import "./index.css";
import App from "./App.tsx";
// @ts-expect-error: package has no TypeScript declaration files for side-effect import
import "@fontsource-variable/inter";
// @ts-expect-error: package has no TypeScript declaration files for side-effect import
import "@fontsource-variable/jetbrains-mono";
import { LangProvider } from "./i18n/LangContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LangProvider>
      <App />
    </LangProvider>
  </StrictMode>,
);
