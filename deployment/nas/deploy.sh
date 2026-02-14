#!/bin/bash
# ============================================
# Script de déploiement automatisé sur NAS
# Inventaire v1.6.0
# ============================================

set -e  # Arrêter en cas d'erreur

echo ""
echo "========================================"
echo "  Déploiement Inventaire sur NAS"
echo "========================================"
echo ""

# Vérifier que .env existe
if [ ! -f .env ]; then
    echo "[ERREUR] Fichier .env introuvable !"
    echo ""
    echo "Veuillez créer un fichier .env à partir de .env.example:"
    echo "  1. Copier .env.example vers .env"
    echo "  2. Éditer .env avec vos paramètres NAS"
    echo "  3. Générer SECRET_KEY avec: openssl rand -hex 32"
    echo ""
    exit 1
fi

# Charger les variables .env
export $(grep -v '^#' .env | xargs)

# Vérifier que les variables critiques sont définies
if [ -z "$NAS_HOST" ]; then
    echo "[ERREUR] NAS_HOST non défini dans .env"
    exit 1
fi

if [ -z "$NAS_USER" ]; then
    echo "[ERREUR] NAS_USER non défini dans .env"
    exit 1
fi

if [ "$SECRET_KEY" = "CHANGEME-USE-OPENSSL-RAND-HEX-32-TO-GENERATE" ]; then
    echo "[ERREUR] SECRET_KEY non modifié dans .env"
    echo ""
    echo "Veuillez générer une clé secrète avec:"
    echo "  openssl rand -hex 32"
    echo ""
    echo "Puis remplacer SECRET_KEY dans .env"
    echo ""
    exit 1
fi

echo "[INFO] Configuration:"
echo "  - NAS: $NAS_USER@$NAS_HOST"
echo "  - Chemin: $NAS_DEPLOY_PATH"
echo ""

# Vérifier la connexion SSH
echo "[1/6] Test de connexion SSH au NAS..."
if ! ssh -o ConnectTimeout=5 "$NAS_USER@$NAS_HOST" "echo 'Connexion OK'" > /dev/null 2>&1; then
    echo "[ERREUR] Impossible de se connecter au NAS via SSH"
    echo ""
    echo "Vérifiez:"
    echo "  - IP correcte dans .env"
    echo "  - SSH activé sur le NAS"
    echo "  - Accès réseau au NAS"
    echo ""
    exit 1
fi
echo "[OK] Connexion SSH réussie"
echo ""

# Créer les dossiers sur le NAS
echo "[2/6] Création des dossiers sur le NAS..."
ssh "$NAS_USER@$NAS_HOST" "mkdir -p $NAS_DEPLOY_PATH/data/database $NAS_DEPLOY_PATH/data/exports $NAS_DEPLOY_PATH/data/uploads"
echo "[OK] Dossiers créés"
echo ""

# Copier docker-compose.yml
echo "[3/6] Copie de docker-compose.yml..."
scp docker-compose.yml "$NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/"
echo "[OK] docker-compose.yml copié"
echo ""

# Copier .env
echo "[4/6] Copie de .env..."
scp .env "$NAS_USER@$NAS_HOST:$NAS_DEPLOY_PATH/"
echo "[OK] .env copié"
echo ""

# Télécharger et démarrer les conteneurs
echo "[5/6] Téléchargement des images Docker..."
echo "(cela peut prendre quelques minutes...)"
ssh "$NAS_USER@$NAS_HOST" "cd $NAS_DEPLOY_PATH && docker-compose pull"
echo "[OK] Images Docker téléchargées"
echo ""

echo "[6/6] Démarrage des conteneurs..."
ssh "$NAS_USER@$NAS_HOST" "cd $NAS_DEPLOY_PATH && docker-compose up -d"
echo "[OK] Conteneurs démarrés"
echo ""

# Afficher le statut
echo "========================================"
echo "  DÉPLOIEMENT TERMINÉ !"
echo "========================================"
echo ""
echo "L'application Inventaire est maintenant déployée sur votre NAS."
echo ""
echo "Accès: http://$NAS_HOST"
echo ""
echo "Prochaines étapes:"
echo "  1. Créer votre premier utilisateur (S'inscrire)"
echo "  2. Configurer les catégories et articles"
echo ""
echo "Gestion des conteneurs:"
echo "  - Voir les logs: ssh $NAS_USER@$NAS_HOST \"cd $NAS_DEPLOY_PATH && docker-compose logs -f\""
echo "  - Redémarrer: ssh $NAS_USER@$NAS_HOST \"cd $NAS_DEPLOY_PATH && docker-compose restart\""
echo "  - Arrêter: ssh $NAS_USER@$NAS_HOST \"cd $NAS_DEPLOY_PATH && docker-compose stop\""
echo ""
