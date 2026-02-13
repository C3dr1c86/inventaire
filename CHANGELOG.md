# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

---

## [1.6.0] - 2026-02-12

### Ajouté

#### Backend - Système Multi-Utilisateurs & Permissions

- **4 rôles prédéfinis** avec permissions granulaires :
  - **Admin** : Permissions complètes (`*:*`)
  - **Gestionnaire** : CRUD sur articles, catégories, mouvements, commandes, fournisseurs, emplacements + export rapports
  - **Technicien** : Lecture + création mouvements de stock (focus terrain)
  - **Consultation** : Lecture seule sur toutes les ressources

- **Système de permissions granulaires** (`backend/app/permissions.py` - NOUVEAU) :
  - Format `"resource:action"` (ex: `articles:create`, `users:delete`, `rapports:export`)
  - Wildcards supportés : `articles:*` (toutes actions sur articles), `*:*` (admin)
  - **Permissions personnalisées par utilisateur** : Champ `permissions` JSON pour overrides custom
  - Fonction `has_permission(user, resource, action)` avec vérification custom puis role defaults
  - Dependency FastAPI `require_permission(resource, action)` pour protection des endpoints

- **Modèle User enrichi** (`backend/app/models.py`) :
  - Ajout `role: Enum(RoleEnum)` (admin, gestionnaire, technicien, consultation)
  - Ajout `permissions: JSON` (nullable) pour permissions custom par utilisateur
  - Relations audit trail ajoutées pour tous les modèles créés

- **Audit trail complet sur 11 modèles** :
  - Modèles enrichis : Article, Categorie, Tag, Photo, Fournisseur, Emplacement, LigneCommande, User, Mouvement, Commande
  - Pattern : `created_by` et `updated_by` (Foreign Keys vers users.id avec `ondelete="SET NULL"`)
  - Relations : `creator` et `updater` (viewonly=True pour éviter modifications accidentelles)
  - **Mouvement spécial** : Migration de `created_by: String(100)` vers `ForeignKey(users.id)`

- **JWT enrichi** (`backend/app/auth.py`) :
  - Payload contient désormais : `username`, `user_id`, `role`, `exp`
  - Durée de vie : 24 heures (1440 minutes)
  - Décodage automatique du `user_id` et `role` dans `get_current_user()`

- **Nouveaux endpoints de gestion utilisateurs** (`backend/app/routers/users.py` - NOUVEAU) :
  - `GET /api/users` : Liste tous les utilisateurs (admin only)
  - `POST /api/users` : Crée un utilisateur avec rôle (admin only)
  - `GET /api/users/{id}` : Récupère détails d'un utilisateur
  - `PUT /api/users/{id}/role` : Change le rôle (admin, validation : pas soi-même)
  - `PUT /api/users/{id}/permissions` : Configure permissions custom (admin)
  - `DELETE /api/users/{id}` : Désactive utilisateur (admin, validations strictes)

- **Validations admin strictes** :
  - Impossible de changer son propre rôle (HTTPException 400)
  - Impossible de se désactiver soi-même (HTTPException 400)
  - Au moins 1 admin actif doit rester dans le système (HTTPException 400)
  - Toutes les routes users protégées avec `require_permission("users", "read|create|update|delete")`

- **Endpoint `/api/auth/me` enrichi** :
  - Retourne désormais : `id`, `username`, `email`, `role`, `permissions` (liste calculée), `is_active`
  - Permissions calculées via `get_user_permissions(user)` (custom + role defaults fusionnés)

- **Suppression limitation mono-utilisateur** :
  - Ancien code bloquant dans `/api/auth/register` supprimé (lignes 38-43)
  - Plusieurs comptes peuvent désormais être créés
  - Premier utilisateur créé = admin par défaut (recommandé)

#### Frontend - Interface Permissions & Gestion Utilisateurs

- **AuthContext enrichi** (`frontend/src/contexts/AuthContext.jsx`) :
  - États ajoutés : `role` (string), `permissions` (array)
  - Fonction `hasPermission(resource, action)` avec support wildcards
  - Callback memoïsé avec `useCallback` pour performance
  - Récupération automatique des permissions depuis `/api/auth/me` au login

- **Hook usePermissions** (`frontend/src/hooks/usePermissions.js` - NOUVEAU) :
  ```javascript
  const {
    hasPermission,      // Fonction de base
    isAdmin,            // role === 'admin'
    isGestionnaire,     // role === 'gestionnaire'
    isTechnicien,       // role === 'technicien'
    isConsultation,     // role === 'consultation'
    canCreate,          // hasPermission(resource, 'create')
    canRead,            // hasPermission(resource, 'read')
    canUpdate,          // hasPermission(resource, 'update')
    canDelete,          // hasPermission(resource, 'delete')
    canExport           // hasPermission(resource, 'export')
  } = usePermissions()
  ```

- **Rendering conditionnel sur 12 pages** :
  - Pattern appliqué : `{canCreate('articles') && <button>Créer</button>}`
  - Pages modifiées :
    - `Dashboard.jsx` : 5 boutons création rapide conditionnels
    - `Articles.jsx` : Boutons Créer/Modifier/Supprimer conditionnels
    - `Categories.jsx` : CRUD complet conditionnel
    - `Tags.jsx` : Actions conditionnelles
    - `Fournisseurs.jsx` : Gestion conditionnelle
    - `Emplacements.jsx` : Création/édition conditionnelles
    - `Mouvements.jsx` : Création conditionnelle
    - `Commandes.jsx` : Actions par statut + permissions
    - `NouvelleCommande.jsx` : Page protection complète
    - `Rapports.jsx` : Exports conditionnels
    - `ScanQRCode.jsx` : Actions conditionnelles
    - `PlanAtelier.jsx` : Lecture seule si consultation

- **Navigation filtrée par permissions** (`frontend/src/components/layout/Layout.jsx`) :
  - Items navigation avec propriété `permission: { resource, action }`
  - Filtrage avec `useMemo` : `visibleNavItems.filter(item => hasPermission(...))`
  - Exemple : Lien "Utilisateurs" visible uniquement si `hasPermission('users', 'read')`

