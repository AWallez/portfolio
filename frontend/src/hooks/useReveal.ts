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
        if (entry.isIntersecting) {
          setVisible(true); // ici c'est OK : appelé dans un callback, pas dans le corps de l'effet
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "-150px 0px -150px 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, visible };
}
