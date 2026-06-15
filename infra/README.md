# Infra — Postgres + ntfy (sur le NAS)

Stack de données et de notifications du portfolio, à faire tourner sur le NAS via Docker.

- **postgres** : stocke les messages du formulaire de contact (table `contacts`).
- **ntfy** : serveur de notifications push → tu reçois chaque message sur ton téléphone.

> **Ports** : Postgres est publié sur **5433** côté NAS (le 5432 est déjà pris par la base
> interne d'UGOS), ntfy sur **8080**. Depuis le PC de dev : `postgres://...@IP_NAS:5433/...`.

## Déploiement

1. Copier le dossier `infra/` sur le NAS (ou cloner le repo).
2. Créer le `.env` à partir de l'exemple et le remplir :
   ```bash
   cp .env.example .env
   nano .env   # mot de passe Postgres fort + NTFY_BASE_URL avec l'IP du NAS
   ```
3. Lancer :
   ```bash
   docker compose up -d
   docker compose ps      # vérifier que les 2 services sont "healthy"
   ```

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

## Sécurité (à garder en tête)

- **Postgres (5432)** est exposé sur le LAN pour le dev. OK sur un réseau domestique ;
  ne pas exposer ce port sur Internet. En prod, l'API tournera sur le NAS et parlera à
  Postgres via le réseau Docker interne (port non publié).
- **ntfy** : par défaut, qui connaît le topic peut publier/lire. Pour le v1 on s'appuie
  sur un **topic au nom secret**. Durcissement possible plus tard : activer l'auth ntfy
  (`NTFY_AUTH_DEFAULT_ACCESS=deny-all` + token pour l'API).
- Mot de passe Postgres fort, et `.env` jamais committé (déjà gitignoré).
