@echo off
echo.
echo ========================================
echo REINITIALISATION DE LA BASE DE DONNEES
echo ========================================
echo.
echo Ce script va :
echo   1. Supprimer la base de donnees actuelle
echo   2. La recreer avec des donnees de test
echo.
echo ATTENTION : Toutes les donnees actuelles seront perdues !
echo.
pause

cd ..
cd backend

echo.
echo Activation de l'environnement virtuel...
call venv\Scripts\activate

echo.
echo Suppression de l'ancienne base de donnees...
if exist database\inventaire.db (
    del database\inventaire.db
    echo Base de donnees supprimee.
) else (
    echo Aucune base de donnees a supprimer.
)

echo.
echo Peuplement de la base de donnees avec des donnees de test...
python seed_database.py

echo.
echo ========================================
echo REINITIALISATION TERMINEE !
echo ========================================
echo.
echo Vous pouvez maintenant demarrer le backend et le frontend.
echo.
pause
