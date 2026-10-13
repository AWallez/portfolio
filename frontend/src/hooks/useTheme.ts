import { useSyncExternalStore } from "react";
type Theme = "light" | "dark";

// Un seul état du thème pour tout le site : la classe `dark` de <html>, posée
// par le script anti-flash d'index.html. Chaque composant s'y abonne au lieu de
// garder sa propre copie (avant : la commande `theme` du terminal laissait
// l'icône du header fausse, et son premier clic ne faisait rien).
// (absent au pré-rendu, qui tourne dans Node : thème clair par défaut)
const root = typeof document !== "undefined" ? document.documentElement : null;
const listeners = new Set<() => void>();

const read = (): Theme => (root?.classList.contains("dark") ? "dark" : "light");

function apply(theme: Theme) {
  root?.classList.toggle("dark", theme === "dark");
  listeners.forEach((l) => l());
}

// localStorage peut être bloqué (navigation privée stricte, cookies refusés) :
// le thème marche alors pour la visite, sans être retenu.
function saved(): string | null {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

// Tant qu'aucun choix n'est mémorisé, le site suit le thème du système, même
// s'il change pendant la visite. Rien n'est écrit avant un clic : écrire dès la
// première visite figeait la préférence système.
if (typeof matchMedia !== "undefined") {
  matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    if (saved() === null) apply(e.matches ? "dark" : "light");
  });
}

/** S'abonne aux bascules de thème (pour le code hors React, ex. le canvas). */
export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Bascule clair/sombre — INSTANTANÉE, volontairement sans animation.
 *
 * Deux tentatives ont été retirées, ne pas les re-proposer :
 * 1. Révélation circulaire (View Transitions API) : ses snapshots ne savent pas
 *    rendre `backdrop-filter` (l'élément capturé devient son propre backdrop
 *    root) → toutes les surfaces en backdrop-blur perdaient leur flou pendant
 *    l'animation, puis le retrouvaient (flash visible). Limitation navigateur.
 * 2. Fondu des couleurs (transition des variables de thème) : pas fluide sur
 *    Chromium/Brave — repeindre toute la page pendant 400 ms par-dessus le
 *    canvas de particules, l'aurora floutée et les surfaces en backdrop-filter
 *    sature le thread principal.
 * Une bascule instantanée est nette et fluide partout.
 */
export function toggleTheme() {
  const next: Theme = read() === "dark" ? "light" : "dark";
  try {
    localStorage.setItem("theme", next);
  } catch {
    // stockage bloqué : la bascule vaut pour cette visite
  }
  apply(next);
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribeTheme, read, () => "light");
  return { theme, toggle: toggleTheme };
}
