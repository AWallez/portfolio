import { useEffect, useState } from "react";
type Theme = "light" | "dark";

export function useTheme() {
  // lit l'état déjà posé par le script anti-flash → une seule source de vérité
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    localStorage.theme = theme;
  }, [theme]);

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
  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }

  return { theme, toggle };
}
