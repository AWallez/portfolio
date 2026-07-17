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
COPY package.json package-lock.json ./
RUN npm ci
COPY src ./src
COPY databases.json ./
COPY --from=webbuild /web/dist ./web/dist
ENV NODE_ENV=production
USER node
EXPOSE 3002
CMD ["npm", "start"]
