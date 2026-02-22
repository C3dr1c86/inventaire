@echo off
cls
echo ========================================
echo   BUILD AUTOMATIQUE VERSION PORTABLE
echo ========================================
echo.

cd /d "%~dp0\.."

set VERSION=2.0.0
set PYTHON_VERSION=3.11.8
set OUTPUT_DIR=build-complet
set PACKAGE_NAME=inventaire-portable-complet-v%VERSION%
set PYTHON_URL=https://www.python.org/ftp/python/%PYTHON_VERSION%/python-%PYTHON_VERSION%-embed-amd64.zip

echo [1/10] Nettoyage...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%"
echo OK

echo [2/10] Telechargement Python embarque...
set PYTHON_ZIP=%OUTPUT_DIR%\python-embed.zip
powershell -Command "$ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '%PYTHON_URL%' -OutFile '%PYTHON_ZIP%'"
if errorlevel 1 goto error
echo OK

echo [3/10] Extraction Python...
powershell -Command "Expand-Archive -Path '%PYTHON_ZIP%' -DestinationPath '%OUTPUT_DIR%\%PACKAGE_NAME%\python' -Force"
del "%PYTHON_ZIP%"
echo OK

echo [4/10] Configuration Python...
(
echo python311.zip
echo .
echo.
echo import site
) > "%OUTPUT_DIR%\%PACKAGE_NAME%\python\python311._pth"
echo OK

echo [5/10] Installation pip...
set PYTHON_EXE=%CD%\%OUTPUT_DIR%\%PACKAGE_NAME%\python\python.exe
set GETPIP_FILE=%CD%\%OUTPUT_DIR%\%PACKAGE_NAME%\python\get-pip.py
powershell -Command "$ProgressPreference='SilentlyContinue'; Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile '%GETPIP_FILE%'"
"%PYTHON_EXE%" "%GETPIP_FILE%" --no-warn-script-location
if errorlevel 1 (
    echo ERREUR installation pip !
    goto error
)
del "%GETPIP_FILE%"
echo OK

echo [6/10] Installation dependances...
copy "..\..\..\backend\requirements.txt" "%OUTPUT_DIR%\%PACKAGE_NAME%\requirements.txt" > nul
"%PYTHON_EXE%" -m pip install --no-warn-script-location -q -r "%OUTPUT_DIR%\%PACKAGE_NAME%\requirements.txt"
if errorlevel 1 (
    echo ERREUR installation dependances !
    goto error
)
del "%OUTPUT_DIR%\%PACKAGE_NAME%\requirements.txt"
echo OK

echo [7/10] Copie backend...
xcopy /E /I /Y /Q "..\..\..\backend" "%OUTPUT_DIR%\%PACKAGE_NAME%\backend" > nul
copy /Y "backend-run.py" "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\run.py" > nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\__pycache__" 2>nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\venv" 2>nul
del /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database" 2>nul
(
echo DATABASE_URL=sqlite:///./database/inventaire.db
echo SECRET_KEY=portable-demo-secret-change-in-production
echo API_HOST=127.0.0.1
echo API_PORT=8000
) > "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\.env.portable"
echo OK

echo [8/10] Copie frontend...
xcopy /E /I /Y /Q "..\..\..\frontend\dist" "%OUTPUT_DIR%\%PACKAGE_NAME%\frontend\dist" > nul
echo OK

echo [9/10] Creation DB demo...
python scripts\create-demo-db.py "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database\inventaire.db" 2>nul
echo OK

echo [10/10] Creation scripts...
call :create_launcher
call :create_readme
copy /Y "templates\Arreter-Inventaire.bat" "%OUTPUT_DIR%\%PACKAGE_NAME%\Arreter Inventaire.bat" > nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\logs" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\exports" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\uploads" 2>nul
echo OK

echo [BONUS] Compression ZIP...
cd "%OUTPUT_DIR%"
powershell -Command "$ProgressPreference='SilentlyContinue'; Compress-Archive -Path '%PACKAGE_NAME%' -DestinationPath '%PACKAGE_NAME%.zip' -CompressionLevel Optimal -Force"
cd ..
echo OK

echo.
echo ========================================
echo   BUILD TERMINE !
echo ========================================
echo.
echo Dossier : %OUTPUT_DIR%\%PACKAGE_NAME%\
echo ZIP     : %OUTPUT_DIR%\%PACKAGE_NAME%.zip
echo.
echo Test immediat :
echo   cd %OUTPUT_DIR%\%PACKAGE_NAME%
echo   "Lancer Inventaire.bat"
echo.
goto end

:create_launcher
(
echo @echo off
echo title Inventaire d'Atelier
echo color 0A
echo cls
echo.
echo echo ========================================
echo echo   INVENTAIRE - VERSION PORTABLE
echo echo ========================================
echo echo.
echo cd /d "%%~dp0"
echo if not exist logs mkdir logs
echo if not exist data\exports mkdir data\exports
echo if not exist data\uploads mkdir data\uploads
echo echo [1/3] Demarrage backend...
echo start /B cmd /c "python\python.exe backend\run.py ^> logs\backend.log 2^>^&1"
echo echo [2/3] Attente 15 secondes...
echo timeout /t 15 /nobreak ^> nul
echo echo [3/3] Demarrage frontend...
echo cd frontend\dist
echo start /B cmd /c "..\..\python\python.exe -m http.server 5173 ^> ..\..\logs\frontend.log 2^>^&1"
echo cd ..\..
echo timeout /t 5 /nobreak ^> nul
echo echo.
echo echo ========================================
echo echo   PRET ! http://localhost:5173
echo echo   Login : admin / admin
echo echo ========================================
echo echo.
echo start http://localhost:5173
echo echo Ne fermez pas cette fenetre !
echo pause ^> nul
) > "%OUTPUT_DIR%\%PACKAGE_NAME%\Lancer Inventaire.bat"
exit /b

:create_readme
(
echo ========================================
echo   VERSION PORTABLE COMPLETE
echo ========================================
echo.
echo LANCEMENT :
echo   Double-clic "Lancer Inventaire.bat"
echo.
echo AUCUNE INSTALLATION NECESSAIRE !
echo   - Python embarque inclus
echo   - Dependances incluses
echo   - DB demo incluse
echo.
echo LOGIN : admin / admin
echo.
echo ARRET : "Arreter Inventaire.bat"
echo.
echo Version %VERSION%
echo ========================================
) > "%OUTPUT_DIR%\%PACKAGE_NAME%\LISEZMOI.txt"
exit /b

:error
echo.
echo ERREUR lors du build !
echo.
exit /b 1

:end
