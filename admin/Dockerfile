# syntax=docker/dockerfile:1

# ---- étape 1 : build du front (web/dist) ----
FROM node:22-alpine AS webbuild
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ .
RUN npm run build

# ---- étape 2 : runtime (tsx, même patron que backend/) ----
FROM node:22-alpine
WORKDIR /app
# NODE_ENV n'est PAS posé avant npm ci, sinon tsx (devDependency) serait omis.
# --chown : le COPY préserve les perms source (restrictives sur le NAS) → sans
# ça, l'utilisateur non-root ne peut pas lire les fichiers (EACCES au démarrage).
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node src ./src
COPY --chown=node:node databases.json ./
COPY --from=webbuild --chown=node:node /web/dist ./web/dist
ENV NODE_ENV=production
USER node
EXPOSE 3002
CMD ["npm", "start"]
