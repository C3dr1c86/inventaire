@echo off
cls
echo ========================================
echo   BUILD VERSION PORTABLE
echo ========================================
echo.

REM Se placer dans le dossier deployment/portable-demo/
cd /d "%~dp0\.."

REM Variables
set VERSION=1.1.0
set OUTPUT_DIR=build
set PACKAGE_NAME=inventaire-portable-v%VERSION%
set PYTHON_VERSION=3.11.8

echo Configuration :
echo   - Version : %VERSION%
echo   - Package : %PACKAGE_NAME%
echo   - Python  : %PYTHON_VERSION%
echo.

REM ========================================
echo [1/9] Nettoyage dossier build...
REM ========================================
if exist "%OUTPUT_DIR%" (
    echo Suppression dossier build existant...
    rmdir /s /q "%OUTPUT_DIR%"
)
mkdir "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%"
echo OK
echo.

REM ========================================
echo [2/9] Telechargement Python portable...
REM ========================================
set PYTHON_URL=https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-embed-amd64.zip
set PYTHON_ZIP=%OUTPUT_DIR%\python-embed.zip

if not exist "%OUTPUT_DIR%\python" (
    echo Telechargement Python %PYTHON_VERSION% embarque...
    echo URL : %PYTHON_URL%
    echo.
    echo Telechargement en cours (peut prendre quelques minutes)...

    REM Utiliser PowerShell pour télécharger
    powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%'}"

    if errorlevel 1 (
        echo.
        echo ERREUR : Echec du telechargement de Python !
        echo.
        echo Telechargez manuellement :
        echo 1. Allez sur https://www.python.org/downloads/windows/
        echo 2. Telechargez "Windows embeddable package (64-bit)"
        echo 3. Extrayez dans %OUTPUT_DIR%\python\
        echo 4. Relancez ce script
        echo.
        pause
        exit /b 1
    )

    echo Extraction de Python...
    powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%OUTPUT_DIR%\python' -Force"
    del "%PYTHON_ZIP%"

    REM Configurer pip dans Python embarqué
    echo Configuration de pip...
    echo import sys > "%OUTPUT_DIR%\python\python311._pth"
    echo python311.zip >> "%OUTPUT_DIR%\python\python311._pth"
    echo . >> "%OUTPUT_DIR%\python\python311._pth"
    echo Lib >> "%OUTPUT_DIR%\python\python311._pth"
    echo Lib\site-packages >> "%OUTPUT_DIR%\python\python311._pth"

    REM Télécharger get-pip.py
    echo Telechargement pip...
    powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%OUTPUT_DIR%\python\get-pip.py'"

    REM Installer pip
    cd %OUTPUT_DIR%\python
    python.exe get-pip.py
    cd ..\..

    echo Python portable configure avec succes !
) else (
    echo Python portable deja present
)
echo OK
echo.

REM ========================================
echo [3/9] Copie Python portable dans package...
REM ========================================
xcopy /E /I /Y "%OUTPUT_DIR%\python" "%OUTPUT_DIR%\%PACKAGE_NAME%\python" > nul
echo OK
echo.

REM ========================================
echo [4/9] Copie backend...
REM ========================================
echo Copie des fichiers backend...
xcopy /E /I /Y "..\..\..\backend" "%OUTPUT_DIR%\%PACKAGE_NAME%\backend" > nul

REM Copier le script run.py personnalisé
copy /Y "backend-run.py" "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\run.py" > nul

REM Créer .env.portable
echo DATABASE_URL=sqlite:///./database/inventaire.db > "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo SECRET_KEY=portable-demo-secret-change-in-production >> "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo API_HOST=127.0.0.1 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo API_PORT=8000 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"

REM Supprimer fichiers inutiles
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\__pycache__" 2>nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\venv" 2>nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database" 2>nul
del /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env" 2>nul

mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database"
echo OK
echo.

REM ========================================
echo [5/9] Build frontend...
REM ========================================
echo Build du frontend React en mode production...
cd ..\..\..\frontend

REM Vérifier si node_modules existe
if not exist "node_modules" (
    echo Installation des dependances npm...
    call npm install
)

echo Build en cours...
call npm run build

if errorlevel 1 (
    echo.
    echo ERREUR : Echec du build frontend !
    echo.
    pause
    exit /b 1
)

cd ..\deployment\portable-demo
echo OK
echo.

REM ========================================
echo [6/9] Copie frontend build...
REM ========================================
echo Copie du build frontend...
xcopy /E /I /Y "..\..\..\frontend\dist" "%OUTPUT_DIR%\%PACKAGE_NAME%\frontend\dist" > nul
echo OK
echo.

REM ========================================
echo [7/9] Creation base de donnees demo...
REM ========================================
echo Generation de la base de donnees avec exemples...
python scripts\create-demo-db.py "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database\inventaire.db"

if errorlevel 1 (
    echo.
    echo AVERTISSEMENT : Echec creation base de donnees demo
    echo La DB sera creee au premier lancement
    echo.
)
echo OK
echo.

REM ========================================
echo [8/9] Copie scripts et fichiers...
REM ========================================
echo Copie des scripts de lancement...
copy /Y "templates\Lancer-Inventaire.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat" > nul
copy /Y "templates\Arreter-Inventaire.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\Arreter Inventaire.bat" > nul
copy /Y "templates\LISEZMOI.txt" "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt" > nul

REM Créer dossiers nécessaires
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\logs" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\exports" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\uploads" 2>nul

echo OK
echo.

REM ========================================
echo [9/9] Compression en ZIP...
REM ========================================
echo Creation de l'archive ZIP...
powershell -Command "Compress-Archive -Path '%OUTPUT_DIR%\%PACKAGE_NAME%\*' -DestinationPath '%OUTPUT_DIR%\%PACKAGE_NAME%.zip' -Force"

if errorlevel 1 (
    echo.
    echo AVERTISSEMENT : Echec compression ZIP
    echo Le package non compresse est disponible dans %OUTPUT_DIR%\%PACKAGE_NAME%\
    echo.
) else (
    echo Archive creee : %OUTPUT_DIR%\%PACKAGE_NAME%.zip
)
echo OK
echo.

REM Calculer taille
echo.
echo ========================================
echo   BUILD TERMINE !
echo ========================================
echo.
echo Package cree : %OUTPUT_DIR%\%PACKAGE_NAME%\
echo Archive ZIP  : %OUTPUT_DIR%\%PACKAGE_NAME%.zip
echo.

REM Afficher taille du dossier
for /f "tokens=3" %%a in ('dir "%OUTPUT_DIR%\%PACKAGE_NAME%" /-c ^| find "octets"') do set FOLDER_SIZE=%%a
echo Taille dossier : %FOLDER_SIZE% octets

REM Afficher taille du ZIP si créé
if exist "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" (
    for %%A in ("%OUTPUT_DIR%\%PACKAGE_NAME%.zip") do set ZIP_SIZE=%%~zA
    echo Taille ZIP     : %ZIP_SIZE% octets
)

echo.
echo Prochaines etapes :
echo   1. Tester : Executez "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo   2. Distribuer : Copiez le ZIP sur cle USB ou partagez
echo.
echo Distribution recommandee :
echo   - Cle USB 8 GB minimum
echo   - Extraire le ZIP avant utilisation
echo   - Conserver le dossier complet
echo.

pause
