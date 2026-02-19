# CLAUDE.md

Ce fichier fournit des conseils à Claude Code (claude.ai/code) lors du travail sur le code de ce dépôt.

## Vue d'ensemble du projet

Application full-stack de gestion d'inventaire avec :
- **Backend** : FastAPI + SQLAlchemy + SQLite (100% complet)
- **Frontend** : React 18 + Vite + React Query (100% complet)
- **Langue** : Français (commentaires de code, UI, documentation)
- **Version actuelle** : v1.9.16 (Correctifs UX mobile + dark mode + suppression mouvements)
- **Prochaine version** : v1.7.0 (Dashboard Analytique Avancé) - Voir [docs/ROADMAP.md](docs/ROADMAP.md)

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

## Workflow Git et CI/CD

### Créer une nouvelle version

Le projet utilise **GitHub Actions** pour automatiser le build et la publication des images Docker.

**Processus complet** :

```bash
# 1. Développer et tester en local
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload

# Dans un autre terminal
cd frontend
npm run dev

# 2. Commit et push des changements
git add -A
git commit -m "type: description du changement"
git push origin main

# 3. Créer un tag de version (déclenche le workflow Docker)
git tag v1.x.x
git push origin v1.x.x

# 4. Attendre le workflow GitHub Actions (~3-5 min)
# Vérifier sur: https://github.com/C3dr1c86/inventaire/actions/workflows/docker-build.yml

# 5. Déployer sur le NAS une fois le workflow terminé
cd deployment\nas
deploy.bat
```

### Workflows GitHub Actions

**Fichiers dans `.github/workflows/`** :

1. **`ci.yml`** : Tests et linting
   - Déclenché sur : chaque push sur `main` et chaque PR
   - Vérifie : Black (formatage Python), Flake8 (linting), tests pytest

2. **`docker-build.yml`** : Build et publication des images Docker
   - Déclenché sur : tags `v*.*.*` (ex: v1.6.5) ou déclenchement manuel
   - Publie sur : GitHub Container Registry (ghcr.io)
   - Images : `ghcr.io/c3dr1c86/inventaire/backend:latest` et `frontend:latest`
   - Crée automatiquement une release GitHub avec notes

3. **`dependency-review.yml`** : Revue de sécurité des dépendances
   - Déclenché sur : Pull Requests
   - Vérifie : Vulnérabilités dans requirements.txt et package.json

### Convention de commits

**Format** : `type: description`

**Types** :
- `feat:` Nouvelle fonctionnalité
- `fix:` Correction de bug
- `docs:` Documentation seulement
- `style:` Formatage (pas de changement de code)
- `refactor:` Refactoring (pas de nouvelle fonctionnalité ni fix)
- `test:` Ajout/modification de tests
- `chore:` Tâches de maintenance

**Exemples** :
```bash
git commit -m "feat: Ajout génération automatique SKU depuis catégorie"
git commit -m "fix: Charger le parent de l'emplacement pour édition d'articles"
git commit -m "docs: Mise à jour CHANGELOG v1.6.5"
```

### Déploiement sur NAS via Git

**Architecture** :
1. Code poussé sur GitHub (main + tag)
2. GitHub Actions build les images Docker → ghcr.io
3. Script `deploy.bat` pull les images depuis ghcr.io → NAS
4. Conteneurs redémarrés sur le NAS avec les nouvelles images

**Le script `deployment/nas/deploy.bat` fait automatiquement** :
- ✅ Connexion SSH au NAS
- ✅ Création des dossiers nécessaires
- ✅ Copie docker-compose.yml et .env
- ✅ `docker compose pull` (télécharge images depuis ghcr.io)
- ✅ `docker compose up -d` (démarre les conteneurs)

