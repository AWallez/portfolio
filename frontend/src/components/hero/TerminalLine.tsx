import { useEffect, useState } from "react";
import type { Line } from "../../hooks/useTypewriter";
import type { Lang } from "../../i18n/LangContext";
import { SPINNER } from "../../i18n/hero";

export function Prompt({ path }: { path: string }) {
  return (
    <>
      <span className="text-accent">alexis@wallez</span>
      <span className="text-muted">:</span>
      <span className="text-sky-700 dark:text-sky-400">{path}</span>
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
export function TerminalLine({
  line,
  lang,
  showCursor = false,
  ghost = false,
}: {
  line: Line & { showOutput?: boolean; isRunning?: boolean };
  lang: Lang;
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
              className="text-accent font-medium underline underline-offset-4"
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
