@echo off
title Arret Inventaire
color 0C
cls

echo.
echo ========================================
echo   ARRET DE L'APPLICATION
echo ========================================
echo.

echo Arret des serveurs en cours...

REM Tuer tous les processus Python (backend et frontend)
taskkill /F /IM python.exe /T > nul 2>&1

REM Attendre un peu
timeout /t 1 /nobreak > nul

echo.
echo ========================================
echo   APPLICATION ARRETEE
echo ========================================
echo.
echo L'application a ete arretee avec succes.
echo Vous pouvez fermer cette fenetre.
echo.

timeout /t 3 /nobreak > nul
