import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Ne monte son contenu que lorsqu'il approche de l'écran (ou qu'on y arrive
 * directement par son ancre). Sert au formulaire de contact, tout en bas : sa
 * liste de 246 pays et son code (~55 Ko) n'ont rien à faire au chargement.
 *
 * L'ancre (`id`) est portée ici, par un conteneur toujours présent : les liens
 * du menu, « cd contact » dans le terminal et le scroll-spy la trouvent avant
 * même que le contenu soit monté.
 */
export default function QuandProche({
  id,
  reserve,
  children,
}: {
  id: string;
  /** classes de la place réservée en attendant (hauteur) */
  reserve: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [monte, setMonte] = useState(
    () => typeof location !== "undefined" && location.hash === `#${id}`,
  );

  useEffect(() => {
    const el = ref.current;
    if (monte || !el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMonte(true);
          io.disconnect();
        }
      },
      // un bon écran d'avance : le code a le temps d'arriver avant qu'on y soit
      { rootMargin: "1200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [monte]);

  return (
    // scroll-mt-20 : comme section[id], le header fixe ne cache pas le haut
    <div id={id} ref={ref} className="scroll-mt-20">
      {monte ? children : <div className={reserve} />}
    </div>
  );
}