**Configuration requise** (fichier `deployment/nas/.env`) :
```env
NAS_HOST=192.168.1.37
NAS_USER=admin
NAS_DEPLOY_PATH=/volume1/docker/inventaire
SECRET_KEY=<généré avec openssl rand -hex 32>
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
   - `User` : Utilisateurs avec username, email, hashed_password, role (RoleEnum), permissions (JSON custom)
   - `Categorie` : **Catégories hiérarchiques** (2 niveaux max : racine → sous-catégorie)
     - Champ `parent_id` pour auto-référence (nullable pour catégories racines)
     - Relations : `parent` (many-to-one) et `children` (one-to-many)
     - Propriétés calculées : `niveau` (0 ou 1), `nom_complet` (ex: "Matériaux > Bois")
     - Validations : empêche >2 niveaux, boucles circulaires, suppression si enfants
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
├── nom (non unique - permet même nom sous parents différents)
├── description
├── parent_id (FK → categories, CASCADE, nullable)
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
- GET / - Liste toutes (structure plate)
- GET /racines - Liste uniquement les catégories racines (parent_id = null)
- GET /tree - Récupère l'arbre hiérarchique complet avec children imbriqués
- GET /{id} - Récupère une catégorie
- GET /{id}/children - Récupère les sous-catégories d'une catégorie
- POST / - Crée (avec parent_id optionnel pour sous-catégorie)
- PUT /{id} - Modifie
- DELETE /{id} - Supprime (bloqué si la catégorie a des enfants)

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
- DELETE /{id} - Supprime un mouvement (admin/gestionnaire — ne modifie PAS le stock)
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

### Catégories hiérarchiques (v1.1.0)

**Structure à 2 niveaux** : Catégories racines → Sous-catégories

Exemples :
```
Matériaux
├── Bois
├── Métal
├── Plastique
└── Autres

