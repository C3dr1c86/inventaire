@echo off
REM Rebuild du frontend avec --no-cache pour forcer la mise à jour
REM À exécuter sur le PC Windows

echo ========================================
echo REBUILD FRONTEND (NO CACHE)
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Suppression du cache et rebuild de l'image frontend...
docker build --no-cache -t inventaire-frontend:latest -f frontend/Dockerfile frontend
if errorlevel 1 (
    echo ERREUR: Échec du build frontend
    pause
    exit /b 1
)
echo OK - Frontend reconstruit (sans cache)
echo.

echo [2/3] Export de l'image frontend...
docker save inventaire-frontend:latest -o inventaire-frontend-nginx-final.tar
echo OK - Frontend exporté (inventaire-frontend-nginx-final.tar)
echo.

echo [3/3] Vérification du contenu de docker-entrypoint.sh...
echo.
echo Contenu de docker-entrypoint.sh qui sera utilisé :
type frontend\docker-entrypoint.sh | findstr "VITE_API_URL"
echo.

echo ========================================
echo SUCCÈS !
echo ========================================
echo.
echo Fichier créé :
echo   - inventaire-frontend-nginx-final.tar
echo.
echo PROCHAINES ÉTAPES :
echo 1. Copiez ce fichier vers \\192.168.1.37\docker_data\
echo 2. Dans l'interface Ugreen :
echo    - Arrêtez le conteneur inventaire_frontend
echo    - Supprimez l'image inventaire-frontend:latest
echo    - Importez inventaire-frontend-nginx-final.tar
echo    - Redémarrez le stack
echo.
pause
