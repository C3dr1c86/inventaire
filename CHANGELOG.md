# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

---

## [1.2.0] - 2026-02-10

### Ajouté

#### Backend
- **Système de gestion de photos pour les articles**
  - Nouveau modèle `Photo` avec relation one-to-many vers `Article`
  - Upload jusqu'à **5 photos par article** (limite validée côté backend)
  - Formats supportés : **JPEG, PNG, WEBP** (validation MIME type)
  - Taille maximale : **5 MB par fichier** (validation côté serveur)
  - Stockage organisé : `uploads/articles/{article_id}/`
  - Génération automatique de miniatures **150x150** avec Pillow (LANCZOS resampling)
  - Sauvegarde des miniatures dans `uploads/articles/{article_id}/thumbnails/`
  - Suppression CASCADE : Suppression d'un article supprime ses photos en base et fichiers

- **Nouveaux endpoints API** pour les photos :
  - `POST /api/articles/{article_id}/photos` : Upload une photo (multipart/form-data)
  - `DELETE /api/articles/{article_id}/photos/{photo_id}` : Supprime une photo
  - `GET /api/articles/{article_id}/photos` : Liste toutes les photos d'un article

- **Service de traitement d'images** (`services/photo_service.py`) :
  - Validation des types MIME et tailles de fichiers
  - Génération de noms de fichiers uniques avec timestamp
  - Conversion RGBA/LA/P → RGB avec fond blanc pour compatibilité JPEG
  - Compression intelligente (quality=85, optimize=True)
  - Gestion de la suppression des fichiers (original + miniature)

- **StaticFiles FastAPI** : Serving des uploads via `/uploads` (monté après tous les routers)

#### Frontend
- **Composant PhotoUpload** (`components/articles/PhotoUpload.jsx`) :
  - Upload par **clic** ou **drag & drop** (HTML5 native)
  - Zone d'upload avec états visuels (normal, hover, drag-active)
  - Validation côté client (type, taille, limite 5 photos)
  - Indicateur de chargement avec spinner pendant upload
  - Galerie avec miniatures en grille responsive (CSS Grid)
  - Bouton de suppression (X) visible au hover sur chaque miniature
  - Confirmation avant suppression
  - **Lightbox** pour visualisation plein écran
    - Affichage de l'image originale (pas la miniature)
    - Fermeture par clic extérieur ou bouton X
    - Nom du fichier affiché sous l'image

- **Intégration dans ArticleForm** :
  - Composant PhotoUpload affiché **uniquement en mode édition** (article existant)
  - Message informatif en mode création : "Vous pourrez ajouter des photos après avoir créé l'article"
  - Invalidation automatique du cache React Query après upload/suppression

- **Affichage dans la liste Articles** :
  - Nouvelle colonne **"Photo"** avec miniature de la première photo
  - Placeholder avec icône 📷 pour les articles sans photo
  - Images 50x50 avec `object-fit: cover` et bordure arrondie

- **Service API** (`services/photoService.js`) :
  - `uploadPhoto(articleId, file)` : Upload avec FormData et Content-Type multipart/form-data
  - `deletePhoto(articleId, photoId)` : Suppression
  - Construction d'URLs complètes pour accès aux images

#### Styles
- **PhotoUpload.css** avec styles complets :
  - Zone upload avec bordure pointillée bleue, transitions smooth
  - Galerie responsive : 120px/100px/80px selon breakpoints
  - Delete button avec opacity 0 → 1 au hover (sauf mobile : toujours visible)
  - Lightbox avec animations fadeIn/zoomIn
  - Media queries pour tablettes (768px) et mobiles (576px)

### Modifié

#### Backend
- `models.py` : Ajout du modèle `Photo` et relation `photos` dans `Article`
- `schemas.py` : Ajout de `PhotoBase`, `PhotoResponse`, et `photos: list[PhotoResponse]` dans `ArticleResponse`
- `crud.py` :
  - Ajout de `get_photos_by_article()`, `get_photo()`, `create_photo()`, `delete_photo()`
  - Modification de `get_article()` et `get_articles()` avec `joinedload(models.Article.photos)` pour éviter N+1
  - Validation de la limite de 5 photos dans `create_photo()`
