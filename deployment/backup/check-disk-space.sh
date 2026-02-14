#!/bin/bash
# Script de vérification de l'espace disque
# Alerte si moins de 10% d'espace disponible
# Usage: ./check-disk-space.sh [threshold_percent]

THRESHOLD="${1:-10}"  # Seuil par défaut: 10%
MOUNT_POINT="${MOUNT_POINT:-/app}"
LOG_FILE="${LOG_FILE:-/app/backups/disk-space.log}"

# Couleurs
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1" | tee -a "$LOG_FILE"
}

# Obtenir l'utilisation du disque
DISK_USAGE=$(df -h "$MOUNT_POINT" | tail -1)
PERCENT_USED=$(echo "$DISK_USAGE" | awk '{print $5}' | sed 's/%//')
PERCENT_FREE=$((100 - PERCENT_USED))
SPACE_USED=$(echo "$DISK_USAGE" | awk '{print $3}')
SPACE_AVAILABLE=$(echo "$DISK_USAGE" | awk '{print $4}')
SPACE_TOTAL=$(echo "$DISK_USAGE" | awk '{print $2}')

log "==================== VÉRIFICATION ESPACE DISQUE ===================="
log "Point de montage: $MOUNT_POINT"
log "Espace total: $SPACE_TOTAL"
log "Espace utilisé: $SPACE_USED ($PERCENT_USED%)"
log "Espace disponible: $SPACE_AVAILABLE ($PERCENT_FREE%)"

# Vérifier le seuil
if [ "$PERCENT_FREE" -lt "$THRESHOLD" ]; then
    log_error "ALERTE: Espace disque critique ! ($PERCENT_FREE% disponible)"
    log_error "Seuil minimal: $THRESHOLD%"

    # Top 10 des répertoires les plus volumineux
    log "Top 10 répertoires volumineux:"
    du -sh /app/* 2>/dev/null | sort -rh | head -10 | tee -a "$LOG_FILE"

    # Suggestions de nettoyage
    log ""
    log "Actions recommandées:"
    echo "  1. Vérifier les backups anciens: ls -lh /app/backups/*/" | tee -a "$LOG_FILE"
    echo "  2. Nettoyer les exports: find /app/data/exports -mtime +7 -delete" | tee -a "$LOG_FILE"
    echo "  3. Nettoyer les logs: find /app/logs -name '*.log' -mtime +30 -delete" | tee -a "$LOG_FILE"
    echo "  4. Vérifier photos uploads: du -sh /app/data/uploads" | tee -a "$LOG_FILE"

    # Envoyer email si configuré
    if command -v mail &> /dev/null && [ -n "$ALERT_EMAIL" ]; then
        echo "Espace disque critique sur $HOSTNAME: $PERCENT_FREE% disponible" | \
            mail -s "ALERTE: Espace Disque Inventaire" "$ALERT_EMAIL"
        log "Email d'alerte envoyé à $ALERT_EMAIL"
    fi

    exit 1
elif [ "$PERCENT_FREE" -lt $((THRESHOLD * 2)) ]; then
    log_warning "Attention: Espace disque faible ($PERCENT_FREE% disponible)"
    log_warning "Envisager le nettoyage bientôt"
    exit 0
else
    log_success "Espace disque OK ($PERCENT_FREE% disponible)"
    exit 0
fi
