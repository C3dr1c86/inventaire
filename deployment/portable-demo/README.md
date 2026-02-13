# Version Portable - Démonstration sans Installation

Configuration portable pour démonstrations sur clé USB (ou dossier PC) **sans aucune installation**.

## 🎯 Objectif

Créer un package autonome permettant de lancer l'application d'inventaire **en un clic** pour :
- Démonstrations clients
- Présentation à des collègues
- Tests sur différents PC
- Formation utilisateurs

## 📦 Contenu du Package

```
inventaire-portable/
├── 📦 Lancer Inventaire.bat        # Double-clic pour démarrer
├── ⛔ Arrêter Inventaire.bat       # Double-clic pour arrêter
├── 📖 LISEZMOI.txt                 # Instructions utilisateur
├── python/                          # Python portable embarqué
│   ├── python.exe
│   ├── Lib/
│   └── ...
├── backend/                         # Code backend
│   ├── app/
│   ├── requirements.txt
│   └── venv/ (créé au premier lancement)
├── frontend/                        # Build frontend statique
│   └── dist/
│       ├── index.html
│       ├── assets/
│       └── ...
├── database/                        # Base de données SQLite
│   └── inventaire-demo.db          # Pré-remplie avec exemples
├── data/                            # Données de démonstration
│   ├── exports/
│   └── uploads/
└── logs/                            # Logs application
    ├── backend.log
    └── frontend.log
```

## 🚀 Création du Package

### Étape 1 : Télécharger Python Portable

```bash
# Télécharger Python Embedded (Windows)
# URL : https://www.python.org/downloads/windows/
# Fichier : python-3.11.x-embed-amd64.zip

cd deployment/portable-demo/
mkdir python
# Extraire le contenu dans python/
```

### Étape 2 : Construire le Package

**Sur votre PC de développement** :

```bash
cd deployment/portable-demo/
scripts\build-portable.bat
```

Ce script :
1. ✅ Télécharge Python portable
2. ✅ Copie le backend et installe dépendances
3. ✅ Build le frontend en mode production
4. ✅ Crée base de données démo avec exemples
5. ✅ Génère scripts de lancement
6. ✅ Package tout dans un ZIP

**Résultat** : `inventaire-portable-v1.1.0.zip` (~150MB)

### Étape 3 : Distribuer

1. **Extraire sur clé USB** (8GB minimum)
2. **Ou copier sur dossier PC** (Desktop, Documents, etc.)
3. **Partager le ZIP** par email/cloud

---

## 💻 Utilisation Utilisateur Final

### Lancement

1. **Brancher clé USB** (ou ouvrir dossier)
2. **Double-cliquer** sur `📦 Lancer Inventaire.bat`
3. **Attendre** ~10 secondes (première fois ~30s)
4. **Le navigateur s'ouvre automatiquement** sur http://localhost:8000

### Identifiants Démo

- **Username** : `demo`
- **Password** : `demo123`

### Arrêt

1. **Double-cliquer** sur `⛔ Arrêter Inventaire.bat`
2. **Ou fermer** la fenêtre console

---

## 📝 Fichiers Scripts

### 📦 Lancer Inventaire.bat

```batch
@echo off
title Inventaire d'Atelier - Démonstration
color 0A
cls

echo.
echo ========================================
echo   INVENTAIRE D'ATELIER - DEMO
echo ========================================
echo.
echo Demarrage de l'application...
echo.

REM Se placer dans le dossier du script
cd /d "%~dp0"

REM Vérifier si Python est présent
if not exist "python\python.exe" (
    echo ERREUR : Python portable introuvable !
    echo Verifiez que le dossier python/ existe.
    pause
    exit /b 1
)

REM Créer venv si première exécution
if not exist "backend\venv\" (
    echo [1/3] Premiere execution : Installation dependances...
    echo Cela peut prendre 1-2 minutes...
    python\python.exe -m venv backend\venv
    backend\venv\Scripts\pip.exe install -r backend\requirements.txt > logs\install.log 2>&1
    echo Installation terminee !
    echo.
)

REM Démarrer backend
echo [2/3] Demarrage du serveur backend...
start /B backend\venv\Scripts\python.exe backend\run.py > logs\backend.log 2>&1

REM Attendre que le backend soit prêt
echo Attente demarrage backend...
timeout /t 5 /nobreak > nul

REM Démarrer serveur frontend simple (Python HTTP server)
echo [3/3] Demarrage du serveur frontend...
cd frontend\dist
start /B ..\..\python\python.exe -m http.server 5173 > ..\..\logs\frontend.log 2>&1
cd ..\..

echo.
echo ========================================
echo   APPLICATION PRETE !
echo ========================================
echo.
echo URL : http://localhost:5173
echo.
echo Identifiants demo :
echo   Username : demo
echo   Password : demo123
echo.
echo Ouverture du navigateur...
timeout /t 2 /nobreak > nul

REM Ouvrir navigateur
start http://localhost:5173

echo.
echo L'application est lancee !
echo.
echo Pour arreter : Double-cliquer sur "Arreter Inventaire.bat"
echo Ou fermer cette fenetre.
echo.
echo ========================================
pause
```

