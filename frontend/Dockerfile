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
EXPOSE 80
# 127.0.0.1 (pas localhost) : dans le conteneur, localhost résout d'abord en IPv6
# ::1, or Nginx n'écoute qu'en IPv4 (listen 80) → "connection refused" au healthcheck.
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
