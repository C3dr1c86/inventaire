#!/bin/bash

echo "=========================================="
echo "Configuration Git et création tag v1.1.0"
echo "=========================================="
echo ""

# Se placer dans le répertoire du script
cd "$(dirname "$0")"

# Initialiser le dépôt git si pas déjà fait
if [ ! -d .git ]; then
    echo "[1/5] Initialisation du dépôt Git..."
    git init
    echo ""
else
    echo "[1/5] Dépôt Git déjà initialisé"
    echo ""
fi

# Configurer git (si nécessaire)
echo "[2/5] Configuration Git (nom et email)..."
read -p "Entrez votre nom pour Git (ex: Cedric Dupont): " GIT_NAME
git config user.name "$GIT_NAME"

read -p "Entrez votre email pour Git (ex: cedric@example.com): " GIT_EMAIL
git config user.email "$GIT_EMAIL"
echo ""

# Ajouter tous les fichiers
echo "[3/5] Ajout des fichiers au dépôt..."
git add .
echo ""

# Créer le commit
echo "[4/5] Création du commit v1.1.0..."
git commit -m "Release v1.1.0 - Système de catégories hiérarchiques

Ajouts principaux :
- Système de catégories hiérarchiques (2 niveaux max)
- Double select cascadé dans ArticleForm
- Affichage arbre hiérarchique dans Categories
- Nouveaux endpoints API : /racines, /tree, /{id}/children
- Validations hiérarchiques (max 2 niveaux, blocage suppression parent)
- Filtres améliorés avec optgroup dans Articles

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
echo ""

# Créer le tag
echo "[5/5] Création du tag v1.1.0..."
git tag -a v1.1.0 -m "Version 1.1.0 - Système de catégories hiérarchiques

Nouveautés :
- Catégories hiérarchiques (catégorie → sous-catégorie)
- Double select cascadé pour création d'articles
- Affichage arbre hiérarchique
- Endpoints API hiérarchiques
- Validations et contraintes hiérarchiques

Voir CHANGELOG.md pour détails complets."
echo ""

echo "=========================================="
echo "Configuration Git terminée avec succès !"
echo "=========================================="
echo ""
echo "Tag créé : v1.1.0"
echo ""
echo "Prochaines étapes (optionnel) :"
echo "  1. Ajouter un remote : git remote add origin URL_DU_DEPOT"
echo "  2. Pousser le code : git push -u origin main"
echo "  3. Pousser le tag : git push origin v1.1.0"
echo ""
echo "Pour voir les tags : git tag -l"
echo "Pour voir le dernier commit : git log -1"
echo ""
