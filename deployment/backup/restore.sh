#!/bin/bash
# Script de restauration d'un backup
# Usage: ./restore.sh <fichier_backup.tar.gz>

set -e

# Configuration
BACKUP_FILE="$1"
RESTORE_DIR="${RESTORE_DIR:-/tmp/inventaire_restore}"
DATABASE_PATH="${DATABASE_PATH:-/app/data/database/inventaire.db}"
UPLOADS_PATH="${UPLOADS_PATH:-/app/data/uploads}"
EXPORTS_PATH="${EXPORTS_PATH:-/app/data/exports}"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Vérifier les arguments
if [ -z "$BACKUP_FILE" ]; then
    log_error "Usage: $0 <fichier_backup.tar.gz>"
    log "Backups disponibles:"
    echo ""
    echo "Quotidiens:"
    ls -lh /app/backups/daily/*.tar.gz 2>/dev/null || echo "  Aucun"
    echo ""
    echo "Hebdomadaires:"
    ls -lh /app/backups/weekly/*.tar.gz 2>/dev/null || echo "  Aucun"
    echo ""
    echo "Mensuels:"
    ls -lh /app/backups/monthly/*.tar.gz 2>/dev/null || echo "  Aucun"
    exit 1
fi

# Vérifier que le fichier existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Fichier de backup introuvable: $BACKUP_FILE"
    exit 1
fi

log "==================== RESTAURATION ===================="
log "Backup source: $BACKUP_FILE"
log "Taille: $(du -h "$BACKUP_FILE" | cut -f1)"

# Demander confirmation
read -p "$(echo -e ${YELLOW}⚠️  Cette opération va ÉCRASER les données actuelles. Continuer? [y/N]${NC} )" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Restauration annulée"
    exit 0
fi

# Créer un répertoire temporaire
log "Extraction vers: $RESTORE_DIR"
mkdir -p "$RESTORE_DIR"
rm -rf "${RESTORE_DIR:?}"/*  # Nettoyer le répertoire

# Extraire l'archive
log "Extraction de l'archive..."
tar -xzf "$BACKUP_FILE" -C "$RESTORE_DIR"

if [ $? -ne 0 ]; then
    log_error "Échec de l'extraction"
    exit 1
fi

log "Extraction réussie"

# Vérifier le contenu
DB_EXTRACTED="${RESTORE_DIR}/app/data/database/inventaire.db"
UPLOADS_EXTRACTED="${RESTORE_DIR}/app/data/uploads"

if [ ! -f "$DB_EXTRACTED" ]; then
    log_error "Base de données introuvable dans le backup"
    log "Contenu de l'archive:"
    tar -tzf "$BACKUP_FILE" | head -20
    exit 1
fi

# Arrêter les services Docker (si en cours)
if command -v docker-compose &> /dev/null; then
    log_warning "Arrêt des conteneurs Docker..."
    docker-compose down 2>/dev/null || true
fi

# Sauvegarder les données actuelles (backup de sécurité)
SAFETY_BACKUP="/tmp/safety_backup_$(date +%Y%m%d_%H%M%S).tar.gz"
log "Création d'un backup de sécurité: $SAFETY_BACKUP"
tar -czf "$SAFETY_BACKUP" \
    -C "$(dirname "$DATABASE_PATH")" "$(basename "$DATABASE_PATH")" \
    -C "/" "${UPLOADS_PATH#/}" \
    2>/dev/null || log_warning "Backup de sécurité non créé (données peut-être inexistantes)"

# Restaurer la base de données
log "Restauration de la base de données..."
mkdir -p "$(dirname "$DATABASE_PATH")"
cp -f "$DB_EXTRACTED" "$DATABASE_PATH"
log "Base de données restaurée: $DATABASE_PATH"

# Restaurer les uploads
if [ -d "$UPLOADS_EXTRACTED" ]; then
    log "Restauration des uploads..."
    mkdir -p "$UPLOADS_PATH"
    rm -rf "${UPLOADS_PATH:?}"/*
    cp -r "$UPLOADS_EXTRACTED"/* "$UPLOADS_PATH/"
    log "Uploads restaurés: $UPLOADS_PATH"
else
    log_warning "Pas d'uploads dans le backup"
fi

# Restaurer les exports (optionnel)
EXPORTS_EXTRACTED="${RESTORE_DIR}/app/data/exports"
if [ -d "$EXPORTS_EXTRACTED" ]; then
    log "Restauration des exports..."
    mkdir -p "$EXPORTS_PATH"
    rm -rf "${EXPORTS_PATH:?}"/*
    cp -r "$EXPORTS_EXTRACTED"/* "$EXPORTS_PATH/"
    log "Exports restaurés: $EXPORTS_PATH"
fi

# Nettoyer le répertoire temporaire
log "Nettoyage..."
rm -rf "$RESTORE_DIR"

log "==================== RESTAURATION TERMINÉE ===================="
log_success "Données restaurées avec succès"
log "Backup de sécurité conservé: $SAFETY_BACKUP"
log ""
log "Prochaines étapes:"
echo "  1. Redémarrer les services: docker-compose up -d"
echo "  2. Vérifier que l'application fonctionne"
echo "  3. Supprimer le backup de sécurité si tout est OK: rm $SAFETY_BACKUP"

exit 0
