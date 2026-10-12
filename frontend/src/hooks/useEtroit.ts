import { useSyncExternalStore } from "react";

// Sous 640 px de large (téléphone en portrait), les visuels des projets
// passent à leur version verticale, quand elle existe.
const REQUETE = "(max-width: 639px)";

const requete = () =>
  typeof matchMedia !== "undefined" ? matchMedia(REQUETE) : null;

function abonner(rappel: () => void) {
  const m = requete();
  m?.addEventListener?.("change", rappel);
  return () => m?.removeEventListener?.("change", rappel);
}

/** Vrai sur écran étroit ; suit la rotation du téléphone. */
export function useEtroit() {
  return useSyncExternalStore(abonner, () => requete()?.matches ?? false);
}
