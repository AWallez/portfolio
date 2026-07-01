# Backend — API de contact

API Fastify (TypeScript) qui reçoit le formulaire de contact du portfolio :
**valide → enregistre dans PostgreSQL → notifie via ntfy**.

## Stack

- [Fastify](https://fastify.dev/) + TypeScript (exécuté avec `tsx`)
- PostgreSQL (driver `pg`) — hébergé sur le NAS
- ntfy — notifications push (hébergé sur le NAS)

## Mise en route

```bash
cd backend
npm install
cp .env.example .env       # puis remplir : mot de passe Postgres + topic ntfy secret
npm run migrate            # crée la table 'contacts'
npm run dev                # API sur http://localhost:3001
```

## Variables d'environnement (`.env`)

| Variable      | Exemple                                                        |
| ------------- | ------------------------------------------------------------- |
| `PORT`        | `3001`                                                         |
| `CORS_ORIGIN` | `http://localhost:5173` (plusieurs séparées par des virgules) |
| `DATABASE_URL`| `postgres://portfolio:MDP@192.168.1.XX:55432/portfolio`      |
| `NTFY_URL`    | `http://192.168.1.XX:8080`                                   |
| `NTFY_TOPIC`  | un nom secret, identique à celui suivi dans l'app ntfy        |
| `NTFY_TOKEN`  | token de publication ntfy (auth activée) — vide en dev local  |
| `TURNSTILE_SECRET` | secret Cloudflare Turnstile ; **vide = vérif désactivée** (pratique en dev) |

## Endpoints

- `GET /health` → `{ "status": "ok" }`
- `POST /api/contact` → enregistre + notifie. Corps JSON :
  ```json
  {
    "firstname": "Jean",
    "lastname": "Dupont",
    "email": "jean@exemple.fr",
    "type": "project",
    "message": "Bonjour !"
  }
  ```
  Réponses : `201 { ok: true }` · `400` (validation) · `429` (trop de requêtes).

## Notes

- `type` accepté : `project`, `hiring`, `other`.
- Champ `company` = honeypot anti-spam (laissé vide par les humains).
- La notif ntfy n'est pas bloquante : si elle échoue, le message est quand même enregistré.
- **Anti-bot Turnstile** : si `TURNSTILE_SECRET` est renseigné, le token du formulaire est vérifié côté serveur (`siteverify`, *fail-closed* → `400` si absent/invalide). Laisser vide en dev désactive la vérif.