Consommables
├── Quincaillerie
├── Colles & Mastics
├── Électricité
└── Plomberie
```

**Backend** :
- Validation `validate_hierarchy()` dans crud.py empêche création de plus de 2 niveaux
- Fonction `has_children()` vérifie si une catégorie a des sous-catégories
- Impossible de supprimer une catégorie parente si elle contient des enfants
- Endpoints `/racines`, `/tree`, `/{id}/children` pour navigation hiérarchique
- Optimisation : `joinedload(Categorie.children)` évite requêtes N+1

**Frontend** :
- **ArticleForm** : Double select cascadé (catégorie parente → sous-catégorie)
- **CategorieForm** : Select "Catégorie parente" pour créer sous-catégories
- **Page Categories** : Affichage en arbre avec indentation visuelle
  - Catégories racines en gras avec fond gris et icône 📁
  - Sous-catégories indentées avec symbole ↳
  - Compteur de sous-catégories affiché
- **Page Articles** : Filtre avec `<optgroup>` pour structure claire

**Points d'attention** :
- Toujours utiliser `/tree` pour affichage hiérarchique (pas `/` qui retourne structure plate)
- Charger sous-catégories dynamiquement avec `getSousCategories(parentId)`
- Vérifier `parent_id` lors de création/modification pour éviter boucles circulaires

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
- **Catégories hiérarchiques (v1.1.0)** :
  - Structure à 2 niveaux (racine → sous-catégorie)
  - Endpoints `/racines`, `/tree`, `/{id}/children`
  - Double select cascadé dans ArticleForm
  - Affichage en arbre dans page Catégories
  - Filtres hiérarchiques avec `<optgroup>`
  - Validations empêchant >2 niveaux et boucles circulaires
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
  - Backend : Modèle User avec role et permissions, endpoints /register, /login, /me
  - Protection de toutes les routes API avec dépendance `get_current_user`
  - JWT enrichi avec expiration de 24 heures (payload : username, user_id, role, exp)
  - Frontend : AuthContext avec permissions, ProtectedRoute, pages Login/Register
  - Token stocké dans localStorage
  - Intercepteur Axios pour ajouter automatiquement le token
  - Redirection automatique vers /login si token invalide/expiré
  - **Multi-utilisateurs** : Plusieurs comptes avec rôles (Admin, Gestionnaire, Technicien, Consultation)
- **Système de permissions granulaires (v1.6.0)** :
  - 4 rôles prédéfinis avec permissions par défaut
  - Permissions custom par utilisateur (champ JSON)
  - Format `resource:action` avec wildcards
  - Protection endpoints avec `require_permission()`
  - Rendering conditionnel frontend basé sur permissions
  - Interface admin pour gestion utilisateurs
  - Audit trail complet (created_by/updated_by sur 11 modèles)
- **Déploiement Docker complet** :
  - Dockerfiles optimisés (multi-stage pour frontend)
  - docker-compose.yml pour build local
  - docker-compose-prebuilt.yml pour images pré-construites
  - Scripts Windows (.bat) et Linux/Mac (.sh) pour déploiement automatisé
  - Volumes persistants pour database et exports
  - Configuration CORS adaptée pour Docker (localhost:80)
  - Guide Raspberry Pi complet (deployment/raspberry-pi/README.md)
- **Version portable complète (Windows)** :
  - Package autonome sans installation (Python 3.11.8 embedded)
  - Scripts de build automatisés
  - Base de données démo pré-remplie (50+ articles)
  - Documentation utilisateur (LISEZMOI.txt)
  - Taille finale : ~56 MB compressé
  - Localisation : deployment/portable-demo/build-complet/

- **Mode sombre complet (v1.9.11)** :
  - Toggle clair/sombre persisté dans localStorage
  - CSS variables via `[data-theme="dark"]` sur `<html>`
  - Toutes les pages et composants compatibles dark mode
  - Bouton toggle dans la sidebar (icône Lune/Soleil)
- **Navigation mobile bottom nav (v1.9.11)** :
  - Barre de navigation fixe en bas (≤576px)
  - Affiche les 4 premiers liens + bouton "Plus" si besoin
  - Masque le hamburger sur smartphone
  - Touches 44px minimum (Apple HIG)
- **Suppression de mouvements (v1.9.9)** :
  - Endpoint `DELETE /api/mouvements/{id}` (admin + gestionnaire)
  - Suppression de l'enregistrement uniquement (stock non modifié)
  - Modal de confirmation avec avertissement stock
  - Bouton visible selon permissions (`canDelete('mouvements')`)
- **Réactivation comptes utilisateurs (v1.9.10)** :
  - Endpoint `POST /api/users/{id}/reactivate`
  - Bouton vert (UserCheck) dans la page Utilisateurs pour les comptes inactifs
  - Protection : impossible de se réactiver soi-même
- **Correctifs dark mode et mobile (v1.9.12 → v1.9.16)** :
  - Remplacement de toutes les couleurs hardcodées par des variables CSS
  - Attributs `data-label` sur tous les `<td>` pour la vue carte mobile
  - Classes CSS dédiées pour les hiérarchies (catégories, emplacements)
  - z-index modal relevé à 1050 (au-dessus du bottom nav à 1000)
  - `white-space: normal` au breakpoint 576px (supprime scroll horizontal)

### Incomplet ⚠️
- Aucune fonctionnalité majeure manquante

**Prochaine version planifiée** : v1.7.0 - Dashboard Analytique Avancé
**Roadmap complète** : Voir [docs/ROADMAP.md](docs/ROADMAP.md) pour toutes les versions planifiées

## Tâches courantes

### Options de déploiement

L'application peut être déployée de **3 façons différentes** :

#### 1. Version Portable Complète (Windows uniquement)

**Idéal pour** : Démonstrations, clés USB, tests sur PC sans Python

**Localisation** : `deployment/portable-demo/build-complet/inventaire-portable-complet-v1.1.0.zip`

**Caractéristiques** :
- Aucune installation requise (Python 3.11.8 embedded inclus)
- Toutes les dépendances pré-installées
- Base de données démo avec 50+ articles
- Taille : ~56 MB (compressé), ~150 MB (décompressé)
- Lancement : Double-clic sur "Lancer Inventaire.bat"
- Mono-utilisateur

**Documentation** : [deployment/portable-demo/README.md](deployment/portable-demo/README.md)

#### 2. Déploiement Docker (Recommandé pour production)

**Idéal pour** : NAS, serveurs, production

##### Sur PC local (développement rapide)
```bash
# Windows
scripts\start.bat

