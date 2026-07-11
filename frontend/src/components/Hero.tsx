import { useEffect, useRef, useState } from "react";
import { useTypewriter, type Line } from "../hooks/useTypewriter";
import { useLang } from "../i18n/LangContext";
import { useTheme } from "../hooks/useTheme";
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
    output: "contact.sh   dev-web/   montage-pc/   conseil/",
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

/* ---- Terminal interactif (après l'intro) -------------------------------- */
// Textes des commandes, localisés en dur ici comme les LINES ci-dessus.
const TERM = {
  fr: {
    hint: "tape help ↵",
    ariaInput: "Terminal interactif — tape une commande (ex. help)",
    help: [
      "Commandes : whoami · ls · cd <section> · cv · theme · lang · clear",
      "Sections : a-propos · competences · parcours · projets · services · contact",
      "Astuce : quelques easter eggs se cachent ici… 😉",
    ],
    whoami: "Alexis Wallez — Développeur Full-Stack & DevOps",
    ls: "a-propos/   competences/   parcours/   projets/   services/   contact.sh",
    cv: "Ouverture du CV…",
    goto: (s: string) => `cd /${s} — c'est parti ▸`,
    home: "~ — retour en haut ▸",
    cdErr: (p: string) =>
      `bash : cd : ${p} : Aucun fichier ou dossier de ce type`,
    theme: "Bascule du thème ✓",
    langSame: "Déjà en français 😉  (essaie « lang en »)",
    sudo: "[sudo] Mot de passe : ●●●●●●●● — accès refusé 😄",
    coffee:
      "☕ Café en préparation… prêt ! Je le prends volontiers en vrai aussi.",
    rmrf: "🚨 Bien tenté ! Heureusement, tout est versionné sur GitHub.",
    exit: "Pas de sortie ici — mais le formulaire de contact est juste en bas 😉",
    notFound: (c: string) =>
      `bash : ${c} : commande introuvable — tape « help »`,
  },
  en: {
    hint: "type help ↵",
    ariaInput: "Interactive terminal — type a command (e.g. help)",
    help: [
      "Commands: whoami · ls · cd <section> · cv · theme · lang · clear",
      "Sections: about · skills · career · projects · services · contact",
      "Hint: a few easter eggs are hiding here… 😉",
    ],
    whoami: "Alexis Wallez — Full-Stack Developer & DevOps",
    ls: "about/   skills/   career/   projects/   services/   contact.sh",
    cv: "Opening the CV…",
    goto: (s: string) => `cd /${s} — let's go ▸`,
    home: "~ — back to top ▸",
    cdErr: (p: string) => `bash: cd: ${p}: No such file or directory`,
    theme: "Theme switched ✓",
    langSame: "Already in English 😉  (try “lang fr”)",
    sudo: "[sudo] Password: ●●●●●●●● — permission denied 😄",
    coffee: "☕ Brewing coffee… done! Happy to grab a real one too.",
    rmrf: "🚨 Nice try! Luckily, everything is versioned on GitHub.",
    exit: "No exit here — but the contact form is right below 😉",
    notFound: (c: string) => `bash: ${c}: command not found — type “help”`,
  },
};