### ⛔ Arrêter Inventaire.bat

```batch
@echo off
title Arret Inventaire
color 0C

echo.
echo ========================================
echo   ARRET DE L'APPLICATION
echo ========================================
echo.

REM Tuer processus Python
taskkill /F /IM python.exe > nul 2>&1

echo Application arretee avec succes !
echo.
timeout /t 2 /nobreak > nul
```

### 📖 LISEZMOI.txt

```txt
========================================
  INVENTAIRE D'ATELIER - VERSION DEMO
========================================

Bienvenue dans la démonstration portable de l'application d'inventaire !

## LANCEMENT RAPIDE

1. Double-cliquer sur "📦 Lancer Inventaire.bat"
2. Attendre ~10 secondes
3. Le navigateur s'ouvre automatiquement
4. Connectez-vous avec :
   - Username : demo
   - Password : demo123

## ARRÊT

Double-cliquer sur "⛔ Arrêter Inventaire.bat"

## FONCTIONNALITÉS

✅ Gestion articles avec catégories hiérarchiques
✅ Mouvements de stock (ENTRÉE/SORTIE)
✅ Système de tags
✅ Statistiques et rapports
✅ Exports CSV/PDF
✅ Recherche avancée avec filtres

## DONNÉES DE DÉMONSTRATION

La base de données contient des exemples pré-remplis :
- 15 catégories (Matériaux, Consommables, Outillage, etc.)
- 50 articles d'exemple
- 30 mouvements de stock
- 10 tags

## CONFIGURATION REQUISE

- Windows 7/8/10/11 (64-bit)
- 2GB RAM minimum
- 500MB espace disque
- Navigateur moderne (Chrome, Firefox, Edge)

## NOTES

- Cette version est 100% portable (aucune installation)
- Toutes les données sont sauvegardées dans database/
- Fonctionne hors-ligne (pas besoin d'internet)
- Les modifications sont conservées entre sessions

## SUPPORT

Pour plus d'informations : https://github.com/votre-username/inventaire

========================================
Version 1.1.0 - Février 2026
========================================
```

---

## 🛠️ Script de Build

### scripts/build-portable.bat

```batch
@echo off
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

echo [1/8] Nettoyage dossier build...
if exist "%OUTPUT_DIR%" rmdir /s /q "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%"

echo [2/8] Telechargement Python portable...
REM TODO: Automatiser téléchargement ou fournir lien
echo MANUEL : Telechargez python-3.11.x-embed-amd64.zip
echo          et extrayez dans build\%PACKAGE_NAME%\python\
pause

echo [3/8] Copie backend...
xcopy /E /I /Y ..\..\..\backend "%OUTPUT_DIR%\%PACKAGE_NAME%\backend"
REM Supprimer __pycache__, venv, database existante
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\__pycache__" 2>nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\venv" 2>nul
rmdir /s /q "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database" 2>nul
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database"

echo [4/8] Build frontend...
cd ..\..\..\frontend
call npm run build
cd ..\deployment\portable-demo

echo [5/8] Copie frontend build...
xcopy /E /I /Y ..\..\..\frontend\dist "%OUTPUT_DIR%\%PACKAGE_NAME%\frontend\dist"

echo [6/8] Creation base de donnees demo...
REM Utiliser Python système pour créer DB démo
python scripts\create-demo-db.py "%OUTPUT_DIR%\%PACKAGE_NAME%\backend\database\inventaire-demo.db"

echo [7/8] Copie scripts et fichiers...
copy templates\Lancer-Inventaire.bat "%OUTPUT_DIR%\%PACKAGE_NAME%\📦 Lancer Inventaire.bat"
copy templates\Arreter-Inventaire.bat "%OUTPUT_DIR%\%PACKAGE_NAME%\⛔ Arrêter Inventaire.bat"
copy templates\LISEZMOI.txt "%OUTPUT_DIR%\%PACKAGE_NAME%\📖 LISEZMOI.txt"

REM Créer dossiers
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\logs"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\exports"
mkdir "%OUTPUT_DIR%\%PACKAGE_NAME%\data\uploads"

echo [8/8] Compression en ZIP...
REM Nécessite 7-Zip ou PowerShell
powershell Compress-Archive -Path "%OUTPUT_DIR%\%PACKAGE_NAME%\*" -DestinationPath "%OUTPUT_DIR%\%PACKAGE_NAME%.zip" -Force

echo.
echo ========================================
echo   BUILD TERMINE !
echo ========================================
echo.
echo Package cree : %OUTPUT_DIR%\%PACKAGE_NAME%.zip
echo Taille estimee : ~150MB
echo.
echo Distribution :
echo   1. Extraire sur cle USB (8GB min)
echo   2. Ou partager le ZIP
echo.
pause
```

