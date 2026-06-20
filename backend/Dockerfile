# syntax=docker/dockerfile:1

FROM node:22-alpine
WORKDIR /app
# deps (tsx inclus : l'app tourne en TS via tsx, pas de build séparé).
# NODE_ENV n'est PAS posé ici, sinon npm ci omettrait tsx (devDependency).
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# production seulement au runtime (après l'install des deps)
ENV NODE_ENV=production
# tourne en utilisateur non-root
USER node
EXPOSE 3001
CMD ["npm", "start"]
