# Infra — stack complète du portfolio (sur le NAS)

Toute la stack du portfolio via **Docker Compose** : front, API, base de données, notifications et reverse proxy HTTPS. Voir aussi le [README racine](../README.md).

## Services

| Service | Image | Rôle | Exposition |
| --- | --- | --- | --- |
| **caddy** | `caddy:2-alpine` | Reverse proxy public + **HTTPS auto** (Let's Encrypt) | **8081 (HTTP) / 8443 (HTTPS)** — seule entrée publique |
| **web** | build `../frontend` | Nginx : sert le SPA React et proxy `/api` → `api` | interne uniquement |
| **api** | build `../backend` | API Fastify : valide → PostgreSQL → ntfy | interne uniquement |
| **postgres** | `postgres:17-alpine` | Messages du formulaire (table `contacts`) | interne uniquement |
| **ntfy** | `binwiederhier/ntfy` | Notifications push → 📱 | 8080 (LAN, app ntfy) |

> **Topologie** : seul **Caddy** est public (8081/8443). Le front (`web`), l'API et Postgres ne sont **pas publiés** — ils ne se parlent que par le réseau Docker interne. L'API et le front partageant la même origine (Nginx proxy `/api`), il n'y a **aucun CORS** côté navigateur.

## HTTPS & mise en ligne

- **Caddy** obtient et renouvelle seul le certificat Let's Encrypt (challenge tls-alpn-01), redirige `80→443` et `www`→domaine apex. Config versionnée : [`Caddyfile`](Caddyfile).
- Les ports **80/443 du NAS étant pris** par le nginx système et **8080 par ntfy**, Caddy écoute sur **8081/8443** ; la box redirige (NAT/PAT) le `80/443` public vers eux.
- Les volumes `caddy_data`/`caddy_config` **persistent les certificats** — à ne pas supprimer (rate-limit ACME).

## Déploiement

> Le compose build `../frontend` et `../backend` → **cloner le repo entier** sur le NAS, pas seulement `infra/`.

1. Cloner le repo, puis se placer dans `infra/`.
2. Créer le `.env` à partir de l'exemple et le remplir :
   ```bash
   cp .env.example .env
   nano .env   # Postgres, NTFY_* (base + topic + token), TURNSTILE_SECRET, SITE_URL
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
   docker compose ps      # caddy / web / api / postgres / ntfy → "healthy"
   ```

Mettre à jour ensuite = `git pull` puis `docker compose up -d --build web` (rebuild du service concerné).

## Sécurité (en place)

- **En-têtes** — HSTS + `Permissions-Policy` posés par Caddy ; `X-Frame-Options` / `X-Content-Type-Options` / `Referrer-Policy` par Nginx.
- **Compression** — gzip côté Nginx (`gzip_proxied any`), traversé tel quel par Caddy (`transport { compression off }` + `header_up Accept-Encoding gzip`).
- **Postgres** — jamais publié : joignable seulement par l'API via le réseau interne.
- **ntfy** — auth `deny-all` par défaut : un user + **token** en écriture pour l'API, l'app du téléphone connectée avec ce compte. Topic au nom secret.
- **Anti-bot** — Cloudflare **Turnstile** : Site Key publique dans le front, `TURNSTILE_SECRET` côté API (vérif `siteverify` *fail-closed* → 400 si jeton absent/invalide).
- **`.env` jamais committé** (gitignoré, exclu par `.dockerignore`).

## Notifications sur le téléphone (ntfy)

1. Installer l'app **ntfy** (Android / iOS).
2. Réglages → ajouter le serveur : `http://IP_DU_NAS:8080`, se connecter avec le compte ntfy créé.
3. S'abonner au topic (`NTFY_TOPIC` du `.env`).
4. Test depuis le NAS :
   ```bash
   curl -H "Authorization: Bearer $NTFY_TOKEN" -d "Test" http://localhost:8080/MON_TOPIC
   ```

### iOS

Un serveur ntfy auto-hébergé ne peut pas pousser en arrière-plan sans relais APNs. D'où `NTFY_UPSTREAM_BASE_URL=https://ntfy.sh` dans le compose : seul un « réveil » anonyme transite par ntfy.sh, **le message reste sur le NAS**. (Android n'en a pas besoin.)

## Spécificités NAS & dépannage

- **Pas de `git` sur le NAS** → cloner/pull via conteneur :
  ```bash
  docker run --rm --user "$(id -u):$(id -g)" -v "$PWD/..":/repo alpine/git -c safe.directory=/repo pull
  ```
- **Healthchecks en `127.0.0.1`** (pas `localhost`) : dans un conteneur, `localhost` résout d'abord en IPv6 `::1`, or l'API et Nginx n'écoutent qu'en IPv4 → sinon faux « unhealthy ».
- **Drift local** : si un fichier a été patché à la main sur le NAS, faire `git checkout -- <fichier>` avant un `git pull` pour éviter un conflit.
- **Réseau bridge Docker KO** (plus de sortie internet pour un conteneur fraîchement lancé, ex. `alpine/git pull` → « Could not resolve host ») : ajouter **`--network host`** au `docker run` du pull. Fix durable = redémarrer le service Docker / le NAS (régénère les règles iptables du bridge).

## Vérifications

```bash
# Postgres répond ?
docker compose exec postgres psql -U portfolio -d portfolio -c "\l"

# ntfy répond ?
curl http://localhost:8080/v1/health

# compression active en prod ?
curl -s -D - -H "Accept-Encoding: gzip" https://alexiswallez.fr/ -o /dev/null | grep -i content-encoding
```
