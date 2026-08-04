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

# Une erreur dans le Caddyfile ne se voit PAS tant que Caddy tourne : il garde
# sa configuration en mémoire et ne relit rien. Elle n'éclate qu'au prochain
# redémarrage — mise à jour du NAS, coupure de courant — et emporte alors tous
# les sites d'un coup. Vécu le 2026-08-04 : un bloc `ntfy` dupliqué entre le
# Caddyfile et conf.d/ dormait depuis des semaines.
#
# On valide donc à chaque déploiement, dans un conteneur jetable : ça marche
# même quand Caddy est déjà à terre, ce qui est justement le cas à réparer.
CADDY_IMG=$(docker compose config --images 2>/dev/null | grep -i caddy | head -1)
if [ -n "${CADDY_IMG:-}" ] && docker image inspect "$CADDY_IMG" >/dev/null 2>&1; then
  echo "→ validation du Caddyfile"
  if ! docker run --rm \
      -v "$REPO/infra/Caddyfile:/etc/caddy/Caddyfile:ro" \
      -v "$REPO/infra/conf.d:/etc/caddy/conf.d:ro" \
      --entrypoint caddy "$CADDY_IMG" \
      validate --config /etc/caddy/Caddyfile >/dev/null 2>&1; then
    echo "✗ Caddyfile invalide — déploiement interrompu. Détail :" >&2
    docker run --rm \
      -v "$REPO/infra/Caddyfile:/etc/caddy/Caddyfile:ro" \
      -v "$REPO/infra/conf.d:/etc/caddy/conf.d:ro" \
      --entrypoint caddy "$CADDY_IMG" \
      validate --config /etc/caddy/Caddyfile 2>&1 | grep -i error >&2
    exit 1
  fi
else
  echo "→ validation du Caddyfile ignorée (image Caddy absente en local)"
fi

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
