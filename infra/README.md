# Infra — stack complète du portfolio (sur le NAS)

Toute la stack du portfolio via Docker Compose.

- **web** : Nginx qui sert le SPA (build du `frontend/`) et proxy `/api` → `api`.
- **api** : API Fastify (`backend/`) — enregistre les messages et publie sur ntfy.
- **postgres** : stocke les messages du formulaire de contact (table `contacts`).
- **ntfy** : serveur de notifications push → chaque message arrive sur ton téléphone.

> **Ports** : `web` est publié sur **`${WEB_PORT}` (8088 par défaut)** — c'est là qu'on
> branche le reverse proxy + HTTPS d'UGOS (→ `alexiswallez.fr`). `api` n'est **pas exposé**
> (joignable seulement par Nginx → même origine, zéro CORS). Postgres reste sur **55432**
> (dev), ntfy sur **8080**.

## Déploiement

> Le compose build `../frontend` et `../backend` → **cloner le repo entier** sur le NAS
> (pas seulement `infra/`).

1. Sur le NAS : `git clone <repo> && cd portfolio/infra`
2. Créer le `.env` et le remplir :
   ```bash
   cp .env.example .env
   nano .env   # Postgres fort, NTFY_BASE_URL + NTFY_TOPIC, SITE_URL, WEB_PORT
   ```
3. Build + démarrage :
   ```bash
   docker compose up -d --build
   ```
4. **Une seule fois** — créer le schéma Postgres (table `contacts`) :
   ```bash
   docker compose run --rm api npm run migrate
   ```
5. Vérifier que tout est sain :
   ```bash
   docker compose ps      # postgres / ntfy / api / web → "healthy"
   ```
6. Brancher le reverse proxy + HTTPS d'UGOS sur `http://IP_NAS:${WEB_PORT}`.

## Vérifications

```bash
# Postgres répond ?
docker exec -it portfolio-postgres psql -U portfolio -d portfolio -c "\l"

# ntfy répond ?
curl http://localhost:8080/v1/health
```

## Recevoir les notifs sur le téléphone

1. Installer l'app **ntfy** (Android / iOS).
2. Réglages → ajouter le serveur : `http://IP_DU_NAS:8080`.
3. S'abonner au topic du formulaire (le même que celui configuré dans l'API backend,
   ex. un nom secret et difficile à deviner).
4. Test depuis le NAS :
   ```bash
   curl -d "Test depuis le NAS" http://localhost:8080/MON_TOPIC_SECRET
   ```
   → la notif doit arriver sur le téléphone.

## iOS

Sur iPhone, un serveur ntfy auto-hébergé ne peut pas pousser en arrière-plan sans relais
APNs. D'où `NTFY_UPSTREAM_BASE_URL=https://ntfy.sh` dans le compose : seul un « réveil »
anonyme transite par ntfy.sh, le message reste sur le NAS. (Android n'en a pas besoin.)

## Sécurité (à garder en tête)

- **Postgres (5432)** est exposé sur le LAN pour le dev. OK sur un réseau domestique ;
  ne pas exposer ce port sur Internet. En prod, l'API tournera sur le NAS et parlera à
  Postgres via le réseau Docker interne (port non publié).
- **ntfy** : par défaut, qui connaît le topic peut publier/lire. Pour le v1 on s'appuie
  sur un **topic au nom secret**. Durcissement possible plus tard : activer l'auth ntfy
  (`NTFY_AUTH_DEFAULT_ACCESS=deny-all` + token pour l'API).
- Mot de passe Postgres fort, et `.env` jamais committé (déjà gitignoré).
