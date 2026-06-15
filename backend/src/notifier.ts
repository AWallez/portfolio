import { config } from "./config";

export type ContactNotification = {
  firstname: string;
  lastname: string;
  email: string;
  type: string;
  message: string;
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

  const res = await fetch(config.ntfy.url.replace(/\/$/, ""), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: config.ntfy.topic,
      title: `Nouveau message de ${c.firstname} ${c.lastname}`,
      message: `${when} · ${c.type}\n${c.email}\n\n${c.message}`,
      priority: 4,
      tags: ["envelope"],
    }),
  });

  if (!res.ok) {
    throw new Error(`ntfy a répondu ${res.status}`);
  }
}
