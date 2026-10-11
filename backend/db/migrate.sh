#!/bin/sh
# Applique le schéma, puis les comptes applicatifs et leurs droits.
#
# Tourne dans un conteneur postgres jetable : `docker compose run --rm --no-deps
# migrate` (service `migrate` d'infra/docker-compose.yml, lancé par deploy.sh).
# Connexion sous le compte propriétaire via PGHOST/PGUSER/PGPASSWORD/PGDATABASE ;
# roles.sql lit les mots de passe des comptes dans API_DB_PASSWORD et
# ADMIN_DB_PASSWORD (\getenv). Aucun secret ne passe sur une ligne de commande.
set -eu
# les « already exists, skipping » des CREATE … IF NOT EXISTS noient le reste
export PGOPTIONS="-c client_min_messages=warning"
psql -v ON_ERROR_STOP=1 -q -f /db/schema.sql
psql -v ON_ERROR_STOP=1 -q -f /db/roles.sql
echo "✓ schéma et comptes appliqués"
