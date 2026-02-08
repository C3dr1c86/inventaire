# CLAUDE.md

Ce fichier fournit des conseils à Claude Code (claude.ai/code) lors du travail sur le code de ce dépôt.

## Vue d'ensemble du projet

Application full-stack de gestion d'inventaire avec :
- **Backend** : FastAPI + SQLAlchemy + SQLite (100% complet)
- **Frontend** : React 18 + Vite + React Query (~99% complet)
- **Langue** : Français (commentaires de code, UI, documentation)

## Commandes de développement

### Backend (Python/FastAPI)

```bash
# Configuration initiale (première fois)
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # Mac/Linux
pip install -r requirements.txt

# Démarrer le serveur de développement (avec auto-reload)
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload  # Démarre sur http://localhost:8000

# Exécuter les tests
cd backend
pytest

# Voir la documentation de l'API
# Après démarrage : http://localhost:8000/docs (Swagger UI)
```

### Frontend (React)

```bash
# Configuration initiale (première fois)
cd frontend
npm install

# Démarrer le serveur de développement (avec HMR)
cd frontend
npm run dev  # Démarre sur http://localhost:5173

# Build de production
npm run build

# Linter le code
npm run lint
```

## Architecture

### Structure du Backend

```
backend/app/
├── main.py           # App FastAPI, config CORS, enregistrement des routers
├── database.py       # Moteur SQLAlchemy, gestion sessions, init_db()
├── models.py         # Modèles ORM SQLAlchemy (User, Categorie, Article, Mouvement, Tag)
├── schemas.py        # Schémas Pydantic pour validation et sérialisation
├── crud.py           # Opérations CRUD sur la base de données
├── auth.py           # Fonctions JWT (create_token, verify_token, get_current_user)
├── routers/          # Gestionnaires de routes FastAPI
│   ├── auth.py       # Endpoints d'authentification (/register, /login, /me)
│   ├── categories.py # Endpoints des catégories
│   ├── articles.py   # Endpoints des articles (avec recherche/filtres)
│   ├── mouvements.py # Endpoints des mouvements de stock
│   ├── rapports.py   # Endpoints des rapports et exports
│   └── tags.py       # Endpoints des tags
└── services/
    └── export_service.py  # Génération exports CSV et PDF (ReportLab)
```

**Patterns architecturaux clés :**

1. **Architecture en couches**
   - Routes (routers/) → Opérations CRUD (crud.py) → Modèles (models.py)
   - Les routes gèrent HTTP, validation via schémas Pydantic
   - CRUD gère la logique base de données
   - Les modèles définissent le schéma de la base de données

2. **Modèles de base de données** (models.py)
   - `User` : Utilisateurs avec username, email, hashed_password (mono-utilisateur)
   - `Categorie` : Catégories avec relation one-to-many vers articles
   - `Article` : Articles avec quantité en stock, seuil minimum, prix, tags (many-to-many)
   - `Mouvement` : Historique des mouvements de stock (ENTREE/SORTIE) avec quantités avant/après
   - `Tag` : Tags avec nom, couleur, relation many-to-many vers articles
   - Relations SQLAlchemy avec suppressions en cascade

3. **Gestion du stock**
   - Les mises à jour de stock sont transactionnelles dans `crud.create_mouvement()`
   - ENTREE ajoute à la quantité, SORTIE soustrait
   - Validation empêche les stocks négatifs (lève HTTPException)
   - Les mouvements stockent quantite_avant et quantite_apres pour traçabilité

4. **Validation**
   - Schémas Pydantic dans schemas.py valident toutes les entrées
   - Contraintes base de données : quantite ≥ 0, prix_unitaire ≥ 0, type IN ('ENTREE', 'SORTIE')
   - Logique métier : Impossible de créer SORTIE si stock insuffisant

### Structure du Frontend