- `main.py` : Enregistrement du router `photos` et montage de StaticFiles pour `/uploads`

#### Frontend
- `components/articles/ArticleForm.jsx` : Intégration du composant PhotoUpload
- `pages/Articles.jsx` : Ajout de la colonne Photo dans le tableau

### Technique

- **Optimisations** :
  - Thumbnails 150x150 réduisent la bande passante (~80% de réduction de taille)
  - React Query cache les photos, évite re-fetch inutiles
  - `joinedload()` pour charger les photos avec l'article en 1 requête

- **Sécurité** :
  - Validation stricte des types MIME (pas de validation par extension uniquement)
  - Vérification de la taille fichier côté serveur (pas de confiance au client)
  - Noms de fichiers générés avec timestamp pour éviter collisions
  - Chemins relatifs stockés en base (pas d'URLs absolues)

- **UX** :
  - Feedback immédiat avec toasts react-toastify
  - Loader spinner pendant upload
  - Drag & drop avec changement de couleur
  - Lightbox pour consulter l'image sans quitter la page

### Notes de migration

⚠️ **Breaking Change** : Structure de base de données modifiée (ajout table `photos`)

Pour migrer depuis v1.1.0 :
1. Arrêter le serveur backend
2. Supprimer `backend/database/inventaire.db`
3. Redémarrer le serveur (la DB sera recréée automatiquement avec le nouveau schéma)
4. Recréer un utilisateur avec `/api/auth/register`

**Important** : Toutes les données précédentes seront perdues. En production, utiliser un outil de migration SQL (Alembic).

### Tests effectués

✅ Upload de photos (JPEG 7KB)
✅ Génération de miniatures (1,5KB pour 150x150)
✅ Limite de 5 photos par article (validation backend)
✅ Validation taille fichier (max 5 MB)
✅ Validation type MIME (JPEG/PNG/WEBP uniquement)
✅ Suppression de photos (fichiers + base de données)
✅ Affichage miniatures dans la liste Articles

---

## [1.1.0] - 2026-02-08

### Ajouté

#### Backend
- **Système de catégories hiérarchiques** (2 niveaux max : catégorie → sous-catégorie)
  - Ajout du champ `parent_id` dans le modèle `Categorie` avec auto-référence SQLAlchemy
  - Propriétés calculées `niveau` (0 = racine, 1 = sous-catégorie) et `nom_complet` (ex: "Matériaux > Bois")
  - Relation `parent` (many-to-one) et `children` (one-to-many)

- **Nouveaux endpoints API** pour la hiérarchie :
  - `GET /api/categories/racines` : Récupère uniquement les catégories racines
  - `GET /api/categories/tree` : Récupère l'arbre complet avec sous-catégories
  - `GET /api/categories/{id}/children` : Récupère les sous-catégories d'une catégorie

- **Validations hiérarchiques** dans CRUD :
  - Fonction `validate_hierarchy()` : Empêche création de plus de 2 niveaux
  - Fonction `has_children()` : Vérifie si une catégorie a des enfants
  - Blocage de la suppression d'une catégorie parente si elle contient des sous-catégories
  - Empêche les boucles circulaires (catégorie parente d'elle-même)

#### Frontend
- **CategorieForm amélioré** :
  - Select "Catégorie parente" pour créer des sous-catégories
  - Affichage uniquement des catégories racines dans le select parent
  - Conversion automatique du `parent_id` en entier ou null

- **ArticleForm avec double select cascadé** :
  - Premier select : Catégories principales (racines uniquement)
  - Second select : Sous-catégories (affiché dynamiquement selon la catégorie parente)
  - Chargement asynchrone des sous-catégories via `getSousCategories()`
  - Si aucune sous-catégorie : utilise automatiquement la catégorie parente
  - Message informatif : "✓ Cette catégorie sera utilisée (pas de sous-catégories disponibles)"

- **Page Categories avec affichage hiérarchique** :
  - Utilise `getCategoriesTree()` au lieu de `getCategories()`
  - Catégories racines affichées avec fond gris clair, en gras, et icône 📁
  - Sous-catégories indentées avec symbole ↳
  - Compteur de sous-catégories entre parenthèses (ex: "Matériaux (4 sous-catégories)")

- **Page Articles - Filtre de catégories amélioré** :
  - Utilise `<optgroup>` pour structure hiérarchique claire
  - Catégories racines en gras avec icône 📁
  - Option "{Catégorie} (toutes)" pour filtrer par catégorie parente
  - Sous-catégories indentées avec symbole ↳

- **Services frontend** :
  - `getCategoriesRacines()` : Récupère les catégories racines
  - `getCategoriesTree()` : Récupère l'arbre hiérarchique complet
  - `getSousCategories(parentId)` : Récupère les sous-catégories d'une catégorie

### Modifié

#### Backend
- `models.py` : Modèle `Categorie` restructuré avec hiérarchie
- `schemas.py` : Schémas Pydantic avec `parent_id`, `niveau`, `nom_complet`, et `children` récursif
- `crud.py` : Fonctions CRUD adaptées avec validations hiérarchiques
- `routers/categories.py` : Routes enrichies avec endpoints hiérarchiques

#### Frontend
- `pages/Articles.jsx` : Filtre de catégories avec `<optgroup>`
- `pages/Categories.jsx` : Affichage en arbre hiérarchique
- `components/categories/CategorieForm.jsx` : Ajout select parent
- `components/articles/ArticleForm.jsx` : Passage de select simple à double select cascadé
- `services/categorieService.js` : Ajout des nouvelles fonctions API

### Technique

- **Optimisations SQL** : Utilisation de `joinedload(Categorie.children)` pour éviter les requêtes N+1
- **Récursivité Pydantic** : `CategorieResponse.model_rebuild()` pour gérer la structure récursive
- **UX** : Messages informatifs, chargement dynamique, indentation visuelle

### Notes de migration

⚠️ **Breaking Change** : Structure de base de données modifiée

Pour migrer depuis v1.0 :
1. Arrêter le serveur backend
2. Supprimer `backend/database/inventaire.db`
3. Redémarrer le serveur (la DB sera recréée automatiquement avec le nouveau schéma)
4. Recréer les catégories avec la nouvelle structure hiérarchique

**Important** : Toutes les données précédentes (catégories, articles, mouvements) seront perdues.

---

## [1.0.0] - 2026-01-XX

### Ajouté

#### Backend
- API REST complète avec FastAPI
- Base de données SQLite avec SQLAlchemy ORM
- Modèles : User, Categorie, Article, Mouvement, Tag
- Authentification JWT (mono-utilisateur)
- CRUD complet pour articles, catégories, mouvements, tags
- Système de tags avec relation many-to-many
- Endpoints de rapports et statistiques
- Exports CSV et PDF (ReportLab)
- Validations et contraintes (stock ≥ 0, prix ≥ 0)
- Gestion transactionnelle des mouvements de stock

#### Frontend
- Application React 18 + Vite
- React Query pour gestion d'état serveur
- Pages : Dashboard, Articles, Catégories, Mouvements, Rapports
- Composants réutilisables : Modal, Loader, Pagination, ProtectedRoute
- Système de tags complet avec TagInput
- Recherche avec debounce (500ms)
- Filtres avancés (catégorie, tags, stock bas)
- Pagination (10 items/page)
- Design responsive (mobile, tablette, desktop)
- Notifications toast (react-toastify)

#### Déploiement
- Dockerfiles optimisés (multi-stage pour frontend)
- docker-compose.yml pour build local
- Scripts de déploiement Windows (.bat) et Linux/Mac (.sh)
- Configuration Nginx reverse proxy
- Volumes persistants pour database et exports

### Documentation
- README.md complet
- CLAUDE.md avec instructions pour Claude Code
- ROADMAP_AMELIORATIONS.md pour futures fonctionnalités

---

[1.1.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.1.0
[1.0.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.0.0
