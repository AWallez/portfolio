import { useState } from "react";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";

export default function Contact() {
  const { lang } = useLang();
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");

  // styles réutilisés pour les champs
  const field =
    "w-full rounded-lg border border-line bg-surface/70 px-3 py-2 text-ink " +
    "placeholder:text-muted focus:border-accent focus:outline-none transition";
  const label = "font-mono text-xs text-muted mb-1 block";

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setStatus("sending");
    // TODO Phase 2 : envoyer vers l'API Node → PostgreSQL
    await new Promise((r) => setTimeout(r, 1000)); // simulation
    setStatus("sent");
  }

  return (
    <section
      id="contact"
      className="max-w-300 mx-auto px-5 sm:px-6 lg:px-8 py-7"
    >
      <h2 className="font-mono text-sm text-accent mb-2 text-readable w-fit">
        <span className="text-muted">//</span> {t("contact", "title", lang)}
      </h2>
      <p className="font-mono text-xs text-muted mb-8 text-readable w-fit">
        <span className="text-accent">alexis@wallez</span>
        <span className="text-muted">:~$ </span>
        {t("contact", "command", lang)}
      </p>

      <div className="max-w-150 mx-auto min-h-125 flex flex-col justify-center">
        {status === "sent" ? (
          <div className="rounded-xl border border-accent/40 bg-accent/5 p-6 text-center shadow-sm backdrop-blur-xs">
            {" "}
            <p className="text-accent font-mono">
              ✓ {t("contact", "success", lang)}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-line bg-base/45 backdrop-blur-[2px] p-6 space-y-4 shadow-sm"
          >
            {" "}
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
                  required
                  className={field}
                />
              </div>
              <div>
                <label className={label} htmlFor="lastname">
                  {t("contact", "lastname", lang)}
                </label>
                <input
                  id="lastname"
                  name="lastname"
                  type="text"
                  required
                  className={field}
                />
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
                required
                className={field}
              />
            </div>
            {/* Type de demande */}
            <div>
              <label className={label} htmlFor="type">
                {t("contact", "reqType", lang)}
              </label>
              <select
                id="type"
                name="type"
                required
                className={field}
                defaultValue=""
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
            </div>
            {/* Message */}
            <div>
              <label className={label} htmlFor="message">
                {t("contact", "message", lang)}
              </label>
              <textarea
                id="message"
                name="message"
                required
                className={field + " resize-y min-h-50"}
              />
            </div>
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
                : `→ ${t("contact", "send", lang)}`}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
