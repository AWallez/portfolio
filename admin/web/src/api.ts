// Petit client HTTP : cookies de session gérés par le navigateur (même origine).
// Toute réponse 401 déclenche onUnauthorized → retour à l'écran de connexion.

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

async function request<T>(
  method: string,
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : {},
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    // un 401 sur /api/login = mauvais mot de passe, PAS une session expirée :
    // on ne déclenche le retour à l'écran de connexion que pour les autres routes
    if (!url.endsWith("/api/login")) onUnauthorized?.();
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error ?? "unauthorized");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  post: <T>(url: string, body?: unknown) => request<T>("POST", url, body),
  patch: <T>(url: string, body: unknown) => request<T>("PATCH", url, body),
  del: <T>(url: string) => request<T>("DELETE", url),
};

// ---- Types partagés avec l'API ----

export const STATUSES = [
  "non_lu",
  "en_attente",
  "a_recontacter",
  "valide",
  "annule",
] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  non_lu: "Non lu",
  en_attente: "En attente",
  a_recontacter: "À recontacter",
  valide: "Validé",
  annule: "Annulé",
};

// Libellés « jolis » pour les types connus ; les types libres s'affichent tels quels.
const TYPE_LABELS: Record<string, string> = {
  project: "Projet",
  hiring: "Recrutement",
  other: "Autre",
  malt: "Malt",
  linkedin: "LinkedIn",
  telephone: "Téléphone",
};
export function typeLabel(t: string): string {
  return TYPE_LABELS[t] ?? t.charAt(0).toUpperCase() + t.slice(1);
}

// Couleur stable dérivée du nom du type (hash → teinte HSL) : n'importe quel
// type — connu ou créé à la volée — obtient une couleur cohérente et distincte.
export function typeColor(t: string): string {
  // hash FNV-ish (Math.imul = bon brassage) → teinte + saturation variables,
  // pour que deux types proches ne tombent pas sur la même couleur.
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) h = Math.imul(h ^ t.charCodeAt(i), 16777619) >>> 0;
  const hue = h % 360;
  const sat = 60 + ((h >>> 9) % 22); // 60–82 %
  return `hsl(${hue}, ${sat}%, 63%)`;
}

export type Contact = {
  id: number;
  firstname: string;
  lastname: string;
  email: string | null;
  type: string;
  phone: string | null;
  message: string | null;
  status: Status;
  note: string | null;
  created_at: string;
  updated_at: string | null;
  manual: boolean;
  ip?: string | null;
  user_agent?: string | null;
};

export type ContactList = {
  items: Contact[];
  total: number;
  page: number;
  limit: number;
  counts: Record<Status, number>;
};

export type DbInfo = { name: string; label: string; crm: boolean };
export type TableInfo = { name: string; approx_rows: number };
export type TableRows = {
  columns: { name: string; type: string }[];
  rows: Record<string, unknown>[];
  total: number;
  page: number;
  limit: number;
};
