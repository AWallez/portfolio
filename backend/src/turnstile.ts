import { config } from "./config";

// Vérifie un jeton Cloudflare Turnstile (anti-bot).
// - Pas de secret configuré → on ne bloque pas (dégradation propre).
// - Secret configuré mais jeton manquant/invalide/erreur réseau → refus (fail-closed).
export async function verifyTurnstile(
  token: string | undefined,
  ip?: string,
): Promise<boolean> {
  if (!config.turnstileSecret) return true;
  if (!token) return false;

  const body = new URLSearchParams({
    secret: config.turnstileSecret,
    response: token,
  });
  if (ip) body.append("remoteip", ip);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
