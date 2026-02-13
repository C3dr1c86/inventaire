@echo off
echo.
echo ========================================
echo AJOUT DE DONNEES DE TEST
echo ========================================
echo.
echo Ce script va ajouter des donnees de test a la base existante.
echo Si la base n'existe pas, elle sera creee.
echo.
pause

cd ..
cd backend

echo.
echo Activation de l'environnement virtuel...
call venv\Scripts\activate

echo.
echo Peuplement de la base de donnees...
python seed_database.py

echo.
echo ========================================
echo TERMINÉ !
echo ========================================
echo.
echo Connexion : admin / admin
echo Frontend : http://localhost:5173
echo Swagger : http://localhost:8000/docs
echo.
pause
