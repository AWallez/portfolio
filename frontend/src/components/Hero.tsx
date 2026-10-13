import { useRef, useState } from "react";
import { useTypewriter } from "../hooks/useTypewriter";
import { useLang } from "../i18n/LangContext";
import { useTheme } from "../hooks/useTheme";
import { useMeasuredHeight } from "../hooks/useMeasuredHeight";
import { useTilt } from "../hooks/useTilt";
import { INTRO, TERM } from "../i18n/hero";
import { runCommand, type Effect } from "./hero/commands";
import { Prompt, TerminalLine } from "./hero/TerminalLine";

type HistEntry = { cmd: string; out: string[] };

export default function Hero() {
  const { lang, toggle: toggleLang } = useLang();
  const { toggle: toggleTheme } = useTheme();
  const lines = INTRO[lang];
  const { rendered } = useTypewriter(lines);
  const { ref, height } = useMeasuredHeight<HTMLDivElement>();
  const { cardRef, glareRef } = useTilt<HTMLDivElement, HTMLDivElement>();

  /* ---- terminal interactif : actif une fois l'intro terminée ---- */
  const T = TERM[lang];
  const introDone =
    rendered.length === lines.length &&
    Boolean(rendered[lines.length - 1]?.showOutput);

  const [history, setHistory] = useState<HistEntry[]>([]);
  const [cleared, setCleared] = useState(false); // `clear` efface aussi l'intro
  const [past, setPast] = useState<string[]>([]); // commandes tapées (flèches ↑/↓)
  const [pastIdx, setPastIdx] = useState(-1);
  // invite = span contentEditable : le prompt et la saisie coulent comme un vrai
  // texte (retour à la ligne commun), exactement comme les lignes de l'intro.
  const editRef = useRef<HTMLSpanElement>(null);

  const apply = (effect: Effect) => {
    switch (effect.type) {
      case "clear":
        setCleared(true);
        setHistory([]);
        break;
      case "top":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "section":
        document
          .getElementById(effect.id)
          ?.scrollIntoView({ behavior: "smooth" });
        break;
      case "cv":
        window.dispatchEvent(new Event("portfolio:open-cv"));
        break;
      case "theme":
        toggleTheme();
        break;
      case "lang":
        toggleLang();
        break;
    }
  };

  // écrit dans l'invite et replace le curseur à la fin (navigation historique)
  const setPrompt = (txt: string) => {
    const el = editRef.current;
    if (!el) return;
    el.textContent = txt;
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  };

  const submit = () => {
    const el = editRef.current;
    const cmd = (el?.textContent ?? "").trim();
    if (el) el.textContent = "";
    setPastIdx(-1);
    if (!cmd) return;
    setPast((p) => [...p, cmd]);
    const { out, effect } = runCommand(cmd, lang);
    if (effect) apply(effect);
    if (out !== null) setHistory((h) => [...h, { cmd, out }]);
  };

  // Entrée = exécuter ; ↑/↓ = rappel des commandes, comme un vrai shell
  const onKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!past.length) return;
      const idx = pastIdx < 0 ? past.length - 1 : Math.max(0, pastIdx - 1);
      setPastIdx(idx);
      setPrompt(past[idx]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (pastIdx < 0) return;
      const idx = pastIdx + 1;
      if (idx >= past.length) {
        setPastIdx(-1);
        setPrompt("");
      } else {
        setPastIdx(idx);
        setPrompt(past[idx]);
      }
    }
  };

  // colle en texte brut (un terminal n'a ni gras, ni retours à la ligne)
  const onPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain").replace(/\r?\n/g, " ");
    document.execCommand("insertText", false, text);
  };

  // cliquer sur la carte focalise l'invite (desktop uniquement :
  // sur tactile, seul un tap direct sur l'invite ouvre le clavier — opt-in)
  const focusPrompt = () => {
    if (!introDone) return;
    if (window.getSelection()?.toString()) return; // ne pas gêner la sélection
    if (matchMedia("(pointer: fine)").matches) editRef.current?.focus();
  };

  return (
    <section className="items-center max-w-210 container-page py-7 w-full">
      {/* titre principal (h1) pour lecteurs d'écran & SEO ; le terminal animé
          ci-dessous reste le rendu visuel. lines[0].output = nom + rôle localisés */}
      <h1 className="sr-only">{lines[0].output}</h1>
      {/* onClick : simple délégation de focus vers l'invite (pas un contrôle
          interactif en soi — l'input, lui, reste focusable au clavier) */}
      <div
        ref={cardRef}
        onClick={focusPrompt}
        className="relative rounded-xl border border-line dark:border-line/30 bg-base/20 backdrop-blur-[3px] overflow-hidden
                   shadow-[0_18px_45px_-12px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.7),inset_0_12px_28px_-20px_rgba(255,255,255,0.4),inset_0_-1px_0_rgba(0,0,0,0.1),inset_0_-14px_28px_-18px_rgba(0,0,0,0.14)]
                   term-bevel
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

        {/* Corps : min-height = hauteur finale mesurée par le fantôme (l'intro ne
            saute donc pas pendant la frappe), puis le terminal GRANDIT librement
            quand on tape des commandes — pas de scrollbar. +44 = padding + marge */}
        <div
          className="relative p-5 font-mono text-sm leading-relaxed"
          style={{ minHeight: height ? height + 44 : undefined }}
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

          {/* ④ invite réelle : le prompt et la saisie coulent dans un même <p>
              (comme les lignes de l'intro) → ils reviennent à la ligne ensemble.
              Le hint « tape help » s'affiche via ::before quand le span est vide
              (cf. .term-input dans index.css). */}
          {introDone && (
            <p className="wrap-break-word">
              <Prompt path="~/portfolio" />
              <span
                ref={editRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label={T.ariaInput}
                data-hint={past.length ? "" : T.hint}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                spellCheck={false}
                className="term-input outline-none text-ink caret-accent"
              />
            </p>
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
