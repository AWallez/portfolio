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

## Rétention RGPD

Le RGPD interdit de conserver une donnée personnelle indéfiniment (art. 5.1.e).
`src/retention.ts` applique deux durées, distinctes parce que les champs n'ont
pas la même finalité :

| Donnée | Durée | Action | Pourquoi |
| --- | --- | --- | --- |
| `ip`, `user_agent` | **1 an** | mises à `NULL` | collectées pour l'anti-spam ; cette finalité s'éteint bien avant l'intérêt du message |
| la ligne entière | **3 ans** après le dernier échange | `DELETE` | durée de référence CNIL en prospection |

La purge tourne **dans l'API** : une passe au démarrage (le conteneur peut avoir
été arrêté plusieurs jours), puis une fois par jour. Pas de cron à maintenir sur
le NAS, et elle suit le conteneur partout où il tourne. Une erreur SQL est
journalisée sans faire tomber l'API.

Le délai de suppression court depuis `COALESCE(updated_at, created_at)` :
répondre via le CRM relance le compteur, sinon un échange en cours serait effacé
au 3ᵉ anniversaire du premier message.

⚠️ Ces durées sont **annoncées aux visiteurs** dans
`frontend/src/i18n/legal.ts` : modifier l'une oblige à modifier l'autre.

## Notes

- `type` accepté : `project`, `hiring`, `other`.
- Champ `company` = honeypot anti-spam (laissé vide par les humains).
- La notif ntfy n'est pas bloquante : si elle échoue, le message est quand même enregistré.
- **Anti-bot Turnstile** : si `TURNSTILE_SECRET` est renseigné, le token du formulaire est vérifié côté serveur (`siteverify`, *fail-closed* → `400` si absent/invalide). Laisser vide en dev désactive la vérif.