# Linux/Mac
./scripts/start.sh

# Accès : http://localhost (frontend) et http://localhost:8000 (backend)
```

##### Sur NAS Ugreen/Synology

**Déploiement de base (accès local réseau uniquement)** :
```bash
# Windows - Déploiement automatisé
cd deployment\nas
deploy.bat

# Configuration dans .env :
# NAS_HOST=192.168.1.37
# NAS_USER=admin
# NAS_DEPLOY_PATH=/volume1/docker/inventaire
# SECRET_KEY=<générer avec openssl rand -hex 32>
```

**Accès : http://192.168.1.37:8080** (réseau local seulement)

---

**Accès externe sécurisé (depuis Internet)** :

Deux solutions disponibles avec guides complets dans `deployment/nas/` :

| Solution | Coût | Avantages | Documentation |
|----------|------|-----------|---------------|
| **Tailscale** | 0€ | VPN privé gratuit, HTTPS automatique, jusqu'à 100 appareils | [GUIDE-TAILSCALE.md](deployment/nas/GUIDE-TAILSCALE.md) |
| **Cloudflare Tunnel** | 1-12€/an (domaine) | URL publique personnalisée, protection DDoS, cache CDN | [GUIDE-CLOUDFLARE-TUNNEL.md](deployment/nas/GUIDE-CLOUDFLARE-TUNNEL.md) |

**Comparatif détaillé** : [COMPARATIF-SOLUTIONS-ACCES-EXTERNE.md](deployment/nas/COMPARATIF-SOLUTIONS-ACCES-EXTERNE.md)

**Guides de déploiement rapide** :
- [DEPLOIEMENT-TAILSCALE-RAPIDE.md](deployment/nas/DEPLOIEMENT-TAILSCALE-RAPIDE.md) : 15 minutes setup
- [DEPLOIEMENT-CLOUDFLARE-RAPIDE.md](deployment/nas/DEPLOIEMENT-CLOUDFLARE-RAPIDE.md) : 20 minutes setup

**Fichiers docker-compose spécifiques** :
- `docker-compose.yml` : Déploiement de base (local uniquement)
- `docker-compose-tailscale.yml` : Avec Tailscale VPN
- `docker-compose-cloudflare.yml` : Avec Cloudflare Tunnel

##### Sur Raspberry Pi 3B+ (ou supérieur)

**Documentation complète** : [deployment/raspberry-pi/README.md](deployment/raspberry-pi/README.md)

**Points clés** :
- Minimum : RPi 3B+ avec 1 GB RAM
- Recommandé : Stockage SSD USB (pas carte microSD pour performances)
- Refroidissement : Dissipateur thermique obligatoire
- OS : Raspberry Pi OS Lite (64-bit)
- Installation sans Docker (Python + Node.js natifs pour économiser RAM)

#### 3. Développement local (Sans Docker)

**Idéal pour** : Développement, modifications du code

Voir section "Commandes de développement" plus haut pour les instructions complètes.

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

### Catégories hiérarchiques - Particularités importantes

- **Structure récursive Pydantic** : `CategorieResponse` contient `children: list[CategorieResponse]` pour représenter l'arbre
  - Nécessite `CategorieResponse.model_rebuild()` après la définition de la classe pour activer la récursivité
  - Sans cela, Pydantic lève une erreur "name 'CategorieResponse' is not defined"

- **Validation de hiérarchie** dans `crud.py` :
  - `validate_hierarchy(db, parent_id, current_id)` empêche >2 niveaux
  - Vérifie que `parent_id` n'est pas `current_id` (évite boucles circulaires)
  - Vérifie que le parent est bien une catégorie racine (niveau 0)

- **Suppression protégée** :
  - Impossible de supprimer une catégorie si elle a des sous-catégories
  - `has_children()` vérifie la présence d'enfants avant suppression
  - Lève `HTTPException(status_code=400)` si bloqué

- **Frontend - Double select cascadé** (ArticleForm) :
  - Premier select : Catégories racines uniquement (`getCategoriesRacines()`)
  - Second select : Sous-catégories dynamiques (`getSousCategories(parentId)`)
  - Si aucune sous-catégorie : utilise automatiquement la catégorie parente
  - Message informatif : "✓ Cette catégorie sera utilisée (pas de sous-catégories disponibles)"

- **Endpoints spécifiques** :
  - `/api/categories/racines` : TOUJOURS utiliser pour le premier select
  - `/api/categories/tree` : Pour affichage hiérarchique (page Catégories)
  - `/api/categories/{id}/children` : Pour charger sous-catégories dynamiquement

- **Optimisation requêtes** :
  - Utiliser `joinedload(Categorie.children)` pour éviter N+1 queries
  - Ne PAS utiliser `/api/categories/` (structure plate) pour affichage hiérarchique

### Système Multi-Utilisateurs & Permissions (v1.6.0) - Particularités importantes

**Architecture Hybrid Role Enum + JSON Permissions** :
- 4 rôles prédéfinis : `admin`, `gestionnaire`, `technicien`, `consultation`
- Permissions par défaut basées sur le rôle
- Permissions custom par utilisateur (override defaults) via champ JSON
- Format permission : `"resource:action"` (ex: `articles:create`, `users:delete`)
- Wildcards supportés : `articles:*` (toutes actions), `*:*` (admin)

**Backend - Structure des permissions** (`backend/app/permissions.py`) :

```python
DEFAULT_PERMISSIONS = {
    RoleEnum.ADMIN: ["*:*"],
    RoleEnum.GESTIONNAIRE: [
        "articles:*", "categories:*", "mouvements:*",
        "commandes:*", "fournisseurs:*", "emplacements:*",
        "rapports:read", "rapports:export"
    ],
    RoleEnum.TECHNICIEN: [
        "articles:read", "categories:read",
        "mouvements:create", "mouvements:read",
        "commandes:read", "rapports:read"
    ],
    RoleEnum.CONSULTATION: [
        "articles:read", "categories:read", "mouvements:read",
        "commandes:read", "fournisseurs:read", "rapports:read"
    ]
}

