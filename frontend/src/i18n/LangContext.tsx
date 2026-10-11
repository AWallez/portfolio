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

// langue initiale : localStorage si déjà choisi, sinon le français. Pas de
// détection du navigateur : Googlebot se présente en anglais et indexait la
// version EN d'un site visant la France.
// localStorage peut être bloqué (navigation privée stricte, cookies refusés) et
// lever une exception : le site doit marcher quand même, sans retenir le choix.
function detectInitial(): Lang {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem("lang");
  } catch {
    // stockage indisponible : français
  }
  if (saved === "fr" || saved === "en") return saved;
  return "fr";
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(detectInitial);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {
      // choix valable pour cette visite seulement
    }
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
