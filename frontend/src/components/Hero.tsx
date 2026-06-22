import { useEffect, useRef, useState } from "react";
import { useTypewriter, type Line } from "../hooks/useTypewriter";
import { useLang } from "../i18n/LangContext";
import { useMeasuredHeight } from "../hooks/useMeasuredHeight";

const LINES_FR: Line[] = [
  {
    path: "~/portfolio",
    command: "whoami",
    output: "Alexis Wallez — Développeur Full-Stack & DevOps",
  },
  {
    path: "~/portfolio",
    command: "cat competences.txt",
    output: "Full-Stack · DevOps · Linux · Docker · Réseau & self-hosting",
  },
  {
    path: "~/portfolio",
    command: "cd services/ ; ls",
    output:
      "contact.sh   dev-web/   montage-pc/   conseil/",
  },
  {
    path: "~/portfolio/services",
    command: "./contact.sh",
    loading: true,
    output:
      "Disponible pour des projets en freelance et des opportunités pro | Cliquez ici▸",
    link: { label: "Contact", href: "#contact" },
  },
];

const LINES_EN: Line[] = [
  {
    path: "~/portfolio",
    command: "whoami",
    output: "Alexis Wallez — Full-Stack Developer & DevOps",
  },
  {
    path: "~/portfolio",
    command: "cat skills.txt",
    output: "Full-Stack · DevOps · Linux · Docker · Network & self-hosting",
  },
  {
    path: "~/portfolio",
    command: "cd services/ ; ls",
    output: "contact.sh   web-dev/   pc-assembly/   consulting/",
  },
  {
    path: "~/portfolio/services",
    command: "./contact.sh",
    loading: true,
    output:
      "Available for freelance projects & professional opportunities | Click here ▸",
    link: { label: "Contact", href: "#contact" },
  },
];

const SPINNER = {
  fr: "En attente de votre prise de contact…",
  en: "We look forward to hearing from you…",
};

function Prompt({ path }: { path: string }) {
  return (
    <>
      <span className="text-accent">alexis@wallez</span>
      <span className="text-muted">:</span>
      <span className="text-sky-500 dark:text-sky-400">{path}</span>
      <span className="text-muted">$ </span>
    </>
  );
}

const Cursor = () => (
  <span className="inline-block w-2 h-4 bg-accent animate-pulse align-middle ml-1" />
);

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
function Spinner() {
  const [f, setF] = useState(0);
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setF((p) => (p + 1) % FRAMES.length), 80);
    return () => clearInterval(id);
  }, []);
  return <span className="text-accent">{FRAMES[f]}</span>;
}

// Rendu d'UNE ligne — utilisé à la fois par le fantôme (mesure) et l'animé (visible).
// `ghost` = true → version figée pour la mesure (pas de curseur, tout affiché).
function TerminalLine({
  line,
  lang,
  showCursor = false,
  ghost = false,
}: {
  line: Line & { showOutput?: boolean; isRunning?: boolean };
  lang: "fr" | "en";
  showCursor?: boolean;
  ghost?: boolean;
}) {
  const showOutput = ghost
    ? Boolean(line.output || line.link)
    : line.showOutput;
  const isRunning = ghost ? Boolean(line.loading) : line.isRunning;

  return (
    <div className="mb-3">
      <p className="wrap-break-word">
        <Prompt path={line.path} />
        <span className="text-ink">{line.command}</span>
        {showCursor && <Cursor />}
      </p>

      {showOutput && (line.output || line.link) && (
        <p className="text-muted wrap-break-word">
          {line.output}{" "}
          {line.link && (
            <a
              href={line.link.href}
              className="text-accent font-medium underline-offset-4 hover:underline"
            >
              {line.link.label}
            </a>
          )}
        </p>
      )}

      {isRunning && (
        <p className="text-muted mt-1">
          {ghost ? <span className="text-accent">⠋</span> : <Spinner />}{" "}
          {SPINNER[lang]}
        </p>
      )}
    </div>
  );
}

export default function Hero() {
  const { lang } = useLang();
  const lines = lang === "fr" ? LINES_FR : LINES_EN;
  const { rendered } = useTypewriter(lines);
  const { ref, height } = useMeasuredHeight<HTMLDivElement>();

  // tilt 3D du terminal : suit la souris (desktop uniquement).
  // Désactivé si « mouvement réduit » ou sur tactile ; rAF pour rester fluide.
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
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
    // frame (et non par event mousemove). Le terminal suit la souris partout.
    // En plus de la rotation, on donne du volume : ombre portée directionnelle
    // (la carte semble soulevée) + reflet spéculaire qui suit le curseur.
    const render = () => {
      raf = 0;
      const el = cardRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return; // hors écran → ignore
      const nx = clamp((mx - (r.left + r.width / 2)) / (window.innerWidth / 2));
      const ny = clamp((my - (r.top + r.height / 2)) / (window.innerHeight / 2));
      el.style.transform = `perspective(900px) rotateX(${(-ny * MAX).toFixed(2)}deg) rotateY(${(nx * MAX).toFixed(2)}deg)`;
      // ombre portée opposée à l'inclinaison → effet « soulevé du plan »
      // (on garde le biseau inset pour l'épaisseur, sinon il sauterait au survol)
      const sx = (-nx * 22).toFixed(0);
      const sy = (-ny * 22 + 14).toFixed(0);
      el.style.boxShadow = `${sx}px ${sy}px 45px -8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.15)`;
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
        const dark = document.documentElement.classList.contains("dark");
        const pct = dark
          ? (5 + 13 * intensity).toFixed(1) // sombre : 5 % → 18 %
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

  return (
    <section className="items-center max-w-210 container-page py-7 w-full">
      {/* titre principal (h1) pour lecteurs d'écran & SEO ; le terminal animé
          ci-dessous reste le rendu visuel. lines[0].output = nom + rôle localisés */}
      <h1 className="sr-only">{lines[0].output}</h1>
      <div
        ref={cardRef}
        className="relative rounded-xl border border-line bg-base/20 backdrop-blur-[3px] overflow-hidden
                   shadow-[0_18px_45px_-12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-1px_0_rgba(0,0,0,0.15)]
                   transition-[transform,box-shadow] duration-150 ease-out will-change-transform motion-reduce:transition-none"
      >
        {/* Barre de titre */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-400" />
          <span className="ml-3 font-mono text-xs text-muted">
            alexis@wallez:~/portfolio$
          </span>
        </div>

        {/* Corps : hauteur figée via le fantôme mesuré (même composant → mesure exacte) */}
        <div
          className="relative p-5 font-mono text-sm leading-relaxed"
          style={{ height: height ? height + 40 : "auto" }}
        >
          {/* ① fantôme invisible = état final mesuré */}
          <div
            ref={ref}
            aria-hidden
            className="invisible absolute inset-x-5 top-5 pointer-events-none"
          >
            {lines.map((line, i) => (
              <TerminalLine key={i} line={line} lang={lang} ghost />
            ))}
          </div>

          {/* ② version animée visible */}
          {rendered.map((line, i) => {
            const isLast = i === rendered.length - 1;
            return (
              <TerminalLine
                key={i}
                line={line}
                lang={lang}
                showCursor={isLast && !line.showOutput}
              />
            );
          })}
        </div>

        {/* reflet spéculaire piloté en JS (suit le curseur) — clippé par les
            coins arrondis grâce à overflow-hidden du parent */}
        <div
          ref={glareRef}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "transparent" }}
        />
      </div>
    </section>
  );
}
