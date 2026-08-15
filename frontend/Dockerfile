# syntax=docker/dockerfile:1

# ---- build : compile le SPA (a besoin de tout le toolchain) ----
FROM node:22-alpine AS build
WORKDIR /app
# couche deps mise en cache tant que les lockfiles ne changent pas
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime : Nginx ne sert QUE dist/ (~1.2 Mo) — pas de node_modules/src ----
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Vite GÉNÈRE index.html et assets/ (donc en 644/755), mais RECOPIE le contenu
# de public/ tel quel, en conservant son mode d'origine. Sur le NAS, l'umask
# UGOS donne 770 aux fichiers du dépôt, et le COPY docker le propage jusqu'ici
# → les workers nginx (utilisateur `nginx`, ni propriétaire ni dans le groupe)
# ne peuvent pas les lire : 403 sur le favicon, l'og-image, robots.txt,
# sitemap.xml et les six fichiers de CV. Même piège que le --chown des
# Dockerfile backend/ et admin/.
# On normalise plutôt qu'on ne --chown : le résultat ne dépend alors ni des
# permissions de la machine de build, ni de l'utilisateur qu'nginx emploie.
# `chmod -R a+rX` ne suffirait pas : le X majuscule ajoute aussi le bit
# d'exécution aux fichiers qui en ont DÉJÀ un, ce qui est le cas ici (770).
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} + \
  && find /usr/share/nginx/html -type f -exec chmod 644 {} +
EXPOSE 80
# 127.0.0.1 (pas localhost) : dans le conteneur, localhost résout d'abord en IPv6
# ::1, or Nginx n'écoute qu'en IPv4 (listen 80) → "connection refused" au healthcheck.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1

# Commit d'où sort cette image (deploy.sh renseigne GIT_SHA). Relu par
# infra/check-drift.sh pour comparer CE QUI TOURNE à ce qu'il y a dans main —
# une intention notée dans un fichier mentirait dès qu'on build à la main.
# En dernier volontairement : la couche est minuscule et le SHA change à chaque
# commit, donc plus haut il invaliderait le cache de `npm ci` et du build.
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
