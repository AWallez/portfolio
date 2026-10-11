import { config } from "./config";

export type ContactNotification = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  phone?: string | null;
  message: string;
  /** message NON enregistré en base (PostgreSQL en panne) : la notification
   *  est alors la seule trace, à recopier dans le CRM */
  unsaved?: boolean;
};

// Envoie une notification push via ntfy (format JSON → gère les accents/UTF-8).
// Abstrait volontairement : on pourra ajouter un canal email plus tard sans toucher aux routes.
export async function notifyContact(c: ContactNotification): Promise<void> {
  // date + heure formatées en heure de Paris
  const when = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Paris",
  }).format(new Date());

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  // ntfy protégé par auth (deny-all) → on s'authentifie avec un token si configuré.
  if (config.ntfy.token) {
    headers.Authorization = `Bearer ${config.ntfy.token}`;
  }

  const res = await fetch(config.ntfy.url.replace(/\/$/, ""), {
    method: "POST",
    headers,
    body: JSON.stringify({
      topic: config.ntfy.topic,
      title: `${c.unsaved ? "⚠️ Non enregistré · " : ""}${c.firstname} ${c.lastname}`,
      message: `${when} · ${c.type}\n${c.email}${c.phone ? " · " + c.phone : ""}\n\n${c.message}`,
      priority: 4,
      tags: ["envelope"],
    }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!res.ok) {
    throw new Error(`ntfy a répondu ${res.status}`);
  }
}
