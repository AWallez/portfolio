// Styles des contrôles. Focus : contour de 2 px (la bordure de 1 px qui
// changeait de couleur ne se voyait presque pas, alors que la validation y
// envoie le focus). Exemple (placeholder) à 65 % et en italique : on voit que
// le champ est vide, sans descendre sous 3:1 (à 50 %, 2,2:1).
const FIELD =
  "w-full rounded-lg border bg-surface/70 px-3 py-2 text-ink " +
  "placeholder:text-muted/65 placeholder:italic outline-none focus:outline-2 focus:outline-offset-1 transition";

export const fieldClass = (invalid: boolean, extra = "") =>
  FIELD +
  (invalid
    ? " border-red-500/70 focus:border-red-500 focus:outline-red-500"
    : " border-line focus:border-accent focus:outline-accent") +
  (extra ? ` ${extra}` : "");
