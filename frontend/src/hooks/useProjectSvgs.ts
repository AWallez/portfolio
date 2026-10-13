import { useEffect, useState } from "react";
import { useLang, type Lang } from "../i18n/LangContext";
import { useTheme } from "./useTheme";
import {
  chargerSvg,
  svgCharge,
  type Theme,
  type Variante,
} from "../lib/projectSvgs";

// Une fois la page au repos, on précharge les visuels de l'autre thème et de
// l'autre langue : changer l'un ou l'autre reste alors instantané.
// (Safari n'a pas requestIdleCallback : un délai le remplace)
const auRepos = (fn: () => void) => {
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(fn, { timeout: 3000 });
  else setTimeout(fn, 1500);
};

/**
 * Visuels des projets pour le thème, la langue et le format courants.
 * Tant qu'un visuel n'est pas arrivé, on garde le précédent (jamais de vide
 * au changement) ; au tout premier affichage, `undefined` (place réservée).
 */
export function useProjectSvgs(assets: string[], vertical: boolean) {
  const { lang } = useLang();
  const theme: Theme = useTheme().theme === "dark" ? "dark" : "light";
  const cle = assets.join(",");
  // derniers visuels affichés, gardés pendant le chargement des suivants
  const [affiches, setAffiches] = useState<Record<string, string>>({});

  useEffect(() => {
    const liste = cle.split(",");
    const v: Variante = { theme, lang, vertical };
    let actif = true;
    Promise.all(liste.map((a) => chargerSvg(a, v))).then((svgs) => {
      if (!actif) return;
      setAffiches((prec) => {
        const suite = { ...prec };
        liste.forEach((a, i) => {
          const svg = svgs[i];
          if (svg !== undefined) suite[a] = svg;
        });
        return suite;
      });
      // l'autre thème et l'autre langue, sans gêner la page. Pas les deux à la
      // fois : chaque fichier se compresse moins bien seul, et précharger les
      // quatre jeux finirait par peser plus que l'ancien paquet unique.
      const autreTheme: Theme = theme === "dark" ? "light" : "dark";
      const autreLang: Lang = lang === "fr" ? "en" : "fr";
      auRepos(() => {
        for (const w of [
          { theme: autreTheme, lang, vertical },
          { theme, lang: autreLang, vertical },
        ])
          for (const a of liste) void chargerSvg(a, w);
      });
    });
    return () => {
      actif = false;
    };
  }, [cle, theme, lang, vertical]);

  // le visuel courant s'il est en cache (changement instantané), sinon le
  // dernier affiché en attendant
  const v: Variante = { theme, lang, vertical };
  return (asset: string): string | undefined =>
    svgCharge(asset, v) ?? affiches[asset];
}
