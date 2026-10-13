import { useState, useRef } from "react";
import {
  User,
  IdCard,
  Mail,
  Phone,
  ClipboardList,
  MessageSquare,
} from "lucide-react";
import PhoneInput, { type Country } from "react-phone-number-input";
import { getExampleNumber } from "libphonenumber-js";
import examples from "libphonenumber-js/examples.mobile.json";
import { useLang } from "../i18n/LangContext";
import { t } from "../i18n/translations";
import { useTheme } from "../hooks/useTheme";
import { useTurnstile } from "../hooks/useTurnstile";
import { LEGAL_PATHS } from "../lib/routes";
import {
  CONTACT_EMAIL,
  EMPTY,
  FIELD_ORDER,
  WITH_EMAIL,
  sendContact,
  validate,
  type Errors,
  type Fields,
  type SendError,
} from "../lib/contactForm";
import Select from "./Select";
import SectionHeader from "./SectionHeader";
import FormField from "./contact/FormField";
import { fieldClass } from "./contact/fieldClass";

type Status = "idle" | "sending" | "sent" | "error";

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
  const sectionRef = useRef<HTMLElement>(null);
  // widget anti-robot, rendu clair ou sombre comme le site. Destructuré :
  // react-hooks/refs interdit de lire une propriété d'un objet contenant un
  // ref pendant le rendu.
  const {
    widgetRef: captchaRef,
    token: captchaToken,
    blocked: captchaBlocked,
    visible: captchaVisible,
    reset: resetCaptcha,
  } = useTurnstile(sectionRef, lang, useTheme().theme === "dark");

  // message d'erreur traduit d'un champ (undefined s'il est valide)
  const errorOf = (name: keyof Fields) => {
    const key = errors[name];
    return key && t("contact", key, lang);
  };
  // attributs ARIA d'un contrôle : invalide, relié à son message d'erreur
  const aria = (name: keyof Fields) => ({
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `err-${name}` : undefined,
  });

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
      const first = FIELD_ORDER.find((k) => found[k]);
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setStatus("sending");
    const result = await sendContact(values, captchaToken, captchaBlocked);
    if (result === "sent") return setStatus("sent");
    setSendError(result);
    setStatus("error");
    resetCaptcha();
  }

  return (
    // l'ancre #contact est portée par le conteneur (cf. QuandProche dans App)
    <section
      ref={sectionRef}
      className="max-w-300 container-page py-7"
    >
      <SectionHeader section="contact" />

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
            onSubmit={(e) => void handleSubmit(e)}
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
              <FormField
                id="firstname"
                icon={User}
                label={t("contact", "firstname", lang)}
                required
                error={errorOf("firstname")}
              >
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
                  {...aria("firstname")}
                  className={fieldClass(!!errors.firstname)}
                />
              </FormField>

              <FormField
                id="lastname"
                icon={IdCard}
                label={t("contact", "lastname", lang)}
                required
                error={errorOf("lastname")}
              >
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
                  {...aria("lastname")}
                  className={fieldClass(!!errors.lastname)}
                />
              </FormField>
            </div>

            {/* Email + Téléphone (optionnel) côte à côte */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                id="email"
                icon={Mail}
                label={t("contact", "email", lang)}
                required
                error={errorOf("email")}
              >
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
                  {...aria("email")}
                  className={fieldClass(!!errors.email)}
                />
              </FormField>

              <FormField
                id="phone"
                icon={Phone}
                label={t("contact", "phone", lang)}
                error={errorOf("phone")}
              >
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
                  numberInputProps={{ id: "phone", ...aria("phone") }}
                  className={errors.phone ? "phone-invalid" : ""}
                />
              </FormField>
            </div>

            <FormField
              id="type"
              labelId="type-label"
              icon={ClipboardList}
              label={t("contact", "reqType", lang)}
              required
              error={errorOf("type")}
            >
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
                className={fieldClass(!!errors.type, "min-h-10.5")}
              />
            </FormField>

            <FormField
              id="message"
              icon={MessageSquare}
              label={t("contact", "message", lang)}
              required
              error={errorOf("message")}
            >
              <textarea
                id="message"
                name="message"
                placeholder={t("contact", "phMessage", lang)}
                maxLength={5000}
                value={values.message}
                onChange={(e) => setField("message", e.target.value)}
                aria-required="true"
                {...aria("message")}
                className={fieldClass(!!errors.message, "resize-y min-h-50")}
              />
            </FormField>

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
              ref={captchaRef}
              className={
                // Pleine largeur (widget en `size: flexible`), habillage identique
                // aux champs (cf. `fieldClass`) quand le widget est visible.
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
