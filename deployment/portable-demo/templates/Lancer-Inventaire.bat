@echo off
title Inventaire d'Atelier - Demonstration
color 0A
cls

echo.
echo ========================================
echo   INVENTAIRE D'ATELIER - DEMO
echo ========================================
echo.
echo Demarrage de l'application...
echo.

REM Se placer dans le dossier du script
cd /d "%~dp0"

REM Vérifier si Python est présent
if not exist "python\python.exe" (
    echo ERREUR : Python portable introuvable !
    echo.
    echo Verifiez que le dossier python\ existe.
    echo.
    echo Instructions :
    echo 1. Telechargez Python Embedded depuis python.org
    echo 2. Extrayez dans le dossier python\
    echo.
    pause
    exit /b 1
)

REM Créer dossiers si nécessaires
if not exist "logs" mkdir logs
if not exist "data\exports" mkdir data\exports
if not exist "data\uploads" mkdir data\uploads

REM Créer venv si première exécution
if not exist "backend\venv\" (
    echo.
    echo ========================================
    echo   PREMIERE EXECUTION
    echo ========================================
    echo.
    echo Installation des dependances...
    echo Cela peut prendre 1-2 minutes.
    echo Veuillez patienter...
    echo.

    REM Configurer pip dans Python embarqué
    if not exist "python\Scripts" mkdir python\Scripts
    python\python.exe -m ensurepip --default-pip

    REM Créer venv
    python\python.exe -m venv backend\venv

    REM Installer dépendances
    backend\venv\Scripts\pip.exe install --quiet -r backend\requirements.txt > logs\install.log 2>&1

    if errorlevel 1 (
        echo.
        echo ERREUR lors de l'installation des dependances !
        echo Consultez logs\install.log pour plus de details.
        echo.
        pause
        exit /b 1
    )

    echo.
    echo Installation terminee avec succes !
    echo.
)

REM Démarrer backend
echo [1/3] Demarrage du serveur backend...
start /B cmd /c "backend\venv\Scripts\python.exe backend\run.py > logs\backend.log 2>&1"

REM Attendre que le backend soit prêt (max 30 secondes)
echo [2/3] Attente du demarrage backend...
set /a count=0
:wait_backend
timeout /t 1 /nobreak > nul
set /a count+=1
curl -s http://localhost:8000/api/health > nul 2>&1
if errorlevel 1 (
    if %count% LSS 30 goto wait_backend
    echo ERREUR : Le backend n'a pas demarre correctement !
    echo Consultez logs\backend.log pour plus de details.
    pause
    exit /b 1
)

echo Backend pret !
echo.

REM Démarrer serveur frontend simple (Python HTTP server)
echo [3/3] Demarrage du serveur frontend...
cd frontend\dist
start /B cmd /c "..\..\python\python.exe -m http.server 5173 > ..\..\logs\frontend.log 2>&1"
cd ..\..

REM Attendre un peu que le frontend démarre
timeout /t 2 /nobreak > nul

echo.
echo ========================================
echo   APPLICATION PRETE !
echo ========================================
echo.
echo URL : http://localhost:5173
echo.
echo Identifiants demo :
echo   Username : admin
echo   Password : admin
echo.
echo Ouverture du navigateur...
timeout /t 2 /nobreak > nul

REM Ouvrir navigateur
start http://localhost:5173

echo.
echo ========================================
echo L'application est maintenant lancee !
echo ========================================
echo.
echo IMPORTANT : NE FERMEZ PAS cette fenetre !
echo.
echo Pour arreter l'application :
echo   Double-cliquez sur "Arreter Inventaire.bat"
echo   OU appuyez sur Ctrl+C dans cette fenetre
echo.
echo ========================================
echo.

REM Garder la fenêtre ouverte
pause > nul
