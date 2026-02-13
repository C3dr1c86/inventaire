@echo off
REM Script de demarrage rapide du backend FastAPI

echo ========================================
echo   Demarrage du Backend (FastAPI)
echo ========================================
echo.

cd backend

REM Verifier si le venv existe
if not exist "venv\Scripts\activate.bat" (
    echo [ERREUR] Environnement virtuel non trouve !
    echo Veuillez creer le venv d'abord avec : python -m venv venv
    echo Puis installer les dependances avec : pip install -r requirements.txt
    pause
    exit /b 1
)

REM Activer le venv et demarrer le serveur
echo Activation de l'environnement virtuel...
call venv\Scripts\activate.bat

echo Demarrage du serveur FastAPI sur http://localhost:8000
echo.
echo [CTRL+C pour arreter le serveur]
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
