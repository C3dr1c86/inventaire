@echo off
REM Script de demarrage rapide de l'application complete (Backend + Frontend)

echo ========================================
echo   Application Inventaire
echo   Demarrage en mode developpement
echo ========================================
echo.

REM Verifier si Python est installe
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Python n'est pas installe ou n'est pas dans le PATH
    pause
    exit /b 1
)

REM Verifier si Node.js est installe
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH
    pause
    exit /b 1
)

echo [OK] Python et Node.js sont installes
echo.

REM Verifier l'environnement backend
if not exist "backend\venv\Scripts\activate.bat" (
    echo [INFO] Creation de l'environnement virtuel Python...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    echo [INFO] Installation des dependances Python...
    pip install -r requirements.txt
    cd ..
    echo.
)

REM Verifier les dependances frontend
if not exist "frontend\node_modules" (
    echo [INFO] Installation des dependances Node.js...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo ========================================
echo   Demarrage des serveurs...
echo ========================================
echo.
echo Backend API : http://localhost:8000
echo Frontend    : http://localhost:5173
echo.
echo Documentation API : http://localhost:8000/docs
echo.
echo [CTRL+C dans chaque fenetre pour arreter]
echo ========================================
echo.

REM Demarrer le backend dans une nouvelle fenetre
start "Backend API (FastAPI)" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

REM Attendre 3 secondes pour que le backend demarre
timeout /t 3 /nobreak >nul

REM Demarrer le frontend dans une nouvelle fenetre
start "Frontend (React)" cmd /k "cd frontend && npm run dev"

echo.
echo [INFO] Les deux serveurs sont en cours de demarrage...
echo [INFO] Le navigateur s'ouvrira automatiquement dans quelques secondes.
echo.
echo Pour arreter l'application, fermez les deux fenetres de terminal.
echo.

REM Attendre 5 secondes puis ouvrir le navigateur
timeout /t 5 /nobreak >nul
start http://localhost:5173

echo.
echo [APPUYEZ SUR UNE TOUCHE POUR FERMER CETTE FENETRE]
pause >nul
