#!/bin/sh
# Déploiement sur le NAS : récupère le code, puis reconstruit les services voulus.
#
#   ./deploy.sh admin        # un service
#   ./deploy.sh web api      # plusieurs
#   ./deploy.sh              # tout : web api admin
#
# Pourquoi un script plutôt que deux commandes : elles ont trois pièges qu'on
# oublie systématiquement depuis un autre dossier —
#   1. le NAS n'a pas de `git`, le pull passe par un conteneur ;
#   2. son bridge Docker est cassé, d'où `--network host` ;
#   3. compose doit tourner DEPUIS infra/, sinon docker-compose.override.yml
#      (image Caddy custom + réseaux média, non versionné) n'est pas chargé.
# Le script se repère tout seul : il marche appelé de n'importe où.

set -eu

REPO=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
SERVICES=${*:-web api admin}

echo "→ dépôt : $REPO"
docker run --rm --network host -w /repo \
  --user "$(id -u):$(id -g)" -v "$REPO:/repo" \
  alpine/git -c safe.directory=/repo pull

cd "$REPO/infra"

# schema.sql est embarqué dans l'image de l'api, et l'admin interroge les
# colonnes qu'il définit → l'api passe en premier, puis la migration, puis le
# reste. Migrer avant de reconstruire l'api rejouerait l'ancien schéma sans
# rien signaler ; reconstruire l'admin avant de migrer le ferait tomber en 500.
case " $SERVICES " in
  *" api "*)
    echo "→ api"
    docker compose up -d --build api
    echo "→ migration du schéma"
    docker compose run --rm api npm run migrate
    ;;
esac

for s in $SERVICES; do
  if [ "$s" != "api" ]; then
    echo "→ $s"
    docker compose up -d --build "$s"
  fi
done

echo
docker compose ps
