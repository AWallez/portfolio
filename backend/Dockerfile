# syntax=docker/dockerfile:1

FROM node:22-alpine
WORKDIR /app
# deps (tsx inclus : l'app tourne en TS via tsx, pas de build séparé).
# NODE_ENV n'est PAS posé ici, sinon npm ci omettrait tsx (devDependency).
# --chown : le COPY docker préserve les permissions des fichiers SOURCE — sur le
# NAS (perms UGOS restrictives), l'utilisateur non-root ne pouvait plus les lire.
COPY --chown=node:node package.json package-lock.json ./
RUN npm ci
COPY --chown=node:node . .
# production seulement au runtime (après l'install des deps)
ENV NODE_ENV=production
# tourne en utilisateur non-root
USER node
EXPOSE 3001
CMD ["npm", "start"]
