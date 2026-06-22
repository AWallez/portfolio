import { useEffect, useState } from "react";

function compute() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  return max > 0 ? h.scrollTop / max : 0;
}

export default function ScrollProgress() {
  // init à 0 (haut de page) plutôt que compute() : éviter de lire le layout
  // pendant le rendu (reflow forcé avant chargement complet). Le useEffect
  // ci-dessous calcule la vraie valeur après le 1er paint.
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => setProgress(compute());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 h-0.5 z-60 pointer-events-none"
    >
      <div
        className="h-full bg-accent origin-left"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
