@echo off
echo ==========================================
echo Configuration Git et creation tag v1.1.0
echo ==========================================
echo.

REM Se placer dans le répertoire du projet
cd /d "%~dp0"

REM Initialiser le dépôt git si pas déjà fait
if not exist .git (
    echo [1/5] Initialisation du depot Git...
    git init
    echo.
) else (
    echo [1/5] Depot Git deja initialise
    echo.
)

REM Configurer git (si nécessaire)
echo [2/5] Configuration Git (nom et email)...
echo Entrez votre nom pour Git (ex: Cedric Dupont):
set /p GIT_NAME="> "
git config user.name "%GIT_NAME%"

echo Entrez votre email pour Git (ex: cedric@example.com):
set /p GIT_EMAIL="> "
git config user.email "%GIT_EMAIL%"
echo.

REM Ajouter tous les fichiers
echo [3/5] Ajout des fichiers au depot...
git add .
echo.

REM Créer le commit
echo [4/5] Creation du commit v1.1.0...
git commit -m "Release v1.1.0 - Systeme de categories hierarchiques

Ajouts principaux :
- Systeme de categories hierarchiques (2 niveaux max)
- Double select cascade dans ArticleForm
- Affichage arbre hierarchique dans Categories
- Nouveaux endpoints API : /racines, /tree, /{id}/children
- Validations hierarchiques (max 2 niveaux, blocage suppression parent)
- Filtres ameliores avec optgroup dans Articles

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
echo.

REM Créer le tag
echo [5/5] Creation du tag v1.1.0...
git tag -a v1.1.0 -m "Version 1.1.0 - Systeme de categories hierarchiques

Nouveautes :
- Categories hierarchiques (categorie -> sous-categorie)
- Double select cascade pour creation d'articles
- Affichage arbre hierarchique
- Endpoints API hierarchiques
- Validations et contraintes hierarchiques

Voir CHANGELOG.md pour details complets."
echo.

echo ==========================================
echo Configuration Git terminee avec succes !
echo ==========================================
echo.
echo Tag cree : v1.1.0
echo.
echo Prochaines etapes (optionnel) :
echo   1. Ajouter un remote : git remote add origin URL_DU_DEPOT
echo   2. Pousser le code : git push -u origin main
echo   3. Pousser le tag : git push origin v1.1.0
echo.
echo Pour voir les tags : git tag -l
echo Pour voir le dernier commit : git log -1
echo.

pause
