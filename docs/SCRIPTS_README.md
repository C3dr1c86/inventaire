# Scripts de Démarrage Rapide

Ce dossier contient des scripts pour démarrer rapidement l'application en mode développement local.

## 🚀 Démarrage Rapide

### Windows

**Double-cliquez simplement sur** `start-dev.bat`

Ou depuis le terminal :
```cmd
start-dev.bat
```

### Linux / macOS

```bash
./start-dev.sh
```

Le script va automatiquement :
- ✅ Vérifier que Python et Node.js sont installés
- ✅ Créer l'environnement virtuel Python si nécessaire
- ✅ Installer les dépendances si nécessaire
- ✅ Démarrer le backend sur http://localhost:8000
- ✅ Démarrer le frontend sur http://localhost:5173
- ✅ Ouvrir automatiquement le navigateur

## 📋 Scripts Disponibles

### Scripts Complets

| Fichier | Description |
|---------|-------------|
| `start-dev.bat` | **(Windows)** Démarre backend + frontend automatiquement |
| `start-dev.sh` | **(Linux/Mac)** Démarre backend + frontend automatiquement |

### Scripts Individuels

| Fichier | Description |
|---------|-------------|
| `start-backend.bat` | **(Windows)** Démarre uniquement le backend FastAPI |
| `start-backend.sh` | **(Linux/Mac)** Démarre uniquement le backend FastAPI |
| `start-frontend.bat` | **(Windows)** Démarre uniquement le frontend React |
| `start-frontend.sh` | **(Linux/Mac)** Démarre uniquement le frontend React |

## 🛑 Arrêter l'Application

### Méthode 1 : Fermer les fenêtres (Windows)
Le script `start-dev.bat` ouvre deux fenêtres de terminal. Fermez-les simplement.

### Méthode 2 : CTRL+C
Dans chaque terminal, appuyez sur `CTRL+C` pour arrêter le serveur.

### Méthode 3 : Script Linux/Mac
Sur Linux/Mac, le script `start-dev.sh` gère automatiquement l'arrêt. Faites simplement `CTRL+C` dans le terminal principal.

## 🔧 URLs Importantes

| Service | URL |
|---------|-----|
| **Frontend (Application)** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **Documentation API (Swagger)** | http://localhost:8000/docs |
| **API Alternative (ReDoc)** | http://localhost:8000/redoc |

## 📝 Prérequis

Avant d'utiliser ces scripts, assurez-vous d'avoir :

1. **Python 3.8+** installé et accessible via `python` ou `python3`
2. **Node.js 16+** installé et accessible via `node`
3. **pip** (gestionnaire de paquets Python) installé
4. **npm** (gestionnaire de paquets Node.js) installé

### Vérifier les installations

**Windows :**
```cmd
python --version
node --version
npm --version
```

**Linux/Mac :**
```bash
python3 --version
node --version
npm --version
```

## 🐛 Dépannage

### Erreur : "Python n'est pas dans le PATH"
Réinstallez Python et cochez l'option "Add Python to PATH" lors de l'installation.

### Erreur : "uvicorn : commande introuvable"
Le venv n'est pas correctement activé. Exécutez manuellement :
```cmd
cd backend
venv\Scripts\activate.bat  # Windows
pip install -r requirements.txt
```

### Erreur : "npm : commande introuvable"
Node.js n'est pas installé ou n'est pas dans le PATH. Téléchargez-le depuis https://nodejs.org/

### Le frontend ne se connecte pas au backend
1. Vérifiez que le backend est bien démarré sur http://localhost:8000
2. Vérifiez le fichier `frontend/.env` :
   ```env
   VITE_API_URL=http://localhost:8000/api
   ```
3. Rechargez la page du navigateur

### Port déjà utilisé
Si le port 8000 ou 5173 est déjà utilisé :

**Windows :**
```cmd
# Trouver le processus
netstat -ano | findstr :8000
# Tuer le processus (remplacer PID)
taskkill /PID <PID> /F
```

**Linux/Mac :**
```bash
# Trouver et tuer le processus
lsof -ti:8000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

## 💡 Conseils

- **Première utilisation** : La première exécution peut prendre plusieurs minutes (installation des dépendances)
- **Rechargement automatique** : Les deux serveurs rechargent automatiquement lors des modifications de code
- **Logs** : Surveillez les fenêtres de terminal pour voir les requêtes et les erreurs
- **Base de données** : La base SQLite est créée automatiquement dans `database/inventaire.db` au premier démarrage

## 🔗 Documentation Complète

Pour plus d'informations, consultez :
- [README.md](README.md) - Documentation générale du projet
- [CLAUDE.md](CLAUDE.md) - Guide complet pour les développeurs
- [DEMARRAGE_RAPIDE.md](DEMARRAGE_RAPIDE.md) - Guide de démarrage détaillé
