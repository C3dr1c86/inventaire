#!/bin/sh

# Script d'entrée Docker pour le frontend
# Génère la configuration runtime avant de démarrer Nginx

set -e

echo "Génération de la configuration runtime..."

# Créer le fichier de configuration JavaScript
# IMPORTANT : Utilise /api (chemin relatif) car Nginx proxie vers le backend
cat > /usr/share/nginx/html/env-config.js << EOF
// Configuration runtime générée par Docker
// API accessible via reverse proxy Nginx sur /api
window.ENV = {
  VITE_API_URL: '/api'
};
EOF

echo "Configuration générée:"
cat /usr/share/nginx/html/env-config.js

echo "Démarrage de Nginx..."
exec nginx -g 'daemon off;'
