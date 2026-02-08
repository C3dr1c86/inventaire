@echo off
REM Script de reconstruction des images avec config Nginx Proxy
REM À exécuter sur le PC Windows

echo ========================================
echo RECONSTRUCTION DES IMAGES NGINX PROXY
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Reconstruction de l'image BACKEND...
docker build -t inventaire-backend:latest -f backend/Dockerfile backend
if errorlevel 1 (
    echo ERREUR: Échec du build backend
    pause
    exit /b 1
)
echo OK - Backend construit
echo.

echo [2/4] Reconstruction de l'image FRONTEND avec nginx-proxy.conf...
docker build -t inventaire-frontend:latest -f frontend/Dockerfile frontend
if errorlevel 1 (
    echo ERREUR: Échec du build frontend
    pause
    exit /b 1
)
echo OK - Frontend construit
echo.

echo [3/4] Export de l'image backend...
docker save inventaire-backend:latest -o inventaire-backend-nginx.tar
echo OK - Backend exporté (inventaire-backend-nginx.tar)
echo.

echo [4/4] Export de l'image frontend...
docker save inventaire-frontend:latest -o inventaire-frontend-nginx.tar
echo OK - Frontend exporté (inventaire-frontend-nginx.tar)
echo.

echo ========================================
echo SUCCÈS !
echo ========================================
echo.
echo Fichiers créés :
echo   - inventaire-backend-nginx.tar
echo   - inventaire-frontend-nginx.tar
echo.
echo PROCHAINES ÉTAPES :
echo 1. Copiez ces 2 fichiers vers \\192.168.1.37\docker_data\
echo 2. Dans l'interface Ugreen :
echo    - Supprimez le stack inventaire
echo    - Supprimez les anciennes images
echo    - Importez les 2 nouvelles images .tar
echo    - Recréez le stack avec docker-compose-nginx-proxy.yml
echo.
pause
