import { useEffect, useState } from "react";
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
    command: "cat skills.txt",
    output: "Full-Stack · DevOps · Linux · Docker · Réseau & self-hosting",
  },
  {
    path: "~/portfolio",
    command: "cd services/ ; ls",
    output:
      "contact.sh   dev-web/   montage-d'ordinateurs/   conseil-hébergement-web/",
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
    output: "contact.sh   dev-web/   pc-assembly/   web-hosting-consulting/",
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

  return (
    <section className="items-center max-w-210 container-page py-7 w-full">
      <div className="rounded-xl border border-line bg-base/45 backdrop-blur-[2px] shadow-lg overflow-hidden">
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
      </div>
    </section>
  );
}
