#!/bin/bash
# Script de backup automatisé pour Inventaire
# Sauvegarde la base de données SQLite + uploads
# Rétention : 7 quotidiens + 4 hebdomadaires + 12 mensuels

set -e  # Exit on error

# Configuration
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
DATABASE_PATH="${DATABASE_PATH:-/app/data/database/inventaire.db}"
UPLOADS_PATH="${UPLOADS_PATH:-/app/data/uploads}"
EXPORTS_PATH="${EXPORTS_PATH:-/app/data/exports}"
LOG_FILE="${BACKUP_DIR}/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_DAILY=$(date +%Y%m%d)
DATE_WEEKLY=$(date +%Y_W%V)   # Année + Numéro de semaine
DATE_MONTHLY=$(date +%Y%m)

# Couleurs pour logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Créer les répertoires si nécessaire
mkdir -p "${BACKUP_DIR}"/{daily,weekly,monthly}
mkdir -p "$(dirname "$LOG_FILE")"

log "==================== DÉBUT BACKUP ===================="
log "Type: $(date +%A) - Quotidien"

# Vérifier que les fichiers existent
if [ ! -f "$DATABASE_PATH" ]; then
    log_error "Base de données introuvable: $DATABASE_PATH"
    exit 1
fi

if [ ! -d "$UPLOADS_PATH" ]; then
    log_warning "Répertoire uploads introuvable: $UPLOADS_PATH (création automatique)"
    mkdir -p "$UPLOADS_PATH"
fi

# Nom du fichier de backup quotidien
BACKUP_FILE="${BACKUP_DIR}/daily/backup_${DATE_DAILY}.tar.gz"

# Créer l'archive
log "Création de l'archive: $BACKUP_FILE"
tar -czf "$BACKUP_FILE.tmp" \
    -C "$(dirname "$DATABASE_PATH")" "$(basename "$DATABASE_PATH")" \
    -C "/" "${UPLOADS_PATH#/}" \
    ${EXPORTS_PATH:+-C "/" "${EXPORTS_PATH#/}"} \
    2>&1 | tee -a "$LOG_FILE"

# Vérifier que l'archive est créée correctement
if [ $? -eq 0 ] && [ -f "$BACKUP_FILE.tmp" ]; then
    mv "$BACKUP_FILE.tmp" "$BACKUP_FILE"

    # Taille de l'archive
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Archive créée avec succès (taille: $SIZE)"
else
    log_error "Échec de la création de l'archive"
    rm -f "$BACKUP_FILE.tmp"
    exit 1
fi

# Copie hebdomadaire (tous les dimanches)
if [ "$(date +%u)" -eq 7 ]; then
    WEEKLY_FILE="${BACKUP_DIR}/weekly/backup_${DATE_WEEKLY}.tar.gz"
    log "Création du backup hebdomadaire: $WEEKLY_FILE"
    cp "$BACKUP_FILE" "$WEEKLY_FILE"
    log_success "Backup hebdomadaire créé"
fi

# Copie mensuelle (le 1er de chaque mois)
if [ "$(date +%d)" -eq 01 ]; then
    MONTHLY_FILE="${BACKUP_DIR}/monthly/backup_${DATE_MONTHLY}.tar.gz"
    log "Création du backup mensuel: $MONTHLY_FILE"
    cp "$BACKUP_FILE" "$MONTHLY_FILE"
    log_success "Backup mensuel créé"
fi

# Nettoyage des vieux backups (rétention)
log "Nettoyage des anciens backups..."

# Quotidiens : garder 7 derniers
find "${BACKUP_DIR}/daily" -name "backup_*.tar.gz" -type f -mtime +7 -delete 2>&1 | tee -a "$LOG_FILE"
DAILY_COUNT=$(find "${BACKUP_DIR}/daily" -name "backup_*.tar.gz" -type f | wc -l)
log "Backups quotidiens conservés: $DAILY_COUNT"

# Hebdomadaires : garder 4 derniers
if [ -d "${BACKUP_DIR}/weekly" ]; then
    # Garder seulement les 4 plus récents
    ls -t "${BACKUP_DIR}/weekly/backup_"*.tar.gz 2>/dev/null | tail -n +5 | xargs -r rm
    WEEKLY_COUNT=$(find "${BACKUP_DIR}/weekly" -name "backup_*.tar.gz" -type f | wc -l)
    log "Backups hebdomadaires conservés: $WEEKLY_COUNT"
fi

# Mensuels : garder 12 derniers
if [ -d "${BACKUP_DIR}/monthly" ]; then
    ls -t "${BACKUP_DIR}/monthly/backup_"*.tar.gz 2>/dev/null | tail -n +13 | xargs -r rm
    MONTHLY_COUNT=$(find "${BACKUP_DIR}/monthly" -name "backup_*.tar.gz" -type f | wc -l)
    log "Backups mensuels conservés: $MONTHLY_COUNT"
fi

# Sync vers cloud (optionnel, nécessite rclone configuré)
if command -v rclone &> /dev/null && [ -n "$RCLONE_REMOTE" ]; then
    log "Synchronisation vers cloud: $RCLONE_REMOTE"
    rclone sync "${BACKUP_DIR}" "${RCLONE_REMOTE}:inventaire-backups/" \
        --progress \
        --log-file="$LOG_FILE" \
        --log-level INFO

    if [ $? -eq 0 ]; then
        log_success "Synchronisation cloud réussie"
    else
        log_error "Échec de la synchronisation cloud"
    fi
else
    log "Synchronisation cloud désactivée (rclone non configuré)"
fi

# Résumé
log "==================== FIN BACKUP ===================="
log "Backup quotidien: $BACKUP_FILE"
log "Total espace backups: $(du -sh "$BACKUP_DIR" | cut -f1)"

# Vérifier l'intégrité de l'archive (test extraction)
log "Test d'intégrité de l'archive..."
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log_success "Archive valide et extractible"
else
    log_error "Archive corrompue !"
    exit 1
fi

exit 0
