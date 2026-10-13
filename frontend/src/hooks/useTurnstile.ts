import { useEffect, useRef, useState, type RefObject } from "react";
import type { Lang } from "../i18n/LangContext";

// Clé de site Turnstile (publique) — widget anti-bot protégeant l'envoi du formulaire.
const TURNSTILE_SITE_KEY = "0x4AAAAAADouXa_GUdi-_H_E";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
  }
}

// Charge le script Turnstile une seule fois (à la demande, quand Contact est monté).
// Rejette si le script est bloqué (bloqueur de publicité, réseau filtré) : sans
// ça, le visiteur réessayait en boucle sans jamais obtenir de jeton.
let turnstileLoading: Promise<void> | null = null;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  turnstileLoading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "true";
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => {
      s.remove();
      turnstileLoading = null; // une prochaine visite de la section retentera
      reject(new Error("turnstile bloqué"));
    });
    document.head.appendChild(s);
  });
  return turnstileLoading;
}

/**
 * Widget anti-robot Cloudflare Turnstile. Le script tiers n'est chargé que
 * lorsque `sectionRef` approche de l'écran (300 px avant), puis le widget suit
 * la langue et le thème du site.
 */
export function useTurnstile(
  sectionRef: RefObject<HTMLElement | null>,
  lang: Lang,
  dark: boolean,
) {
  // token récupéré quand le widget se valide (managed → auto)
  const [token, setToken] = useState("");
  // script Cloudflare introuvable : l'envoi part quand même (le serveur décide),
  // mais un refus est alors expliqué par le blocage, avec l'adresse en secours
  const [blocked, setBlocked] = useState(false);
  // Le widget affiche-t-il réellement quelque chose ? Turnstile injecte TOUJOURS un
  // iframe (invisible en `interaction-only`), donc `:empty` ne suffit pas. On mesure
  // la hauteur réelle du widget plutôt que de se fier aux callbacks
  // `before/after-interactive` : au chargement, le widget entre puis ressort
  // brièvement du mode interactif, ce qui faisait clignoter le cadre.
  const [visible, setVisible] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [armed, setArmed] = useState(false);

  // arme le chargement quand la section approche (300 px avant) — une fois
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || armed) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [armed, sectionRef]);

  // n'habille le widget que s'il occupe vraiment de la place à l'écran. On mesure
  // l'ENFANT (l'iframe) et non le conteneur : sa hauteur ne dépend pas du cadre
  // qu'on ajoute, donc pas de boucle observateur → style → observateur.
  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const child = el.firstElementChild;
      setVisible(!!child && child.getBoundingClientRect().height > 20);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (re)rend le widget en suivant la langue (i18n) et le thème du site
  useEffect(() => {
    if (!armed) return;
    let cancelled = false;
    loadTurnstile().then(
      () => {
        if (cancelled || !widgetRef.current || !window.turnstile) return;
        setBlocked(false);
        widgetIdRef.current = window.turnstile.render(widgetRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: dark ? "dark" : "light", // calé sur le thème clair/sombre du site
          language: lang, // FR/EN selon le sélecteur du header
          appearance: "interaction-only", // discret : visible seulement si défi nécessaire
          // `flexible` : le widget épouse la largeur du formulaire (aligné sur les
          // champs). Son intérieur n'est pas stylable (iframe cross-origin).
          size: "flexible",
          callback: (t: string) => setToken(t),
          "expired-callback": () => setToken(""),
          "error-callback": () => setToken(""),
        });
      },
      () => {
        if (!cancelled) setBlocked(true);
      },
    );
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [armed, lang, dark]);

  // réarme le widget pour permettre une nouvelle tentative
  const reset = () => {
    if (widgetIdRef.current && window.turnstile)
      window.turnstile.reset(widgetIdRef.current);
    setToken("");
  };

  return { widgetRef, token, blocked, visible, reset };
}
