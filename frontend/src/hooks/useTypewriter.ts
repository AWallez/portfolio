import { useEffect, useState } from "react";

export type Line = {
  path: string;
  command: string;
  output?: string;
  link?: { label: string; href: string };
  loading?: boolean; // laisse un "spinner" tourner sous la sortie (script encore actif)
};
type Rendered = Line & { showOutput: boolean; isRunning?: boolean };

const prefersReduced = () =>
  typeof matchMedia !== "undefined" &&
  matchMedia("(prefers-reduced-motion: reduce)").matches;

export function useTypewriter(lines: Line[]) {
  const [reduced] = useState(prefersReduced);
  const [rendered, setRendered] = useState<Rendered[]>(
    reduced
      ? lines.map((l) => ({
          ...l,
          showOutput: true,
          isRunning: Boolean(l.loading),
        }))
      : [],
  );

  useEffect(() => {
    if (reduced) return;

    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((r) => {
        timers.push(setTimeout(r, ms));
      });

    const acc: Rendered[] = [];

    async function run() {
      for (let i = 0; i < lines.length; i++) {
        acc.push({ ...lines[i], command: "", showOutput: false });
        await wait(i === 0 ? 350 : 0);
        if (cancelled) return;

        // prompt seul affiché, petit temps mort avant la frappe (naturel)
        setRendered([...acc]);
        await wait(750);
        if (cancelled) return;

        // frappe caractère par caractère
        for (let c = 1; c <= lines[i].command.length; c++) {
          acc[i] = { ...acc[i], command: lines[i].command.slice(0, c) };
          setRendered([...acc]);
          await wait(75);
          if (cancelled) return;
        }

        // sortie de la commande
        if (lines[i].output || lines[i].link) {
          await wait(250);
          if (cancelled) return;
          acc[i] = {
            ...acc[i],
            showOutput: true,
            isRunning: Boolean(lines[i].loading),
          };
          setRendered([...acc]);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [lines, reduced]);

  return { rendered };
}
