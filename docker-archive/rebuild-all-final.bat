@echo off
REM Script final de reconstruction complète
REM Corrige TOUS les problèmes identifiés

echo ========================================
echo RECONSTRUCTION COMPLETE - VERSION FINALE
echo ========================================
echo.

cd /d "%~dp0"

echo [1/6] Reconstruction de l'image BACKEND avec redirect_slashes=False...
docker build --no-cache -t inventaire-backend:latest -f backend/Dockerfile backend
if errorlevel 1 (
    echo ERREUR: Échec du build backend
    pause
    exit /b 1
)
echo OK - Backend construit
echo.

echo [2/6] Reconstruction de l'image FRONTEND avec nginx-proxy...
docker build --no-cache -t inventaire-frontend:latest -f frontend/Dockerfile frontend
if errorlevel 1 (
    echo ERREUR: Échec du build frontend
    pause
    exit /b 1
)
echo OK - Frontend construit
echo.

echo [3/6] Export de l'image backend...
docker save inventaire-backend:latest -o inventaire-backend-final.tar
echo OK - Backend exporté
echo.

echo [4/6] Export de l'image frontend...
docker save inventaire-frontend:latest -o inventaire-frontend-final.tar
echo OK - Frontend exporté
echo.

echo [5/6] Affichage des tailles...
dir inventaire-*-final.tar
echo.

echo [6/6] Vérifications...
echo Vérification de redirect_slashes dans le backend:
docker run --rm inventaire-backend:latest grep -A 2 "app = FastAPI" /app/app/main.py | findstr redirect_slashes
echo.
echo Vérification de nginx-proxy.conf dans le frontend:
docker run --rm inventaire-frontend:latest cat /etc/nginx/conf.d/default.conf | findstr "proxy_pass"
echo.

echo ========================================
echo SUCCÈS - IMAGES PRÊTES !
echo ========================================
echo.
echo Fichiers créés :
echo   - inventaire-backend-final.tar
echo   - inventaire-frontend-final.tar
echo.
echo PROCHAINES ÉTAPES :
echo 1. Copiez ces 2 fichiers vers \\192.168.1.37\docker_data\
echo 2. Dans l'interface Ugreen :
echo    - Supprimez le stack inventaire
echo    - Supprimez les anciennes images
echo    - Importez les 2 nouvelles images
echo    - Créez un nouveau stack avec docker-compose-nginx-proxy.yml
echo.
pause
