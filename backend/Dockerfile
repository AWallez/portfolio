# syntax=docker/dockerfile:1

# ---- étape 1 : compilation (TypeScript → un seul fichier JS, esbuild) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- étape 2 : exécution, dépendances de production seulement ----
# Avant : l'image embarquait tsx, TypeScript et vitest (devDependencies), qui
# recompilaient le TS à chaque démarrage, avec npm en PID 1. Ici, node lance
# directement le JS déjà compilé : image plus légère, moins de mémoire, et le
# SIGTERM de `docker stop` arrive au serveur (cf. server.ts).
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# --chown : le COPY docker préserve les permissions des fichiers SOURCE — sur le
# NAS (perms UGOS restrictives), l'utilisateur non-root ne pouvait plus les lire.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build --chown=node:node /app/dist ./dist
# tourne en utilisateur non-root
USER node
EXPOSE 3001
CMD ["node", "dist/server.js"]

# Commit d'où sort cette image — cf. frontend/Dockerfile pour le pourquoi.
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
