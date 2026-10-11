import { useState, useEffect, useRef } from "react";
import {
  User,
  IdCard,
  Mail,
  Phone,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import { getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { useTheme } from "../hooks/useTheme";
import { LEGAL_PATHS } from "../lib/routes";
import Select from "./Select";

type Status = "idle" | "sending" | "sent" | "error";
// Cause d'un échec d'envoi, chacune avec son message : le visiteur sait s'il
// doit attendre, réessayer ou écrire directement.
type SendError =
  | "errCaptcha" // vérification anti-robot refusée par le serveur
  | "errCaptchaBlocked" // script Cloudflare bloqué (bloqueur) : jamais de jeton
  | "errRate" // 429 : trop d'envois en une minute
  | "errServer" // 5xx, ou réponse inattendue
  | "errNetwork"; // le serveur n'a pas répondu du tout
type Fields = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  phone: string; // optionnel (non requis dans validate)
  message: string;
};
// On garde la CLÉ de traduction, pas le texte : une erreur affichée suit
// ainsi le changement de langue.
type FieldError = "errRequired" | "errEmail" | "errType" | "errPhone";
type Errors = Partial<Record<keyof Fields, FieldError>>;

const CONTACT_EMAIL = "wallezalexis@gmail.com";
// causes où réessayer ne suffira pas : le message se termine par l'adresse
const WITH_EMAIL: SendError[] = ["errCaptchaBlocked", "errServer", "errNetwork"];

const EMPTY: Fields = {
  firstname: "",
  lastname: "",
  email: "",
  type: "",
  phone: "",
  message: "",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// URL de l'API : vide en prod (même origine) ; http://localhost:3001 en dev (.env.development)
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

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

export default function Contact() {
  const { lang } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [sendError, setSendError] = useState<SendError>("errServer");
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  // honeypot : champ invisible que seuls les bots remplissent
  const [trap, setTrap] = useState("");
  // pays courant du champ tél. → placeholder d'exemple correspondant à la région
  const [country, setCountry] = useState<Country>("FR");
  const phonePlaceholder = getExampleNumber(country, examples)?.formatNational();
  // anti-bot Turnstile : token récupéré quand le widget se valide (managed → auto)
  const [captchaToken, setCaptchaToken] = useState("");
  // script Cloudflare introuvable : l'envoi part quand même (le serveur décide),
  // mais un refus est alors expliqué par le blocage, avec l'adresse en secours
  const [captchaBlocked, setCaptchaBlocked] = useState(false);
  // Le widget affiche-t-il réellement quelque chose ? Turnstile injecte TOUJOURS un
  // iframe (invisible en `interaction-only`), donc `:empty` ne suffit pas. On mesure
  // la hauteur réelle du widget plutôt que de se fier aux callbacks
  // `before/after-interactive` : au chargement, le widget entre puis ressort
  // brièvement du mode interactif, ce qui faisait clignoter le cadre.
  const [captchaVisible, setCaptchaVisible] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // n'injecte Turnstile (script tiers Cloudflare) que lorsque la section contact
  // approche du viewport → page initiale plus légère et console propre au démarrage
  const [armed, setArmed] = useState(false);

  // thème courant (le widget Turnstile est rendu clair ou sombre comme le site)
  const dark = useTheme().theme === "dark";

  // arme le chargement Turnstile quand la section approche (300 px avant) — une fois
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
  }, [armed]);

  // n'habille le widget que s'il occupe vraiment de la place à l'écran. On mesure
  // l'ENFANT (l'iframe) et non le conteneur : sa hauteur ne dépend pas du cadre
  // qu'on ajoute, donc pas de boucle observateur → style → observateur.
  useEffect(() => {
    const el = widgetRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const child = el.firstElementChild;
      setCaptchaVisible(
        !!child && child.getBoundingClientRect().height > 20,
      );
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // (re)rend le widget Turnstile en suivant la langue (i18n) et le thème du site
  useEffect(() => {
    if (!armed) return;
    let cancelled = false;
    loadTurnstile().then(() => {
      if (cancelled || !widgetRef.current || !window.turnstile) return;
      setCaptchaBlocked(false);
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: dark ? "dark" : "light", // calé sur le thème clair/sombre du site
        language: lang, // FR/EN selon le sélecteur du header
        appearance: "interaction-only", // discret : visible seulement si défi nécessaire
        // `flexible` : le widget épouse la largeur du formulaire (aligné sur les
        // champs). Son intérieur n'est pas stylable (iframe cross-origin).
        size: "flexible",
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    }, () => {
      if (!cancelled) setCaptchaBlocked(true);
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [armed, lang, dark]);

  // styles réutilisés pour les champs. Focus : contour de 2 px (la bordure de
  // 1 px qui changeait de couleur ne se voyait presque pas, alors que la
  // validation y envoie le focus). Placeholder en `text-muted` plein : à 50 %,
  // il tombait à 2,2:1 de contraste en thème clair.
  const field =
    "w-full rounded-lg border bg-surface/70 px-3 py-2 text-ink " +
    "placeholder:text-muted outline-none focus:outline-2 focus:outline-offset-1 transition";
  // label avec petite icône lucide (raccord avec les badges du site)
  const label = "font-mono text-xs text-muted mb-1 flex items-center gap-1.5";
  const labelIcon = "text-accent shrink-0";

  function validate(v: Fields): Errors {
    const e: Errors = {};
    if (!v.firstname.trim()) e.firstname = "errRequired";
    if (!v.lastname.trim()) e.lastname = "errRequired";
    if (!v.email.trim()) e.email = "errRequired";
    else if (!EMAIL_RE.test(v.email)) e.email = "errEmail";
    if (!v.type) e.type = "errType";
    // téléphone optionnel : on ne valide que s'il est renseigné
    if (v.phone && !isValidPhoneNumber(v.phone)) e.phone = "errPhone";
    if (!v.message.trim()) e.message = "errRequired";
    return e;
  }

  function setField(name: keyof Fields, value: string) {
    setValues((v) => ({ ...v, [name]: value }));
    // efface l'erreur du champ dès que l'utilisateur le corrige
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (trap) {
      // bot détecté : on simule un succès sans rien envoyer
      setStatus("sent");
      return;
    }
    const found = validate(values);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      // focus le premier champ invalide (ordre visuel)
      const order: (keyof Fields)[] = [
        "firstname",
        "lastname",
        "email",
        "phone",
        "type",
        "message",
      ];
      const first = order.find((k) => found[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setStatus("sending");
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, cfTurnstileToken: captchaToken }),
      });
    } catch {
      return fail("errNetwork");
    }
    if (res.ok) return setStatus("sent");
    if (res.status === 429) return fail("errRate");
    const body = (await res.json().catch(() => null)) as {
      error?: string;
    } | null;
    if (res.status === 400 && body?.error === "captcha")
      return fail(captchaBlocked ? "errCaptchaBlocked" : "errCaptcha");
    fail("errServer");
  }

  function fail(cause: SendError) {
    setSendError(cause);
    setStatus("error");
    // réarme le widget anti-bot pour permettre une nouvelle tentative
    if (widgetIdRef.current && window.turnstile)
      window.turnstile.reset(widgetIdRef.current);
    setCaptchaToken("");
  }

  const fieldClass = (name: keyof Fields, extra = "") =>
    field +
    (errors[name]
      ? " border-red-500/70 focus:border-red-500 focus:outline-red-500"
      : " border-line focus:border-accent focus:outline-accent") +
    (extra ? ` ${extra}` : "");
  // message d'erreur d'un champ : rouge foncé en thème clair (red-500 en 12 px
  // ne faisait que 3,4:1)
  const errText = "mt-1 text-xs text-red-700 dark:text-red-400";

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="max-w-300 container-page py-7"
    >
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("contact", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("contact", "command", lang)}
      </p>

      <div className="min-h-125 flex flex-col justify-center">
        {/* annonces pour lecteurs d'écran (envoi / succès) */}
        <p className="sr-only" role="status" aria-live="polite">
          {status === "sending" && t("contact", "sendingStatus", lang)}
          {status === "sent" && t("contact", "success", lang)}
        </p>

        {status === "sent" ? (
          /* écran de succès façon terminal : la commande a tourné, exit 0 */
          <div className="w-full max-w-105 mx-auto rounded-xl border border-line bg-base/60 backdrop-blur-[3px] shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-line">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="ml-2 font-mono text-[11px] text-muted">
                alexis@wallez:~/contact$
              </span>
            </div>
            <div className="p-5 font-mono text-sm space-y-1.5">
              <p className="wrap-break-word">
                <span className="text-accent">$ </span>
                <span className="text-ink">./contact.sh</span>
              </p>
              <p className="text-accent wrap-break-word">
                ✓ {t("contact", "success", lang)}
              </p>
              <p className="text-xs text-muted">exit 0</p>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="card-bevel no-glow w-full max-w-150 mx-auto rounded-xl border border-line bg-base/60 backdrop-blur-[3px] p-6 space-y-4"
          >
            {/* honeypot anti-spam : hors écran et hors tabulation */}
            <div aria-hidden className="absolute left-[-9999px]">
              <label htmlFor="company">Company</label>
              <input
                id="company"
                name="company"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={trap}
                onChange={(e) => setTrap(e.target.value)}
              />
            </div>

            {/* légende des champs requis */}
            <p className="font-mono text-xs text-muted">
              <span aria-hidden="true" className="text-accent">*</span>{" "}
              {t("contact", "required", lang)}
            </p>

            {/* Prénom + Nom côte à côte */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="firstname">
                  <User size={12} aria-hidden className={labelIcon} />
                  {t("contact", "firstname", lang)}
                  <span aria-hidden="true" className="text-accent"> *</span>
                </label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  autoComplete="given-name"
                  maxLength={100}
                  placeholder={t("contact", "phFirst", lang)}
                  value={values.firstname}
                  onChange={(e) => setField("firstname", e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.firstname}
                  aria-describedby={
                    errors.firstname ? "err-firstname" : undefined
                  }
                  className={fieldClass("firstname")}
                />
                {errors.firstname && (
                  <p id="err-firstname" className={errText}>
                    {t("contact", errors.firstname, lang)}
                  </p>
                )}
              </div>

              {/* Type de demande */}
              <div>
                <label className={label} htmlFor="lastname">
                  <IdCard size={12} aria-hidden className={labelIcon} />
                  {t("contact", "lastname", lang)}
                  <span aria-hidden="true" className="text-accent"> *</span>
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  autoComplete="family-name"
                  maxLength={100}
                  placeholder={t("contact", "phLast", lang)}
                  value={values.lastname}
                  onChange={(e) => setField("lastname", e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.lastname}
                  aria-describedby={
                    errors.lastname ? "err-lastname" : undefined
                  }
                  className={fieldClass("lastname")}
                />
                {errors.lastname && (
                  <p id="err-lastname" className={errText}>
                    {t("contact", errors.lastname, lang)}
                  </p>
                )}
              </div>
            </div>

            {/* Email + Téléphone (optionnel) côte à côte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="email">
                  <Mail size={12} aria-hidden className={labelIcon} />
                  {t("contact", "email", lang)}
                  <span aria-hidden="true" className="text-accent"> *</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  spellCheck={false}
                  placeholder={t("contact", "phEmail", lang)}
                  value={values.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-required="true"
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                  className={fieldClass("email")}
                />
                {errors.email && (
                  <p id="err-email" className={errText}>
                    {t("contact", errors.email, lang)}
                  </p>
                )}
              </div>
              <div>
                <label className={label} htmlFor="phone">
                  <Phone size={12} aria-hidden className={labelIcon} />
                  {t("contact", "phone", lang)}
                </label>
                <PhoneInput
                  defaultCountry="FR"
                  limitMaxLength
                  // drapeaux servis depuis notre domaine (copiés dans public/flags/)
                  // au lieu de l'hôte tiers GitHub Pages par défaut (requête externe
                  // peu fiable). Chargés à la demande : seul le pays affiché est requis.
                  flagUrl="/flags/{XX}.svg"
                  placeholder={phonePlaceholder}
                  value={values.phone || undefined}
                  onChange={(v) => setField("phone", v ?? "")}
                  onCountryChange={(c) => c && setCountry(c)}
                  numberInputProps={{
                    id: "phone",
                    "aria-invalid": !!errors.phone,
                    "aria-describedby": errors.phone ? "err-phone" : undefined,
                  }}
                  className={errors.phone ? "phone-invalid" : ""}
                />
                {errors.phone && (
                  <p id="err-phone" className={errText}>
                    {t("contact", errors.phone, lang)}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={label} htmlFor="type" id="type-label">
                <ClipboardList size={12} aria-hidden className={labelIcon} />
                {t("contact", "reqType", lang)}
                <span aria-hidden="true" className="text-accent"> *</span>
              </label>
              {/* liste déroulante maison (cf. Select.tsx) : rendue dans la page,
                  donc stylable — un <select> natif délègue son popup à l'OS */}
              <Select
                id="type"
                labelledBy="type-label"
                value={values.type}
                onChange={(v) => setField("type", v)}
                options={[
                  { value: "project", label: t("contact", "optProject", lang) },
                  { value: "hiring", label: t("contact", "optHiring", lang) },
                  { value: "other", label: t("contact", "optOther", lang) },
                ]}
                required
                invalid={!!errors.type}
                describedBy={errors.type ? "err-type" : undefined}
                className={fieldClass("type", "min-h-10.5")}
              />
              {errors.type && (
                <p id="err-type" className={errText}>
                  {t("contact", errors.type, lang)}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className={label} htmlFor="message">
                <MessageSquare size={12} aria-hidden className={labelIcon} />
                {t("contact", "message", lang)}
                <span aria-hidden="true" className="text-accent"> *</span>
              </label>
              <textarea
                id="message"
                name="message"
                placeholder={t("contact", "phMessage", lang)}
                maxLength={5000}
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "err-message" : undefined}
                className={fieldClass("message") + " resize-y min-h-50"}
              />
              {errors.message && (
                <p id="err-message" className={errText}>
                  {t("contact", errors.message, lang)}
                </p>
              )}
            </div>

            {/* Erreur d'envoi : un message par cause ; l'adresse en secours
                quand réessayer ne suffira pas */}
            {status === "error" && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-700 dark:text-red-400"
              >
                {t("contact", sendError, lang)}
                {WITH_EMAIL.includes(sendError) && (
                  <>
                    {" "}
                    <a
                      href={`mailto:${CONTACT_EMAIL}`}
                      className="font-medium underline underline-offset-2"
                    >
                      {CONTACT_EMAIL}
                    </a>
                  </>
                )}
              </p>
            )}

            {/* Widget anti-bot Turnstile — invisible la plupart du temps.
                `empty:hidden` : aucun cadre tant que Cloudflare n'affiche rien.
                Quand il apparaît, il est encadré comme les autres champs pour
                faire partie du formulaire (seul l'extérieur est stylable). */}
            <div
              ref={widgetRef}
              className={
                // Pleine largeur (widget en `size: flexible`), habillage identique
                // aux champs (cf. `field`) quand le widget est visible.
                // `leading-[0]` : l'iframe du widget vit dans un shadow DOM (hors de
                // portée de notre CSS) et s'aligne sur la ligne de base du texte →
                // ~6 px d'espace fantôme sous elle (place des jambages) qui faisaient
                // dépasser le cadre. line-height s'hérite à travers le shadow DOM.
                // `[&>div]:w-full` : la div injectée par Turnstile (hôte du shadow
                // DOM, en DOM clair → stylable) doit s'étirer pour que le widget
                // `flexible` remplisse vraiment le formulaire.
                "empty:hidden leading-[0] [&>div]:w-full " +
                (captchaVisible
                  ? "rounded-lg border border-line bg-surface/70 p-2"
                  : "")
              }
            />

            {/* Bouton : lift + halo accent au survol, flèche qui glisse (façon badges) */}
            <button
              type="submit"
              disabled={status === "sending"}
              className="group w-full font-mono text-sm px-4 py-2.5 rounded-lg
                         bg-accent text-base font-medium transition
                         hover:-translate-y-0.5 hover:opacity-95
                         hover:shadow-[0_8px_22px_-6px_color-mix(in_srgb,var(--accent)_55%,transparent)]
                         disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none
                         motion-reduce:hover:translate-y-0"
            >
              {status === "sending" ? (
                t("contact", "sending", lang)
              ) : status === "error" ? (
                t("contact", "retry", lang)
              ) : (
                <>
                  <span
                    aria-hidden
                    className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                  >
                    →
                  </span>{" "}
                  {t("contact", "send", lang)}
                </>
              )}
            </button>

            {/* RGPD art. 13 : la personne doit être informée AU MOMENT où elle
                saisit ses données, pas seulement dans une page qu'elle ne lira
                pas. D'où l'essentiel en clair ici, et le détail derrière le lien. */}
            <p className="text-xs text-muted leading-relaxed">
              {t("contact", "rgpdNotice", lang)}{" "}
              {/* souligné en permanence : la couleur seule ne suffit pas à
                  distinguer un lien (WCAG 1.4.1) */}
              <a
                href={LEGAL_PATHS.privacy}
                className="text-accent underline underline-offset-2"
              >
                {t("contact", "rgpdLink", lang)}
              </a>
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
