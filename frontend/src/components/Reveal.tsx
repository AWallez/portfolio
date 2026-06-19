import type { ReactNode } from "react";
import { useReveal } from "../hooks/useReveal";

type Variant = "up" | "fade" | "zoom" | "left" | "right" | "up-lg" | "zoom-out"; // zoom-out = zoom-in mais avec un léger décalage vers le bas

const HIDDEN: Record<Variant, string> = {
  up: "opacity-0 translate-y-8",
  "up-lg": "opacity-0 translate-y-16", // montée plus ample
  "zoom-out": "opacity-0 scale-107", // zoom-in mais avec un léger décalage vers le bas
  fade: "opacity-0",
  zoom: "opacity-0 scale-90",
  left: "opacity-0 -translate-x-12",
  right: "opacity-0 translate-x-12",
};

const SHOWN = "opacity-100 translate-y-0 translate-x-0 scale-100";

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

  return (
    <div
      ref={ref}
      style={{
        transitionDelay: `${delay}ms`,
        // courbe avec léger dépassement (effet "snap" satisfaisant)
        transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}
      className={
        "transition-all duration-1500 " +
        (visible ? SHOWN : HIDDEN[variant]) +
        " " +
        className
      }
    >
      {children}
    </div>
  );
}
