import { isValidPhoneNumber } from "react-phone-number-input";

// Logique du formulaire de contact, sans React : validation et envoi.
// Séparée du composant pour être testée directement.

export type Fields = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  phone: string; // optionnel (non requis dans validate)
  message: string;
};
// On garde la CLÉ de traduction, pas le texte : une erreur affichée suit
// ainsi le changement de langue.
export type FieldError = "errRequired" | "errEmail" | "errType" | "errPhone";
export type Errors = Partial<Record<keyof Fields, FieldError>>;

// Cause d'un échec d'envoi, chacune avec son message : le visiteur sait s'il
// doit attendre, réessayer ou écrire directement.
export type SendError =
  | "errCaptcha" // vérification anti-robot refusée par le serveur
  | "errCaptchaBlocked" // script Cloudflare bloqué (bloqueur) : jamais de jeton
  | "errRate" // 429 : trop d'envois en une minute
  | "errServer" // 5xx, ou réponse inattendue
  | "errNetwork"; // le serveur n'a pas répondu du tout

export const CONTACT_EMAIL = "wallezalexis@gmail.com";
// causes où réessayer ne suffira pas : le message se termine par l'adresse
export const WITH_EMAIL: SendError[] = [
  "errCaptchaBlocked",
  "errServer",
  "errNetwork",
];

export const EMPTY: Fields = {
  firstname: "",
  lastname: "",
  email: "",
  type: "",
  phone: "",
  message: "",
};
// ordre visuel des champs : le focus va au premier invalide
export const FIELD_ORDER: (keyof Fields)[] = [
  "firstname",
  "lastname",
  "email",
  "phone",
  "type",
  "message",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(v: Fields): Errors {
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

// URL de l'API : vide en prod (même origine) ; http://localhost:3001 en dev (.env.development)
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "";

/**
 * Envoie le message. Renvoie "sent" ou la cause de l'échec.
 * `captchaBlocked` : le script anti-robot n'a jamais pu se charger, un refus
 * du serveur s'explique alors par le blocage et non par un échec du défi.
 */
export async function sendContact(
  values: Fields,
  token: string,
  captchaBlocked: boolean,
): Promise<"sent" | SendError> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, cfTurnstileToken: token }),
    });
  } catch {
    return "errNetwork";
  }
  if (res.ok) return "sent";
  if (res.status === 429) return "errRate";
  const body = (await res.json().catch(() => null)) as {
    error?: string;
  } | null;
  if (res.status === 400 && body?.error === "captcha")
    return captchaBlocked ? "errCaptchaBlocked" : "errCaptcha";
  return "errServer";
}
