#!/bin/bash
# ============================================
# Script de déploiement complet Tailscale HTTPS
# Inventaire v1.6.5+
# ============================================

set -e

echo ""
echo "=========================================="
echo "  Déploiement Tailscale HTTPS sur NAS"
echo "=========================================="
echo ""

# Étape 1 : Cloner ou mettre à jour le dépôt
echo "[1/6] Mise à jour du dépôt Git..."
if [ -d "/home/Cédric/inventaire" ]; then
    cd /home/Cédric/inventaire
    echo "   Dépôt existant trouvé, mise à jour..."
    git pull origin main
else
    echo "   Clonage du dépôt depuis GitHub..."
    cd /home/Cédric
    git clone https://github.com/C3dr1c86/inventaire.git
    cd inventaire
fi
echo "   ✅ Dépôt à jour"
echo ""

# Étape 2 : Builder l'image frontend avec .env.production
echo "[2/6] Build de l'image frontend (3-5 minutes)..."
echo "   Ceci va construire une nouvelle image avec le fix Mixed Content"
docker build --no-cache -t ghcr.io/c3dr1c86/inventaire/frontend:latest -f frontend/Dockerfile frontend
echo "   ✅ Image frontend construite"
echo ""

# Étape 3 : Créer le dossier de déploiement
echo "[3/6] Création du dossier de déploiement..."
mkdir -p /home/Cédric/docker/inventaire/data/database
mkdir -p /home/Cédric/docker/inventaire/data/exports
mkdir -p /home/Cédric/docker/inventaire/data/uploads
echo "   ✅ Dossiers créés"
echo ""

# Étape 4 : Copier les fichiers de configuration
echo "[4/6] Copie des fichiers de configuration..."
cp /home/Cédric/inventaire/deployment/nas/docker-compose-tailscale-https.yml /home/Cédric/docker/inventaire/docker-compose.yml
cp /home/Cédric/inventaire/deployment/nas/nginx-tailscale.conf /home/Cédric/docker/inventaire/
echo "   ✅ Fichiers copiés"
echo ""

# Étape 5 : Redémarrer les conteneurs
echo "[5/6] Redémarrage des conteneurs..."
cd /home/Cédric/docker/inventaire
docker compose down 2>/dev/null || true
echo "   Démarrage des nouveaux conteneurs..."
docker compose up -d
echo "   ✅ Conteneurs redémarrés"
echo ""

# Étape 6 : Configurer HTTPS Tailscale
echo "[6/6] Configuration HTTPS Tailscale..."
echo "   Attente du démarrage complet de Tailscale (30 secondes)..."
sleep 30
docker exec inventaire-tailscale tailscale serve --bg --https=443 http://localhost:80
echo "   ✅ HTTPS configuré"
echo ""

echo "=========================================="
echo "  ✅ DÉPLOIEMENT TERMINÉ !"
echo "=========================================="
echo ""
echo "📱 Accès : https://inventaire-nas.tail53f399.ts.net"
echo ""
echo "⏱️  Attendez encore 60 secondes pour que tous les services démarrent"
echo "🔄 Puis testez avec Ctrl+Shift+R dans le navigateur"
echo ""
echo "Vérification de l'état des conteneurs :"
docker compose ps
echo ""
