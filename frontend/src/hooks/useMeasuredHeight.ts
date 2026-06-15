import { useEffect, useRef, useState } from "react";

// mesure en continu la hauteur réelle d'un élément (s'adapte à la largeur, la langue, etc.)
export function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, height };
}