```
frontend/src/
├── main.jsx          # Point d'entrée React, configuration QueryClient
├── App.jsx           # Configuration du routeur, ToastContainer, AuthProvider, définitions des routes
├── contexts/
│   └── AuthContext.jsx         # Contexte React pour l'état d'authentification global
├── components/
│   ├── layout/
│   │   └── Layout.jsx          # Navigation sidebar, wrapper de page, bouton déconnexion
│   ├── common/
│   │   ├── Modal.jsx           # Composant modal réutilisable
│   │   ├── Loader.jsx          # Composant loader animé réutilisable
│   │   ├── Pagination.jsx      # Composant pagination réutilisable
│   │   └── ProtectedRoute.jsx  # HOC pour protéger les routes (redirect si non connecté)
│   ├── articles/
│   │   └── ArticleForm.jsx     # Formulaire création/édition article
│   ├── categories/
│   │   └── CategorieForm.jsx   # Formulaire création/édition catégorie
│   ├── tags/
│   │   └── TagInput.jsx        # Sélecteur de tags avec création inline
│   └── mouvements/
│       └── MouvementForm.jsx   # Formulaire mouvement de stock
├── pages/
│   ├── Login.jsx       # Page de connexion
│   ├── Register.jsx    # Page d'inscription (mono-utilisateur)
│   ├── Dashboard.jsx   # Stats, recherche globale, création rapide, alertes
│   ├── Articles.jsx    # Liste articles avec recherche/filtres/tags
│   ├── Mouvements.jsx  # Historique des mouvements
│   └── Rapports.jsx    # Rapports et boutons d'export
├── services/          # Fonctions client API (Axios)
│   ├── api.js         # Instance axios avec intercepteurs JWT
│   ├── authService.js # Login, register, getCurrentUser, logout
│   ├── articleService.js
│   ├── categorieService.js
│   ├── mouvementService.js
│   ├── rapportService.js
│   └── tagService.js
└── hooks/             # Hooks React personnalisés (actuellement minimal)
```

**Patterns frontend clés :**

1. **Gestion d'état**
   - React Query (@tanstack/react-query) pour l'état serveur
   - Pas de bibliothèque d'état global (Redux, etc.) - React Query gère le cache
   - Les formulaires utilisent react-hook-form

2. **Récupération de données**
   - Les services utilisent Axios avec URL de base depuis la variable d'env `VITE_API_URL`
   - Les hooks React Query encapsulent les appels services pour cache/refetch
   - Exemple : `useQuery(['articles'], articleService.getAll)`

3. **Routage**
   - React Router v6 dans App.jsx
   - Le composant Layout fournit une navigation sidebar cohérente

## Schéma de base de données

**Base de données SQLite** (créée automatiquement dans `database/inventaire.db`)

```
users
├── id (PK)
├── username (unique)
├── email (unique)
├── hashed_password
├── is_active
├── created_at
└── updated_at

categories
├── id (PK)
├── nom (unique)
├── description
├── created_at
└── updated_at

articles
├── id (PK)
├── nom
├── quantite (≥ 0)
├── quantite_min (seuil de stock)
├── prix_unitaire (≥ 0)
├── categorie_id (FK → categories)
├── description
├── sku (unique, optionnel)
├── created_at
└── updated_at

mouvements
├── id (PK)
├── article_id (FK → articles, CASCADE)
├── type ('ENTREE' | 'SORTIE')
├── quantite (> 0)
├── quantite_avant
├── quantite_apres
├── motif (raison)
├── created_at
└── created_by

tags
├── id (PK)
├── nom (unique)
├── couleur (format #RRGGBB)
├── description
├── created_at
└── updated_at

article_tags (table d'association many-to-many)
├── article_id (FK → articles, CASCADE)
└── tag_id (FK → tags, CASCADE)
```

## Endpoints de l'API

Tous les endpoints sont préfixés par `/api/`

**Authentification** (`/api/auth`) - Routes publiques
- POST /register - Créer un compte utilisateur (mono-utilisateur : refuse si un compte existe)
- POST /login - Se connecter (form-data OAuth2 : username + password) → Retourne JWT token
- GET /me - Récupérer les informations de l'utilisateur connecté (nécessite token)