// alias de sections acceptés (FR + EN) → id de la section à atteindre
const SECTIONS_MAP: Record<string, string> = {
  about: "about",
  "a-propos": "about",
  apropos: "about",
  "à-propos": "about",
  contact: "contact",
  projects: "projects",
  projets: "projects",
  skills: "skills",
  competences: "skills",
  compétences: "skills",
  services: "services",
  career: "career",
  parcours: "career",
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
  const { lang, toggle: toggleLang } = useLang();
  const { toggle: toggleTheme } = useTheme();
  const lines = lang === "fr" ? LINES_FR : LINES_EN;
  const { rendered } = useTypewriter(lines);
  const { ref, height } = useMeasuredHeight<HTMLDivElement>();

  /* ---- terminal interactif : actif une fois l'intro terminée ---- */
  const T = TERM[lang];
  const introDone =
    rendered.length === lines.length &&
    Boolean(rendered[lines.length - 1]?.showOutput);

  type HistEntry = { cmd: string; out: string[] };
  const [history, setHistory] = useState<HistEntry[]>([]);
  const [value, setValue] = useState("");
  const [cleared, setCleared] = useState(false); // `clear` efface aussi l'intro
  const [past, setPast] = useState<string[]>([]); // commandes tapées (flèches ↑/↓)
  const [pastIdx, setPastIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // le contenu dépasse la hauteur figée du terminal → on scrolle en bas,
  // comme un vrai terminal (la fenêtre ne grandit pas)
  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history, cleared]);

  const scrollToSection = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  // exécute une commande ; renvoie les lignes à afficher (null = pas d'entrée,
  // ex. `clear` qui vide tout)
  const run = (raw: string): string[] | null => {
    const cmd = raw.trim();
    const low = cmd.toLowerCase();

    if (low === "clear") {
      setCleared(true);
      setHistory([]);
      return null;
    }
    if (low === "help" || low === "aide" || low === "?") return T.help;
    if (low === "whoami") return [T.whoami];
    if (low === "ls" || low.startsWith("ls ")) return [T.ls];
    if (low === "pwd") return ["~/portfolio"];
    if (low === "date")
      return [new Date().toLocaleString(lang === "fr" ? "fr-FR" : "en-US")];
    if (low.startsWith("echo ")) return [cmd.slice(5)];
    if (low === "cv") {
      window.dispatchEvent(new Event("portfolio:open-cv"));
      return [T.cv];
    }
    if (low === "theme") {
      toggleTheme();
      return [T.theme];
    }
    if (low === "lang" || low === "lang en" || low === "lang fr") {
      const target = low.endsWith("en")
        ? "en"
        : low.endsWith("fr")
          ? "fr"
          : null;
      if (target === lang) return [T.langSame];
      toggleLang(); // remonte Hero (key={lang}) → l'intro rejoue dans l'autre langue
      return [];
    }
    // navigation façon shell : cd <section>, et toute variante de « remonter
    // à la racine ~ » : cd · cd ~ · cd / · cd .. · cd ../ · cd ../.. · cd . · cd - · cd..
    if (low === "cd" || low === "cd.." || low.startsWith("cd ")) {
      const arg = low.startsWith("cd ") ? low.slice(3).trim() : "";
      const key = arg.replace(/^[~/]+/, "").replace(/\/+$/, ""); // ~/x, /x, x/
      if (!key || key === "~" || /^[./-]+$/.test(key)) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return [T.home];
      }
      const target = SECTIONS_MAP[key];
      if (target) {
        scrollToSection(target);
        return [T.goto(target)];
      }
      return [T.cdErr(arg)];
    }
    const section = SECTIONS_MAP[low];
    if (section) {
      scrollToSection(section);
      return [T.goto(section)];
    }
    if (low.includes("coffee") || low.includes("café")) return [T.coffee];
    if (low.startsWith("rm ")) return [T.rmrf];
    if (low.startsWith("sudo")) return [T.sudo];
    if (low === "exit" || low === "logout" || low === "quit") return [T.exit];
    return [T.notFound(cmd)];
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = value.trim();
    setValue("");
    setPastIdx(-1);
    if (!cmd) return;
    setPast((p) => [...p, cmd]);
    const out = run(cmd);
    if (out !== null) setHistory((h) => [...h, { cmd, out }]);
  };

  // flèches ↑/↓ : rappel des commandes précédentes, comme un vrai shell
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!past.length) return;
      const idx = pastIdx < 0 ? past.length - 1 : Math.max(0, pastIdx - 1);
      setPastIdx(idx);
      setValue(past[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (pastIdx < 0) return;
      const idx = pastIdx + 1;
      if (idx >= past.length) {
        setPastIdx(-1);
        setValue("");
      } else {
        setPastIdx(idx);
        setValue(past[idx]);
      }
    }
  };

  // cliquer n'importe où sur la carte focalise l'invite (desktop uniquement :
  // sur tactile, seul un tap direct sur l'input ouvre le clavier — opt-in)
  const focusPrompt = () => {
    if (!introDone) return;
    if (window.getSelection()?.toString()) return; // ne pas gêner la sélection
    if (matchMedia("(pointer: fine)").matches)
      inputRef.current?.focus({ preventScroll: true });
  };

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
      const ny = clamp(
        (my - (r.top + r.height / 2)) / (window.innerHeight / 2),
      );
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
    // max-w-215 (au lieu de 210) : compense la gouttière de scrollbar réservée
    // dans le corps du terminal (les lignes de l'intro wrappent comme avant)
    <section className="items-center max-w-215 container-page py-7 w-full">
      {/* titre principal (h1) pour lecteurs d'écran & SEO ; le terminal animé
          ci-dessous reste le rendu visuel. lines[0].output = nom + rôle localisés */}
      <h1 className="sr-only">{lines[0].output}</h1>
      {/* onClick : simple délégation de focus vers l'invite (pas un contrôle
          interactif en soi — l'input, lui, reste focusable au clavier) */}
      <div
        ref={cardRef}
        onClick={focusPrompt}
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

        {/* Corps : hauteur figée via le fantôme mesuré (même composant → mesure
            exacte, invite comprise). scrollbar-gutter réserve la place de la
            scrollbar dès le départ : quand elle apparaît (commandes tapées),
            rien ne se re-wrappe. +44 = padding vertical (40) + marge de sûreté */}
        <div
          ref={bodyRef}
          className="relative p-5 font-mono text-sm leading-relaxed overflow-y-auto scrollbar-gutter-stable"
          style={{ height: height ? height + 44 : "auto" }}
        >
          {/* ① fantôme invisible = état final mesuré (invite interactive
              comprise, sinon elle déborderait de la hauteur figée) */}
          <div
            ref={ref}
            aria-hidden
            className="invisible absolute inset-x-5 top-5 pointer-events-none"
          >
            {lines.map((line, i) => (
              <TerminalLine key={i} line={line} lang={lang} ghost />
            ))}
            <p className="wrap-break-word">
              <Prompt path="~/portfolio" />
              {T.hint}
            </p>
          </div>

          {/* ② version animée visible (masquée après `clear`, comme un vrai shell) */}
          {!cleared &&
            rendered.map((line, i) => {
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

          {/* ③ échanges interactifs (annoncés aux lecteurs d'écran) */}
          <div aria-live="polite">
            {history.map((h, i) => (
              <div key={i} className="mb-3">
                <p className="wrap-break-word">
                  <Prompt path="~/portfolio" />
                  <span className="text-ink">{h.cmd}</span>
                </p>
                {h.out.map((o, j) => (
                  <p key={j} className="text-muted wrap-break-word">
                    {o}
                  </p>
                ))}
              </div>
            ))}
          </div>

          {/* ④ invite réelle : le terminal devient interactif après l'intro.
              gap-2 ≈ un caractère mono : en flex, l'espace de fin du « $ » est
              avalé — on recrée le même écart que sur les lignes de l'intro */}
          {introDone && (
            <form onSubmit={onSubmit} className="flex items-baseline gap-2">
              <span className="whitespace-nowrap">
                <Prompt path="~/portfolio" />
              </span>
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label={T.ariaInput}
                placeholder={past.length ? "" : T.hint}
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                className="grow min-w-0 bg-transparent border-none outline-none
                           font-mono text-sm text-ink caret-accent
                           placeholder:text-muted/60"
              />
            </form>
          )}
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