---

## 🎨 Interface Utilisateur Simplifiée

Pour la version démo, vous pouvez également créer un **menu de démonstration** au démarrage :

```
========================================
  INVENTAIRE D'ATELIER - DEMO
========================================

Scenarios de démonstration disponibles :

1. Visite guidée (5 min)
2. Créer un nouvel article
3. Enregistrer un mouvement de stock
4. Consulter les rapports
5. Utiliser sans guide (mode libre)

Choix (1-5) : _
```

---

## 📊 Taille Estimée du Package

| Composant | Taille |
|-----------|--------|
| Python portable | ~30MB |
| Backend + dépendances | ~50MB |
| Frontend build | ~5MB |
| Database démo | ~1MB |
| Documentation | ~1MB |
| **TOTAL** | **~90MB** |

**Compressé (ZIP)** : ~60MB

---

## ✅ Avantages Version Portable

| Critère | Version Portable | Installation Normale |
|---------|------------------|----------------------|
| **Installation** | ❌ Aucune | ✅ Nécessaire |
| **Temps setup** | 10 secondes | 5-10 minutes |
| **Permissions admin** | ❌ Non requises | ✅ Souvent requises |
| **Portabilité** | ✅ Clé USB / Dossier | ❌ Lié au PC |
| **Démonstration** | ✅ Parfait | ⚠️ Complexe |
| **Production** | ⚠️ Limité | ✅ Recommandé |

---

## 🔧 Alternatives

### Option 1 : Version Electron (Desktop App)

**Avantages** :
- Application native Windows (.exe)
- Pas besoin de navigateur
- Distribution via installeur

**Inconvénients** :
- Nécessite développement Electron
- Package plus lourd (~200MB)
- Temps de développement : 3-5 jours

### Option 2 : Docker Desktop Portable

**Avantages** :
- Utilise configuration Docker existante
- Isolation complète

**Inconvénients** :
- Nécessite Docker Desktop installé
- Pas vraiment "portable"

### Option 3 : Version Web Hébergée (Demo Online)

**Avantages** :
- Aucune installation
- Accès depuis n'importe où
- Parfait pour démo à distance

**Inconvénients** :
- Nécessite hébergement
- Connexion internet requise

---

## 📝 Prochaines Étapes

1. [ ] Télécharger Python portable
2. [ ] Créer script `build-portable.bat`
3. [ ] Créer script `create-demo-db.py` (génère données exemple)
4. [ ] Tester sur PC vierge
5. [ ] Créer ZIP final
6. [ ] Tester démo complète

---

## 🎯 Résumé

**OUI, c'est parfaitement possible !**

La version portable permet de :
- ✅ Démonstration en 10 secondes chrono
- ✅ Aucune installation nécessaire
- ✅ Fonctionne sur n'importe quel PC Windows
- ✅ Base de données exemple pré-remplie
- ✅ Parfait pour formations/présentations

**Recommandation** : Créer cette version **après** le déploiement Raspberry Pi, pour avoir une version stable à packager.

---

**Retour** : [deployment/README.md](../README.md)
