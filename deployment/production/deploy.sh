#!/bin/bash
# Script de déploiement pour serveur/NAS distant
# Usage: ./deploy.sh [OPTIONS]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration par défaut
REMOTE_HOST="${REMOTE_HOST:-}"
REMOTE_USER="${REMOTE_USER:-root}"
REMOTE_PATH="${REMOTE_PATH:-/opt/inventaire}"
IMAGE_VERSION="${IMAGE_VERSION:-latest}"

# Fonction d'aide
show_help() {
    cat << EOF
Script de déploiement Inventaire

Usage: ./deploy.sh [OPTIONS]

Options:
    -h, --host HOST          Adresse IP ou nom d'hôte du serveur distant
    -u, --user USER          Utilisateur SSH (défaut: root)
    -p, --path PATH          Chemin d'installation (défaut: /opt/inventaire)
    -v, --version VERSION    Version des images Docker (défaut: latest)
    --help                   Afficher cette aide

Variables d'environnement:
    REMOTE_HOST             Adresse du serveur distant
    REMOTE_USER             Utilisateur SSH
    REMOTE_PATH             Chemin d'installation
    IMAGE_VERSION           Version des images Docker
    SECRET_KEY              Clé secrète JWT (obligatoire)

Exemple:
    ./deploy.sh --host 192.168.1.100 --user admin --version v1.6.0
    
    # Ou avec variables d'environnement:
    export REMOTE_HOST=192.168.1.100
    export SECRET_KEY=\$(openssl rand -hex 32)
    ./deploy.sh

