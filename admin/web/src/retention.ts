// Échéances RGPD d'un contact, pour affichage dans le CRM.
//
// Les durées reproduisent celles réellement appliquées par la purge
// (backend/src/retention.ts). Elles sont dupliquées ici faute de module commun :
// l'API publique et le CRM sont deux paquets npm distincts, avec leurs propres
// dépendances et leur propre image Docker. ⚠️ Modifier l'une oblige à modifier
// l'autre — sinon le CRM annoncerait une date que la purge ne respecte pas.
//
// Le calcul ne dépend que de `created_at` : inutile de le faire côté SQL, et ça
// évite de toucher aux quatre requêtes de routes/contacts.ts.

const ANONYMIZE_AFTER_YEARS = 1;
const DELETE_AFTER_YEARS = 3;

const DAY_MS = 86_400_000;

export type Expiry = {
  date: Date;
  /** Jours restants (négatif = échéance dépassée, la purge n'est pas encore passée). */
  days: number;
  /** Vrai à moins d'un mois : mérite d'être signalé visuellement. */
  soon: boolean;
};

function expiry(createdAt: string, years: number): Expiry {
  const date = new Date(createdAt);
  date.setFullYear(date.getFullYear() + years);
  const days = Math.ceil((date.getTime() - Date.now()) / DAY_MS);
  return { date, days, soon: days <= 30 };
}

/** Date d'effacement de l'ip et du user-agent (le message, lui, est conservé). */
export const ipErasure = (createdAt: string): Expiry =>
  expiry(createdAt, ANONYMIZE_AFTER_YEARS);

/** Date de suppression définitive de la fiche. */
export const deletion = (createdAt: string): Expiry =>
  expiry(createdAt, DELETE_AFTER_YEARS);

/** « dans 3 jours », « dans 10 mois »… — l'unité s'adapte à l'échéance. */
export function relative(days: number): string {
  const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });
  if (Math.abs(days) < 45) return rtf.format(days, "day");
  const months = Math.round(days / 30.44);
  if (Math.abs(months) < 18) return rtf.format(months, "month");
  return rtf.format(Math.round(days / 365.25), "year");
}

export function fmtDay(d: Date): string {
  return d.toLocaleDateString("fr-FR", { dateStyle: "long" });
}
