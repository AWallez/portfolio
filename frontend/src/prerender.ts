import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { LangProvider } from "./i18n/LangContext";
import Accueil from "./components/Accueil";

// Point d'entrée du pré-rendu, au build seulement (cf. scripts/prerender.mjs).
// Le premier écran de l'accueil en HTML : en français (langue par défaut) et
// en thème clair côté JS, le CSS se chargeant du sombre via la classe `dark`
// que pose le script anti-flash.
export function premierEcran(): string {
  return renderToString(
    createElement(LangProvider, null, createElement(Accueil, { statique: true })),
  );
}
