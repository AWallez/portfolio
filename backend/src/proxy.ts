// trustProxy : derrière Caddy → Nginx, sans ça req.ip vaudrait l'IP interne du
// proxy pour TOUS les visiteurs (rate-limit global partagé au lieu de par IP,
// colonne contacts.ip inutile, remoteip Turnstile faux).
// ⚠️ PAS `true` : confiance aveugle → un bot qui envoie « X-Forwarded-For:
// 127.0.0.1 » se fait enregistrer comme 127.0.0.1 (vécu : toutes les IP de
// contacts étaient en 127.x). Avec cette liste (nos proxys internes seulement),
// Fastify remonte la chaîne XFF depuis la droite et s'arrête sur la première
// IP NON privée = la vraie IP publique vue par Caddy — insensible au spoofing.
export const TRUST_PROXY = [
  "loopback",
  "10.0.0.0/8",
  "172.16.0.0/12",
  "192.168.0.0/16",
];
