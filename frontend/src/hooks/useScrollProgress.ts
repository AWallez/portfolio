import { useEffect, useRef, useState } from "react";

/**
 * Renvoie un ratio 0→1 d'avancement du défilement À TRAVERS l'élément référencé.
 * Sert à « dessiner » la ligne de timeline au fil du scroll.
 * Respecte prefers-reduced-motion (renvoie 1 = ligne déjà pleine).
 */
const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // si mouvement réduit : ligne déjà pleine, pas de setState dans l'effet
  const [progress, setProgress] = useState(() => (prefersReduced() ? 1 : 0));

  useEffect(() => {
    if (prefersReduced()) return; // déjà à 1, rien à observer
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const update = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // commence à se remplir quand le haut passe sous 55% du viewport
      const p = (vh * 0.55 - r.top) / r.height;
      setProgress(Math.min(1, Math.max(0, p)));
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return { ref, progress };
}
