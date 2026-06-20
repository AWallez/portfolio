import { useEffect, useRef, useState } from "react";

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // si l'utilisateur veut moins d'animations : visible dès le départ (pas de setState dans l'effet)
  const [visible, setVisible] = useState(prefersReduced);

  useEffect(() => {
    if (prefersReduced()) return; // déjà visible, rien à observer
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        // reversible : ré-anime à la remontée du scroll (pas de disconnect)
        setVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "-150px 0px -150px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}
