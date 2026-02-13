@echo off
REM Script de demarrage rapide du frontend React

echo ========================================
echo   Demarrage du Frontend (React)
echo ========================================
echo.

cd frontend

REM Verifier si node_modules existe
if not exist "node_modules" (
    echo [AVERTISSEMENT] node_modules non trouve !
    echo Installation des dependances...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERREUR] Echec de l'installation des dependances
        pause
        exit /b 1
    )
)

echo Demarrage du serveur de developpement Vite sur http://localhost:5173
echo.
echo [CTRL+C pour arreter le serveur]
echo.

npm run dev
