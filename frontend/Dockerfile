# Multi-stage build : Build React + Serve avec Nginx

# Stage 1 : Build de l'application React
FROM node:26-alpine as builder

WORKDIR /build

# Copier package.json et package-lock.json pour cache Docker
COPY package*.json ./

# Installer TOUTES les dépendances (y compris devDependencies pour le build)
# vite, @vitejs/plugin-react, etc. sont nécessaires pour npm run build
RUN npm ci

# Copier le code source
COPY public/ ./public/
COPY src/ ./src/
COPY index.html ./
COPY vite.config.js ./
# IMPORTANT: Copier .env.production pour que Vite utilise VITE_API_URL=/api
COPY .env.production ./

# Build de production
RUN npm run build

# Stage 2 : Serveur Nginx pour production
FROM nginx:alpine as production

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés depuis le stage builder
COPY --from=builder /build/dist /usr/share/nginx/html

# Créer un script d'entrypoint pour configurer l'API URL au runtime
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Générer env-config.js avec les variables d'\''environnement' >> /docker-entrypoint.sh && \
    echo 'cat > /usr/share/nginx/html/env-config.js <<EOF' >> /docker-entrypoint.sh && \
    echo 'window.ENV = {' >> /docker-entrypoint.sh && \
    echo '  VITE_API_URL: "${VITE_API_URL:-http://localhost:8000/api}"' >> /docker-entrypoint.sh && \
    echo '};' >> /docker-entrypoint.sh && \
    echo 'EOF' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'exec "$@"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Exposer le port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Démarrer Nginx avec l'entrypoint
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
