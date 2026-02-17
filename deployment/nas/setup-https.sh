#!/bin/bash
# Script de configuration HTTPS Tailscale
# Configure Tailscale Serve pour exposer l'application en HTTPS

echo "🔧 Configuration de Tailscale Serve pour HTTPS..."

# Attendre que Tailscale soit prêt
sleep 5

# Configurer Tailscale Serve pour HTTPS
# Proxie HTTPS vers le proxy Nginx local (port 80)
tailscale serve https / http://localhost:80

if [ $? -eq 0 ]; then
    echo "✅ HTTPS configuré avec succès !"
    echo "🌐 Accès : https://inventaire-nas.tail53f399.ts.net"
else
    echo "❌ Erreur lors de la configuration HTTPS"
    exit 1
fi

# Afficher la configuration
echo ""
echo "📋 Configuration Tailscale Serve :"
tailscale serve status

# Garder le conteneur actif
tail -f /dev/null
