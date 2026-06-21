import { useState, useEffect, useRef } from "react";
import PhoneInput, {
  isValidPhoneNumber,
  type Country,
} from "react-phone-number-input";
import { getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

type Status = "idle" | "sending" | "sent" | "error";
type Fields = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  phone: string; // optionnel (non requis dans validate)
  message: string;
};
type Errors = Partial<Record<keyof Fields, string>>;

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
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(
    "script[data-turnstile]",
  );
  if (existing)
    return new Promise((r) => existing.addEventListener("load", () => r()));
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.dataset.turnstile = "true";
    s.addEventListener("load", () => resolve());
    document.head.appendChild(s);
  });
}

export default function Contact() {
  const { lang } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  // honeypot : champ invisible que seuls les bots remplissent
  const [trap, setTrap] = useState("");
  // pays courant du champ tél. → placeholder d'exemple correspondant à la région
  const [country, setCountry] = useState<Country>("FR");
  const phonePlaceholder = getExampleNumber(country, examples)?.formatNational();
  // anti-bot Turnstile : token récupéré quand le widget se valide (managed → auto)
  const [captchaToken, setCaptchaToken] = useState("");
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTurnstile().then(() => {
      if (cancelled || !widgetRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(widgetRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: "auto",
        callback: (token: string) => setCaptchaToken(token),
        "expired-callback": () => setCaptchaToken(""),
        "error-callback": () => setCaptchaToken(""),
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, []);

  // styles réutilisés pour les champs
  const field =
    "w-full rounded-lg border bg-surface/70 px-3 py-2 text-ink " +
    "placeholder:text-muted focus:outline-none transition";
  const label = "font-mono text-xs text-muted mb-1 block";

  function validate(v: Fields): Errors {
    const e: Errors = {};
    if (!v.firstname.trim()) e.firstname = t("contact", "errRequired", lang);
    if (!v.lastname.trim()) e.lastname = t("contact", "errRequired", lang);
    if (!v.email.trim()) e.email = t("contact", "errRequired", lang);
    else if (!EMAIL_RE.test(v.email)) e.email = t("contact", "errEmail", lang);
    if (!v.type) e.type = t("contact", "errType", lang);
    // téléphone optionnel : on ne valide que s'il est renseigné
    if (v.phone && !isValidPhoneNumber(v.phone))
      e.phone = t("contact", "errPhone", lang);
    if (!v.message.trim()) e.message = t("contact", "errRequired", lang);
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
    try {
      const res = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, cfTurnstileToken: captchaToken }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus("sent");
    } catch {
      setStatus("error");
      // réarme le widget anti-bot pour permettre une nouvelle tentative
      if (widgetIdRef.current && window.turnstile)
        window.turnstile.reset(widgetIdRef.current);
      setCaptchaToken("");
    }
  }

  const fieldClass = (name: keyof Fields, extra = "") =>
    field +
    (errors[name]
      ? " border-red-500/70 focus:border-red-500"
      : " border-line focus:border-accent") +
    (extra ? ` ${extra}` : "");

  return (
    <section id="contact" className="max-w-300 container-page py-7">
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("contact", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("contact", "command", lang)}
      </p>

      <div className="max-w-150 mx-auto min-h-125 flex flex-col justify-center">
        {/* annonces pour lecteurs d'écran (envoi / succès) */}
        <p className="sr-only" role="status" aria-live="polite">
          {status === "sending" && t("contact", "sendingStatus", lang)}
          {status === "sent" && t("contact", "success", lang)}
        </p>

        {status === "sent" ? (
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-6 text-center shadow-sm backdrop-blur-xs">
            <p className="text-accent font-mono">
              ✓ {t("contact", "success", lang)}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-xl border border-line bg-base/60 backdrop-blur-[3px] p-6 space-y-4 shadow-sm"
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
                  {t("contact", "firstname", lang)}
                  <span aria-hidden="true" className="text-accent"> *</span>
                </label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  autoComplete="given-name"
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
                  <p id="err-firstname" className="mt-1 text-xs text-red-500">
                    {errors.firstname}
                  </p>
                )}
              </div>

              {/* Type de demande */}
              <div>
                <label className={label} htmlFor="lastname">
                  {t("contact", "lastname", lang)}
                  <span aria-hidden="true" className="text-accent"> *</span>
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  autoComplete="family-name"
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
                  <p id="err-lastname" className="mt-1 text-xs text-red-500">
                    {errors.lastname}
                  </p>
                )}
              </div>
            </div>

            {/* Email + Téléphone (optionnel) côte à côte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="email">
                  {t("contact", "email", lang)}
                  <span aria-hidden="true" className="text-accent"> *</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
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
                  <p id="err-email" className="mt-1 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label className={label} htmlFor="phone">
                  {t("contact", "phone", lang)}
                </label>
                <PhoneInput
                  defaultCountry="FR"
                  limitMaxLength
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
                  <p id="err-phone" className="mt-1 text-xs text-red-500">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={label} htmlFor="type">
                {t("contact", "reqType", lang)}
                <span aria-hidden="true" className="text-accent"> *</span>
              </label>
              <select
                id="type"
                name="type"
                value={values.type}
                onChange={(e) => setField("type", e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? "err-type" : undefined}
                className={fieldClass("type", "min-h-10.5")}
              >
                <option value="" disabled>
                  —
                </option>
                <option value="project">
                  {t("contact", "optProject", lang)}
                </option>
                <option value="hiring">
                  {t("contact", "optHiring", lang)}
                </option>
                <option value="other">{t("contact", "optOther", lang)}</option>
              </select>
              {errors.type && (
                <p id="err-type" className="mt-1 text-xs text-red-500">
                  {errors.type}
                </p>
              )}
            </div>

            {/* Message */}
            <div>
              <label className={label} htmlFor="message">
                {t("contact", "message", lang)}
                <span aria-hidden="true" className="text-accent"> *</span>
              </label>
              <textarea
                id="message"
                name="message"
                placeholder={t("contact", "phMessage", lang)}
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
                aria-required="true"
                aria-invalid={!!errors.message}
                aria-describedby={errors.message ? "err-message" : undefined}
                className={fieldClass("message") + " resize-y min-h-50"}
              />
              {errors.message && (
                <p id="err-message" className="mt-1 text-xs text-red-500">
                  {errors.message}
                </p>
              )}
            </div>

            {/* Erreur d'envoi (réseau / serveur) */}
            {status === "error" && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/40 bg-red-500/5 px-3 py-2 text-sm text-red-500"
              >
                {t("contact", "error", lang)}
              </p>
            )}

            {/* widget anti-bot Turnstile (invisible la plupart du temps) */}
            <div ref={widgetRef} className="flex justify-center empty:hidden" />

            {/* Bouton */}
            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full font-mono text-sm px-4 py-2.5 rounded-lg
                         bg-accent text-base font-medium
                         hover:opacity-90 disabled:opacity-60 transition"
            >
              {status === "sending"
                ? t("contact", "sending", lang)
                : status === "error"
                  ? t("contact", "retry", lang)
                  : `→ ${t("contact", "send", lang)}`}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
