import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

// les badges atteignables : ceux qui ont une info-bulle sont des <button>
const badgesDe = (el: HTMLElement | null) => [
  ...(el?.querySelectorAll<HTMLButtonElement>("button") ?? []),
];

// rend `courant` seul atteignable par Tab dans le groupe
function rendreCourant(liste: HTMLButtonElement[], courant: HTMLButtonElement) {
  for (const b of liste) {
    b.tabIndex = b === courant ? 0 : -1;
    if (b === courant) b.dataset.courant = "";
    else delete b.dataset.courant;
  }
}

/**
 * Groupe de badges parcouru au clavier comme une barre d'outils (motif ARIA
 * « toolbar ») : UNE étape de tabulation pour tout le groupe, puis les flèches
 * gauche / droite (et Début / Fin) passent d'un badge à l'autre, chacun
 * ouvrant son info-bulle. Avant, chaque badge était une étape : il fallait 91
 * tabulations pour traverser la page jusqu'au formulaire.
 */
export default function BadgeGroup({
  label,
  className,
  children,
}: {
  /** nom du groupe pour les lecteurs d'écran */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // à chaque rendu (langue, badges) : un seul badge atteignable, celui visité
  // en dernier s'il existe encore, sinon le premier
  useEffect(() => {
    const liste = badgesDe(ref.current);
    const courant = liste.find((b) => "courant" in b.dataset) ?? liste[0];
    if (courant) rendreCourant(liste, courant);
  });

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const liste = badgesDe(ref.current);
    const cible: EventTarget = e.target;
    if (!(cible instanceof HTMLButtonElement)) return;
    const i = liste.indexOf(cible);
    if (i < 0) return;
    const n = liste.length;
    const vers = {
      ArrowRight: (i + 1) % n,
      ArrowLeft: (i - 1 + n) % n,
      Home: 0,
      End: n - 1,
    }[e.key];
    if (vers === undefined) return;
    e.preventDefault();
    rendreCourant(liste, liste[vers]);
    liste[vers].focus();
  };

  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label={label}
      onKeyDown={onKeyDown}
      // un badge atteint au clic ou au toucher devient aussi le courant
      onFocus={(e) => {
        const cible: EventTarget = e.target;
        if (!(cible instanceof HTMLButtonElement)) return;
        const liste = badgesDe(ref.current);
        if (liste.includes(cible)) rendreCourant(liste, cible);
      }}
      className={className}
    >
      {children}
    </div>
  );
}
