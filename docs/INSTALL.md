# Guide d'Installation - Application d'Inventaire

## Prérequis

Avant de commencer, vous devez installer les outils suivants sur votre système :

### 1. Python 3.10 ou supérieur

**Windows :**
1. Téléchargez Python depuis [python.org](https://www.python.org/downloads/)
2. Lancez l'installateur
3. ⚠️ **IMPORTANT** : Cochez "Add Python to PATH" avant d'installer
4. Vérifiez l'installation : `python --version`

**Mac/Linux :**
```bash
# Mac avec Homebrew
brew install python@3.10

# Ubuntu/Debian
sudo apt update
sudo apt install python3.10 python3.10-venv python3-pip

# Vérification
python3 --version
```

### 2. Node.js 18 ou supérieur

**Windows :**
1. Téléchargez Node.js depuis [nodejs.org](https://nodejs.org/)
2. Choisissez la version LTS (recommandé)
3. Lancez l'installateur avec les options par défaut
4. Vérifiez l'installation : `node --version` et `npm --version`

**Mac/Linux :**
```bash
# Mac avec Homebrew
brew install node

# Ubuntu/Debian avec NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérification
node --version
npm --version
```

## Installation du Backend (Python/FastAPI)

### Étape 1 : Créer l'environnement virtuel

```bash
# Se déplacer dans le dossier backend
cd backend

# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement virtuel

# Sur Windows (PowerShell)
venv\Scripts\Activate.ps1

# Sur Windows (CMD)
venv\Scripts\activate.bat

# Sur Mac/Linux
source venv/bin/activate
```

**Note :** Une fois activé, vous devriez voir `(venv)` au début de votre ligne de commande.

### Étape 2 : Installer les dépendances Python

```bash
# Assurez-vous que l'environnement virtuel est activé (vous devez voir (venv))
pip install --upgrade pip
pip install -r requirements.txt
```

Cette commande installe :
- FastAPI : Framework web
- Uvicorn : Serveur ASGI
- SQLAlchemy : ORM pour la base de données
- Pydantic : Validation des données
- ReportLab : Génération de PDF
- Et toutes les autres dépendances

### Étape 3 : Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

Vous pouvez modifier le fichier `.env` si nécessaire (optionnel pour démarrer).

### Étape 4 : Démarrer le serveur backend

```bash
# Assurez-vous d'être dans le dossier backend avec l'environnement virtuel activé
uvicorn app.main:app --reload
```

Le backend devrait maintenant être accessible sur :
- API : http://localhost:8000
- Documentation Swagger : http://localhost:8000/docs
- Documentation ReDoc : http://localhost:8000/redoc

**Note :** Le flag `--reload` permet le rechargement automatique lors des modifications du code.

### Vérification du Backend

Ouvrez http://localhost:8000/docs dans votre navigateur. Vous devriez voir la documentation interactive de l'API.

## Installation du Frontend (React)

### Étape 1 : Installer les dépendances npm

Ouvrez un **nouveau terminal** (gardez le backend en cours d'exécution) :

```bash
# Se déplacer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install
```

Cette commande installe :
- React : Bibliothèque UI
- Vite : Build tool
- Axios : Client HTTP
- React Query : Gestion du cache
- React Router : Routing
- Et toutes les autres dépendances

**Note :** L'installation peut prendre quelques minutes.

### Étape 2 : Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
# Windows
copy .env.example .env

# Mac/Linux
cp .env.example .env
```

### Étape 3 : Démarrer le serveur de développement

```bash
# Assurez-vous d'être dans le dossier frontend
npm run dev
```

Le frontend devrait maintenant être accessible sur : http://localhost:5173

## Utilisation de l'Application

### 1. Démarrage quotidien

Vous devez démarrer les **deux serveurs** (backend et frontend) dans des terminaux séparés :

**Terminal 1 - Backend :**
```bash
cd backend
venv\Scripts\activate  # Windows
# ou source venv/bin/activate  # Mac/Linux
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend :**
```bash
cd frontend
npm run dev
```

### 2. Première utilisation

1. Ouvrez http://localhost:5173 dans votre navigateur
2. Créez quelques catégories (ex: Électronique, Alimentaire, Fournitures)
3. Ajoutez des articles dans ces catégories
4. Testez les mouvements de stock (entrées/sorties)
5. Consultez les rapports et exportez des données

### 3. Accès aux fonctionnalités

- **Dashboard** : Vue d'ensemble avec statistiques
- **Articles** : Gestion complète des articles (CRUD)
- **Mouvements** : Enregistrer et consulter l'historique
- **Rapports** : Stock bas, valeur totale, exports CSV/PDF

## Résolution de problèmes courants

### Problème : "Python n'est pas reconnu"
**Solution :** Python n'est pas dans le PATH. Réinstallez Python en cochant "Add Python to PATH".

### Problème : "npm n'est pas reconnu"
**Solution :** Node.js n'est pas dans le PATH. Réinstallez Node.js.

### Problème : "Module 'fastapi' introuvable"
**Solution :** L'environnement virtuel n'est pas activé ou les dépendances ne sont pas installées.
```bash
cd backend
venv\Scripts\activate  # Activer l'environnement
pip install -r requirements.txt
```

### Problème : Le frontend ne peut pas contacter le backend
**Solution :**
1. Vérifiez que le backend est bien démarré sur le port 8000
2. Vérifiez l'URL dans `frontend/.env` : `VITE_API_URL=http://localhost:8000/api`
3. Vérifiez la console du navigateur pour les erreurs CORS

### Problème : "sqlite3.OperationalError: unable to open database file"
**Solution :** Le dossier `database/` n'existe pas. Il sera créé automatiquement au premier démarrage du backend.

### Problème : Port déjà utilisé
**Solution :** Un autre processus utilise le port 8000 ou 5173.
```bash
# Windows - Trouver et tuer le processus
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

## Build de Production

### Backend
Le backend peut être déployé avec :
```bash
pip install gunicorn  # Serveur de production
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
cd frontend
npm run build
```

Les fichiers statiques seront générés dans `frontend/dist/`.

## Structure des Dossiers

```
inventaire/
├── backend/              # API Python/FastAPI
│   ├── app/
│   │   ├── routers/     # Routes API
│   │   ├── services/    # Logique métier
│   │   ├── models.py    # Modèles BDD
│   │   ├── schemas.py   # Validation
│   │   └── main.py      # Point d'entrée
│   ├── venv/            # Environnement virtuel (créé à l'installation)
│   └── requirements.txt
│
├── frontend/            # Application React
│   ├── src/
│   │   ├── components/ # Composants React
│   │   ├── pages/      # Pages
│   │   ├── services/   # API calls
│   │   └── hooks/      # Hooks personnalisés
│   ├── node_modules/   # Dépendances (créé à l'installation)
│   └── package.json
│
├── database/            # Base de données SQLite (créé au démarrage)
└── exports/             # Fichiers exportés (CSV, PDF)
```

## Support

Pour toute question ou problème :
1. Vérifiez la console du backend pour les erreurs Python
2. Vérifiez la console du navigateur (F12) pour les erreurs JavaScript
3. Consultez la documentation API : http://localhost:8000/docs

## Prochaines Étapes

Une fois l'installation terminée, vous pouvez :
1. Personnaliser l'interface (couleurs, logos)
2. Ajouter l'authentification des utilisateurs
3. Implémenter des rapports supplémentaires
4. Ajouter des graphiques avec une bibliothèque comme Chart.js
5. Déployer sur un serveur de production

---

**Bon développement ! 🚀**
