import { useEffect, useRef, useState } from "react";
import { staticIntro } from "../lib/media";

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  // mobile ou « mouvement réduit » : visible dès le départ (pas d'animation,
  // pas de setState dans l'effet)
  const [visible, setVisible] = useState(staticIntro);

  useEffect(() => {
    if (staticIntro()) return; // déjà visible, rien à observer
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
