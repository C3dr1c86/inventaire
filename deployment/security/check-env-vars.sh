#!/bin/bash
# Script de vérification des variables d'environnement requises
# S'assure qu'aucun secret n'est hardcodé et que toutes les vars nécessaires sont définies

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

echo "==================== VÉRIFICATION VARIABLES D'ENVIRONNEMENT ===================="

ERRORS=0
WARNINGS=0

# Variables CRITIQUES (production)
CRITICAL_VARS=(
    "SECRET_KEY"
)

# Variables RECOMMANDÉES
RECOMMENDED_VARS=(
    "DATABASE_URL"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SMTP_PASSWORD"
)

# Variables OPTIONNELLES
OPTIONAL_VARS=(
    "RCLONE_REMOTE"
    "SENTRY_DSN"
    "LOG_LEVEL"
)

# Vérifier les variables CRITIQUES
echo ""
echo "Variables CRITIQUES (obligatoires en production):"
for VAR in "${CRITICAL_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        log_error "$VAR non définie !"
        ERRORS=$((ERRORS + 1))
    else
        # Vérifier que ce n'est pas une valeur par défaut
        if [ "${!VAR}" = "your-secret-key-here" ] || \
           [ "${!VAR}" = "changeme" ] || \
           [ "${!VAR}" = "secret" ]; then
            log_error "$VAR utilise une valeur par défaut non sécurisée !"
            ERRORS=$((ERRORS + 1))
        else
            log "$VAR définie (${#!VAR} caractères)"
        fi
    fi
done

# Vérifier les variables RECOMMANDÉES
echo ""
echo "Variables RECOMMANDÉES:"
for VAR in "${RECOMMENDED_VARS[@]}"; do
    if [ -z "${!VAR}" ]; then
        log_warning "$VAR non définie (fonctionnalité désactivée)"
        WARNINGS=$((WARNINGS + 1))
    else
        log "$VAR définie"
    fi
done

# Vérifier les variables OPTIONNELLES
echo ""
echo "Variables OPTIONNELLES:"
for VAR in "${OPTIONAL_VARS[@]}"; do
    if [ -n "${!VAR}" ]; then
        log "$VAR définie"
    fi
done

# Vérifier la force du SECRET_KEY
echo ""
echo "Vérification force du SECRET_KEY:"
if [ -n "$SECRET_KEY" ]; then
    LENGTH=${#SECRET_KEY}

    if [ $LENGTH -lt 32 ]; then
        log_error "SECRET_KEY trop court ($LENGTH caractères, minimum 32)"
        ERRORS=$((ERRORS + 1))
    elif [ $LENGTH -lt 64 ]; then
        log_warning "SECRET_KEY acceptable ($LENGTH caractères, recommandé 64+)"
        WARNINGS=$((WARNINGS + 1))
    else
        log "SECRET_KEY fort ($LENGTH caractères)"
    fi

    # Vérifier entropie (présence de majuscules, minuscules, chiffres)
    if echo "$SECRET_KEY" | grep -q '[a-z]' && \
       echo "$SECRET_KEY" | grep -q '[A-Z]' && \
       echo "$SECRET_KEY" | grep -q '[0-9]'; then
        log "SECRET_KEY a une bonne entropie (maj, min, chiffres)"
    else
        log_warning "SECRET_KEY manque de diversité (ajouter maj/min/chiffres)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

# Vérifier qu'aucun secret n'est hardcodé dans le code
echo ""
echo "Vérification absence secrets hardcodés:"

# Chercher des patterns suspects dans le code
SUSPICIOUS_PATTERNS=(
    "SECRET_KEY = "
    "password = "
    "api_key = "
    "token = "
)

FOUND_HARDCODED=0
for PATTERN in "${SUSPICIOUS_PATTERNS[@]}"; do
    # Chercher dans backend (exclure commentaires et variables d'env)
    MATCHES=$(grep -r "$PATTERN" backend/ \
        --exclude-dir=venv \
        --exclude-dir=__pycache__ \
        --exclude="*.pyc" \
        --exclude=".env*" \
        | grep -v "os.getenv" \
        | grep -v "^#" \
        | wc -l)

    if [ "$MATCHES" -gt 0 ]; then
        log_error "Pattern suspect trouvé: $PATTERN ($MATCHES occurrences)"
        FOUND_HARDCODED=$((FOUND_HARDCODED + 1))
        ERRORS=$((ERRORS + 1))
    fi
done

if [ $FOUND_HARDCODED -eq 0 ]; then
    log "Aucun secret hardcodé détecté"
fi

# Générer un SECRET_KEY sécurisé si nécessaire
echo ""
echo "Génération SECRET_KEY sécurisé (si besoin):"
NEW_KEY=$(openssl rand -hex 32)
echo "  export SECRET_KEY='$NEW_KEY'"
echo "  (64 caractères hexadécimaux)"

# Résumé
echo ""
echo "==================== RÉSUMÉ ===================="
echo "Erreurs critiques: $ERRORS"
echo "Avertissements: $WARNINGS"

if [ $ERRORS -gt 0 ]; then
    echo ""
    log_error "ÉCHEC: $ERRORS erreur(s) critique(s) détectée(s)"
    log_error "Corriger avant déploiement en production !"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    log_warning "Attention: $WARNINGS avertissement(s)"
    log_warning "Fonctionnalités optionnelles peuvent ne pas fonctionner"
    exit 0
else
    echo ""
    log "SUCCÈS: Configuration sécurisée ✓"
    exit 0
fi
