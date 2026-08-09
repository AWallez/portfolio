#!/bin/sh
# Prévient quand ce qui TOURNE sur le NAS n'est plus ce qu'il y a dans main.
#
#   ./check-drift.sh            # contrôle + notification ntfy si l'état a changé
#   ./check-drift.sh --dry-run  # affiche l'état, n'envoie rien
#
# Posé en cron toutes les 15 min. Il ne déploie RIEN : le déploiement reste
# manuel et volontaire (décision assumée), ce script ne fait que fermer son seul
# vrai défaut — pousser un commit et oublier de le mettre en ligne.
#
# Pourquoi comparer par service et pas à la tête de main : `deploy.sh web` ne
# reconstruit que le front. Comparer chaque service à la tête de main ferait
# passer l'api pour périmée dès qu'un commit touche le front, et des alertes
# systématiquement fausses finissent ignorées — donc inutiles.
#
# Pourquoi relire un LABEL d'image plutôt qu'un fichier écrit au déploiement :
# le label est une OBSERVATION de ce qui tourne, un fichier serait une intention
# déclarée. Un build lancé à la main hors deploy.sh rendrait le second faux sans
# que rien ne le signale.

set -eu

REPO=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
STATE="$REPO/infra/.drift-state" # gitignoré
DRY=${1:-}

git_c() {
  docker run --rm --network host -w /repo \
    --user "$(id -u):$(id -g)" -v "$REPO:/repo" \
    alpine/git -c safe.directory=/repo "$@"
}

# Le .env contient des `$$` (échappement compose du hash bcrypt) : le sourcer
# les casserait. On extrait donc uniquement les deux clés utiles.
env_val() { grep -E "^$1=" "$REPO/infra/.env" 2>/dev/null | head -1 | cut -d= -f2- || true; }

notify() { # $1 = titre, $2 = tags, $3 = corps
  topic=$(env_val NTFY_TOPIC)
  token=$(env_val NTFY_TOKEN)
  [ -n "$topic" ] || { echo "✗ NTFY_TOPIC introuvable dans infra/.env" >&2; return 1; }
  curl -sS -o /dev/null \
    ${token:+-H "Authorization: Bearer $token"} \
    -H "Title: $1" -H "Tags: $2" \
    -d "$3" "http://127.0.0.1:8080/$topic"
}

git_c fetch --quiet origin

report=""  # lignes lisibles pour la notification
signature="" # état compact, comparé au passage précédent
stale=0

# name | conteneur | chemin surveillé
while read -r name container path; do
  [ -n "$name" ] || continue

  want=$(git_c log -1 --format=%H origin/main -- "$path" | tr -d '\r')
  got=$(docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' \
    "$container" 2>/dev/null | tr -d '\r' || echo absent)
  case "$got" in "" | "<no value>") got=unknown ;; esac

  if [ "$got" = "$want" ]; then
    signature="$signature $name=ok"
  elif [ "$got" = absent ]; then
    signature="$signature $name=absent"
    stale=1
    report="$report
  $name : conteneur absent"
  else
    # nombre de commits en retard SUR CE CHEMIN ; « ? » si le SHA gravé est
    # inconnu de l'historique (image d'avant l'ajout du label, ou rebase)
    n=$(git_c rev-list --count "$got..origin/main" -- "$path" 2>/dev/null | tr -d '\r' || echo '?')
    signature="$signature $name=stale"
    stale=1
    report="$report
  $name : $n commit(s) non déployé(s)"
  fi
done <<EOF
web portfolio-web frontend
api portfolio-api backend
admin portfolio-admin admin
EOF

# Caddy est un cas à part : pas d'image maison, sa config est bind-montée et il
# ne la RELIT JAMAIS une fois démarré. Une erreur de Caddyfile y dort donc
# jusqu'au prochain redémarrage, où elle emporte tous les sites d'un coup
# (vécu le 04/08/2026). On compare des dates : le conteneur a-t-il démarré
# après le dernier commit touchant infra/ ?
started=$(docker inspect --format '{{.State.StartedAt}}' portfolio-caddy 2>/dev/null || echo '')
if [ -z "$started" ]; then
  signature="$signature caddy=absent"
  stale=1
  report="$report
  caddy : conteneur absent"
else
  last=$(git_c log -1 --format=%ct origin/main -- infra | tr -d '\r')
  # `date -d` échouerait sur un format inattendu : on ne veut pas casser le
  # contrôle des autres services pour autant.
  if started_ts=$(date -d "$started" +%s 2>/dev/null); then
    if [ "$last" -gt "$started_ts" ]; then
      signature="$signature caddy=stale"
      stale=1
      report="$report
  caddy : tourne sur une config antérieure au dernier commit infra/"
    else
      signature="$signature caddy=ok"
    fi
  else
    signature="$signature caddy=inconnu"
  fi
fi

signature=$(echo "$signature" | sed 's/^ *//')
previous=$(cat "$STATE" 2>/dev/null || echo '')

if [ "$DRY" = "--dry-run" ]; then
  echo "état    : $signature"
  echo "précédent: ${previous:-(aucun)}"
  [ "$stale" -eq 1 ] && echo "détail  :$report"
  exit 0
fi

# On ne notifie QUE les transitions. Sinon une alerte identique toutes les 15
# minutes devient du bruit qu'on apprend à ignorer, et le jour où elle compte
# vraiment on ne la lit plus.
if [ "$signature" = "$previous" ]; then
  exit 0
fi

if [ "$stale" -eq 1 ]; then
  notify "Site pas à jour" "package,warning" "Services en retard sur main :$report

Déployer : /volume1/docker/portfolio/infra/deploy.sh"
else
  notify "Tout est à jour" "white_check_mark" "Les 4 services correspondent à main."
fi

printf '%s\n' "$signature" > "$STATE"