# Vérification permission
def has_permission(user: "User", resource: str, action: str) -> bool:
    # 1. Check custom permissions (overrides)
    if user.permissions:
        if f"{resource}:{action}" in user.permissions: return True
    # 2. Check default role permissions
    role_perms = DEFAULT_PERMISSIONS.get(user.role, [])
    return (f"{resource}:{action}" in role_perms or
            f"{resource}:*" in role_perms or
            "*:*" in role_perms)
```

**Protection des endpoints** :

```python
from app.permissions import require_permission

@router.post("/api/articles", dependencies=[Depends(require_permission("articles", "create"))])
def create_article(...):
    # Endpoint protégé : Seuls les users avec "articles:create" peuvent accéder
    pass
```

**Audit Trail sur tous les modèles** :
- 11 modèles enrichis : Article, Categorie, Tag, Photo, Fournisseur, Emplacement, LigneCommande, User, Mouvement, Commande
- Colonnes : `created_by` et `updated_by` (Foreign Keys vers users.id)
- Pattern dans CRUD :
  ```python
  def create_article(db, article_data, current_user):
      db_article = models.Article(..., created_by=current_user.id)

  def update_article(db, article_id, article_data, current_user):
      db_article.updated_by = current_user.id
  ```
- Relations viewonly : `creator = relationship("User", foreign_keys=[created_by], viewonly=True)`

**JWT enrichi** :
- Payload contient : `username`, `user_id`, `role`, `exp`
- Durée de vie : 24 heures (1440 minutes)
- Performance : Role dans JWT évite DB lookup à chaque requête
- Limitation actuelle : Changement de rôle ne force pas logout immédiat (token valide 24h)

**Validations admin strictes** (`backend/app/routers/users.py`) :
```python
def update_user_role(user_id, role_update, current_user):
    if user_id == current_user.id:
        raise HTTPException(400, "Impossible de changer son propre rôle")
    # ...

