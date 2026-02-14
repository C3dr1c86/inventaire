# Application d'Inventaire Multi-plateforme

[![CI Status](https://github.com/VOTRE-USER/inventaire/actions/workflows/ci.yml/badge.svg)](https://github.com/VOTRE-USER/inventaire/actions/workflows/ci.yml)
[![Docker Build](https://github.com/VOTRE-USER/inventaire/actions/workflows/docker-build.yml/badge.svg)](https://github.com/VOTRE-USER/inventaire/actions/workflows/docker-build.yml)
[![Backend Coverage](https://img.shields.io/badge/coverage-backend_64%25-green.svg)](backend/htmlcov/index.html)
[![Frontend Coverage](https://img.shields.io/badge/coverage-frontend_18.83%25-yellow.svg)](frontend/coverage/index.html)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v1.9.0-blue.svg)](https://github.com/VOTRE-USER/inventaire/releases)
[![Python](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)

Application complète de gestion d'inventaire avec backend FastAPI et frontend React.

## Fonctionnalités

- **Gestion des articles** : Ajouter, modifier, supprimer des articles
- **Catégories** : Organiser les articles par catégories
- **Mouvements de stock** : Suivre les entrées et sorties avec historique
- **Recherche et filtrage** : Rechercher des articles et filtrer par catégorie ou stock bas
- **Rapports** : Générer des rapports de stock bas et valeur totale
- **Exports** : Exporter les données en CSV ou PDF

## Technologies

### Backend
- **Python 3.10+**
- **FastAPI** : Framework web moderne et rapide
- **SQLAlchemy** : ORM pour la base de données
- **SQLite** : Base de données légère et portable
- **Pydantic** : Validation des données
- **ReportLab** : Génération de PDF

### Frontend
- **React 18** : Bibliothèque UI
- **Vite** : Build tool rapide
- **React Router** : Navigation
- **Axios** : Requêtes HTTP
- **React Query** : Gestion du cache et des états serveur

## 🚀 Démarrage Rapide

**La façon la plus simple de lancer l'application en local :**

### Windows
Double-cliquez sur `start-dev.bat` ou exécutez :
```cmd
start-dev.bat
```

### Linux / macOS
```bash
./start-dev.sh
```

Le script va automatiquement :
- ✅ Installer les dépendances si nécessaire
- ✅ Démarrer le backend (http://localhost:8000)
- ✅ Démarrer le frontend (http://localhost:5173)
- ✅ Ouvrir le navigateur

📖 **Plus d'infos :** Consultez [SCRIPTS_README.md](SCRIPTS_README.md) pour tous les scripts disponibles et le dépannage.

---

## Installation Manuelle

### Prérequis
- Python 3.10 ou supérieur
- Node.js 18 ou supérieur
- npm ou yarn

### Backend

```bash
# Se déplacer dans le dossier backend
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows :
venv\Scripts\activate
# Sur Mac/Linux :
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'exemple des variables d'environnement
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Démarrer le serveur
uvicorn app.main:app --reload
```

Le backend sera accessible sur `http://localhost:8000`
Documentation API : `http://localhost:8000/docs`

### Frontend

```bash
# Se déplacer dans le dossier frontend
cd frontend

# Installer les dépendances
npm install

# Copier le fichier d'exemple des variables d'environnement
copy .env.example .env  # Windows
# cp .env.example .env  # Mac/Linux

# Démarrer le serveur de développement
npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## Structure du projet

```
inventaire/
├── backend/           # API FastAPI
│   ├── app/
│   │   ├── routers/  # Routes API
│   │   ├── services/ # Logique métier
│   │   ├── models.py # Modèles base de données
│   │   ├── schemas.py# Schémas de validation
│   │   └── main.py   # Point d'entrée
│   └── requirements.txt
│
├── frontend/          # Application React
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── hooks/
│   └── package.json
│
├── docs/              # Documentation
│   ├── QUICKSTART.md
│   ├── DEPLOIEMENT_NAS.md
│   └── README_DOCKER.md
│
├── scripts/           # Scripts de déploiement
│   ├── setup.bat/.sh
│   ├── build-images.bat/.sh
│   └── deploy-to-nas.bat/.sh
│
├── database/          # Base de données SQLite
└── exports/           # Fichiers exportés
```

## Documentation

- **[Guide de démarrage rapide](docs/QUICKSTART.md)** - Pour commencer rapidement
- **[Déploiement sur NAS](docs/DEPLOIEMENT_NAS.md)** - Installation sur NAS Ugreen/Synology
- **[Guide Docker](docs/README_DOCKER.md)** - Utilisation avec Docker
- **[Images pré-construites](docs/README_IMAGES_PREBUILT.md)** - Déploiement rapide avec images Docker

## Utilisation

### Démarrage rapide

1. Démarrer le backend : `cd backend && uvicorn app.main:app --reload`
2. Démarrer le frontend : `cd frontend && npm run dev`
3. Ouvrir le navigateur sur `http://localhost:5173`

### Première utilisation

1. Créer des catégories (ex: Électronique, Alimentaire, Fournitures)
2. Ajouter des articles avec leurs informations (nom, quantité, prix, etc.)
3. Enregistrer des mouvements de stock (entrées/sorties)
4. Consulter les rapports et exporter les données

## API Endpoints

### Articles
- `GET /api/articles` - Liste tous les articles
- `GET /api/articles/{id}` - Récupère un article
- `POST /api/articles` - Crée un article
- `PUT /api/articles/{id}` - Modifie un article
- `DELETE /api/articles/{id}` - Supprime un article

### Catégories
- `GET /api/categories` - Liste toutes les catégories
- `POST /api/categories` - Crée une catégorie
- `PUT /api/categories/{id}` - Modifie une catégorie
- `DELETE /api/categories/{id}` - Supprime une catégorie

### Mouvements
- `GET /api/mouvements` - Liste tous les mouvements
- `POST /api/mouvements` - Crée un mouvement (entrée/sortie)
- `GET /api/mouvements/article/{id}` - Historique d'un article

### Rapports
- `GET /api/rapports/stock-bas` - Articles en stock bas
- `GET /api/rapports/valeur-totale` - Valeur totale du stock
- `GET /api/rapports/export/csv` - Export CSV
- `GET /api/rapports/export/pdf` - Export PDF

## Développement

### Backend

Les modèles de données sont définis dans `backend/app/models.py`. Pour modifier la structure de la base de données, modifiez les modèles et supprimez le fichier `database/inventaire.db` pour recréer la base.

### Frontend

L'application utilise React Query pour la gestion du cache. Les hooks personnalisés dans `frontend/src/hooks/` encapsulent la logique de communication avec l'API.

## Tests

### Backend
```bash
cd backend
pytest
```

### Frontend
```bash
cd frontend
npm run test
```

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## Licence

MIT

## Support

Pour toute question ou problème, ouvrez une issue sur le dépôt GitHub.
