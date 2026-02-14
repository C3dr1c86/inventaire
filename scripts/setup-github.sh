#!/bin/bash
# Script d'aide à la configuration GitHub pour CI/CD
# Usage: ./setup-github.sh [username]

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_info() {
    echo -e "${BLUE}[ℹ]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

echo "==================== CONFIGURATION GITHUB CI/CD ===================="
echo ""

# Vérifier qu'on est dans le bon répertoire
if [ ! -f "README.md" ] || [ ! -d ".github" ]; then
    log_error "Ce script doit être exécuté depuis la racine du projet inventaire"
    exit 1
fi

# Demander username GitHub
if [ -z "$1" ]; then
    log_info "Entrez votre username GitHub:"
    read -r GITHUB_USERNAME
else
    GITHUB_USERNAME="$1"
fi

log_info "Username GitHub: $GITHUB_USERNAME"
echo ""

# 1. Vérifier remote Git
log_info "Étape 1/6: Vérification remote Git..."
CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")

if [ "$CURRENT_REMOTE" = "none" ]; then
    log_warning "Aucun remote configuré"
    log_info "Ajout du remote origin..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/inventaire.git"
    log "Remote ajouté"
elif [[ "$CURRENT_REMOTE" == *"votre-username"* ]]; then
    log_warning "Remote pointe vers un placeholder"
    log_info "Mise à jour du remote..."
    git remote set-url origin "https://github.com/$GITHUB_USERNAME/inventaire.git"
    log "Remote mis à jour"
else
    log "Remote déjà configuré: $CURRENT_REMOTE"
fi

# 2. Vérifier branche principale
log_info "Étape 2/6: Vérification branche principale..."
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" = "master" ]; then
    log_info "Renommage master → main (recommandé GitHub)..."
    git branch -M main
    log "Branche renommée en 'main'"
elif [ "$CURRENT_BRANCH" = "main" ]; then
    log "Déjà sur branche 'main'"
else
    log_warning "Branche actuelle: $CURRENT_BRANCH (inhabituel)"
fi

# 3. Mettre à jour badges README
log_info "Étape 3/6: Mise à jour badges README..."
if grep -q "VOTRE-USER" README.md; then
    log_info "Remplacement placeholders dans README..."

    # Backup
    cp README.md README.md.bak

    # Remplacer VOTRE-USER par le vrai username
    sed -i "s/VOTRE-USER/$GITHUB_USERNAME/g" README.md

    log "Badges mis à jour avec username: $GITHUB_USERNAME"
    log_info "Backup créé: README.md.bak"
else
    log "README déjà configuré"
fi

# 4. Vérifier que tout est commité
log_info "Étape 4/6: Vérification statut Git..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "Changements non commités détectés"
    git status --short
    echo ""
    read -p "$(echo -e ${YELLOW}Commiter les changements maintenant? [y/N]${NC} )" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add README.md
        git commit -m "chore: update GitHub username in badges"
        log "Changements commités"
    fi
else
    log "Aucun changement non commité"
fi

# 5. Résumé et prochaines étapes
echo ""
log_info "Étape 5/6: Résumé de la configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Repository: https://github.com/$GITHUB_USERNAME/inventaire"
echo "Remote:     $(git remote get-url origin)"
echo "Branche:    $(git branch --show-current)"
echo "Commits:    $(git log --oneline | wc -l) commits prêts"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 6. Instructions suivantes
log_info "Étape 6/6: Prochaines actions"
echo ""
echo "1️⃣  Créer le repository sur GitHub (si pas déjà fait):"
echo "   https://github.com/new"
echo "   Nom: inventaire"
echo "   ⚠️  Ne PAS initialiser avec README/gitignore"
echo ""
echo "2️⃣  Pousser le code:"
echo "   git push -u origin main"
echo ""
echo "3️⃣  Activer GitHub Actions:"
echo "   https://github.com/$GITHUB_USERNAME/inventaire/settings/actions"
echo "   → Allow all actions"
echo "   → Read and write permissions"
echo ""
echo "4️⃣  Créer le premier release tag:"
echo "   git tag -a v1.9.0 -m 'Release v1.9.0 - Production Ready'"
echo "   git push origin v1.9.0"
echo ""
echo "5️⃣  Vérifier les workflows:"
echo "   https://github.com/$GITHUB_USERNAME/inventaire/actions"
echo ""

log "Configuration terminée ! 🎉"
log_info "Voir guide complet: docs/GITHUB_SETUP.md"

# Demander si on push maintenant
echo ""
read -p "$(echo -e ${GREEN}Voulez-vous pousser le code maintenant? [y/N]${NC} )" -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    log_info "Push vers GitHub..."

    # Vérifier que le repo existe
    if git ls-remote origin &>/dev/null; then
        git push -u origin main
        log "Code poussé avec succès !"

        # Proposer de créer le tag
        echo ""
        read -p "$(echo -e ${GREEN}Créer le tag v1.9.0 maintenant? [y/N]${NC} )" -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git tag -a v1.9.0 -m "Release v1.9.0 - Production Ready"
            git push origin v1.9.0
            log "Tag v1.9.0 créé et poussé !"
            echo ""
            log_info "🐳 Build Docker en cours..."
            log_info "Voir progression: https://github.com/$GITHUB_USERNAME/inventaire/actions"
        fi
    else
        log_error "Le repository n'existe pas sur GitHub"
        log_info "Créez-le d'abord sur: https://github.com/new"
        log_info "Puis relancez: git push -u origin main"
    fi
else
    log_info "Vous pouvez pousser plus tard avec: git push -u origin main"
fi

echo ""
log "✅ Setup terminé !"