def deactivate_user(user_id, current_user):
    if user_id == current_user.id:
        raise HTTPException(400, "Impossible de se désactiver soi-même")

    active_admins = db.query(User).filter(
        User.role == RoleEnum.ADMIN, User.is_active == True
    ).count()

    target_user = db.query(User).get(user_id)
    if target_user.role == RoleEnum.ADMIN and active_admins <= 1:
        raise HTTPException(400, "Au moins 1 admin actif requis")
```

**Frontend - Hook usePermissions** (`frontend/src/hooks/usePermissions.js`) :

```javascript
const {
  hasPermission,      // Fonction de base
  isAdmin,            // role === 'admin'
  canCreate,          // hasPermission(resource, 'create')
  canUpdate,          // hasPermission(resource, 'update')
  canDelete,          // hasPermission(resource, 'delete')
  canExport           // hasPermission(resource, 'export')
} = usePermissions()
```

**Rendering conditionnel** (pattern appliqué sur 12 pages) :

```javascript
function Articles() {
  const { canCreate, canUpdate, canDelete } = usePermissions()

  return (
    <>
      {canCreate('articles') && <button onClick={handleCreate}>Créer</button>}
      {canUpdate('articles') && <button onClick={handleEdit}>Modifier</button>}
      {canDelete('articles') && <button onClick={handleDelete}>Supprimer</button>}
    </>
  )
}
```

**Navigation filtrée** (`frontend/src/components/layout/Layout.jsx`) :

```javascript
const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/articles', icon: Package, label: 'Articles', permission: { resource: 'articles', action: 'read' } },
  { path: '/users', icon: Users, label: 'Utilisateurs', permission: { resource: 'users', action: 'read' } },
]

