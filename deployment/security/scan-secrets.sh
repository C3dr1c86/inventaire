#!/bin/bash
# Script de scan des secrets avec detect-secrets
# Usage: ./scan-secrets.sh [--update-baseline]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BASELINE_FILE="$PROJECT_ROOT/.secrets.baseline"

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

# Vérifier que detect-secrets est installé
if ! command -v detect-secrets &> /dev/null; then
    log_error "detect-secrets n'est pas installé"
    log "Installation:"
    echo "  pip install detect-secrets"
    exit 1
fi

VERSION=$(detect-secrets --version 2>&1 | grep -oP '\d+\.\d+\.\d+')
log "detect-secrets version: $VERSION"

cd "$PROJECT_ROOT"

# Mode : update baseline ou scan
if [ "$1" = "--update-baseline" ]; then
    log "Mode: Mise à jour de la baseline"

    # Générer nouvelle baseline
    log "Scan du projet..."
    detect-secrets scan \
        --baseline "$BASELINE_FILE" \
        --exclude-files 'node_modules/.*' \
        --exclude-files 'venv/.*' \
        --exclude-files '.git/.*' \
        --exclude-files 'frontend/dist/.*' \
        --exclude-files 'frontend/coverage/.*' \
        --exclude-files '.*\.min\.js$' \
        --exclude-files '.*\.lock$' \
        --exclude-files '.*\.log$' \
        --exclude-files 'backend/database/.*' \
        --exclude-files 'data/.*' \
        --exclude-files 'backups/.*'

    log "Baseline mise à jour: $BASELINE_FILE"
    log_warning "Vérifier manuellement les nouveaux secrets détectés !"

else
    log "Mode: Audit (comparaison avec baseline)"

    # Scanner et comparer avec baseline
    log "Scan du projet..."
    if detect-secrets scan \
        --baseline "$BASELINE_FILE" \
        --exclude-files 'node_modules/.*' \
        --exclude-files 'venv/.*' \
        --exclude-files '.git/.*' \
        --exclude-files 'frontend/dist/.*' \
        --exclude-files 'frontend/coverage/.*' \
        --exclude-files '.*\.min\.js$' \
        --exclude-files '.*\.lock$' \
        --exclude-files '.*\.log$' \
        --exclude-files 'backend/database/.*' \
        --exclude-files 'data/.*' \
        --exclude-files 'backups/.*' \
        > /dev/null 2>&1; then

        # Aucun nouveau secret détecté
        echo ""
        log "✓ Aucun nouveau secret détecté"
        log "✓ Le code est conforme à la baseline"
        exit 0
    else
        # Nouveaux secrets détectés
        echo ""
        log_error "⚠️  NOUVEAUX SECRETS DÉTECTÉS !"
        log_error "Des secrets ont été trouvés qui ne sont pas dans la baseline"
        echo ""

        # Afficher les secrets détectés
        detect-secrets scan --baseline "$BASELINE_FILE" 2>&1 | grep -A 5 "Potential secrets"

        echo ""
        log_error "Actions requises:"
        echo "  1. Vérifier les secrets détectés ci-dessus"
        echo "  2. Si ce sont de vrais secrets:"
        echo "     - Les retirer du code (utiliser variables d'env)"
        echo "     - Révoquer/regénérer les clés exposées"
        echo "  3. Si ce sont des faux positifs:"
        echo "     - Exécuter: ./scan-secrets.sh --update-baseline"
        echo "     - Puis commit la baseline mise à jour"

        exit 1
    fi
fi