- **Badge de rôle utilisateur** (Layout sidebar) :
  - Affichage du rôle actuel avec badge coloré
  - Couleurs : Admin (violet #8b5cf6), Gestionnaire (bleu #3b82f6), Technicien (vert #10b981), Consultation (gris #6b7280)
  - Affiché sous le nom d'utilisateur dans la sidebar

- **Page Gestion des Utilisateurs** (`frontend/src/pages/Users.jsx` - NOUVEAU) :
  - **Tableau complet** : Utilisateur, Email, Rôle (badge coloré), Statut (actif/inactif), Créé le, Actions
  - **Badges de statut** : ✅ Actif (vert) / ❌ Inactif (rouge) avec icônes
  - **3 actions par utilisateur** :
    - Changer Rôle (icône UserCog) → Modal avec select 4 rôles
    - Permissions Custom (icône Shield) → Modal avec 23+ checkboxes
    - Désactiver (icône UserX) → Confirmation + is_active = false
  - **Modal Création Utilisateur** :
    - Champs : username (min 3), email (validation), password (min 8), role (select)
    - Validation côté client + backend
    - Toast de confirmation après création
  - **Modal Changement Rôle** :
    - Affichage rôle actuel
    - Select nouveau rôle avec 4 options
    - Badge coloré selon le rôle
  - **Modal Permissions Custom** :
    - 23+ permissions disponibles organisées par ressource :
      - Articles (create, update, delete)
      - Catégories (create, update, delete)
      - Tags (create, update, delete)
      - Fournisseurs (create, update, delete)
      - Emplacements (create, update, delete)
      - Mouvements (create)
      - Commandes (create, update, delete)
      - Rapports (export)
      - Utilisateurs (read, create, update, delete)
    - Checkboxes avec toggle on/off
    - Sauvegarde envoie liste permissions au backend

- **Service API utilisateurs** (`frontend/src/services/userService.js` - NOUVEAU) :
  - `getUsers()` : Liste tous les utilisateurs
  - `getUser(id)` : Détails d'un utilisateur
  - `createUser(userData)` : Création avec rôle
  - `updateUserRole(userId, role)` : Changement de rôle
  - `updateUserPermissions(userId, permissions)` : Mise à jour permissions custom
  - `deactivateUser(userId)` : Désactivation (is_active = false)

### Modifié

#### Backend - Protection Endpoints & Audit Trail

- **16 fonctions CRUD modifiées** (`backend/app/crud.py`) :
  - Ajout paramètre `current_user: models.User` dans signatures
  - Pattern create : `db_model = models.Model(..., created_by=current_user.id)`
  - Pattern update : `db_model.updated_by = current_user.id`
  - Fonctions modifiées :
    - Articles : `create_article`, `update_article`
    - Catégories : `create_categorie`, `update_categorie`
    - Tags : `create_tag`, `update_tag`
    - Fournisseurs : `create_fournisseur`, `update_fournisseur`
    - Emplacements : `create_emplacement`, `update_emplacement`
    - Photos : `create_photo`
    - Mouvements : `create_mouvement`
    - Commandes : `update_commande`
    - Users : `create_user` (current_user optional pour registration)

- **9 routers modifiés** pour passer `current_user` aux CRUD :
  - `categories.py`, `articles.py`, `photos.py`, `tags.py`, `fournisseurs.py`, `emplacements.py`, `mouvements.py`, `commandes.py`, `auth.py`
  - Pattern : `crud.create_xxx(db, xxx_data, current_user)`

- **Endpoints protégés avec permissions** :
  - Tous les endpoints POST/PUT/DELETE nécessitent permissions appropriées
  - Exemple : `POST /api/articles` → `Depends(require_permission("articles", "create"))`
  - Exemple : `DELETE /api/users/{id}` → `Depends(require_permission("users", "delete"))`

- **Schemas Pydantic** (`backend/app/schemas.py`) :
  - Ajout `UserCreateAdmin`, `RoleUpdate`, `PermissionsUpdate`
  - Modification `UserMeResponse` : Ajout champs `role` et `permissions`
  - Ajout `created_by` et `updated_by` dans tous les schémas Response

#### Frontend - Intégration Permissions

- **12 pages modifiées** avec rendering conditionnel (voir section Ajouté)
- **App.jsx** : Ajout route `/users` avec protection ProtectedRoute
- **Layout.jsx** : Filtrage navigation + affichage badge rôle

### Technique

- **Architecture Hybrid Role Enum + JSON Permissions** :
  - Simplicité : 4 rôles clairs avec permissions par défaut
  - Flexibilité : Admin peut override permissions par utilisateur (champ JSON)
  - Performance : Role dans JWT → pas de DB lookup à chaque requête
  - Évolutivité : Migration future vers RBAC complet facile

- **JWT Cache Invalidation** (limitation actuelle) :
  - Problème : Changement de rôle ne force pas déconnexion immédiate (JWT valide 24h)
  - Solution court terme : Frontend invalide token localStorage après modification
  - Solution long terme (v1.7.0) : Refresh tokens + token blacklist

- **Optimisations** :
  - Permission check dans JWT payload (< 1ms, pas de DB query)
  - `useMemo` pour filtre navigation (évite re-calculs)
  - `useCallback` pour hasPermission (évite re-création fonction)
  - React Query cache users (invalidation après mutations)

- **Sécurité** :
  - Double validation : Frontend masque boutons + Backend bloque API (403)
  - Admin lockout prevention (validations strictes)
  - Audit trail avec SET NULL (pas de cascade delete sur users)
  - Permissions custom stockées en JSON (pas de table séparée pour MVP)

- **UX pensée pour administration** :
  - Badges colorés pour reconnaissance visuelle rapide des rôles
  - Confirmations avant actions critiques (désactivation, changement rôle)
  - Toasts informatifs partout
  - Page Users accessible uniquement aux admins
  - Layout sidebar affiche rôle actuel pour contexte

### Notes de migration

⚠️ **Breaking Change** : Structure de base de données modifiée (ajout `role`, `permissions` dans `users`, audit trail sur 11 tables)

#### Migration automatique recommandée :

**Option 1 - Reset complet avec données de test** (recommandé pour développement) :
```batch
scripts\reset-database.bat
```
Crée automatiquement :
- Compte admin : admin / admin (role: admin)
- Données de test complètes

**Option 2 - Migration manuelle** (conservation compte existant) :

1. **Backend en cours d'exécution** :
   - FastAPI détectera les nouvelles colonnes
   - Colonnes ajoutées automatiquement avec valeurs par défaut :
     - `users.role` → 'consultation' (ou promouvoir premier user en admin manuellement)
     - `users.permissions` → NULL
     - Audit trail → NULL (acceptable car nullable=True)

2. **Promouvoir premier utilisateur en admin** (SQL manuel) :
   ```sql
   UPDATE users SET role = 'admin' WHERE id = (SELECT MIN(id) FROM users);
   ```

3. **Important** : Les mouvements existants auront `created_by = NULL` (acceptable)

#### Script de migration Mouvement.created_by (si nécessaire)

Si vous avez des mouvements avec `created_by` String (ancien format username), utiliser :
```python
# backend/migrate_mouvements.py (voir docs/migrations/)
python backend/migrate_mouvements.py
```

### Tests effectués

✅ **Backend (via Swagger UI)** :
- Création de 4 utilisateurs avec différents rôles
- Validation transitions permissions (403 si non autorisé)
- Admin change rôle d'un gestionnaire → OK
- Gestionnaire tente accès /api/users → 403 FORBIDDEN
- Technicien crée mouvement → OK
- Technicien tente créer article → 403 FORBIDDEN
- Consultation lecture seule → Tous POST/PUT/DELETE bloqués (403)
- Validation admin lockout : Impossible de changer propre rôle (400)
- Validation admin lockout : Impossible de désactiver dernier admin (400)
- Audit trail : Articles créés ont `created_by` = user.id

✅ **Frontend** :
- Badge rôle affiché dans sidebar avec bonne couleur
- Navigation filtrée : Lien "Utilisateurs" visible seulement pour admin
- Rendering conditionnel : Boutons masqués selon permissions
- Page Users : Création utilisateur → Toast succès
- Changement rôle : Modal → Mutation → Badge couleur change
- Permissions custom : Checkboxes → Sauvegarde → Toast succès
- Désactivation : Confirmation → Statut "Inactif" affiché
- Dashboard : Admin voit 5 boutons, Consultation voit 0 boutons

✅ **Intégration** :
- Admin crée article → created_by = admin.id
- Gestionnaire modifie article → updated_by = gestionnaire.id
- Technicien tente modifier article → Bouton masqué frontend + 403 backend
- Token JWT contient user_id, role, exp
- `/api/auth/me` retourne permissions calculées (custom + defaults)

### Améliorations futures prévues (v1.7.0)

- Refresh tokens pour invalidation immédiate après changement rôle
- Token blacklist pour forcer logout utilisateurs modifiés
- Logs d'audit (qui a fait quoi, quand)
- Interface admin pour visualiser historique des modifications (created_by/updated_by)

---

## [1.5.0] - 2026-02-11

### Ajouté

#### Backend
- **Système de gestion des commandes fournisseurs** :
  - Nouveau modèle `Commande` avec workflow d'états : **BROUILLON → ENVOYEE → RECUE / ANNULEE**
  - Nouveau modèle `LigneCommande` pour les articles commandés (quantité, prix unitaire, montant)
  - Relation many-to-one vers `Fournisseur` avec contrainte `ondelete="RESTRICT"`
  - Relation one-to-many vers `LigneCommande` avec cascade delete
  - Champs : numero_commande (unique), statut, dates (commande, réception prévue/réelle), montant_total, notes
  - Propriété calculée `montant_ligne` dans LigneCommande (quantité × prix unitaire)
  - Contraintes CHECK : `statut IN ('BROUILLON', 'ENVOYEE', 'RECUE', 'ANNULEE')`, `montant_total ≥ 0`

- **Nouveaux endpoints API** pour les commandes (`/api/commandes`) :
  - `GET /` : Liste toutes les commandes avec pagination (skip, limit)
  - `GET /{id}` : Récupère une commande complète avec lignes
  - `POST /` : Crée une commande en statut BROUILLON
  - `PUT /{id}` : Modifie une commande (seulement si BROUILLON)
  - `DELETE /{id}` : Supprime une commande (seulement si BROUILLON)
  - `POST /{id}/envoyer` : Passe une commande de BROUILLON à ENVOYEE
  - `POST /{id}/recevoir` : Passe une commande de ENVOYEE à RECUE + **mise à jour automatique du stock**
  - `POST /{id}/annuler` : Passe une commande à ANNULEE (seulement si BROUILLON ou ENVOYEE)
  - `GET /{id}/pdf` : Génère et télécharge un bon de commande PDF

- **Mise à jour automatique du stock** :
  - Fonction `recevoir_commande()` dans CRUD :
    - Met à jour `quantite_recue` pour chaque ligne de commande
    - Incrémente `article.quantite` automatiquement
    - Crée un mouvement de stock **ENTREE** pour chaque ligne
    - Définit `date_reception_reelle` à la date actuelle
  - Transaction atomique : rollback complet en cas d'erreur

- **Génération de PDF pour bons de commande** :
  - Nouvelle fonction `export_commande_pdf()` dans `services/export_service.py`
  - Format professionnel avec :
    - En-tête avec titre "BON DE COMMANDE" et numéro de commande
    - Informations fournisseur (nom, contact, email, téléphone, adresse)
    - Tableau des lignes : Article, Référence, Quantité, Prix unitaire, Montant
    - Total général en gras
    - Dates de commande et réception prévue
    - Notes de commande
  - Couleur d'en-tête : Bleu (#007bff) cohérent avec l'icône ShoppingCart

- **Validations workflow** :
  - Transitions d'états strictes : BROUILLON → ENVOYEE → RECUE
  - Annulation possible uniquement si BROUILLON ou ENVOYEE
  - Modification/suppression bloquée si statut ≠ BROUILLON
  - Validation montant_total ≥ 0
  - Validation numero_commande unique

#### Frontend
- **Page Commandes** (`pages/Commandes.jsx`) :
  - Liste complète avec tableau : N° Commande, Fournisseur, Date commande, Date réception, Montant, Statut, Actions
  - **Badges de statut colorés** :
    - BROUILLON : Gris (#6c757d)
    - ENVOYEE : Bleu (#007bff)
    - RECUE : Vert (#28a745)
    - ANNULEE : Rouge (#dc3545)
  - **Filtres** :
    - Statut (Tous, Brouillon, Envoyée, Reçue, Annulée)
    - Fournisseur (dropdown)
  - **Actions conditionnelles selon statut** :
    - BROUILLON : Modifier, Envoyer, Supprimer
    - ENVOYEE : Télécharger PDF, Recevoir (+ mise à jour stock), Annuler
    - RECUE : Télécharger PDF uniquement
    - ANNULEE : Télécharger PDF uniquement
  - Pagination (10 commandes/page)
  - Modals de confirmation pour actions critiques (envoyer, recevoir, annuler, supprimer)

- **Page Nouvelle Commande** (`pages/NouvelleCommande.jsx`) :
  - **Système de panier** pour construction de commande :
    - Sélection fournisseur (requis)
    - Génération automatique du numéro de commande (timestamp)
    - Date de réception prévue (date picker)
    - Notes de commande (textarea)
  - **Gestion des lignes de commande** :
    - Sélection article (dropdown avec recherche)
    - Quantité à commander (input number)
    - Prix unitaire **pré-rempli automatiquement** depuis `article.prix_fournisseur`
    - Montant ligne calculé automatiquement (quantité × prix)
    - Tableau des lignes du panier avec colonnes : Article, Quantité, Prix unitaire, Montant, Actions
    - Boutons : Modifier ligne, Supprimer ligne
  - **Calcul automatique du total** :
    - Total calculé avec `useMemo` (somme des montants de toutes les lignes)
    - Affiché en gras sous le tableau
  - **Validations** :
    - Fournisseur requis
    - Au moins 1 ligne de commande
    - Quantité > 0 pour chaque ligne
    - Prix unitaire ≥ 0 pour chaque ligne
  - Bouton "Créer la commande" avec loader pendant soumission

- **Service API** (`services/commandeService.js`) :
  - `getCommandes(filters)` : Récupère commandes avec filtres optionnels
  - `getCommande(id)` : Récupère une commande
  - `createCommande(data)` : Crée une commande
  - `updateCommande(id, data)` : Modifie une commande
  - `deleteCommande(id)` : Supprime une commande
  - `envoyerCommande(id)` : Envoie une commande
  - `recevoirCommande(id)` : Réceptionne une commande
  - `annulerCommande(id)` : Annule une commande
  - `downloadPDF(id)` : Télécharge le PDF avec authentification JWT

- **Intégration dans ArticleForm** :
  - Affichage du champ `prix_fournisseur` dans la section Fournisseurs
  - Message informatif : "Prix utilisé par défaut lors de la création de commandes"
  - Validation prix_fournisseur ≥ 0

- **Navigation** :
  - Lien "Commandes" dans Layout avec icône `ShoppingCart` (lucide-react)
  - Routes : `/commandes` (liste) et `/commandes/nouvelle` (création)

#### Scripts et données de test
- **Script de seeding de base de données** (`backend/seed_database.py`) :
  - Fonction `clear_database()` : Supprime toutes les données existantes
  - Fonction `seed_database()` : Crée données de test complètes
  - **Données créées** :
    - 1 utilisateur (admin/admin)
    - 8 catégories hiérarchiques
    - 5 tags
    - 3 fournisseurs
    - 10 emplacements (2 zones, 3 étagères, 5 boîtes)
    - 10 articles avec tags, fournisseurs, et prix_fournisseur
    - 10 mouvements de stock

- **Scripts Windows** :
  - `scripts/reset-database.bat` : Supprime database + recrée avec données de test
  - `scripts/seed-database.bat` : Ajoute données de test sans supprimer
  - Documentation dans `scripts/README.md`

### Modifié

#### Backend
- `models.py` : Ajout des classes `Commande` et `LigneCommande` (lignes 320-380)
- `schemas.py` : Ajout de 8 nouveaux schémas Pydantic pour commandes et lignes
  - `CommandeBase`, `CommandeCreate`, `CommandeUpdate`, `CommandeResponse`
  - `LigneCommandeBase`, `LigneCommandeCreate`, `LigneCommandeUpdate`, `LigneCommandeResponse`
  - `PaginatedCommandes` pour pagination
  - `CommandeResponse.model_rebuild()` pour références récursives
- `crud.py` : Ajout de 8 fonctions CRUD complètes (lignes 1997+)
  - `get_commande()`, `get_commandes()`, `create_commande()`, `update_commande()`, `delete_commande()`
  - `envoyer_commande()`, `recevoir_commande()`, `annuler_commande()`
- `routers/commandes.py` : **NOUVEAU** router complet avec 10 endpoints
- `services/export_service.py` : Ajout fonction `export_commande_pdf()` (lignes 1061-1226)
- `main.py` : Enregistrement du router commandes avec préfixe `/api/commandes`

#### Frontend
- `App.jsx` : Ajout des routes `/commandes` et `/commandes/nouvelle`
- `components/layout/Layout.jsx` : Ajout lien navigation "Commandes"
- `components/articles/ArticleForm.jsx` : Affichage du champ `prix_fournisseur`

### Technique

- **Workflow à états** :
  - Machine à états stricte avec transitions validées
  - Blocage des actions non autorisées selon le statut
  - Traçabilité complète avec dates de transition

- **Optimisations** :
  - `joinedload()` pour charger lignes et fournisseur en 1 requête
  - React Query cache les commandes
  - `useMemo` pour calcul du total côté client (évite re-calculs inutiles)
  - Pagination backend pour grandes listes

- **UX améliorée** :
  - Panier de commande intuitif (pattern e-commerce)
  - Pré-remplissage automatique du prix depuis l'article
  - Actions conditionnelles pour éviter erreurs utilisateur
  - Confirmations avant actions critiques (envoyer, recevoir, annuler)
  - Feedback immédiat avec toasts

- **Sécurité** :
  - Validation stricte des transitions d'états
  - Téléchargement PDF authentifié avec JWT
  - Contraintes CHECK en base de données
  - Validations Pydantic côté backend

- **Intégration stock** :
  - Réception automatique crée mouvements ENTREE
  - Quantités before/after tracées dans mouvements
  - Transaction atomique pour cohérence des données

### Tests effectués

✅ **Backend (via Swagger UI)** :
- Création de commande en BROUILLON avec lignes
- Envoi de commande (BROUILLON → ENVOYEE)
- Réception de commande avec mise à jour stock automatique (ENVOYEE → RECUE)
- Annulation de commande (BROUILLON/ENVOYEE → ANNULEE)
- Validation transitions d'états (blocages si statut incorrect)
- Génération PDF avec toutes les informations
- Filtres par statut et fournisseur_id
- Pagination avec skip/limit

✅ **Frontend** :
- Page Commandes : Affichage, filtres, pagination, badges colorés
- Actions conditionnelles selon statut (boutons affichés/cachés)
- Création de commande : Panier, ajout/modification/suppression lignes
- Calcul automatique du total
- Pré-remplissage prix_fournisseur depuis article
- Confirmations modals pour actions critiques
- Téléchargement PDF avec authentification
- Toasts de succès/erreur
- Navigation et liens cliquables

✅ **Intégration** :
- Stock mis à jour correctement après réception
- Mouvements ENTREE créés automatiquement
- Validation workflow (impossible de modifier/supprimer commande envoyée)
- Seeding database fonctionne sans erreur

### Notes de migration

⚠️ **Breaking Change** : Structure de base de données modifiée (ajout tables `commandes` et `lignes_commande`)

Pour migrer depuis v1.4.0 :
1. **Option 1 - Reset complet** (recommandé pour tests) :
   ```batch
   scripts\reset-database.bat
   ```
   Crée un compte admin/admin + données de test complètes

2. **Option 2 - Conservation des données** :
   - Arrêter le serveur backend
   - Supprimer `backend/database/inventaire.db`
   - Redémarrer le serveur (tables créées automatiquement)
   - **Attention** : Toutes les données existantes seront perdues

**Important** : En production, utiliser un outil de migration SQL (Alembic) pour préserver les données.

---

## [1.4.0] - 2026-02-11

### Ajouté

#### Frontend
- **Vue Plan d'atelier** (nouvelle page `/plan-atelier`) :
  - Visualisation hiérarchique complète à 3 niveaux (Zone → Étagère → Boîte)
  - **4 cartes statistiques colorées** : Zones, Étagères, Boîtes, Articles stockés
  - **Arbre visuel interactif** avec expansion/réduction des zones
  - **Badges de remplissage colorés** :
    - Vert (< 70%), Orange (70-89%), Rouge (≥ 90%)
    - Affichage pourcentage + quantité utilisée / capacité max
    - Support "Illimité" pour emplacements sans capacité définie
  - **Barre de recherche temps réel** : Filtre zones, étagères, boîtes par code ou description
  - **Boutons Développer/Réduire tout** pour navigation rapide
  - **Actions par emplacement** :
    - Téléchargement QR code direct (bouton QR Code)
    - Navigation vers articles de l'emplacement (bouton Package)
  - **Indentation visuelle** :
    - Zones : Fond gris, icône Warehouse, bordure gauche cyan
    - Étagères : Fond blanc, icône Layers, indent 2rem
    - Boîtes : Fond gris clair, icône Box, indent 4rem
  - **Empty state** informatif si aucun emplacement
  - Responsive design complet (grilles adaptatives)

- **Filtre "Sans emplacement"** dans page Articles :
  - Nouveau select emplacement avec option "📍 Sans emplacement"
  - Permet de filtrer rapidement les articles non rangés
  - Facilite l'organisation progressive de l'atelier
  - Réinitialisation automatique de la pagination lors du filtre

#### Backend
- **Support filtre `emplacement_id='null'`** dans `/api/articles` :
  - Nouveau paramètre `emplacement_id` dans endpoint GET articles
  - Gestion spéciale de la valeur `'null'` pour articles sans emplacement
  - Query SQL optimisée : `emplacement_id IS NULL` pour performance
  - Documentation Swagger mise à jour

### Modifié

#### Backend
- `crud.py` (ligne 343) : Type `emplacement_id` étendu à `Union[int, str]`
- `crud.py` (lignes 410-415) : Logique filtre emplacement avec gestion `'null'`
- `routers/articles.py` (ligne 36) : Ajout paramètre `emplacement_id` avec description
- `routers/articles.py` (lignes 73-84) : Conversion et validation `emplacement_id`
- Import `Union` ajouté dans `crud.py` pour type hints

#### Frontend
- `App.jsx` : Ajout route `/plan-atelier` avec import PlanAtelier
- `Layout.jsx` : Ajout lien navigation "Plan d'atelier" avec icône Warehouse
- `Articles.jsx` :
  - Import `getEmplacements` depuis emplacementService
  - États `selectedEmplacement` et `showSansEmplacement`
  - Query emplacements pour alimenter select
  - Select emplacement dans filtres (après fournisseurs)
  - Passage `emplacement_id` à query articles
  - Gestion intelligente valeur 'sans' vs ID numérique

### Technique

- **Architecture flexible** : Option A (Vue en arbre visuel) adoptée
  - Pas de positionnement manuel nécessaire
  - S'adapte automatiquement à l'organisation évolutive
  - Support organisation incrémentale (zones génériques → affinage progressif)
  - Aucune contrainte spatiale vs carte 2D

- **Optimisations** :
  - Query tree utilise `joinedload(children).joinedload(children)` pour charger 3 niveaux en 1 requête
  - Recherche côté client avec useMemo pour performance
  - États d'expansion maintenus en mémoire (pas de re-render inutiles)

- **UX pensée pour organisation évolutive** :
  - Articles peuvent exister sans emplacement (nullable)
  - Filtrage immédiat des articles non classés
  - Zones temporaires possibles ("À classer", "En réparation")
  - Réorganisation facile (édition parent_id)

### Tests effectués

✅ **Frontend** :
- Vue Plan d'atelier : Affichage arbre 3 niveaux
- Statistiques : Comptage zones, étagères, boîtes, articles
- Recherche : Filtre temps réel sur codes et descriptions
- Expand/Collapse : Fonctionnement des boutons et clicks
- Badges remplissage : Couleurs correctes selon pourcentage
- QR codes : Téléchargement direct depuis Plan d'atelier
- Navigation : Liens vers articles d'un emplacement
- Filtre Articles : Option "Sans emplacement" fonctionnelle
- Responsive : Grilles statistiques adaptatives

✅ **Backend** :
- Filtre `emplacement_id=null` : Retourne articles sans emplacement
- Filtre `emplacement_id=123` : Retourne articles de l'emplacement 123
- Validation : Ignore valeurs invalides sans erreur
- Documentation : Swagger UI à jour avec nouveau paramètre

---

## [1.3.1] - 2026-02-11

### Ajouté

#### Backend
- **Exports de données de référence (Fournisseurs, Tags, Emplacements)** :
  - 6 nouvelles fonctions d'export dans `services/export_service.py` :
    - `export_fournisseurs_csv()` : Liste complète des fournisseurs (8 colonnes)
    - `export_fournisseurs_pdf()` : Rapport PDF avec header violet (#6f42c1)
    - `export_tags_csv()` : Liste des tags avec nombre d'articles associés
    - `export_tags_pdf()` : Rapport PDF avec header orange (#fd7e14)
    - `export_emplacements_csv()` : Liste des emplacements avec capacité et % remplissage
    - `export_emplacements_pdf()` : Rapport PDF avec header cyan (#17a2b8)
  - Format CSV : Délimiteur `;` avec encoding UTF-8
  - Format PDF : Tables avec alternance de couleurs de lignes, totaux affichés

- **Nouveaux endpoints API** pour les exports (`/api/rapports`) :
  - `GET /export/fournisseurs-{format}` : Export fournisseurs (csv ou pdf)
  - `GET /export/tags-{format}` : Export tags avec `joinedload(Tag.articles)` pour comptage
  - `GET /export/emplacements-{format}` : Export emplacements avec `joinedload(parent, articles)`

#### Frontend
- **Scan de codes-barres d'articles** (extension ScanQRCode) :
  - Détection automatique du type de code : QR code emplacement vs code-barres article
  - Recherche d'article par SKU après scan de code-barres
  - Affichage complet de l'article scanné :
    - Grille d'informations : Quantité, Prix, Catégorie, Emplacement
    - Indicateur de stock bas avec alerte visuelle ⚠️
    - Valeur totale calculée (quantité × prix)
    - Photo de l'article (si disponible)
    - Tags avec badges colorés
    - Description complète
  - Boutons d'action : "Voir les détails", "Historique des mouvements", "Scanner un autre code"
  - Page "Article introuvable" si SKU n'existe pas
  - Support de 2 modes de scan : lecteur physique (clavier) et caméra

- **Action rapide Dashboard pour les emplacements** :
  - Bouton "Créer un emplacement" dans la section "Actions rapides"
  - Style cyan (#17a2b8) cohérent avec l'icône MapPin
  - Modal avec EmplacementForm pour création rapide
  - Mutation React Query avec invalidation des caches `emplacements`, `emplacements-racines`, `emplacements-tree`
  - Toast de confirmation après création

- **Section Exports réorganisée** (page Rapports) :
  - **Avant** : 10 cartes séparées en grille (layout brouillon)
  - **Après** : Tableau structuré avec 7 lignes de données + 1 séparateur
  - Colonnes : Type de données | Description | Formats disponibles
  - Séparateur visuel : "📚 Données de référence" (ligne gris clair)
  - Boutons CSV et PDF groupés sur la même ligne pour chaque type de données
  - Icônes colorées maintenues : 🚚 violet (fournisseurs), 🏷️ orange (tags), 📍 cyan (emplacements)

- **Services frontend** :
  - `rapportService.js` : Ajout de 3 fonctions d'export
    - `exportFournisseurs(format)` : Download CSV ou PDF fournisseurs
    - `exportTags(format)` : Download CSV ou PDF tags
    - `exportEmplacementsData(format)` : Download CSV ou PDF emplacements
  - Pattern consistant : Blob API + `window.URL.createObjectURL()` + auto-download

### Modifié

#### Backend
- `services/export_service.py` : Ajout de 6 fonctions d'export (lignes 843-1058)
- `routers/rapports.py` : Ajout de 3 endpoints GET pour exports de référence (lignes 355-438)
- Optimisation requêtes : `joinedload()` pour éviter N+1 queries lors des exports

#### Frontend
- `pages/ScanQRCode.jsx` : Extension complète du support des codes-barres d'articles
  - Ajout détection automatique du type de code
  - Ajout affichage complet de l'article scanné (lignes 332-539)
  - Gestion des états `articleSku` et `articleData`
  - Query conditionnelle pour recherche d'article par SKU
- `pages/Dashboard.jsx` : Ajout bouton "Créer un emplacement" dans Actions rapides
- `pages/Rapports.jsx` : Refactoring complet de la section Exports (lignes 509-700)
  - Remplacement grille de 10 cartes par tableau structuré
  - Amélioration lisibilité et organisation
- `services/rapportService.js` : Ajout de 3 fonctions d'export (lignes 126-184)

### Technique

- **Optimisations** :
  - Exports utilisent `joinedload()` pour précharger relations (tags.articles, emplacements.parent/articles)
  - React Query met en cache les données d'articles scannés
  - Invalidation ciblée des caches après création d'emplacement

- **UX améliorée** :
  - Section Exports plus claire et moins encombrée (-30% d'espace vertical)
  - Scan de codes-barres avec affichage riche de l'article (photo, tags, emplacement)
  - Création rapide d'emplacements depuis le Dashboard (raccourci workflow)
  - Messages informatifs clairs (stock bas, article introuvable)

- **Détection intelligente de codes** :
  - QR code emplacement : Format `emplacement:ID:CODE` → Affiche articles de l'emplacement
  - Code-barres article : Format libre (SKU) → Recherche et affiche l'article

### Tests effectués

✅ **Backend** :
- Exports CSV fournisseurs, tags, emplacements (délimiteur `;`, encoding UTF-8)
- Exports PDF avec headers colorés et totaux
- Requêtes optimisées avec `joinedload()` (1 query au lieu de N+1)

✅ **Frontend** :
- Scan QR code emplacement → Affiche articles
- Scan code-barres article → Affiche détails article
- Création d'emplacement depuis Dashboard → Modal + Toast
- Tableau Exports responsive et organisé
- Téléchargement CSV/PDF pour fournisseurs, tags, emplacements

---

## [1.3.0] - 2026-02-10

### Ajouté

#### Backend
- **Système de gestion de fournisseurs pour les articles**
  - Nouveau modèle `Fournisseur` avec champs : nom (unique), contact, email, téléphone, adresse, site_web, description
  - Relation **many-to-many** entre `Article` et `Fournisseur` via table d'association `article_fournisseurs`
  - **3 nouveaux champs globaux dans Article** (Option A - champs globaux) :
    - `prix_fournisseur` (Float, nullable) : Prix d'achat chez le fournisseur
    - `ref_fournisseur` (String 50, nullable) : Référence produit chez le fournisseur
    - `delai_livraison` (Integer, nullable) : Délai de livraison en jours
  - Contraintes CHECK : `prix_fournisseur ≥ 0 OR NULL`, `delai_livraison ≥ 0 OR NULL`

- **Nouveaux endpoints API** pour les fournisseurs (`/api/fournisseurs`) :
  - `GET /` : Liste tous les fournisseurs
  - `GET /{id}` : Récupère un fournisseur
  - `POST /` : Crée un fournisseur (validation unicité du nom)
  - `PUT /{id}` : Modifie un fournisseur
  - `DELETE /{id}` : Supprime un fournisseur (bloque si articles associés)
  - `POST /{id}/articles/{article_id}` : Associe un fournisseur à un article
  - `DELETE /{id}/articles/{article_id}` : Dissocie un fournisseur d'un article
  - `GET /{id}/articles` : Liste les articles d'un fournisseur

- **Validations backend** :
  - Nom fournisseur **unique** (validation lors de create et update)
  - Email : Validation via regex Pydantic
  - Site web : Validation URL via regex Pydantic (`^https?://`)
  - Suppression bloquée si le fournisseur est associé à des articles (HTTPException 400)

- **Filtre par fournisseur** :
  - Nouveau paramètre `fournisseur_id` dans `GET /api/articles`
  - Retourne uniquement les articles associés au fournisseur spécifié

#### Frontend
- **Composant FournisseurInput** (`components/fournisseurs/FournisseurInput.jsx`) :
  - Multi-select de fournisseurs avec badges **gris neutres** (différent des tags colorés)
  - Création inline de fournisseur rapide (nom, email, téléphone)
  - Sélection/désélection avec icône X
  - Auto-sélection après création inline
  - Basé sur le pattern TagInput mais adapté pour les fournisseurs

- **Page Fournisseurs** (`pages/Fournisseurs.jsx`) :
  - CRUD complet avec tableau affichant : Nom, Contact, Email, Téléphone, Créé le, Actions
  - Liens **cliquables** : `mailto:` pour email, `tel:` pour téléphone
  - Modal de création/édition avec FournisseurForm
  - Confirmation avant suppression avec message d'avertissement (échec si articles associés)
  - Empty state avec icône camion 🚚
  - Lien de navigation dans Layout avec icône `Truck` (lucide-react)

- **FournisseurForm** (`components/fournisseurs/FournisseurForm.jsx`) :
  - Formulaire complet avec 7 champs : nom (requis), contact, email, téléphone, adresse, site_web, description
  - Validation côté client :
    - Email : Regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
    - Site web : Validation `new URL()` + message d'erreur informatif
  - Nettoyage des données : null au lieu de chaînes vides pour champs optionnels

- **Intégration dans ArticleForm** :
  - Section "Fournisseurs" avec FournisseurInput
  - **Champs conditionnels** affichés uniquement si `fournisseur_ids.length > 0` :
    - Prix fournisseur (validation ≥ 0)
    - Référence fournisseur (maxLength 50)
    - Délai livraison en jours (validation ≥ 0)
  - Pré-remplissage des fournisseurs lors de l'édition d'un article
  - Validation et parsing des champs (conversion en Float/Integer)

- **Intégration dans page Articles** :
  - **Filtre par fournisseur** : Dropdown avec liste des fournisseurs
  - **Badges fournisseurs** affichés dans la colonne Tags :
    - Badges gris avec icône camion 🚚
    - Affichés sous les tags colorés
    - Pattern : `🚚 {nom_fournisseur}`

- **Service API** (`services/fournisseurService.js`) :
  - `getFournisseurs()` : Récupère tous les fournisseurs
  - `getFournisseur(id)` : Récupère un fournisseur
  - `createFournisseur(data)` : Crée un fournisseur
  - `updateFournisseur(id, data)` : Modifie un fournisseur
  - `deleteFournisseur(id)` : Supprime un fournisseur
  - Fonctions d'association : `addFournisseurToArticle()`, `removeFournisseurFromArticle()`, `getArticlesByFournisseur()`

#### Styles
- **FournisseurInput.css** avec styles cohérents :
  - Badges gris neutres (#e0e0e0) non sélectionnés, bleu (#007bff) quand sélectionnés
  - Formulaire inline avec grille responsive (2 colonnes desktop, 1 colonne mobile)
  - Bouton "Créer un fournisseur" avec bordure pointillée (pattern identique aux tags)
  - Animations hover avec `transform: translateY(-1px)`

### Modifié

#### Backend
- `models.py` :
  - Ajout table d'association `article_fournisseurs` (ligne 170)
  - Ajout classe `Fournisseur` avec 8 colonnes + timestamps
  - Modification `Article` : Relation `fournisseurs` + 3 nouveaux champs optionnels
  - **BUGFIX CRITIQUE** (ligne 94) : Changé `secondary=article_fournisseurs` → `secondary="article_fournisseurs"` (référence par string pour éviter NameError)

- `schemas.py` :
  - Ajout schémas Pydantic : `FournisseurBase`, `FournisseurCreate`, `FournisseurUpdate`, `FournisseurResponse`
  - Validator pour `site_web` avec regex URL
  - Modification `ArticleBase` : Ajout prix_fournisseur, ref_fournisseur, delai_livraison
  - Modification `ArticleCreate` : Ajout `fournisseur_ids: list[int]`
  - Modification `ArticleUpdate` : Ajout `fournisseur_ids` + 3 champs optionnels
  - Modification `ArticleResponse` : Ajout `fournisseurs: list[FournisseurResponse]`

- `crud.py` :
  - Ajout CRUD fournisseurs (9 fonctions) : `get_fournisseur`, `get_fournisseur_by_nom`, `get_fournisseurs`, `create_fournisseur`, `update_fournisseur`, `delete_fournisseur`, `add_fournisseur_to_article`, `remove_fournisseur_from_article`, `get_articles_by_fournisseur`
  - Modification `get_article()` : Ajout `.options(joinedload(models.Article.fournisseurs))` pour éviter N+1
  - Modification `get_articles()` : Ajout paramètre `fournisseur_id` avec filtre SQL
  - Modification `create_article()` : Extraction et association `fournisseur_ids` (pattern identique tags)
  - Modification `update_article()` : Gestion `fournisseur_ids` avec `clear()` + `append()` pour mise à jour association

- `routers/fournisseurs.py` : **NOUVEAU** router complet avec 8 endpoints (structure identique à `tags.py`)

- `routers/articles.py` : Ajout paramètre `fournisseur_id` dans endpoint `GET /api/articles`

- `main.py` : Enregistrement du router fournisseurs avec préfixe `/api/fournisseurs`

#### Frontend
- `App.jsx` : Ajout route `/fournisseurs` avec `ProtectedRoute`
- `components/layout/Layout.jsx` : Ajout lien navigation "Fournisseurs" avec icône `Truck`
- `components/articles/ArticleForm.jsx` : Intégration FournisseurInput + champs conditionnels
- `pages/Articles.jsx` : Ajout filtre fournisseur + badges fournisseurs dans tableau

### Technique

- **Architecture** : Réutilisation du pattern Tags pour la relation many-to-many
  - Table d'association avec CASCADE delete
  - Schéma Pydantic avec `xxx_ids` en input, `xxxs: list[XxxResponse]` en output
  - CRUD avec `joinedload()` pour optimisation SQL

- **Décision architecturale** : **Option A - Champs globaux**
  - Les champs `prix_fournisseur`, `ref_fournisseur`, `delai_livraison` sont dans la table `articles` (pas dans la table d'association)
  - Suppose un fournisseur principal par article
  - Simplifie le MVP v1.3.0 (évolution future possible vers Option B avec table d'association enrichie)

- **Optimisations** :
  - `joinedload(models.Article.fournisseurs)` évite les requêtes N+1
  - React Query met en cache les fournisseurs
  - Invalidation automatique des caches `['fournisseurs']` et `['articles']` après mutations

- **Sécurité** :
  - Validation stricte des emails et URLs côté backend ET frontend
  - Validation unicité du nom fournisseur
  - Blocage de la suppression si associations existent
  - Contraintes CHECK en base de données pour prix et délai

- **UX** :
  - Feedback immédiat avec toasts react-toastify
  - Champs conditionnels pour éviter la surcharge d'informations
  - Badges visuellement distincts (gris pour fournisseurs, colorés pour tags)
  - Liens cliquables pour email et téléphone (améliore l'utilisabilité)

### Corrections de bugs

- **BUGFIX CRITIQUE** : `NameError: name 'article_fournisseurs' is not defined`
  - **Cause** : Dans `models.py`, la relation `Article.fournisseurs` utilisait `secondary=article_fournisseurs` (référence variable) alors que la table était définie APRÈS la classe Article
  - **Fix** : Changement en `secondary="article_fournisseurs"` (référence par string)
  - **Impact** : Empêchait totalement la création de fournisseurs (erreur 500 sur POST /api/fournisseurs)
  - **Localisation** : `backend/app/models.py` ligne 94

### Notes de migration

⚠️ **Breaking Change** : Structure de base de données modifiée (ajout table `fournisseurs` et `article_fournisseurs`, modification table `articles`)

Pour migrer depuis v1.2.0 :
1. Arrêter le serveur backend
2. Supprimer `backend/database/inventaire.db`
3. Redémarrer le serveur (la DB sera recréée automatiquement avec le nouveau schéma)
4. Recréer un utilisateur avec `/api/auth/register`

**Important** : Toutes les données précédentes seront perdues. En production, utiliser un outil de migration SQL (Alembic).

### Tests effectués

✅ **Backend (via Swagger UI)** :
- Création de fournisseurs avec tous les champs
- Validation unicité du nom
- Validation email et URL invalides
- Suppression bloquée si articles associés
- Association article ↔ fournisseur
- Filtre articles par fournisseur_id

✅ **Frontend** :
- Page Fournisseurs : CRUD complet fonctionnel
- FournisseurInput : Sélection/désélection, création inline
- ArticleForm : Champs conditionnels apparaissent/disparaissent correctement
- Articles : Filtre fournisseur, affichage badges gris
- Navigation : Lien "Fournisseurs" avec icône camion
- Liens mailto: et tel: cliquables

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

[1.5.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.5.0
[1.4.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.4.0
[1.3.1]: https://github.com/votre-repo/inventaire/releases/tag/v1.3.1
[1.3.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.3.0
[1.2.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.2.0
[1.1.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.1.0
[1.0.0]: https://github.com/votre-repo/inventaire/releases/tag/v1.0.0