const visibleNavItems = useMemo(() => {
  return navItems.filter(item => {
    if (!item.permission) return true
    return hasPermission(item.permission.resource, item.permission.action)
  })
}, [hasPermission])
```

**Badge de rôle** :
- Couleurs : Admin (violet #8b5cf6), Gestionnaire (bleu #3b82f6), Technicien (vert #10b981), Consultation (gris #6b7280)
- Affiché dans Layout sidebar sous le nom d'utilisateur

**Page Users** (`frontend/src/pages/Users.jsx`) :
- Accessible uniquement aux admins (`hasPermission('users', 'read')`)
- CRUD complet : Créer, modifier rôle, permissions custom, désactiver
- 3 modals : UserModal (création), RoleModal (changement rôle), PermissionsModal (23+ checkboxes)
- Badges colorés selon rôle et statut (actif/inactif)

**Points critiques** :

1. **Double validation obligatoire** :
   - Frontend masque les boutons (UX)
   - Backend bloque les endpoints (sécurité)
   - Ne JAMAIS se fier uniquement au frontend

2. **JWT cache invalidation** :
   - Problème : Changement de rôle ne force pas logout immédiat
   - Solution court terme : Frontend invalide token localStorage après modification
   - Solution long terme (v1.7.0) : Refresh tokens + token blacklist

3. **Permissions personnalisées** :
   - Admin peut override permissions d'un user via champ JSON
   - Custom permissions prioritaires sur role defaults
   - Exemple : Technicien avec permission custom `articles:create`

4. **Migration mono-user → multi-users** :
   - Ancien code mono-user supprimé dans `/api/auth/register`
   - Plusieurs comptes peuvent être créés
   - Premier utilisateur créé = admin recommandé

5. **Mouvement.created_by special case** :
   - Ancien format : String(100) contenant username
   - Nouveau format : ForeignKey(users.id)
   - Migration nécessaire si données existantes (voir `backend/migrate_mouvements.py`)

**Optimisations** :
- Permission check dans JWT (< 1ms, pas de DB query)
- `useMemo` pour filtre navigation (évite re-calculs)
- `useCallback` pour hasPermission (évite re-création fonction)
- React Query cache users (invalidation après mutations)

**Ressources disponibles** (24+ permissions configurables) :
- Articles : read, create, update, delete
- Catégories : read, create, update, delete
- Tags : read, create, update, delete
- Fournisseurs : read, create, update, delete
- Emplacements : read, create, update, delete
- Mouvements : read, create, delete (admin + gestionnaire uniquement)
- Commandes : read, create, update, delete
- Rapports : read, export
- Utilisateurs : read, create, update, delete

### Version portable complète - Particularités importantes

**Localisation** : `deployment/portable-demo/build-complet/inventaire-portable-complet-v1.1.0/`

**Structure du package** :
```
inventaire-portable-complet-v1.1.0/
├── python/               # Python 3.11.8 embedded avec toutes dépendances
├── backend/              # Code FastAPI complet
│   ├── app/
│   ├── database/         # Base de données SQLite
│   └── run.py            # Point d'entrée personnalisé
├── frontend/             # Build React (pas de sous-dossier dist)
│   ├── index.html        # ← Directement dans frontend/
│   └── assets/
├── data/
│   ├── exports/
│   └── uploads/
├── logs/
│   ├── backend.log
│   └── frontend.log
├── Lancer Inventaire.bat # Script principal
├── Arreter Inventaire.bat
└── LISEZMOI.txt          # Documentation utilisateur
```

**Points critiques** :

1. **Python embedded configuration** :
   - Fichier `python/python311._pth` DOIT contenir "import site" pour activer site-packages
   - pip installé manuellement via get-pip.py
   - Dépendances dans `python/Lib/site-packages/`

2. **Script de lancement** (Lancer Inventaire.bat) :
   - **IMPORTANT** : Frontend dans `frontend/` (PAS `frontend/dist/`)
   - Commande : `cd frontend` puis `python\python.exe -m http.server 5173`
   - **ERREUR COURANTE** : `cd frontend\dist` cause "Le chemin d'accès spécifié est introuvable"

3. **Base de données démo** :
   - Créée par `scripts/create-demo-db.py`
   - Contient 50+ articles, 5 catégories hiérarchiques, 10 tags, 30 mouvements
   - Localisation : `backend/database/inventaire.db`

4. **Build du package** :
   - Script automatisé : `deployment/portable-demo/scripts/build-portable-auto.bat`
   - Télécharge Python 3.11.8 embedded depuis python.org
   - Installe toutes les dépendances backend
   - Copie frontend/dist → frontend/
   - Crée base de données démo
   - Génère scripts de lancement

5. **Limitations** :
   - Windows uniquement (Python embedded est spécifique Windows)
   - Mono-utilisateur (une seule instance à la fois)
   - Pas de multi-threading (http.server simple thread)

**Scripts disponibles** :
- `build-portable-auto.bat` : Build automatisé sans interaction
- `build-portable-complet.bat` : Build avec pauses pour vérification
- `create-demo-db.py` : Génère base de données avec données réalistes

**Déploiement** :
1. Extraire le ZIP n'importe où (Bureau, clé USB, etc.)
2. Double-cliquer "Lancer Inventaire.bat"
3. Attendre 20 secondes (backend démarre, puis frontend)
4. Navigateur s'ouvre automatiquement sur http://localhost:5173
5. Login : admin / admin

**Documentation utilisateur complète** : Voir `LISEZMOI.txt` dans le package
