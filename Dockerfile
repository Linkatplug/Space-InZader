# Space InZader — image de production
# Étape 1 : build (tests + bundle Vite) ; étape 2 : nginx sert dist/

# ---------- Étape 1 : build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Dépendances d'abord (cache Docker tant que package*.json ne change pas)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Sources
COPY . .

# Les tests doivent passer, sinon l'image n'est pas construite
RUN npm test

# Bundle de production → /app/dist
RUN npx vite build

# ---------- Étape 2 : serveur ----------
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
