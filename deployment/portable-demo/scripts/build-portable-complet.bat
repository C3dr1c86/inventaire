@echo off
cls
echo ========================================
echo   BUILD VERSION PORTABLE COMPLETE
echo   (avec Python embarque)
echo ========================================
echo.

REM Se placer dans le dossier deployment/portable-demo/
cd /d "%~dp0\.."

REM Variables
set VERSION=1.1.0
set PYTHON_VERSION=3.11.8
set OUTPUT_DIR=build-complet
set PACKAGE_NAME=inventaire-portable-complet-v%VERSION%
set PYTHON_URL=https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-embed-amd64.zip

echo Configuration :
echo   - Version : %VERSION%
echo   - Python  : %PYTHON_VERSION% (embarque)
echo   - Package : %PACKAGE_NAME%
echo.
pause

REM ========================================
echo [1/10] Nettoyage...
REM ========================================
if exist "%OUTPUT_DIR%" (
    echo Suppression dossier existant...
    rmdir /s /q "%OUTPUT_DIR%"
)
mkdir "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%"
echo OK
echo.

REM ========================================
echo [2/10] Telechargement Python embarque...
REM ========================================
set PYTHON_ZIP=%OUTPUT_DIR%\python-embed.zip

echo Telechargement depuis python.org...
echo URL : %PYTHON_URL%
echo (Taille : ~10 MB, peut prendre 1-2 minutes)
echo.

powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%'}"

if errorlevel 1 (
    echo.
    echo ERREUR : Telechargement echoue !
    echo.
    echo Verifiez votre connexion internet.
    echo Ou telechargez manuellement depuis :
    echo https://www.python.org/downloads/windows/
    echo.
    pause
    exit /b 1
)

echo Telechargement termine !
echo.

REM ========================================
echo [3/10] Extraction Python...
REM ========================================
echo Extraction de Python embarque...
powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%OUTPUT_DIR%\%PACKAGE_NAME%\python' -Force"
del "%PYTHON_ZIP%"
echo OK
echo.

REM ========================================
echo [4/10] Configuration Python embarque...
REM ========================================
echo Configuration pip et chemins...

REM Créer python311._pth pour activer site-packages
echo python311.zip > "%OUTPUT_DIR%\%PACKAGE_NAME%\python\python311._pth"
echo . >> "%OUTPUT_DIR%\%PACKAGE_NAME%\python\python311._pth"
echo >> "%OUTPUT_DIR%\%PACKAGE_NAME%\python\python311._pth"
echo # Activer site-packages >> "%OUTPUT_DIR%\%PACKAGE_NAME%\python\python311._pth"
echo import site >> "%OUTPUT_DIR%\%PACKAGE_NAME%\python\python311._pth"

echo OK
echo.

REM ========================================
echo [5/10] Installation de pip...
REM ========================================
echo Telechargement get-pip.py...
powershell -Command "Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%OUTPUT_DIR%\%PACKAGE_NAME%\python\get-pip.py'"

echo Installation pip...
cd "%OUTPUT_DIR%\%PACKAGE_NAME%\python"
python.exe get-pip.py --no-warn-script-location
cd ..\..\..

if errorlevel 1 (
    echo.
    echo AVERTISSEMENT : Installation pip partielle
    echo On continue quand meme...
    echo.
)
echo OK
echo.

REM ========================================
echo [6/10] Installation dependances Python...
REM ========================================
echo Installation des dependances du backend...
echo (Cela peut prendre 2-3 minutes)
echo.

REM Copier requirements.txt temporairement
copy "..\..\..\backend\requirements.txt" "%OUTPUT_DIR%\%PACKAGE_NAME%\requirements.txt" > nul

cd "%OUTPUT_DIR%\%PACKAGE_NAME%"
python\python.exe -m pip install --no-warn-script-location -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERREUR : Installation dependances echouee !
    echo.
    pause
    cd ..\..
    exit /b 1
)

del requirements.txt
cd ..\..

echo OK
echo.

REM ========================================
echo [7/10] Copie backend...
REM ========================================
echo Copie des fichiers backend...
xcopy /E /I /Y "..\..\..\backend" "%OUTPUT_DIR%\%PACKAGE_NAME%\backend" > nul

REM Copier run.py personnalisé
copy /Y "backend-run.py" "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\run.py" > nul

REM Nettoyer
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\__pycache__" 2>nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\venv" 2>nul
del /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env" 2>nul

REM Créer .env.portable
echo DATABASE_URL=sqlite:///./database/inventaire.db > "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo SECRET_KEY=portable-demo-secret-change-in-production >> "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo API_HOST=127.0.0.1 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo API_PORT=8000 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"

echo OK
echo.

