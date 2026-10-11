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

# verrou de compose-auto-update (cf. main)
LOCK=/run/lock/compose-auto-update.lock

# git dans un conteneur : le NAS n'en a pas, et son bridge Docker est cassé
# (d'où --network host). Mêmes options partout, d'où cette fonction.
git_c() {
  docker run --rm --network host -w /repo \
    --user "$(id -u):$(id -g)" -v "$REPO:/repo" \
    alpine/git -c safe.directory=/repo "$@"
}

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

# Le Caddyfile du dépôt diffère-t-il de celui que Caddy utilise ? On compare au
# fichier VU PAR LE CONTENEUR, et non à l'état d'avant le pull : un pull fait à
# part (cas d'un deploy.sh modifié) ne laissait voir aucun changement, et Caddy
# gardait l'ancienne configuration. Caddy arrêté : rien à redémarrer.
caddy_a_change() {
  [ -n "$(docker compose ps -q --status running caddy)" ] || return 1
  en_service=$(docker compose exec -T caddy cat /etc/caddy/Caddyfile | md5sum)
  [ "$en_service" != "$(md5sum < "$REPO/infra/Caddyfile")" ]
}

# Construit puis démarre un service, en gardant de quoi revenir en arrière.
#
# L'image qui tourne est d'abord étiquetée `:previous` : `build` écrase
# `:latest`, et compose-auto-update purge les images sans étiquette, si bien
# qu'il ne restait rien vers quoi revenir. `--wait` attend ensuite que le
# conteneur soit SAIN (healthcheck), là où `up -d` rendait la main aussitôt
# lancé, même si le service tombait dix secondes plus tard. S'il ne devient
# pas sain, l'image précédente est remise et le déploiement s'arrête.
# NB : la migration, elle, n'est pas défaite. Elle n'ajoute que des colonnes et
# des droits, que l'ancienne image ignore.
deploie() {
  s=$1
  img=$(docker compose config --images "$s" | head -1)
  if docker image inspect "$img" >/dev/null 2>&1; then
    docker image tag "$img" "${img%:*}:previous"
  fi
  # ⚠️ `build --pull` et non `up --build` : sans `--pull`, Docker réutilise
  # l'image de base gardée en cache depuis le premier build, et elle n'est
  # jamais rafraîchie. node:22-alpine avait ainsi trois mois de correctifs
  # Alpine de retard au 25/09/2026. Reconstruire le code ne suffit pas.
  # `|| return 1` explicite : appelée dans un `||`, la fonction ne s'arrête
  # plus d'elle-même sur une erreur (set -e y est suspendu). Un build raté
  # aurait sinon relancé l'ancienne image et passé pour un succès.
  docker compose build --pull "$s" || return 1
  if docker compose up -d --no-deps --wait --wait-timeout 120 "$s"; then
    return 0
  fi
  echo "✗ $s ne devient pas sain : retour à l'image précédente" >&2
  docker compose logs --tail 20 "$s" >&2 || true
  if docker image inspect "${img%:*}:previous" >/dev/null 2>&1; then
    docker image tag "${img%:*}:previous" "$img"
    docker compose up -d --no-deps --wait --wait-timeout 120 "$s" \
      && echo "→ $s : image précédente remise en service" >&2
  fi
  return 1
}

main() {
  REPO=$(CDPATH='' cd -- "$(dirname -- "$0")/.." && pwd)
  SERVICES=${*:-web api admin}

  # Verrou partagé avec compose-auto-update : lui aussi reconstruit les images
  # du portfolio et recrée leurs conteneurs. Deux programmes qui recréent le
  # même conteneur en même temps, c'est un état incohérent garanti. On attend
  # donc la fin de sa passe (15 min au plus) ; pendant le déploiement, c'est
  # lui qui refusera de démarrer, et il le signale.
  # ⚠️ On n'ouvre le fichier QUE s'il existe, en lecture : créé par ce script
  # (compte Alex), il deviendrait inouvrable en écriture pour compose-auto-update
  # (root) dans /run/lock, répertoire partagé protégé (fs.protected_regular).
  if [ -e "$LOCK" ]; then
    exec 9<"$LOCK"
    if ! flock -n 9; then
      echo "→ une passe de compose-auto-update est en cours : attente (15 min au plus)"
      flock -w 900 9 || { echo "✗ verrou toujours pris, abandon" >&2; exit 1; }
    fi
  fi

  echo "→ dépôt : $REPO"
  AVANT=$(git_c rev-parse HEAD | tr -d '\r')
  git_c pull

  # Grave le commit dans les images reconstruites (cf. les ARG GIT_SHA des
  # Dockerfile). C'est ce que relit `check-drift.sh` pour savoir si ce qui
  # tourne correspond encore à main — donc à faire APRÈS le pull.
  GIT_SHA=$(git_c rev-parse HEAD | tr -d '\r')
  export GIT_SHA
  echo "→ commit : $GIT_SHA"

  cd "$REPO/infra"
  # Caddyfile invalide : on revient au commit d'avant. S'arrêter ne suffisait
  # pas, le fichier invalide restait sur le disque et attendait le prochain
  # redémarrage de Caddy (mise à jour du NAS, coupure) pour emporter tous les
  # sites. Le dépôt reste en retard sur main jusqu'à ce que le Caddyfile soit
  # corrigé, et check-drift.sh le signale.
  if ! check_caddy "$REPO"; then
    echo "→ retour au commit $AVANT" >&2
    git_c reset -q --hard "$AVANT"
    exit 1
  fi

  # ⚠️ `--no-deps` partout : le script ne touche QU'AUX services qu'on lui
  # donne. Sans lui, `up -d api` peut recréer au passage postgres ou ntfy si
  # leur définition a bougé, sans la copie des données ni le retour arrière
  # que compose-auto-update leur réserve. Chacun son périmètre.

  # Migration AVANT toute reconstruction, à chaque déploiement (idempotente) :
  # elle lit backend/db/ dans le dépôt qu'on vient de tirer, dans un conteneur
  # postgres jetable (service `migrate`), et crée au besoin les comptes dont la
  # nouvelle api ou le nouvel admin vont se servir. Une migration qui échoue
  # arrête tout : rien n'a encore été reconstruit.
  echo "→ migration du schéma et des comptes"
  docker compose run --rm --no-deps migrate

  for s in $SERVICES; do
    echo "→ $s"
    deploie "$s" || exit 1
  done

  # Caddy ne relit jamais son fichier tout seul, et le Caddyfile est monté en
  # fichier seul (cf. docker-compose.yml) : seul un redémarrage lui fait voir
  # le nouveau. Il a été validé plus haut ; on ne redémarre que s'il diffère de
  # celui en service, car Caddy porte tous les sites publics du NAS (coupure
  # d'une seconde).
  if caddy_a_change; then
    echo "→ Caddyfile modifié : redémarrage de caddy"
    docker compose restart caddy
  fi

  echo
  docker compose ps
}

main "$@"
