# Script d'assemblage du package portable v2.0.0
$base = "C:\Users\cedri\Desktop\inventaire\deployment\portable-demo\build-complet\inventaire-portable-complet-v2.0.0"
$repo = "C:\Users\cedri\Desktop\inventaire"

Write-Host "[7] Copie backend..."
Copy-Item -Path "$repo\backend\app" -Destination "$base\backend\app" -Recurse -Force
Copy-Item -Path "$repo\deployment\portable-demo\backend-run.py" -Destination "$base\backend\run.py" -Force
Get-ChildItem "$base\backend" -Include "__pycache__" -Recurse -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Get-ChildItem "$base\backend" -Filter "*.pyc" -Recurse | Remove-Item -Force -ErrorAction SilentlyContinue

$envContent = @"
DATABASE_URL=sqlite:///./database/inventaire.db
SECRET_KEY=portable-demo-secret-key-2024-inventaire-atelier
API_HOST=127.0.0.1
API_PORT=8000
"@
[System.IO.File]::WriteAllText("$base\backend\.env", $envContent, [System.Text.Encoding]::ASCII)
New-Item -ItemType Directory -Path "$base\backend\database" -Force | Out-Null
Write-Host "  Backend: OK"

Write-Host "[8] Copie frontend..."
New-Item -ItemType Directory -Path "$base\frontend\dist" -Force | Out-Null
Copy-Item -Path "$repo\frontend\dist\*" -Destination "$base\frontend\dist" -Recurse -Force
Write-Host "  Frontend: OK"

Write-Host "[9] Creation BDD demo..."
$python = "$base\python\python.exe"
$script = "$repo\deployment\portable-demo\scripts\create-demo-db.py"
$dbPath = "$base\backend\database\inventaire.db"
& $python $script $dbPath
Write-Host "  BDD: OK"

Write-Host "[10] Creation repertoires et scripts..."
New-Item -ItemType Directory -Path "$base\logs" -Force | Out-Null
New-Item -ItemType Directory -Path "$base\data\exports" -Force | Out-Null
New-Item -ItemType Directory -Path "$base\data\uploads" -Force | Out-Null

# Script Lancer Inventaire
$launcher = @'
@echo off
title Inventaire d'Atelier v2.0.0
color 0A
cls
echo.
echo ========================================
echo   INVENTAIRE ATELIER v2.0.0
echo ========================================
echo.
cd /d "%~dp0"
if not exist logs mkdir logs
if not exist data\exports mkdir data\exports
if not exist data\uploads mkdir data\uploads
echo [1/3] Demarrage backend...
start /B cmd /c "python\python.exe backend\run.py > logs\backend.log 2>&1"
echo [2/3] Attente demarrage (15 secondes)...
timeout /t 15 /nobreak > nul
echo [3/3] Demarrage frontend...
cd frontend\dist
start /B cmd /c "..\..\python\python.exe -m http.server 5173 > ..\..\logs\frontend.log 2>&1"
cd ..\..
timeout /t 3 /nobreak > nul
echo.
echo ========================================
echo   PRET !  http://localhost:5173
echo   Login : admin / admin
echo ========================================
echo.
echo Ne fermez pas cette fenetre !
start http://localhost:5173
pause > nul
'@
[System.IO.File]::WriteAllText("$base\Lancer Inventaire.bat", $launcher, [System.Text.Encoding]::Default)

# Script Arreter Inventaire
$stopper = @'
@echo off
title Arret Inventaire
echo Arret de l'application...
taskkill /F /FI "WINDOWTITLE eq Inventaire d'Atelier v2.0.0" /T 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000 " ^| findstr "LISTENING"') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " ^| findstr "LISTENING"') do taskkill /F /PID %%a 2>nul
echo Application arretee.
timeout /t 2 /nobreak > nul
'@
[System.IO.File]::WriteAllText("$base\Arreter Inventaire.bat", $stopper, [System.Text.Encoding]::Default)

# LISEZMOI.txt
$readme = @"
========================================
  INVENTAIRE ATELIER v2.0.0
  Version Portable Complete
========================================

LANCEMENT :
  Double-clic sur "Lancer Inventaire.bat"

AUCUNE INSTALLATION NECESSAIRE !
  - Python 3.11.8 embarque inclus
  - Toutes dependances incluses
  - Base de donnees demo incluse

CONNEXION :
  Login : admin
  Mot de passe : admin

ARRET :
  Double-clic sur "Arreter Inventaire.bat"
  (ou fermer la fenetre de commande)

CONTENU DE LA DEMO :
  - 31 articles avec emplacements et tags
  - 5 fournisseurs (avec email pour devis)
  - 14 emplacements organises en zones
  - 10 tags colores
  - 21 categories hierarchiques
  - 30 mouvements de stock historiques
  - 2 demandes de devis (brouillon + envoyee)

NOUVELLES FONCTIONNALITES v2.0.0 :
  - Mode sombre / mode clair
  - Gestion fournisseurs et devis
  - Plan d'atelier avec QR codes
  - Scanner QR code (HTTPS requis)
  - Export CSV / PDF
  - Rapports et statistiques
  - Gestion multi-utilisateurs

Version : 2.0.0
"@
[System.IO.File]::WriteAllText("$base\LISEZMOI.txt", $readme, [System.Text.Encoding]::Default)

Write-Host "  Scripts et fichiers: OK"

Write-Host "[11] Compression ZIP..."
$zipPath = "C:\Users\cedri\Desktop\inventaire\deployment\portable-demo\build-complet\inventaire-portable-complet-v2.0.0.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $base -DestinationPath $zipPath -CompressionLevel Optimal
Write-Host "  ZIP: OK"

$zipSize = [math]::Round((Get-Item $zipPath).Length / 1MB, 1)
Write-Host ""
Write-Host "========================================"
Write-Host "  BUILD TERMINE !"
Write-Host "========================================"
Write-Host "  Dossier : $base"
Write-Host "  ZIP     : $zipPath ($zipSize MB)"
Write-Host "  Login   : admin / admin"
Write-Host "========================================"
