import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
type Theme = "light" | "dark";

// startViewTransition n'est pas encore dans tous les types DOM → on le déclare nous-mêmes.
type VTDocument = Document & {
  startViewTransition?: (cb: () => void) => { ready: Promise<void> };
};

export function useTheme() {
  // lit l'état déjà posé par le script anti-flash → une seule source de vérité
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  useEffect(() => {
    localStorage.theme = theme;
  }, [theme]);

  function apply(next: Theme) {
    document.documentElement.classList.toggle("dark", next === "dark");
    setTheme(next);
  }

  function toggle(e?: { clientX: number; clientY: number }) {
    const next: Theme = theme === "dark" ? "light" : "dark";
    const doc = document as VTDocument;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // pas de View Transitions, mouvement réduit, ou pas de coordonnées → bascule simple
    if (!doc.startViewTransition || reduce || !e) {
      apply(next);
      return;
    }

    const x = e.clientX;
    const y = e.clientY;
    // rayon pour couvrir le coin le plus éloigné depuis le bouton
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = doc.startViewTransition(() => {
      flushSync(() => apply(next));
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 450,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});
  }

  return { theme, toggle };
}
