@echo off
REM ============================================
REM Script de deploiement automatise sur NAS
REM Inventaire v1.6.0
REM ============================================

echo.
echo ========================================
echo   Deploiement Inventaire sur NAS
echo ========================================
echo.

REM Verifier que .env existe
if not exist .env (
    echo [ERREUR] Fichier .env introuvable !
    echo.
    echo Veuillez creer un fichier .env a partir de .env.example:
    echo   1. Copier .env.example vers .env
    echo   2. Editer .env avec vos parametres NAS
    echo   3. Generer SECRET_KEY avec: openssl rand -hex 32
    echo.
    pause
    exit /b 1
)

REM Charger les variables .env
for /f "usebackq tokens=1,2 delims==" %%a in (.env) do (
    if not "%%a"=="" if not "%%b"=="" (
        set "%%a=%%b"
    )
)

REM Verifier que les variables critiques sont definies
if "%NAS_HOST%"=="" (
    echo [ERREUR] NAS_HOST non defini dans .env
    pause
    exit /b 1
)

if "%NAS_USER%"=="" (
    echo [ERREUR] NAS_USER non defini dans .env
    pause
    exit /b 1
)

if "%SECRET_KEY%"=="CHANGEME-USE-OPENSSL-RAND-HEX-32-TO-GENERATE" (
    echo [ERREUR] SECRET_KEY non modifie dans .env
    echo.
    echo Veuillez generer une cle secrete avec:
    echo   openssl rand -hex 32
    echo.
    echo Puis remplacer SECRET_KEY dans .env
    echo.
    pause
    exit /b 1
)

echo [INFO] Configuration:
echo   - NAS: %NAS_USER%@%NAS_HOST%
echo   - Chemin: %NAS_DEPLOY_PATH%
echo.

REM Verifier la connexion SSH
echo [1/6] Test de connexion SSH au NAS...
ssh -o ConnectTimeout=5 %NAS_USER%@%NAS_HOST% "echo 'Connexion OK'" >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Impossible de se connecter au NAS via SSH
    echo.
    echo Verifiez:
    echo   - IP correcte dans .env
    echo   - SSH active sur le NAS
    echo   - Acces reseau au NAS
    echo.
    pause
    exit /b 1
)
echo [OK] Connexion SSH reussie
echo.

REM Creer les dossiers sur le NAS
echo [2/6] Creation des dossiers sur le NAS...
ssh %NAS_USER%@%NAS_HOST% "mkdir -p %NAS_DEPLOY_PATH%/data/database %NAS_DEPLOY_PATH%/data/exports %NAS_DEPLOY_PATH%/data/uploads"
if errorlevel 1 (
    echo [ERREUR] Impossible de creer les dossiers
    pause
    exit /b 1
)
echo [OK] Dossiers crees
echo.

REM Copier docker-compose.yml
echo [3/6] Copie de docker-compose.yml...
scp docker-compose.yml %NAS_USER%@%NAS_HOST%:%NAS_DEPLOY_PATH%/
if errorlevel 1 (
    echo [ERREUR] Impossible de copier docker-compose.yml
    pause
    exit /b 1
)
echo [OK] docker-compose.yml copie
echo.

REM Copier .env
echo [4/6] Copie de .env...
scp .env %NAS_USER%@%NAS_HOST%:%NAS_DEPLOY_PATH%/
if errorlevel 1 (
    echo [ERREUR] Impossible de copier .env
    pause
    exit /b 1
)
echo [OK] .env copie
echo.

REM Telecharger et demarrer les conteneurs
echo [5/6] Telechargement des images Docker...
echo (cela peut prendre quelques minutes...)
ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker compose -f docker-compose.yml pull"
if errorlevel 1 (
    echo [ERREUR] Impossible de telecharger les images Docker
    pause
    exit /b 1
)
echo [OK] Images Docker telechargees
echo.

echo [6/6] Demarrage des conteneurs...
ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker compose -f docker-compose.yml up -d"
if errorlevel 1 (
    echo [ERREUR] Impossible de demarrer les conteneurs
    pause
    exit /b 1
)
echo [OK] Conteneurs demarres
echo.

REM Afficher le statut
echo ========================================
echo   DEPLOIEMENT TERMINE !
echo ========================================
echo.
echo L'application Inventaire est maintenant deployee sur votre NAS.
echo.
echo Acces: http://%NAS_HOST%
echo.
echo Prochaines etapes:
echo   1. Creer votre premier utilisateur (S'inscrire)
echo   2. Configurer les categories et articles
echo.
echo Gestion des conteneurs:
echo   - Voir les logs: ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker compose logs -f"
echo   - Redemarrer: ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker compose restart"
echo   - Arreter: ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker compose stop"
echo.

pause
