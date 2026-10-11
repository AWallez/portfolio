# syntax=docker/dockerfile:1

# ---- étape 1 : build du front (web/dist) ----
FROM node:22-alpine AS webbuild
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# ---- étape 2 : compilation du serveur (TypeScript → un seul fichier JS) ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
RUN npm run build

# ---- étape 3 : exécution, dépendances de production seulement ----
# Même patron que backend/ : plus de tsx ni de TypeScript dans l'image, node
# lance le JS compilé et reçoit le SIGTERM de `docker stop`.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# --chown : le COPY préserve les perms source (restrictives sur le NAS) → sans
# ça, l'utilisateur non-root ne peut pas lire les fichiers (EACCES au démarrage).
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
# dist/server.js lit ../databases.json et sert ../web/dist (cf. config.ts,
# server.ts) : mêmes chemins relatifs que depuis src/
COPY --chown=node:node databases.json ./
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=webbuild --chown=node:node /web/dist ./web/dist
USER node
EXPOSE 3002
CMD ["node", "dist/server.js"]

# Commit d'où sort cette image — cf. frontend/Dockerfile pour le pourquoi.
ARG GIT_SHA=unknown
LABEL org.opencontainers.image.revision=$GIT_SHA
