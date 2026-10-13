import { useEffect, useRef } from "react";

// Tilt 3D d'une carte qui suit la souris (terminal du Hero), desktop uniquement.
// Désactivé si « mouvement réduit » ou sur tactile ; rAF pour rester fluide.
// Renvoie la ref de la carte et celle du calque de reflet posé dessus.
export function useTilt<C extends HTMLElement, G extends HTMLElement>() {
  const cardRef = useRef<C>(null);
  const glareRef = useRef<G>(null);

  useEffect(() => {
    if (
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      matchMedia("(pointer: coarse)").matches
    )
      return;
    const MAX = 7; // inclinaison max (degrés)
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    let mx = 0;
    let my = 0;
    let raf = 0;
    // lecture du layout + écritures regroupées dans le rAF : 1 reflow max par
    // frame (et non par event mousemove). La carte suit la souris partout.
    // En plus de la rotation, on donne du volume : ombre portée directionnelle
    // (la carte semble soulevée) + reflet spéculaire qui suit le curseur.
    const render = () => {
      raf = 0;
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // hors écran → ignore
      const nx = clamp((mx - (r.left + r.width / 2)) / (window.innerWidth / 2));
      const ny = clamp(
        (my - (r.top + r.height / 2)) / (window.innerHeight / 2),
      );
      el.style.transform = `perspective(900px) rotateX(${(-ny * MAX).toFixed(2)}deg) rotateY(${(nx * MAX).toFixed(2)}deg)`;
      // ombre portée opposée à l'inclinaison → effet « soulevé du plan »
      // (on garde le biseau inset pour l'épaisseur, sinon il sauterait au survol)
      const sx = (-nx * 22).toFixed(0);
      const sy = (-ny * 22 + 14).toFixed(0);
      // ombre thème-consciente : une ombre noire discrète (0.35) est quasi
      // invisible sur le fond sombre → aucun fondu. On la creuse et l'adoucit.
      const dark = document.documentElement.classList.contains("dark");
      // sombre : le biseau 3D (teinté à l'accent) est géré par la classe CSS
      // `.term-bevel` → on laisse l'ombre à la classe (le tilt fait déjà le relief).
      if (dark) {
        el.style.boxShadow = "";
      } else {
        // clair : ombre portée + biseau (rim clair en haut, ombre douce en bas) → 3D
        el.style.boxShadow = `${sx}px ${sy}px 45px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 12px 28px -20px rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.1), inset 0 -14px 28px -18px rgba(0,0,0,0.14)`;
      }
      // reflet : un point lumineux suit le curseur, d'autant plus fort que l'on
      // est loin du centre (la surface « accroche » la lumière en s'inclinant).
      // Teinté avec --accent (teal) qui s'adapte déjà clair/sombre → visible sur
      // les deux thèmes, sans détecter le thème en JS.
      const g = glareRef.current;
      if (g) {
        const gx = (((mx - r.left) / r.width) * 100).toFixed(1);
        const gy = (((my - r.top) / r.height) * 100).toFixed(1);
        const intensity = Math.min(1, Math.hypot(nx, ny));
        // le teal sombre (clair) ressort moins que le teal vif (sombre) : on
        // monte un peu l'opacité en thème clair, on la baisse en thème sombre
        const pct = dark
          ? (2 + 6 * intensity).toFixed(1) // sombre : 2 % → 8 % (reflet discret)
          : (10 + 24 * intensity).toFixed(1); // clair : 10 % → 34 %
        g.style.background = `radial-gradient(circle at ${gx}% ${gy}%, color-mix(in srgb, var(--accent) ${pct}%, transparent), transparent 60%)`;
      }
    };
    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!raf) raf = requestAnimationFrame(render);
    };
    const onLeave = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      const el = cardRef.current;
      if (el) {
        el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
        el.style.boxShadow = ""; // retour à l'ombre de repos (classe Tailwind)
      }
      if (glareRef.current) glareRef.current.style.background = "transparent";
    };
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return { cardRef, glareRef };
}
