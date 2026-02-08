# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

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
