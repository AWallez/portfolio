import { useEffect, useState } from "react";

/**
 * Renvoie l'id de la section actuellement la plus visible à l'écran.
 * Sert à mettre en surbrillance le lien correspondant dans la nav (scroll-spy).
 * Renvoie "" quand aucune section observée n'est dans la zone active
 * (ex. quand on remonte sur hero/about, qui ne sont pas dans la nav).
 */
export function useActiveSection(ids: readonly string[]) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    // on maintient l'ensemble des sections actuellement visibles (id → position top)
    const visible = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }

        if (visible.size === 0) {
          setActive(""); // plus rien dans la zone → aucun lien surligné
          return;
        }
        // sinon : la section visible la plus haute dans la page
        let topId = "";
        let topPos = Infinity;
        for (const [id, pos] of visible) {
          if (pos < topPos) {
            topPos = pos;
            topId = id;
          }
        }
        setActive(topId);
      },
      // la zone « active » est la bande centrale du viewport
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [ids]);

  return active;
}