REM ========================================
echo [8/10] Copie frontend build...
REM ========================================
echo Copie du build frontend...
xcopy /E /I /Y "..\..\..\frontend\dist" "%OUTPUT_DIR%\%PACKAGE_NAME%\frontend\dist" > nul
echo OK
echo.

REM ========================================
echo [9/10] Creation base de donnees demo...
REM ========================================
echo Generation DB avec donnees exemple...
python scripts\create-demo-db.py "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database\inventaire.db"
echo OK
echo.

REM ========================================
echo [10/10] Creation scripts de lancement...
REM ========================================
echo Creation scripts...

REM Script de lancement principal
echo @echo off > "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo title Inventaire d'Atelier >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo color 0A >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo cls >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo ======================================== >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo   INVENTAIRE D'ATELIER - VERSION PORTABLE >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo ======================================== >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo Demarrage... >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo cd /d "%%~dp0" >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo if not exist "logs" mkdir logs >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo if not exist "data\exports" mkdir data\exports >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo if not exist "data\uploads" mkdir data\uploads >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo [1/3] Demarrage backend... >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo start /B cmd /c "python\python.exe backend\run.py ^> logs\backend.log 2^>^&1" >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo [2/3] Attente backend (15 secondes)... >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo timeout /t 15 /nobreak ^> nul >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo [3/3] Demarrage frontend... >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo cd frontend\dist >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo start /B cmd /c "..\..\python\python.exe -m http.server 5173 ^> ..\..\logs\frontend.log 2^>^&1" >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo cd ..\.. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo timeout /t 5 /nobreak ^> nul >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo ======================================== >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo   APPLICATION PRETE ! >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo ======================================== >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo URL : http://localhost:5173 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo Login : admin / admin >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo start http://localhost:5173 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo Ne fermez pas cette fenetre ! >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo Pour arreter : "Arreter Inventaire.bat" >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
echo pause ^> nul >> "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"

REM Copier script arrêt
copy /Y "templates\Arreter-Inventaire.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\Arreter Inventaire.bat" > nul

REM Créer README
echo ======================================== > "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo   VERSION PORTABLE COMPLETE >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo ======================================== >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo LANCEMENT : >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo   Double-clic sur "Lancer Inventaire.bat" >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo AUCUNE INSTALLATION NECESSAIRE ! >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo - Python embarque inclus >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo - Toutes dependances incluses >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo - Base de donnees demo incluse >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo LOGIN : >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo   Username : admin >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo   Password : admin >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo ARRET : >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo   Double-clic sur "Arreter Inventaire.bat" >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo. >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo Version %VERSION% - Fevrier 2026 >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
echo ======================================== >> "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"

REM Créer dossiers
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\logs" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\exports" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\uploads" 2>nul

echo OK
echo.

REM ========================================
echo [BONUS] Compression ZIP...
REM ========================================
echo Creation archive ZIP...
echo (Cela peut prendre 2-3 minutes)
echo.

cd "%OUTPUT_DIR%"
powershell -Command "Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '%PACKAGE_NAME%.zip' -CompressionLevel Optimal -Force"
cd ..

if exist "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" (
    echo ZIP cree avec succes !
) else (
    echo AVERTISSEMENT : ZIP non cree, utilisez le dossier directement
)
echo.

REM ========================================
echo TERMINE !
REM ========================================
echo.
echo ========================================
echo   BUILD TERMINE AVEC SUCCES !
echo ========================================
echo.
echo Package cree : %OUTPUT_DIR%\%PACKAGE_NAME%\
echo Archive ZIP  : %OUTPUT_DIR%\%PACKAGE_NAME%.zip
echo.

REM Calculer taille
for /f "tokens=3" %%a in ('dir "%OUTPUT_DIR%\%PACKAGE_NAME%" /-c ^| find "octets"') do set FOLDER_SIZE=%%a
echo Taille dossier : %FOLDER_SIZE% octets (~150-200 MB)

if exist "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" (
    for %%A in ("%OUTPUT_DIR%\%PACKAGE_NAME%.zip") do set ZIP_SIZE=%%~zA
    echo Taille ZIP     : %ZIP_SIZE% octets (~60-80 MB)
)

echo.
echo CARACTERISTIQUES :
echo   - Python 3.11.8 embarque (~30 MB)
echo   - Toutes dependances incluses (~100 MB)
echo   - Base de donnees demo (~100 KB)
echo   - Aucune installation requise sur PC cible
echo   - Fonctionne sur TOUS les PC Windows 64-bit
echo.
echo UTILISATION :
echo   1. Copier le dossier sur cle USB
echo   2. Double-clic "Lancer Inventaire.bat"
echo   3. C'est tout !
echo.
echo TEST IMMEDIAT :
echo   cd %OUTPUT_DIR%\%PACKAGE_NAME%
echo   "Lancer Inventaire.bat"
echo.

pause
