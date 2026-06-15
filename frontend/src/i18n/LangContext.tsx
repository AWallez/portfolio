/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Lang = "fr" | "en";
type LangCtx = { lang: Lang; toggle: () => void };

const Ctx = createContext<LangCtx | null>(null);

// langue initiale : localStorage si déjà choisi, sinon celle du navigateur
function detectInitial(): Lang {
  const saved = localStorage.getItem("lang");
  if (saved === "fr" || saved === "en") return saved;
  return navigator.language.toLowerCase().startsWith("fr") ? "fr" : "en";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectInitial);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang; // bon pour le SEO + l'accessibilité
  }, [lang]);

  const toggle = () => setLang((l) => (l === "fr" ? "en" : "fr"));

  return <Ctx.Provider value={{ lang, toggle }}>{children}</Ctx.Provider>;
}

// hook pour lire la langue depuis n'importe quel composant
export function useLang() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useLang doit être utilisé dans <LangProvider>");
  return ctx;
}
