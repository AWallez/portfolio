import { useEffect, useRef } from "react";

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const cv = canvas;
    const ctx = context;

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let width = 0,
      height = 0,
      raf = 0;
    type P = { x: number; y: number; vx: number; vy: number };
    const points: P[] = [];

    const accent = () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--accent")
        .trim() || "#0e9b8c";

    function resize() {
      const prevW = width || cv.clientWidth;
      const prevH = height || cv.clientHeight;

      width = cv.clientWidth;
      height = cv.clientHeight;
      cv.width = width * devicePixelRatio;
      cv.height = height * devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);

      const count = Math.max(
        30,
        Math.min(140, Math.floor((width * height) / 18000)),
      );

      // repositionne proportionnellement les particules existantes (pas de saut)
      if (points.length > 0) {
        const sx = width / prevW;
        const sy = height / prevH;
        for (const p of points) {
          p.x *= sx;
          p.y *= sy;
        }
      }

      // ajuste le NOMBRE en temps réel
      if (points.length < count) {
        // il en manque → on en ajoute (positions aléatoires sur la nouvelle taille)
        const toAdd = count - points.length;
        for (let k = 0; k < toAdd; k++) {
          points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
          });
        }
      } else if (points.length > count) {
        // il y en a trop → on retire le surplus
        points.length = count;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const color = accent();
      const isLight = !document.documentElement.classList.contains("dark");
      const boost = isLight ? 1.8 : 1; // particules ~80% plus marquées en clair

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
      }

      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < 130) {
            ctx.strokeStyle = color;
            ctx.globalAlpha = (1 - dist / 130) * 0.3 * boost;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 0.7 * boost;
      ctx.fillStyle = color;
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
    >
      {/* couche 1 : halos aurora (CSS) */}
      <div className="aurora aurora-1" />
      <div className="aurora aurora-2" />
      <div className="aurora aurora-3" />

      {/* couche 2 : réseau de particules (canvas), par-dessus l'aurora */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}
