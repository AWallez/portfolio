// Chemins des pages hors accueil.
//
// Partagés par le routage (App), la page légale elle-même (lien croisé) et le
// footer : dupliquer ces chaînes serait le meilleur moyen de casser un lien en
// silence. Isolés ici plutôt que dans LegalPage.tsx pour que App puisse router
// sans importer la page — donc sans annuler son chargement différé.
export const LEGAL_PATHS = {
  mentions: "/mentions-legales",
  privacy: "/confidentialite",
} as const;

export type LegalKind = keyof typeof LEGAL_PATHS;

/** Le chemin courant, sans slash final. */
export function currentPath(): string {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

/** La page légale correspondant à un chemin, si c'en est une. */
export function matchLegal(path: string): LegalKind | undefined {
  return (Object.keys(LEGAL_PATHS) as LegalKind[]).find(
    (k) => LEGAL_PATHS[k] === path,
  );
}
