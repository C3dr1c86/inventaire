#!/bin/bash
# Script de test automatisé de restauration
# Vérifie qu'un backup peut être restauré correctement
# Usage: ./test-backup.sh [fichier_backup.tar.gz]

set -e

# Configuration
BACKUP_FILE="${1:-/app/backups/daily/backup_$(date +%Y%m%d).tar.gz}"
TEST_DIR="/tmp/inventaire_backup_test_$(date +%s)"
LOG_FILE="/tmp/backup_test_$(date +%Y%m%d).log"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[TEST]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1" | tee -a "$LOG_FILE"
}

# Début du test
log "==================== TEST DE RESTAURATION ===================="
log "Backup testé: $BACKUP_FILE"
log "Répertoire de test: $TEST_DIR"
log "Log: $LOG_FILE"

# Vérifier que le backup existe
if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Fichier de backup introuvable: $BACKUP_FILE"
    exit 1
fi

log_success "Fichier de backup trouvé ($(du -h "$BACKUP_FILE" | cut -f1))"

# Test 1: Vérifier l'intégrité de l'archive
log "Test 1: Vérification intégrité archive..."
if tar -tzf "$BACKUP_FILE" > /dev/null 2>&1; then
    log_success "Archive valide et extractible"
else
    log_error "Archive corrompue ou invalide"
    exit 1
fi

# Test 2: Extraction de l'archive
log "Test 2: Extraction vers répertoire temporaire..."
mkdir -p "$TEST_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEST_DIR" 2>&1 | tee -a "$LOG_FILE"

if [ $? -eq 0 ]; then
    log_success "Extraction réussie"
else
    log_error "Échec de l'extraction"
    exit 1
fi

# Test 3: Vérifier la présence de la base de données
log "Test 3: Vérification présence base de données..."
DB_FILE=$(find "$TEST_DIR" -name "inventaire.db" -type f | head -1)

if [ -f "$DB_FILE" ]; then
    DB_SIZE=$(du -h "$DB_FILE" | cut -f1)
    log_success "Base de données trouvée (taille: $DB_SIZE)"
else
    log_error "Base de données introuvable dans le backup"
    log "Contenu extrait:"
    find "$TEST_DIR" -type f | head -20 | tee -a "$LOG_FILE"
    exit 1
fi

# Test 4: Vérifier l'intégrité de la base de données SQLite
log "Test 4: Vérification intégrité base de données SQLite..."
if command -v sqlite3 &> /dev/null; then
    INTEGRITY_CHECK=$(sqlite3 "$DB_FILE" "PRAGMA integrity_check;")

    if [ "$INTEGRITY_CHECK" = "ok" ]; then
        log_success "Base de données SQLite valide"
    else
        log_error "Base de données corrompue: $INTEGRITY_CHECK"
        exit 1
    fi

    # Compter les tables
    TABLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    log_success "Nombre de tables: $TABLE_COUNT"

    # Compter les articles (exemple)
    ARTICLE_COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM articles;" 2>/dev/null || echo "N/A")
    log "Nombre d'articles dans le backup: $ARTICLE_COUNT"
else
    log "sqlite3 non installé - impossible de vérifier l'intégrité de la DB"
fi

# Test 5: Vérifier la présence des uploads (optionnel)
log "Test 5: Vérification uploads..."
UPLOADS_DIR=$(find "$TEST_DIR" -type d -name "uploads" | head -1)

if [ -d "$UPLOADS_DIR" ]; then
    UPLOADS_COUNT=$(find "$UPLOADS_DIR" -type f | wc -l)
    UPLOADS_SIZE=$(du -sh "$UPLOADS_DIR" | cut -f1)
    log_success "Uploads trouvés ($UPLOADS_COUNT fichiers, $UPLOADS_SIZE)"
else
    log "Pas d'uploads dans ce backup (normal si aucune photo)"
fi

# Test 6: Calcul du checksum MD5 (pour tracking corruption)
log "Test 6: Calcul checksum..."
if command -v md5sum &> /dev/null; then
    CHECKSUM=$(md5sum "$BACKUP_FILE" | cut -d' ' -f1)
    log_success "Checksum MD5: $CHECKSUM"
    echo "$CHECKSUM  $BACKUP_FILE" > "${BACKUP_FILE}.md5"
    log "Checksum sauvegardé dans ${BACKUP_FILE}.md5"
else
    log "md5sum non disponible - skip checksum"
fi

# Nettoyage
log "Nettoyage du répertoire de test..."
rm -rf "$TEST_DIR"

# Résumé final
log "==================== RÉSULTAT TEST ===================="
log_success "Tous les tests sont passés ✓"
log "Le backup est valide et peut être restauré en production"
log ""
log "Détails complets dans: $LOG_FILE"

# Retour succès
exit 0
