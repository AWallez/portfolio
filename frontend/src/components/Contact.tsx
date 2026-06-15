import { useState } from "react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

type Status = "idle" | "sending" | "sent" | "error";
type Fields = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  message: string;
};
type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
  firstname: "",
  lastname: "",
  email: "",
  type: "",
  message: "",
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Contact() {
  const { lang } = useLang();
  const [status, setStatus] = useState<Status>("idle");
  const [values, setValues] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  // honeypot : champ invisible que seuls les bots remplissent
  const [trap, setTrap] = useState("");

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
      return;
    }
    setStatus("sending");
    try {
      // TODO Phase 2 : remplacer par l'appel réel à l'API Node → PostgreSQL
      // await fetch("/api/contact", { method: "POST", headers: {...}, body: JSON.stringify(values) })
      await new Promise((r) => setTimeout(r, 1000)); // simulation
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const fieldClass = (name: keyof Fields) =>
    field +
    (errors[name]
      ? " border-red-500/70 focus:border-red-500"
      : " border-line focus:border-accent");

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
            className="rounded-xl border border-line bg-base/45 backdrop-blur-[2px] p-6 space-y-4 shadow-sm"
          >
            {/* honeypot anti-spam : hors écran et hors tabulation */}
            <div aria-hidden className="absolute -left-[9999px]" >
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

            {/* Prénom + Nom côte à côte */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label} htmlFor="firstname">
                  {t("contact", "firstname", lang)}
                </label>
                <input
                  id="firstname"
                  name="firstname"
                  type="text"
                  autoComplete="given-name"
                  value={values.firstname}
                  onChange={(e) => setField("firstname", e.target.value)}
                  aria-invalid={!!errors.firstname}
                  aria-describedby={errors.firstname ? "err-firstname" : undefined}
                  className={fieldClass("firstname")}
                />
                {errors.firstname && (
                  <p id="err-firstname" className="mt-1 text-xs text-red-500">
                    {errors.firstname}
                  </p>
                )}
              </div>
              <div>
                <label className={label} htmlFor="lastname">
                  {t("contact", "lastname", lang)}
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  autoComplete="family-name"
                  value={values.lastname}
                  onChange={(e) => setField("lastname", e.target.value)}
                  aria-invalid={!!errors.lastname}
                  aria-describedby={errors.lastname ? "err-lastname" : undefined}
                  className={fieldClass("lastname")}
                />
                {errors.lastname && (
                  <p id="err-lastname" className="mt-1 text-xs text-red-500">
                    {errors.lastname}
                  </p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={label} htmlFor="email">
                {t("contact", "email", lang)}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={(e) => setField("email", e.target.value)}
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

            {/* Type de demande */}
            <div>
              <label className={label} htmlFor="type">
                {t("contact", "reqType", lang)}
              </label>
              <select
                id="type"
                name="type"
                value={values.type}
                onChange={(e) => setField("type", e.target.value)}
                aria-invalid={!!errors.type}
                aria-describedby={errors.type ? "err-type" : undefined}
                className={fieldClass("type")}
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
              </label>
              <textarea
                id="message"
                name="message"
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
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
