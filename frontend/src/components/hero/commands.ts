import type { Lang } from "../../i18n/LangContext";
import { TERM } from "../../i18n/hero";

// Interprète du terminal du Hero. Fonction PURE : elle ne fait que décider de
// la réponse et de l'effet à produire (défiler, changer de thème…), que le
// composant applique. On peut ainsi tester chaque commande sans DOM.

export type Effect =
  | { type: "clear" }
  | { type: "top" }
  | { type: "section"; id: string }
  | { type: "cv" }
  | { type: "theme" }
  | { type: "lang" };

/** `out` : lignes à afficher sous la commande ; null = aucune entrée (`clear`). */
export type Result = { out: string[] | null; effect?: Effect };

// alias de sections acceptés (FR + EN) → id de la section à atteindre
const SECTIONS: Record<string, string> = {
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

export function runCommand(raw: string, lang: Lang, now = new Date()): Result {
  const T = TERM[lang];
  const cmd = raw.trim();
  const low = cmd.toLowerCase();
  const goto = (id: string): Result => ({
    out: [T.goto(id)],
    effect: { type: "section", id },
  });

  if (low === "clear") return { out: null, effect: { type: "clear" } };
  if (low === "help" || low === "aide" || low === "?") return { out: T.help };
  if (low === "whoami") return { out: [T.whoami] };
  if (low === "ls" || low.startsWith("ls ")) return { out: [T.ls] };
  if (low === "pwd") return { out: ["~/portfolio"] };
  if (low === "date")
    return { out: [now.toLocaleString(lang === "fr" ? "fr-FR" : "en-US")] };
  if (low.startsWith("echo ")) return { out: [cmd.slice(5)] };
  if (low === "cv") return { out: [T.cv], effect: { type: "cv" } };
  if (low === "theme") return { out: [T.theme], effect: { type: "theme" } };
  if (low === "lang" || low === "lang en" || low === "lang fr") {
    const target = low.endsWith(" en") ? "en" : low.endsWith(" fr") ? "fr" : null;
    if (target === lang) return { out: [T.langSame] };
    // le Hero est remonté (key={lang}) : l'intro rejoue dans l'autre langue
    return { out: [], effect: { type: "lang" } };
  }
  // navigation façon shell : cd <section>, et toute variante de « remonter
  // à la racine ~ » : cd · cd ~ · cd / · cd .. · cd ../ · cd ../.. · cd . · cd - · cd..
  if (low === "cd" || low === "cd.." || low.startsWith("cd ")) {
    const arg = low.startsWith("cd ") ? low.slice(3).trim() : "";
    const key = arg.replace(/^[~/]+/, "").replace(/\/+$/, ""); // ~/x, /x, x/
    if (!key || key === "~" || /^[./-]+$/.test(key))
      return { out: [T.home], effect: { type: "top" } };
    const id = SECTIONS[key];
    return id ? goto(id) : { out: [T.cdErr(arg)] };
  }
  if (SECTIONS[low]) return goto(SECTIONS[low]);
  if (low.includes("coffee") || low.includes("café")) return { out: [T.coffee] };
  if (low.startsWith("rm ")) return { out: [T.rmrf] };
  if (low.startsWith("sudo")) return { out: [T.sudo] };
  if (low === "exit" || low === "logout" || low === "quit")
    return { out: [T.exit] };
  return { out: [T.notFound(cmd)] };
}
