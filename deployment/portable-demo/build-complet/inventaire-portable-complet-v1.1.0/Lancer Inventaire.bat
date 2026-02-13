@echo off
title Inventaire d'Atelier - Version Portable
color 0A
cls

echo.
echo ========================================
echo   INVENTAIRE - VERSION PORTABLE COMPLETE
echo ========================================
echo.
echo Demarrage...
echo.

cd /d "%~dp0"

if not exist logs mkdir logs
if not exist data\exports mkdir data\exports
if not exist data\uploads mkdir data\uploads

echo [1/3] Demarrage backend...
start /B cmd /c "python\python.exe backend\run.py > logs\backend.log 2>&1"

echo [2/3] Attente backend (15 secondes)...
timeout /t 15 /nobreak > nul

echo [3/3] Demarrage frontend...
cd frontend
start /B cmd /c "..\python\python.exe -m http.server 5173 > ..\logs\frontend.log 2>&1"
cd ..

timeout /t 5 /nobreak > nul

echo.
echo ========================================
echo   APPLICATION PRETE !
echo ========================================
echo.
echo URL : http://localhost:5173
echo Login : admin / admin
echo.

start http://localhost:5173

echo Ne fermez pas cette fenetre !
echo Pour arreter : "Arreter Inventaire.bat"
echo.

pause > nul
