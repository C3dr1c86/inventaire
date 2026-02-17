@echo off
REM ============================================
REM Script de deploiement Tailscale sur NAS
REM Inventaire v1.6.5
REM ============================================

echo.
echo ========================================
echo   Deploiement Tailscale sur NAS
echo ========================================
echo.

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

echo [INFO] Configuration:
echo   - NAS: %NAS_USER%@%NAS_HOST%
echo   - Chemin: %NAS_DEPLOY_PATH%
echo.

REM Verifier la connexion SSH
echo [1/6] Test de connexion SSH au NAS...
ssh -o ConnectTimeout=5 %NAS_USER%@%NAS_HOST% "echo 'Connexion OK'" >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Impossible de se connecter au NAS via SSH
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

REM Copier docker-compose-tailscale.yml
echo [3/6] Copie de docker-compose-tailscale.yml...
scp docker-compose-tailscale.yml %NAS_USER%@%NAS_HOST%:%NAS_DEPLOY_PATH%/docker-compose.yml
if errorlevel 1 (
    echo [ERREUR] Impossible de copier docker-compose-tailscale.yml
    pause
    exit /b 1
)
echo [OK] docker-compose-tailscale.yml copie
echo.

REM Copier nginx-tailscale.conf
echo [4/6] Copie de nginx-tailscale.conf...
scp nginx-tailscale.conf %NAS_USER%@%NAS_HOST%:%NAS_DEPLOY_PATH%/
if errorlevel 1 (
    echo [ERREUR] Impossible de copier nginx-tailscale.conf
    pause
    exit /b 1
)
echo [OK] nginx-tailscale.conf copie
echo.

REM Copier .env
echo [5/6] Copie de .env...
scp .env %NAS_USER%@%NAS_HOST%:%NAS_DEPLOY_PATH%/
if errorlevel 1 (
    echo [ERREUR] Impossible de copier .env
    pause
    exit /b 1
)
echo [OK] .env copie
echo.

echo [6/6] Demarrage des conteneurs avec Tailscale...
ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker compose pull && docker compose down && docker compose up -d"
if errorlevel 1 (
    echo [ERREUR] Impossible de demarrer les conteneurs
    pause
    exit /b 1
)
echo [OK] Conteneurs demarres
echo.

REM Afficher le statut
echo ========================================
echo   DEPLOIEMENT TAILSCALE TERMINE !
echo ========================================
echo.
echo Tailscale est en cours de connexion...
echo.
echo PROCHAINES ETAPES:
echo.
echo 1. Attendez 30-60 secondes que Tailscale se connecte
echo.
echo 2. Allez sur: https://login.tailscale.com/admin/machines
echo    Vous devriez voir "inventaire-nas" dans la liste
echo.
echo 3. Cliquez sur "inventaire-nas" puis activez HTTPS
echo    Notez l'URL fournie (ex: https://inventaire-nas.tail1a2b3c.ts.net)
echo.
echo 4. Mettez a jour CORS_ORIGINS dans docker-compose-tailscale.yml:
echo    - CORS_ORIGINS=https://votre-url-tailscale.ts.net,http://localhost
echo.
echo 5. Redeployez avec cette commande:
echo    deploy-tailscale.bat
echo.
echo 6. Installez Tailscale sur vos appareils:
echo    - Android/iOS: App Store / Play Store
echo    - Windows/Mac: https://tailscale.com/download
echo.
echo 7. Connectez-vous et accedez a votre URL Tailscale !
echo.
echo Voir les logs: ssh %NAS_USER%@%NAS_HOST% "cd %NAS_DEPLOY_PATH% && docker logs -f inventaire-tailscale"
echo.

pause
