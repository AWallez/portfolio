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
#
# ⚠️ Tout le corps vit dans main(), appelée en dernière ligne. Ce n'est pas un
# style : le `git pull` ci-dessous RÉÉCRIT CE FICHIER pendant son exécution, or
# `sh` lit un script au fil de l'eau, par position dans le fichier. Sans ce
# découpage, l'interpréteur reprendrait sa lecture à un décalage devenu faux et
# exécuterait n'importe quoi. Enfermé dans une fonction, le corps est analysé
# en entier avant que la moindre commande ne tourne.

set -eu

# Valide la configuration Caddy dans un conteneur jetable.
#
# Une erreur de Caddyfile ne se voit PAS tant que Caddy tourne : il garde sa
# configuration en mémoire et ne relit jamais le fichier. Elle n'éclate qu'au
# redémarrage suivant — mise à jour du NAS, coupure de courant — et emporte
# alors tous les sites d'un coup. Vécu le 2026-08-04 : un bloc `ntfy` dupliqué
# entre le Caddyfile et conf.d/ dormait depuis des semaines.
#
# Conteneur jetable et non `docker exec` : ça doit marcher même quand Caddy est
# déjà à terre, ce qui est précisément la situation à réparer.
check_caddy() {
  repo=$1
  img=$(docker compose config --images 2>/dev/null | grep -i caddy | head -1)
  if [ -z "${img:-}" ] || ! docker image inspect "$img" >/dev/null 2>&1; then
    echo "→ validation du Caddyfile ignorée (image Caddy absente en local)"
    return 0
  fi
  echo "→ validation du Caddyfile"
  out=$(docker run --rm \
    -v "$repo/infra/Caddyfile:/etc/caddy/Caddyfile:ro" \
    -v "$repo/infra/conf.d:/etc/caddy/conf.d:ro" \
    --entrypoint caddy "$img" \
    validate --config /etc/caddy/Caddyfile 2>&1) && return 0
  echo "✗ Caddyfile invalide — déploiement interrompu :" >&2
  echo "$out" | grep -i error >&2 || echo "$out" >&2
  return 1
}

main() {
  REPO=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
  SERVICES=${*:-web api admin}

  echo "→ dépôt : $REPO"
  docker run --rm --network host -w /repo \
    --user "$(id -u):$(id -g)" -v "$REPO:/repo" \
    alpine/git -c safe.directory=/repo pull

  cd "$REPO/infra"
  check_caddy "$REPO"

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
}

main "$@"