**Catégories** (`/api/categories`) - Routes protégées (nécessitent authentification)
- GET / - Liste toutes
- GET /{id} - Récupère une
- POST / - Crée
- PUT /{id} - Modifie
- DELETE /{id} - Supprime

**Articles** (`/api/articles`)
- GET / - Liste avec paramètres optionnels : `search`, `categorie_id`, `stock_bas`, `skip`, `limit`
- GET /{id} - Récupère un
- POST / - Crée
- PUT /{id} - Modifie
- DELETE /{id} - Supprime

**Mouvements** (`/api/mouvements`)
- GET / - Liste avec paramètres optionnels : `article_id`, `type`, `skip`, `limit`
- GET /{id} - Récupère un
- POST / - Crée (met à jour automatiquement le stock de l'article)
- GET /article/{article_id} - Historique des mouvements pour un article

**Tags** (`/api/tags`)
- GET / - Liste tous les tags
- GET /{id} - Récupère un tag
- POST / - Crée un tag (nom, couleur, description)
- PUT /{id} - Modifie un tag
- DELETE /{id} - Supprime un tag
- POST /{tag_id}/articles/{article_id} - Associe un tag à un article
- DELETE /{tag_id}/articles/{article_id} - Retire un tag d'un article

**Rapports** (`/api/rapports`)
- GET /statistiques - Statistiques globales (total articles, valeur, catégories, nombre stock bas)
- GET /stock-bas - Articles en dessous du seuil quantite_min
- GET /valeur-totale - Valeur totale du stock avec détails par catégorie
- GET /export/csv?type={articles|mouvements|stock-bas} - Télécharge CSV
- GET /export/pdf?type={inventaire|stock-bas} - Télécharge PDF

## Comportements clés

### Logique de mouvement de stock (crud.py)

Lors de la création d'un mouvement :
1. Valider que l'article existe
2. Pour SORTIE : Vérifier que quantite_disponible ≥ quantite demandée
3. Calculer nouvelle quantité : ENTREE ajoute, SORTIE soustrait
4. Mettre à jour article.quantite
5. Créer enregistrement mouvement avec quantite_avant et quantite_apres
6. Valider transaction (ou rollback en cas d'erreur)

### Système d'export (services/export_service.py)

- **CSV** : Utilise le module csv Python, retourne StreamingResponse
- **PDF** : Utilise ReportLab, génère des tableaux formatés avec en-têtes/pieds de page
- Exports sauvegardés dans le répertoire `exports/` avec horodatage

### Intégration Frontend-Backend

- Le frontend s'attend à l'API sur `http://localhost:8000/api` (configurable via `.env`)
- CORS configuré dans backend main.py pour autoriser localhost:5173 et localhost:3000
- React Query met en cache les réponses, refetch au montage/focus fenêtre

## Statut actuel

### Complet ✅
- API backend entièrement fonctionnelle (tous CRUD, rapports, exports)
- Modèles de base de données avec relations et contraintes appropriées
- Pages frontend affichent les données correctement
- Fonctionnalité d'export (CSV/PDF) opérationnelle côté backend
- **Système de tags complet** :
  - Backend : Modèles Tag + table association many-to-many + endpoints CRUD
  - Frontend : TagInput avec création inline, affichage badges colorés
  - Association many-to-many articles-tags
  - Affichage des tags dans listes et résultats de recherche
  - Sélection/désélection de tags dans ArticleForm
- **Dashboard enrichi** :
  - Cartes de statistiques (articles, valeur stock, catégories, alertes)
  - Boutons de création rapide (article, catégorie) avec modals
  - Barre de recherche globale avec affichage résultats enrichis (tags)
  - Alertes stock bas avec détails
  - Liens rapides vers toutes les sections
- **Formulaires complets** :
  - ArticleForm : Gestion articles avec tags, validation complète
  - CategorieForm : Gestion catégories avec validation
  - MouvementForm : Enregistrement mouvements stock
- **Notifications et feedback UX** :
  - Toasts react-toastify partout (Dashboard, Articles, Mouvements)
  - Messages succès/erreur cohérents sur toutes les pages
  - Modal de confirmation avant suppression d'articles
  - Loader animé réutilisable avec composant dédié
- **Filtres et recherche avancés** :
  - Page Articles : Recherche avec debounce (500ms), filtre catégorie, filtre stock bas
  - Dashboard : Recherche globale avec affichage enrichi (tags, liens directs)
  - Combinaison de plusieurs filtres simultanés
- **Pagination** :
  - Composant Pagination réutilisable avec navigation intuitive
  - Implémentée sur Articles (10 items/page) et Mouvements (10 items/page)
  - Affichage des numéros de page avec ellipses pour grandes listes
  - Indicateur de page actuelle et nombre total de résultats
  - Réinitialisation automatique à la page 1 lors du changement de filtres
- **Design Responsive** :
  - Sidebar mobile avec bouton hamburger et overlay
  - Navigation adaptative (sidebar coulissante sur mobile)
  - Tableaux avec scroll horizontal sur tablette et mode carte sur mobile
  - Stats cards en grille responsive (4 cols desktop, 2 cols tablette, 1 col mobile)
  - Filtres et boutons s'empilent verticalement sur petits écrans
  - Formulaires optimisés avec champs en pleine largeur sur mobile
  - Pagination adaptative (vertical sur mobile)
  - Breakpoints: 768px (tablette) et 576px (mobile)
- **Authentification JWT complète** :
  - Backend : Modèle User, endpoints /register, /login, /me
  - Protection de toutes les routes API avec dépendance `get_current_user`
  - JWT avec expiration de 24 heures (mono-utilisateur)
  - Frontend : AuthContext, ProtectedRoute, pages Login/Register
  - Token stocké dans localStorage
  - Intercepteur Axios pour ajouter automatiquement le token
  - Redirection automatique vers /login si token invalide/expiré
  - **Mode mono-utilisateur** : Un seul compte peut être créé
- **Déploiement Docker complet** :
  - Dockerfiles optimisés (multi-stage pour frontend)
  - docker-compose.yml pour build local
  - docker-compose-prebuilt.yml pour images pré-construites
  - Scripts Windows (.bat) et Linux/Mac (.sh) pour déploiement automatisé
  - Volumes persistants pour database et exports
  - Configuration CORS adaptée pour Docker (localhost:80)

### Incomplet ⚠️
- Aucune fonctionnalité majeure manquante

## Tâches courantes

### Déploiement Docker

#### Sur PC local (développement rapide)
```bash
# Windows
scripts\start.bat

# Linux/Mac
./scripts/start.sh

# Accès : http://localhost (frontend) et http://localhost:8000 (backend)
```

#### Sur NAS Ugreen/Synology
```bash
# Windows - Déploiement complet automatisé
scripts\deploy-to-nas.bat

# Le script va :
# 1. Construire les images Docker
# 2. Les transférer via SCP vers le NAS
# 3. Se connecter en SSH et démarrer les conteneurs
# 4. Afficher l'URL d'accès

# Configuration dans .env :
# HOST_IP=192.168.x.x  # IP du NAS
# SECRET_KEY=...        # Clé JWT (générer avec openssl rand -hex 32)
```

### Tâches courantes de développement

### Ajouter un nouveau champ à Article

1. Mettre à jour `models.py` : Ajouter colonne à la classe Article
2. Supprimer `database/inventaire.db` (sera recréé automatiquement avec nouveau schéma)
3. Mettre à jour `schemas.py` : Ajouter champ à ArticleBase/ArticleCreate/ArticleUpdate
4. Mettre à jour frontend : Ajouter champ à ArticleForm.jsx
5. Redémarrer les deux serveurs

### Déboguer les problèmes Backend

- Vérifier le terminal exécutant uvicorn pour les erreurs Python
- Voir la doc API sur http://localhost:8000/docs pour tester les endpoints
- Utiliser un navigateur SQLite pour inspecter `database/inventaire.db` directement
- FastAPI auto-valide les entrées - vérifier le JSON de réponse pour erreurs de validation

### Déboguer les problèmes Frontend

- Vérifier la console du navigateur (F12) pour les erreurs JavaScript
- Vérifier l'onglet Network pour les appels API échoués
- React Query DevTools peuvent être ajoutés pour déboguer le cache
- Vérifier que `.env` a le bon `VITE_API_URL=http://localhost:8000/api`

## Notes importantes

- Tout le code et commentaires sont en français (exigence métier)
- Le backend valide toutes les entrées via schémas Pydantic avant opérations base de données
- La quantité en stock ne peut jamais être négative (imposé dans le code et contraintes DB)
- Le fichier de base de données est git-ignoré mais la structure des répertoires est committée
- Les fichiers d'export dans `exports/` sont aussi git-ignorés

### Authentification - Points critiques

- **Mode mono-utilisateur** : L'endpoint `/register` refuse la création si un compte existe déjà
- **Première utilisation** : Créer le compte via `/register` lors du premier démarrage
- **Token JWT** : Durée de vie de 24 heures (configurable dans `backend/app/auth.py`)
- **Hashage password** : bcrypt via passlib - **IMPORTANT** : Utiliser bcrypt==4.0.1 (pas 5.x qui est incompatible avec passlib 1.7.4)
- **CORS** : Inclut `http://localhost` et `http://localhost:80` pour Docker (voir `backend/app/main.py:22`)
- **Routes protégées** : TOUTES les routes API (sauf /auth/*) nécessitent le token JWT
- **Frontend** : Le token est injecté automatiquement dans les headers via l'intercepteur Axios (`frontend/src/services/api.js`)

### Docker - Points critiques

- **Line endings** : TOUS les fichiers .sh DOIVENT avoir des line endings Unix (LF). Les CRLF Windows cassent l'entrypoint Docker
- **Base de données** :
  - Développement local : `backend/database/inventaire.db`
  - Docker : `data/database/inventaire.db` (volume monté)
  - Ces deux emplacements sont DIFFÉRENTS - un compte créé en local n'existera pas dans Docker
- **Configuration runtime frontend** : `docker-entrypoint.sh` génère `env-config.js` pour injecter `VITE_API_URL` au runtime
- **Port 80** : Si déjà utilisé, modifier `ports:` dans docker-compose.yml (ex: `8080:80`)
- **Rebuild nécessaire** : Après modification de requirements.txt ou package.json, rebuild l'image concernée
- **Scripts de déploiement** : Tous dans `scripts/` - ils font `cd ..` pour revenir à la racine du projet

### Architecture Nginx Reverse Proxy - SOLUTION RECOMMANDÉE POUR PRODUCTION

**Problème** : En production (NAS, serveurs distants), les requêtes CORS preflight échouent avec des erreurs 307/405 car FastAPI redirige automatiquement les URLs sans trailing slash.

**Solution** : Utiliser Nginx comme reverse proxy pour servir le frontend ET proxier les requêtes `/api` vers le backend. Tout vient de la même origine, donc **pas de CORS**.

**Architecture :**
```
Client → http://nas:8080/          → Nginx → Fichiers React statiques
Client → http://nas:8080/api/*     → Nginx → Proxy → Backend FastAPI:8000
```

**Fichiers clés :**
- `frontend/nginx-proxy.conf` : Configuration Nginx avec `location /api { proxy_pass http://backend:8000/api; }`
- `frontend/docker-entrypoint.sh` : Génère `env-config.js` avec `VITE_API_URL: "/api"` (chemin relatif)
- `backend/app/main.py` : **CRITIQUE** → `app = FastAPI(redirect_slashes=False, ...)` pour éviter redirections 307
- `docker-compose-nginx-proxy.yml` : Backend expose port 8000 SEULEMENT sur réseau Docker interne, frontend expose port 8080

**Points critiques :**

1. **`redirect_slashes=False` est OBLIGATOIRE dans FastAPI**
   - Sans ça, `/api/categories` → redirige vers `/api/categories/` (307 Temporary Redirect)
   - Les redirections 307 sont **interdites** pour les requêtes CORS preflight
   - Symptôme : Erreurs 405 "Method Not Allowed" dans la console navigateur
   - **Vérification** : `docker exec backend grep "redirect_slashes" /app/app/main.py` doit afficher `redirect_slashes=False`

2. **env-config.js doit contenir un chemin RELATIF**
   - Correct : `VITE_API_URL: "/api"` (chemin relatif, même origine)
   - Incorrect : `VITE_API_URL: "http://localhost:8000/api"` (origine différente, CORS)
   - **Vérification** : http://nas:8080/env-config.js doit afficher `"/api"`

3. **Le frontend doit charger env-config.js au runtime**
   - `frontend/src/services/api.js` lit `window.ENV.VITE_API_URL` au runtime
   - Si le build hardcode l'URL, env-config.js ne sert à rien
   - **Vérification** : Console navigateur → `window.ENV` doit retourner `{VITE_API_URL: "/api"}`

4. **Le backend ne doit PAS être exposé directement**
   - Dans docker-compose : backend utilise `expose: ["8000"]` (pas `ports:`)
   - Seulement accessible via le réseau Docker interne
   - Nginx proxie les requêtes depuis le réseau interne

**Commandes de diagnostic en cas de problème :**

```bash
# Vérifier redirect_slashes dans le backend
docker exec inventaire_backend grep -A 3 "app = FastAPI" /app/app/main.py | grep redirect_slashes

# Vérifier env-config.js dans le frontend
docker exec inventaire_frontend cat /usr/share/nginx/html/env-config.js

# Vérifier la config Nginx active
docker exec inventaire_frontend cat /etc/nginx/conf.d/default.conf | grep proxy_pass

# Tester la connectivité backend depuis le frontend
docker exec inventaire_frontend wget -O- http://backend:8000/api/health

# Surveiller les logs pour voir les redirections 307
docker logs inventaire_backend -f
# Si vous voyez "307 Temporary Redirect", redirect_slashes=False est manquant !
```

**Rebuild complet en cas de problème :**

```batch
# Sur PC Windows
cd C:\Users\cedri\Desktop\inventaire

# Nettoyer cache Docker
docker rmi inventaire-backend:latest inventaire-frontend:latest -f
docker builder prune -a -f

# Reconstruire sans cache
docker build --pull --no-cache -t inventaire-backend:latest -f backend/Dockerfile backend
docker build --pull --no-cache -t inventaire-frontend:latest -f frontend/Dockerfile frontend

# Vérifier que redirect_slashes est présent
docker run --rm inventaire-backend:latest grep "redirect_slashes" /app/app/main.py

# Exporter
docker save inventaire-backend:latest -o inventaire-backend-final.tar
docker save inventaire-frontend:latest -o inventaire-frontend-final.tar
```

### Système de tags - Particularités importantes

- **IMPORTANT** : `tag_ids` ne doit PAS être dans `ArticleBase` car il serait hérité par `ArticleResponse`
- `tag_ids` est un champ d'entrée seulement, présent dans `ArticleCreate` et `ArticleUpdate`
- `ArticleResponse` utilise `tags: list[TagResponse]` pour afficher les tags complets (pas juste les IDs)
- L'association many-to-many est gérée manuellement dans `crud.py` avec `append()` et `clear()`
- Les tags sont chargés avec `joinedload()` pour éviter les requêtes N+1
- Dans le frontend, React Query nécessite `queryFn: () => getTags()` (pas `queryFn: getTags`) pour éviter la pollution des paramètres
