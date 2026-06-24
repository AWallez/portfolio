// Helpers de détection média partagés (évite la duplication de matchMedia).

export const prefersReducedMotion = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

// petit écran = mobile (Lighthouse mobile ~412 px ; téléphones réels < 640)
export const isSmallScreen = () =>
  typeof matchMedia !== "undefined" && matchMedia("(max-width: 640px)").matches;

// animations d'intro désactivées : mouvement réduit OU mobile.
// Sur mobile on rend l'état final tout de suite (pas de typewriter ni de reveal)
// → le contenu du hero est présent dès le 1er rendu (meilleur LCP), et on allège
// le main-thread. Le desktop garde toutes les animations.
export const staticIntro = () => prefersReducedMotion() || isSmallScreen();
