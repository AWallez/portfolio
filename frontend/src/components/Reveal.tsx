import { useEffect, useState, type ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

type Variant = "up" | "fade" | "zoom" | "left" | "right" | "up-lg" | "zoom-out";

const HIDDEN: Record<Variant, string> = {
  up: "opacity-0 translate-y-8",
  "up-lg": "opacity-0 translate-y-16", // montée plus ample
  "zoom-out": "opacity-0 scale-107", // démarre légèrement agrandi puis revient à 100%
  fade: "opacity-0",
  zoom: "opacity-0 scale-90",
  left: "opacity-0 -translate-x-12",
  right: "opacity-0 translate-x-12",
};

const SHOWN = "opacity-100 translate-y-0 translate-x-0 scale-100";
// pose de sortie : invisible MAIS sans décalage (transform identité) → fondu
// sur place, sans rejouer l'entrée à l'envers.
const FADING = "opacity-0 translate-y-0 translate-x-0 scale-100";

const SLIDE_MS = 1500; // entrée : glissement / zoom (transform) avec léger "snap"
const FADE_MS = 600; // fondu de l'opacité (entrée et sortie)

export default function Reveal({
  children,
  delay = 0,
  variant = "up",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  variant?: Variant;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>();

  // Apparition : glisse de HIDDEN[variant] vers SHOWN (transform + fondu).
  // Disparition : passe par FADING (fondu sur place, transform inchangé), puis —
  // une fois invisible — REPOSITIONNE sur HIDDEN[variant] (armed) pour que la
  // prochaine apparition re-glisse. La transition reste CONSTANTE : impossible
  // d'inverser entrée et sortie.
  const [armed, setArmed] = useState(true); // au départ : pose d'entrée (décalée)
  if (visible && armed) setArmed(false); // (re)devenu visible → on désarme

  useEffect(() => {
    if (visible) return; // visible : rien à programmer
    // après la fin du fondu (élément invisible), on remet la pose d'entrée
    const id = setTimeout(() => setArmed(true), FADE_MS + delay + 80);
    return () => clearTimeout(id);
  }, [visible, delay]);

  const pose = visible ? SHOWN : armed ? HIDDEN[variant] : FADING;

  // transition constante : opacité douce (fondu) + le mouvement avec rebond (snap).
  // Tailwind v4 anime translate/scale/rotate via leurs propriétés CSS dédiées
  // (pas seulement `transform`) → on les liste toutes, sinon le glissement/zoom
  // « saute » au lieu de s'animer et tout ressemble à un simple fondu.
  const slide = `${SLIDE_MS}ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms`;
  const transition = [
    `opacity ${FADE_MS}ms cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`,
    `transform ${slide}`,
    `translate ${slide}`,
    `scale ${slide}`,
    `rotate ${slide}`,
  ].join(", ");

  return (
    <div ref={ref} style={{ transition }} className={pose + " " + className}>
      {children}
    </div>
  );
}
