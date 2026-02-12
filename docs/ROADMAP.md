# ROADMAP - Application Inventaire d'Atelier

**Version actuelle** : v1.6.0
**Dernière mise à jour** : 2026-02-12

---

## 🎯 Vision Long Terme

Créer une application complète de gestion d'inventaire d'atelier avec :
- Gestion multi-sites et multi-utilisateurs
- Suivi avancé des stocks et mouvements
- Intégration fournisseurs et commandes
- Analytique et rapports détaillés
- Interface moderne et responsive
- Déploiement flexible (local, NAS, cloud)

---

## 📋 Versions Planifiées

### v1.2.0 - Gestion des Photos ✅ TERMINÉ

**Objectif** : Ajouter des photos aux articles pour identification visuelle

**Backend** :
- [x] Upload de fichiers images (PNG, JPG, WEBP)
- [x] Stockage organisé : `uploads/articles/{article_id}/`
- [x] Endpoint `POST /api/articles/{id}/photos` pour upload
- [x] Endpoint `DELETE /api/articles/{id}/photos/{photo_id}` pour suppression
- [x] Validation taille max (5MB par photo)
- [x] Génération de miniatures (thumbnails) avec Pillow
- [x] Nouveau modèle `Photo` avec relation many-to-one vers Article

**Frontend** :
- [x] Composant `PhotoUpload` avec drag & drop
- [x] Galerie photos dans ArticleForm (max 5 photos)
- [x] Affichage miniature dans liste articles
- [x] Lightbox pour visualisation plein écran
- [x] Indicateur de chargement pendant upload
- [x] Suppression avec confirmation

**Technique** :
- [x] Librairie : `python-multipart` pour FastAPI
- [x] Librairie : `Pillow` pour génération thumbnails
- [x] Frontend : Native HTML5 (drag & drop)
- [x] Stockage : Volume Docker persistant pour `uploads/`

**Terminé le** : 2026-02-10

---

### v1.3.0 - Système de Fournisseurs ✅ TERMINÉ

**Objectif** : Gérer les fournisseurs et liens avec articles

**Backend** :
- [x] Modèle `Fournisseur` : nom, contact, email, téléphone, adresse, site web, description
- [x] Relation many-to-many `Article ↔ Fournisseur` (table association `article_fournisseurs`)
- [x] Endpoints CRUD fournisseurs : `/api/fournisseurs` (8 endpoints)
- [x] Endpoint `/api/fournisseurs/{id}/articles` : articles d'un fournisseur
- [x] Champs optionnels dans Article : `prix_fournisseur`, `ref_fournisseur`, `delai_livraison`
- [x] Validation unicité nom, email, URL
- [x] Filtre `fournisseur_id` dans `GET /api/articles`

**Frontend** :
- [x] Page `Fournisseurs` avec CRUD complet
- [x] Composant `FournisseurForm` avec validation email/URL
- [x] Composant `FournisseurInput` : Multi-select avec création inline
- [x] Affichage badges fournisseurs dans liste articles
- [x] Filtre par fournisseur dans page Articles
- [x] Champs conditionnels dans ArticleForm (prix/ref/délai)

**Fonctionnalités avancées** (reportées à v1.5.0) :
- [ ] Historique des prix par fournisseur
- [ ] Comparaison de prix entre fournisseurs
- [ ] Export liste d'articles par fournisseur (pour commandes)

**Terminé le** : 2026-02-10

---

### v1.3.1 - Améliorations Exports et Scan ✅ TERMINÉ

**Objectif** : Ajouter exports de données de référence et étendre le système de scan

**Backend** :
- [x] Exports CSV/PDF pour Fournisseurs (8 colonnes, header violet)
- [x] Exports CSV/PDF pour Tags (avec comptage articles associés, header orange)
- [x] Exports CSV/PDF pour Emplacements (capacité et % remplissage, header cyan)
- [x] 3 nouveaux endpoints : `/api/rapports/export/fournisseurs-{format}`, `/api/rapports/export/tags-{format}`, `/api/rapports/export/emplacements-{format}`
- [x] Optimisation requêtes avec `joinedload()` pour éviter N+1 queries

**Frontend** :
- [x] **Scan de codes-barres d'articles** :
  - Détection automatique : QR code emplacement vs code-barres article
  - Recherche article par SKU après scan
  - Affichage complet article : quantité, prix, catégorie, emplacement, photo, tags
  - Indicateur stock bas avec alerte visuelle
  - Boutons actions : détails, historique mouvements, rescanner
- [x] **Action rapide Dashboard** : Bouton "Créer un emplacement" avec modal
- [x] **Section Exports réorganisée** : Tableau structuré (7 lignes + séparateur) au lieu de 10 cartes
- [x] Services frontend : `exportFournisseurs()`, `exportTags()`, `exportEmplacementsData()`

**UX** :
- [x] Layout Exports plus clair (-30% espace vertical)
- [x] Détection intelligente de codes (emplacement vs article)
- [x] Création rapide emplacements depuis Dashboard

**Terminé le** : 2026-02-11

---

### v1.4.0 - Emplacements Physiques ✅ TERMINÉ

**Objectif** : Gérer les emplacements physiques dans l'atelier avec visualisation complète

**Backend** :
- [x] Modèle `Emplacement` hiérarchique : Zone → Étagère → Boîte ✅
- [x] Champs : code, description, capacité_max, parent_id ✅
- [x] Relation Article → Emplacement (one-to-many) ✅
- [x] Validation : Un emplacement ne peut contenir plus que sa capacité ✅
- [x] Endpoints : `/api/emplacements/tree`, `/api/emplacements/{id}/articles` ✅
- [x] Exports CSV/PDF emplacements (complété en v1.3.1) ✅

**Frontend** :
- [x] Page Emplacements avec arbre hiérarchique (similaire à Catégories) ✅
- [x] Triple select cascadé dans ArticleForm : Zone → Étagère → Boîte ✅
- [x] **Vue "Plan d'atelier"** : Arbre visuel interactif à 3 niveaux avec stats et badges ✅
- [x] **Filtre "Sans emplacement"** dans page Articles ✅
- [x] Recherche d'articles par emplacement ✅
- [x] Indicateur de remplissage (% capacité utilisée) ✅

**Fonctionnalités avancées** :
- [x] Génération QR codes pour emplacements ✅
- [x] Scan QR code → Liste articles dans cet emplacement ✅
- [x] **Scan codes-barres articles** → Affichage détails article (complété en v1.3.1) ✅
- [x] Suggestions d'emplacements pour nouvel article (basé sur catégorie) ✅
- [x] Action rapide Dashboard pour créer emplacements (complété en v1.3.1) ✅

**État actuel** : 100% complet ✅

**Terminé le** : 2026-02-11

**Fonctionnalités livrées** :
- ✅ Système d'emplacements hiérarchiques complet (3 niveaux)
- ✅ Vue Plan d'atelier avec arbre visuel interactif
- ✅ Statistiques globales (zones, étagères, boîtes, articles)
- ✅ Badges de remplissage colorés (vert/orange/rouge)
- ✅ Recherche temps réel et navigation expand/collapse
- ✅ QR codes téléchargeables pour tous les emplacements
- ✅ Filtre "Sans emplacement" pour organisation progressive
- ✅ Support organisation flexible et évolutive

---

### v1.5.0 - Gestion des Commandes ✅ TERMINÉ

**Objectif** : Passer commandes fournisseurs depuis l'inventaire

**Backend** :
- [x] Modèle `Commande` : fournisseur_id, date, statut (BROUILLON, ENVOYEE, RECUE, ANNULEE)
- [x] Modèle `LigneCommande` : commande_id, article_id, quantite_commandee, quantite_recue, prix_unitaire
- [x] Endpoints CRUD commandes : `/api/commandes` (10 endpoints)
- [x] Workflow : BROUILLON → ENVOYEE → RECUE (crée mouvement ENTREE automatique)
- [x] Calcul automatique montant_total
- [x] Validation transitions d'états strictes
- [x] Propriété calculée `montant_ligne` dans LigneCommande

**Frontend** :
- [x] Page Commandes avec liste, filtres (statut, fournisseur), pagination
- [x] Page Nouvelle Commande : Système de panier pour construction commande
- [x] Sélection articles avec pré-remplissage prix_fournisseur
- [x] Calcul total automatique avec useMemo
- [x] Badges de statut colorés (gris/bleu/vert/rouge)
- [x] Actions conditionnelles selon statut (envoyer, recevoir, annuler)
- [x] Export PDF bon de commande avec authentification JWT
- [x] Confirmations modales pour actions critiques

**Fonctionnalités avancées** :
- [x] Téléchargement PDF bon de commande
- [x] Réception automatique avec mise à jour stock
- [x] Création mouvements ENTREE lors de réception
- [ ] Suggestions articles à commander (stock bas) - Reporté à v1.7.0
- [ ] Historique commandes par fournisseur - Reporté à v1.7.0
- [ ] Statistiques dépenses par mois/fournisseur - Reporté à v1.7.0

**État actuel** : 100% complet ✅

**Terminé le** : 2026-02-11

**Fonctionnalités livrées** :
- ✅ Workflow complet BROUILLON → ENVOYEE → RECUE / ANNULEE
- ✅ Système de panier pour construction commande
- ✅ Mise à jour automatique stock lors de réception
- ✅ Génération PDF bons de commande
- ✅ Filtres et pagination
- ✅ Script de seeding avec données de test

---

### v1.6.0 - Multi-Utilisateurs & Permissions ✅ TERMINÉ

**Objectif** : Support de plusieurs utilisateurs avec rôles et permissions granulaires

**Backend** :
- [x] Retirer limitation mono-utilisateur
- [x] Enum `RoleEnum` : Admin, Gestionnaire, Technicien, Consultation
- [x] Système de permissions granulaires `resource:action` avec wildcards
- [x] Middleware de permissions par endpoint (`require_permission()`)
- [x] Audit trail : created_by, updated_by sur 11 modèles
- [x] JWT enrichi avec user_id et role
- [x] Endpoints CRUD utilisateurs `/api/users` (6 endpoints)
- [x] Validations admin strictes (lockout prevention)
- [x] Permissions custom par utilisateur (champ JSON)

**Frontend** :
- [x] Page Utilisateurs (admin uniquement) avec CRUD complet
- [x] Badge rôle dans sidebar (violet/bleu/vert/gris)
- [x] Rendering conditionnel basé sur permissions (12 pages)
- [x] Navigation filtrée dynamiquement selon permissions
- [x] Hook `usePermissions` avec helpers (canCreate, canUpdate, canDelete)
- [x] Modals : Création user, Changement rôle, Permissions custom
- [x] 23+ permissions configurables par utilisateur

**Permissions** :
- **Admin** : Toutes permissions (`*:*`)
- **Gestionnaire** : CRUD articles, catégories, mouvements, commandes, fournisseurs, emplacements + export rapports
- **Technicien** : Lecture + créer mouvements de stock uniquement
- **Consultation** : Lecture seule sur toutes les ressources

**Architecture** :
- Hybrid Role Enum + JSON Permissions
- Role dans JWT (performance)
- Permissions custom override defaults
- Double validation frontend + backend

**État actuel** : 100% complet ✅

**Terminé le** : 2026-02-12

**Fonctionnalités livrées** :
- ✅ 4 rôles prédéfinis avec permissions claires
- ✅ Système permissions granulaires avec wildcards
- ✅ Interface admin pour gérer utilisateurs dynamiquement
- ✅ Audit trail sur 11 modèles (created_by/updated_by)
- ✅ JWT enrichi (user_id + role)
- ✅ Rendering conditionnel sur toutes les pages
- ✅ Permissions custom par utilisateur (23+ permissions)
- ✅ Validations admin lockout (impossible de se modifier soi-même)

---

### v1.7.0 - Dashboard Analytique Avancé (Priorité : BASSE) 🟢

**Objectif** : Enrichir le dashboard avec graphiques et insights

**Backend** :
- [ ] Endpoints statistiques avancés :
  - `/api/rapports/evolution-stock` : Évolution stock par mois
  - `/api/rapports/top-articles-sortis` : Articles les plus sortis
  - `/api/rapports/rotation-stock` : Taux de rotation par catégorie
  - `/api/rapports/valeur-par-emplacement` : Répartition valeur

**Frontend** :
- [ ] Librairie de charts : Chart.js ou Recharts
- [ ] Graphiques dashboard :
  - **Ligne** : Évolution valeur stock sur 12 mois
  - **Barres** : Top 10 articles sortis
  - **Camembert** : Répartition valeur par catégorie
  - **Jauge** : Taux de rotation moyen
- [ ] Filtres date range (7j, 30j, 6m, 1an)
- [ ] Export graphiques en PNG

**Estimation** : 3-4 jours

---

### v1.8.0 - Alertes Email Stock Bas (Priorité : MOYENNE) 🟡

**Objectif** : Alertes email automatiques pour stock critique avec fréquence configurable

**Backend** :
- [ ] **Configuration SMTP** :
  - Variables d'environnement : `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`
  - Validation configuration au démarrage (optionnel)
  - Support TLS/SSL
- [ ] **Système d'alertes stock bas** :
  - Détection articles avec `quantite < quantite_min`
  - Table `AlerteConfig` : email_destinataire, frequence (QUOTIDIEN/HEBDOMADAIRE), heure_envoi, actif
  - Scheduler (APScheduler) pour envoi automatique
  - Template email HTML avec liste articles en alerte
  - Historique envois (date dernière alerte par article)
- [ ] **Endpoints configuration** :
  - `GET /api/alertes/config` : Récupérer configuration actuelle
  - `PUT /api/alertes/config` : Modifier fréquence et destinataire
  - `POST /api/alertes/test` : Envoyer email de test immédiatement
  - `GET /api/alertes/historique` : Historique des envois

**Frontend** :
- [ ] **Page Paramètres (nouvelle)** :
  - Section "Alertes Email"
  - Formulaire configuration :
    - Email destinataire (validation format)
    - Fréquence : Radio buttons (Quotidien / Hebdomadaire)
    - Heure d'envoi (si quotidien) ou jour de la semaine (si hebdomadaire)
    - Toggle Activer/Désactiver
  - Bouton "Envoyer un test" avec feedback
  - Tableau historique des 10 derniers envois
- [ ] **Indicateur configuration** :
  - Badge dans navigation si alertes non configurées
  - Toast info au premier login admin

**Template Email** :
```html
Sujet: [Inventaire] ⚠️ Alertes Stock Bas - {date}

Bonjour,

{X} article(s) sont en dessous du seuil de stock minimum :

┌────────────────────────────────────────┐
│ Article           │ Stock │ Seuil │ Écart│
├────────────────────────────────────────┤
│ Vis inox 4x40mm  │   15  │  20   │  -5  │
│ Colle à bois 1L  │    2  │   3   │  -1  │
│ ...              │  ...  │  ...  │ ...  │
└────────────────────────────────────────┘

Actions recommandées :
→ Consulter l'inventaire complet : {URL}/articles?stock_bas=true
→ Passer une commande fournisseur : {URL}/commandes/nouvelle

---
Cet email est envoyé automatiquement selon la configuration ({frequence}).
```

**Fonctionnalités avancées (futures versions)** :
- [ ] Alertes pour article non bougé depuis X jours (v1.9.0)
- [ ] Notification commande fournisseur livrée (v1.9.0)
- [ ] Notifications in-app avec badge compteur (v1.9.0)
- [ ] Webhooks pour intégration Slack/Discord (v2.1.0)

**Estimation** : 4-5 jours

**Notes importantes** :
- Configuration SMTP simple (Gmail, Outlook, SMTP dédié)
- Pas de queue système (envoi direct lors du scheduler)
- Logs des envois pour debugging
- Gestion des erreurs SMTP avec retry (3 tentatives)

---

### v1.9.0 - Tests Complets & Sécurité Renforcée (Priorité : HAUTE) 🔴

**Objectif** : Assurer la qualité et la sécurité de l'application avec tests exhaustifs

📋 **Spécification technique détaillée** : [V1.9.0_TESTS_SECURITE.md](V1.9.0_TESTS_SECURITE.md)

**Backend - Tests** :
- [ ] **Tests unitaires (pytest)** :
  - Tous les CRUD (11 modèles × 4-5 fonctions = ~50 tests)
  - Fonctions de validation (hiérarchies, permissions, workflows)
  - Helpers et utilitaires (auth, exports, photos)
  - Objectif : 80% de couverture minimale
- [ ] **Tests d'intégration** :
  - Workflows complets (créer article → mouvement → stock mis à jour)
  - Gestion commandes (BROUILLON → ENVOYEE → RECUE + stock)
  - Authentification et permissions (25+ scénarios)
  - Upload photos et génération thumbnails
  - Exports CSV/PDF (contenu validé)
- [ ] **Tests de sécurité** :
  - Injection SQL (requêtes paramétrées)
  - XSS (validation inputs, échappement HTML)
  - CSRF (tokens, SameSite cookies)
  - Path traversal (uploads)
  - Rate limiting sur endpoints critiques
  - Validation JWT (expiration, signature, claims)
  - Tests de permissions (403 attendus)

**Frontend - Tests** :
- [ ] **Tests composants (React Testing Library)** :
  - Composants réutilisables (Modal, Loader, Pagination, etc.)
  - Formulaires (ArticleForm, CategorieForm, etc.)
  - Pages (Articles, Dashboard, etc.)
  - Objectif : Tous les composants critiques testés
- [ ] **Tests E2E (Playwright ou Cypress)** :
  - User journeys complets :
    - Login → Créer article → Ajouter photo → Mouvement → Logout
    - Login admin → Créer utilisateur → Changer rôle → Vérifier permissions
    - Scan QR code → Voir articles → Créer mouvement
  - Navigation et routing
  - Formulaires et validations
  - Filtres et recherche

**Sécurité Renforcée** :
- [ ] **HTTPS obligatoire en production** :
  - Redirection HTTP → HTTPS automatique
  - HSTS headers (Strict-Transport-Security)
  - Certificat SSL Let's Encrypt (auto-renew)
- [ ] **Rate Limiting** :
  - Librairie : slowapi (FastAPI)
  - Limites :
    - Login : 5 tentatives / 15 min
    - Création compte : 3 / heure
    - Endpoints POST/PUT/DELETE : 60 / min
    - Upload photos : 10 / min
- [ ] **Validation inputs renforcée** :
  - Sanitization HTML (bleach) pour champs texte
  - Validation stricte formats (email, URL, SKU)
  - Taille max tous les champs string (prévention DoS)
  - Validation MIME type ET contenu fichiers (magic bytes)
- [ ] **Audit & Logging** :
  - Logs structurés (JSON) avec contexte (user_id, action, timestamp)
  - Rotation automatique (max 30 jours, 100 MB par fichier)
  - Logs des échecs d'authentification (alerte après 10 échecs)
  - Monitoring des erreurs 500 (Sentry ou équivalent)
- [ ] **Backup automatisé** :
  - Script cron quotidien : backup database + uploads
  - Rétention : 7 backups quotidiens + 4 hebdomadaires + 12 mensuels
  - Compression (gzip) et stockage hors-site (S3, Backblaze, NAS)
  - Test de restauration mensuel (automatisé)
- [ ] **Secrets Management** :
  - Aucun secret hardcodé (scan avec detect-secrets)
  - Variables d'environnement obligatoires
  - Option : .env.vault (chiffrement) ou Doppler/Vault

**CI/CD** :
- [ ] **GitHub Actions** :
  - Workflow : Lint → Tests unitaires → Tests intégration → Build
  - Exécution sur : push, pull_request, release
  - Fail si couverture < 80% ou tests échouent
  - Build automatique images Docker sur tag release
- [ ] **Pre-commit hooks** :
  - Black (formatage Python)
  - ESLint + Prettier (formatage JS/React)
  - detect-secrets (scan secrets)
  - pytest sur fichiers modifiés

**Estimation** : 7-10 jours

**Livrables** :
- Rapport de couverture de tests (HTML + badge README)
- Rapport de sécurité (scan vulnérabilités dépendances)
- Documentation des workflows de test
- Guide de sécurité pour déploiement

---

### v2.0.0 - Application Mobile (Priorité : MOYENNE) 🟡

**Objectif** : Application mobile pour consultation et actions rapides en atelier

**Choix technologique** : **PWA (Progressive Web App)** recommandé
- Avantages : Même codebase React, pas de stores, déploiement immédiat
- Fonctionnalités natives : Caméra (QR/barcode), notifications push, mode hors-ligne

**Frontend - PWA** :
- [ ] **Configuration Service Worker** :
  - Stratégie cache : Network-first pour API, Cache-first pour assets
  - Mode hors-ligne : Stocker dernières données dans IndexedDB
  - Synchronisation en arrière-plan (Background Sync API)
- [ ] **Manifest.json** :
  - Icônes multiples résolutions (192x192, 512x512)
  - Thème couleur, splash screen
  - Orientation : portrait
  - Display : standalone
- [ ] **Interface mobile optimisée** :
  - Bottom navigation (accès rapide : Scan, Articles, Mouvements, Profil)
  - Boutons tactiles larges (min 44x44px)
  - Modals full-screen sur mobile
  - Pull-to-refresh pour listes
- [ ] **Fonctionnalités clés** :
  - Scan code-barres/QR codes avec caméra native (jsQR ou QuaggaJS)
  - Consultation stock en temps réel (mode connecté)
  - Création mouvements rapide (formulaire simplifié)
  - Notifications push (stock bas, commandes)
  - Mode hors-ligne : Consultation dernières données + sync à la reconnexion

**Backend - Support PWA** :
- [ ] **Web Push Notifications** :
  - VAPID keys pour push notifications
  - Endpoint `/api/push/subscribe` pour enregistrer device
  - Envoi notifs via FCM (Firebase Cloud Messaging) ou service équivalent
- [ ] **API optimisée mobile** :
  - Pagination par défaut (éviter gros payloads)
  - Compression Gzip/Brotli obligatoire
  - Headers Cache-Control appropriés

**Alternative : React Native** (si besoin natif pur)
- Avantages : Performances natives, accès APIs système avancées
- Inconvénients : 2 codebases (iOS + Android), déploiement stores complexe
- Estimation : +15 jours supplémentaires

**Estimation PWA** : 10-12 jours
**Estimation React Native** : 20-25 jours

**Fonctionnalités futures** :
- [ ] Géolocalisation pour mouvements (traçabilité lieu)
- [ ] Signature électronique pour réceptions commandes
- [ ] Mode multi-ateliers avec sélection emplacement actif

---

## 🔧 Améliorations Techniques

### Performance & Optimisation

- [ ] **Cache Redis** pour queries fréquentes (liste articles, stats)
- [ ] **Pagination backend** pour grandes listes (actuellement illimitée)
- [ ] **Lazy loading** images articles
- [ ] **Service Worker** pour PWA et cache frontend
- [ ] **Compression Gzip/Brotli** sur Nginx
- [ ] **Indexes database** : Ajouter indexes sur foreign keys, champs recherche

### Tests & Qualité

- [ ] **Tests unitaires backend** : pytest pour CRUD et validations
- [ ] **Tests d'intégration** : Workflows complets (créer article → mouvement)
- [ ] **Tests frontend** : React Testing Library pour composants
- [ ] **Tests E2E** : Playwright ou Cypress pour user journeys
- [ ] **Coverage** : Objectif 80% de couverture

### CI/CD & DevOps

- [ ] **GitHub Actions** :
  - Lint & Tests automatiques sur PR
  - Build Docker images automatique
  - Release notes automatiques
- [ ] **Docker Compose production** avec :
  - PostgreSQL au lieu de SQLite
  - Redis pour cache
  - Nginx reverse proxy
  - Certbot SSL (Let's Encrypt)
- [ ] **Monitoring** : Prometheus + Grafana pour métriques

### Sécurité

- [ ] **HTTPS obligatoire** en production
- [ ] **Rate limiting** sur endpoints API
- [ ] **Validation inputs** renforcée (XSS, SQL injection)
- [ ] **Backup automatique** database (cron quotidien)
- [ ] **Rotation logs** avec retention 30 jours
- [ ] **Secrets management** avec .env.vault ou Doppler

---

## 🚀 Stratégie de Déploiement

### Principes Directeurs

**Priorités** :
1. **Simplicité** : Configuration minimale, peu de dépendances
2. **Efficacité** : Performances optimales, consommation ressources réduite
3. **Facilité d'entretien** : Mises à jour simples, logs clairs, debugging facile
4. **Sécurité** : HTTPS, backups automatiques, isolation, secrets chiffrés

### Options de Déploiement Recommandées

#### Option A - NAS/Serveur Maison (RECOMMANDÉ pour usage personnel/PME) 🌟

**Cas d'usage** : 1-20 utilisateurs, réseau local, contrôle total des données

**Stack simplifiée** :
- Docker Compose (orchestration simple)
- SQLite (base de données fichier, backups faciles)
- Nginx reverse proxy (1 conteneur pour backend + frontend)
- Traefik (optionnel : HTTPS automatique avec Let's Encrypt)

**Matériel recommandé** :
- NAS : Synology DS220+, QNAP TS-253D, Ugreen DXP4800+
- Raspberry Pi 4 8GB (budget limité)
- Mini-PC : Intel NUC, Beelink (si charge > 10 users)

**Avantages** :
- ✅ Pas de coûts mensuels (sauf électricité ~5€/mois)
- ✅ Données sous contrôle physique
- ✅ Backups sur même appareil (RAID) + externe
- ✅ Configuration Docker simple (1 fichier `docker-compose.yml`)
- ✅ Accès réseau local rapide
- ✅ Option VPN pour accès distant sécurisé

**Inconvénients** :
- ⚠️ Pas de haute disponibilité (si panne matériel = downtime)
- ⚠️ Bande passante limitée pour accès distant
- ⚠️ Nécessite IP fixe ou DynDNS pour accès internet

**Configuration type** :
```yaml
# docker-compose.yml (fichier unique)
version: '3.8'
services:
  app:
    image: inventaire-app:latest
    volumes:
      - ./data:/app/data              # Database + uploads
      - ./backups:/app/backups        # Backups automatiques
    environment:
      - SECRET_KEY=${SECRET_KEY}      # Depuis .env
      - SMTP_HOST=${SMTP_HOST}        # Alertes email
    labels:
      - traefik.enable=true           # HTTPS automatique
      - traefik.http.routers.app.rule=Host(`inventaire.local`)
    restart: unless-stopped

  traefik:  # Optionnel : HTTPS automatique
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik:/etc/traefik
```

**Backup automatique** :
```bash
# Script cron quotidien (deployment/backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backups/backup_$DATE.tar.gz data/
# Rétention : garder 7 derniers + sync vers disque externe/cloud
find backups/ -name "backup_*.tar.gz" -mtime +7 -delete
rclone sync backups/ remote:inventaire-backups/  # Optionnel : cloud
```

**Maintenance** :
```bash
# Mise à jour (zero-downtime avec Watchtower)
docker pull inventaire-app:latest
docker-compose up -d  # Rolling update automatique

# Restauration backup
tar -xzf backups/backup_20260212.tar.gz -C ./
docker-compose restart
```

**Estimation coût** :
- Matériel : 300-800€ (une fois)
- Électricité : ~5€/mois
- Total 3 ans : ~480€ (vs 2000€+ pour cloud)

---

#### Option B - VPS Cloud (Pour accès internet public)

**Cas d'usage** : Accès internet requis, clients externes, SLA élevé

**Providers recommandés** :
- Hetzner (Allemagne) : 5€/mois (2 CPU, 4GB RAM) - **MEILLEUR RAPPORT QUALITÉ/PRIX**
- OVH (France) : 7€/mois (2 CPU, 4GB RAM) - Données en France
- DigitalOcean : 12$/mois (droplet 4GB) - Interface simple
- Scaleway (France) : 8€/mois (DEV1-M) - Données EU

**Stack production** :
- Docker Compose (simplicité) OU Kubernetes (si scaling requis)
- PostgreSQL (recommandé pour >50 users, multi-connexions)
- Nginx + Certbot (SSL Let's Encrypt gratuit)
- Monitoring : Uptime Kuma (self-hosted, simple)

**Sécurité renforcée** :
- Firewall UFW (ports 80, 443, 22 seulement)
- Fail2ban (protection brute force SSH + API)
- Backups quotidiens vers Object Storage (Hetzner Storage Box : 3€/TB/mois)
- Updates automatiques (unattended-upgrades)

**Avantages** :
- ✅ Accessible depuis n'importe où (internet)
- ✅ SLA garanti (99.9%+ uptime)
- ✅ Scaling facile (upgrade CPU/RAM en 1 clic)
- ✅ Backups automatiques provider

**Inconvénients** :
- ⚠️ Coût mensuel récurrent (60-150€/an)
- ⚠️ Données hébergées chez tiers
- ⚠️ Configuration initiale plus complexe

**Estimation coût** :
- VPS 4GB : 60-100€/an
- Backups storage : 36€/an (1TB)
- Domain : 10€/an
- Total : ~100-150€/an

---

### Déploiements Spécifiques

#### 1. Développement Local ✅ (Actuel)

**Stack** :
- Backend : uvicorn dev server (port 8000)
- Frontend : Vite dev server (port 5173)
- Database : SQLite fichier local

```bash
# Backend
cd backend && venv\Scripts\activate && uvicorn app.main:app --reload

# Frontend
cd frontend && npm run dev
```

---

#### 2. Docker Portable (Démo/Tests) ✅

**Fichier unique** : `docker-compose.yml` à la racine

```bash
# Démarrage rapide (Windows)
scripts\start.bat

# Linux/Mac
./scripts/start.sh
```

**URL** : http://localhost

---

#### 3. NAS Synology/Ugreen (Production Maison)

**Guide complet** : `deployment/nas/README.md`

**Configuration requise** :
- Docker installé sur NAS
- 2 GB RAM minimum
- Disques RAID pour redondance

**Déploiement** :
```bash
# Transfer depuis PC
scp docker-compose.yml user@nas:/volume1/docker/inventaire/
scp .env.production user@nas:/volume1/docker/inventaire/.env

# SSH sur NAS
ssh user@nas
cd /volume1/docker/inventaire
docker-compose up -d
```

**Accès** : http://nas.local ou http://192.168.x.x

---

#### 4. Raspberry Pi (Budget Limité)

**Guide détaillé** : `deployment/raspberry-pi/README.md`

**Matériel minimum** :
- Raspberry Pi 4 4GB (8GB recommandé)
- Carte microSD 32GB (SSD USB recommandé pour perfs)
- Alimentation officielle

**Performance attendue** :
- 5-10 utilisateurs simultanés
- Temps réponse < 500ms
- Consommation : 5W (~1€/mois)

---

### Choix Recommandé par Cas d'Usage

| Cas d'Usage | Solution | Coût 3 ans | Complexité | Sécurité |
|-------------|----------|------------|------------|----------|
| **Atelier personnel (1-3 users)** | Raspberry Pi 4 | ~120€ | ⭐⭐ Facile | ⭐⭐⭐ Bonne |
| **PME locale (5-20 users)** | NAS Synology | ~600€ | ⭐⭐⭐ Moyenne | ⭐⭐⭐⭐ Très bonne |
| **Accès internet requis** | VPS Hetzner | ~300€ | ⭐⭐⭐⭐ Complexe | ⭐⭐⭐⭐⭐ Excellente |
| **Multi-sites (>50 users)** | Kubernetes Cloud | ~2000€+ | ⭐⭐⭐⭐⭐ Expert | ⭐⭐⭐⭐⭐ Excellente |

**Recommandation générale** : **NAS Synology/Ugreen + VPN** pour usage PME
- Simple à configurer (interface web)
- Maintenance minimale (updates automatiques)
- Backups intégrés (Hyper Backup)
- Accès distant sécurisé (VPN built-in)
- Coût maîtrisé (pas d'abonnement)

---

## 📅 Planning Estimé (Mis à jour 2026-02-12)

### Q1 2026 (Janv-Mars) ✅ COMPLÉTÉ

- ✅ v1.0.0 - Application de base (TERMINÉ)
- ✅ v1.1.0 - Catégories hiérarchiques (TERMINÉ)
- ✅ v1.2.0 - Photos articles (TERMINÉ)
- ✅ v1.3.0 - Système de Fournisseurs (TERMINÉ)
- ✅ v1.3.1 - Améliorations Exports et Scan (TERMINÉ)
- ✅ v1.4.0 - Emplacements physiques avec Vue Plan d'atelier (TERMINÉ)
- ✅ v1.5.0 - Gestion commandes (TERMINÉ)
- ✅ v1.6.0 - Multi-utilisateurs & Permissions (TERMINÉ)

### Q2 2026 (Avr-Juin) 🎯 EN COURS

**Priorités** :
1. **v1.9.0 - Tests & Sécurité** (7-10 jours) - **PRIORITÉ HAUTE** 🔴
   - Tests unitaires backend (pytest)
   - Tests composants frontend (React Testing Library)
   - Tests E2E (Playwright)
   - Sécurité renforcée (rate limiting, HTTPS, validation)
   - CI/CD avec GitHub Actions
   - Audit de sécurité complet

2. **Déploiement Production** (3-5 jours)
   - Finaliser configuration NAS (Synology/Ugreen)
   - Guide déploiement VPS (Hetzner/OVH)
   - Scripts backup automatisés
   - Documentation maintenance

3. **v1.7.0 - Dashboard Analytique** (3-4 jours) - **PRIORITÉ BASSE** 🟢
   - Graphiques Chart.js (évolution stock, top articles sortis)
   - Statistiques avancées
   - Filtres date range

### Q3 2026 (Juil-Sept)

**Priorités** :
1. **v1.8.0 - Alertes Email Stock Bas** (4-5 jours) - **PRIORITÉ MOYENNE** 🟡
   - Configuration SMTP
   - Scheduler APScheduler (quotidien/hebdomadaire)
   - Template email HTML
   - Page Paramètres frontend

2. **Optimisations Performance** (5-7 jours)
   - Profiling et amélioration temps chargement
   - Indexes database optimisés
   - Lazy loading images
   - Compression Gzip/Brotli

3. **Documentation Complète**
   - Guide administrateur
   - Guide utilisateur final
   - Architecture technique (docs/ARCHITECTURE.md)
   - Tutoriels vidéo (optionnel)

### Q4 2026 (Oct-Déc)

**Priorités** :
1. **v2.0.0 - Application Mobile (PWA)** (10-12 jours) - **PRIORITÉ MOYENNE** 🟡
   - Service Worker + mode hors-ligne
   - Interface mobile optimisée
   - Bottom navigation
   - Scan QR/barcode avec caméra
   - Notifications push

2. **Fonctionnalités avancées** (selon besoins utilisateurs)
   - Suggestions commandes (stock bas)
   - Historique commandes par fournisseur
   - Statistiques dépenses mensuelles
   - Géolocalisation mouvements (optionnel)

### 2027 et au-delà

**Évolutions futures** (flexibles selon retours utilisateurs) :
- v2.1.0 - Multi-sites / Multi-ateliers
- v2.2.0 - Intégrations (Webhooks Slack/Discord, API publique)
- v2.3.0 - Module de facturation / Gestion clients
- v3.0.0 - Architecture microservices (si scaling requis)

---

## 🎯 Prochaines Étapes Immédiates

### Phase 1 - Consolidation & Qualité (Priorité Immédiate) 🔴

**Objectif** : Sécuriser et valider l'existant avant nouvelles fonctionnalités

1. **v1.9.0 - Tests Complets** (2-3 semaines)
   - [ ] Configurer pytest + fixtures backend
   - [ ] Tests unitaires CRUD (50+ tests)
   - [ ] Tests intégration workflows (15+ scénarios)
   - [ ] Tests sécurité (injections, XSS, permissions)
   - [ ] Tests frontend (React Testing Library)
   - [ ] Tests E2E (Playwright) - 5 user journeys critiques
   - [ ] Rapport de couverture (objectif 80%)

2. **Sécurité Renforcée** (1 semaine)
   - [ ] Rate limiting (slowapi)
   - [ ] HTTPS obligatoire (configuration Nginx/Traefik)
   - [ ] Validation inputs renforcée
   - [ ] Audit de sécurité (scan vulnérabilités dépendances)
   - [ ] Secrets management (.env.vault ou Doppler)

3. **CI/CD** (3-5 jours)
   - [ ] GitHub Actions : Lint + Tests + Build
   - [ ] Pre-commit hooks (Black, ESLint, detect-secrets)
   - [ ] Build automatique Docker images sur release
   - [ ] Badge de couverture dans README

### Phase 2 - Déploiement Production (1-2 semaines)

4. **Documentation Déploiement**
   - [ ] Guide NAS Synology/Ugreen (avec screenshots)
   - [ ] Guide VPS Hetzner (configuration complète)
   - [ ] Scripts backup automatisés + restauration
   - [ ] Checklist maintenance mensuelle

5. **Test Déploiement Réel**
   - [ ] Déployer sur NAS ou VPS de test
   - [ ] Valider backups automatiques
   - [ ] Tester restauration depuis backup
   - [ ] Mesurer performances (temps réponse, charge)
   - [ ] Documenter problèmes rencontrés + solutions

### Phase 3 - Nouvelles Fonctionnalités (Flexible)

6. **v1.7.0 - Dashboard Analytique** (optionnel, priorité basse)
   - Si besoin utilisateur confirmé

7. **v1.8.0 - Alertes Email Stock Bas**
   - Quand déploiement production stable

8. **v2.0.0 - PWA Mobile**
   - Après retours utilisateurs sur v1.6-1.9

---

### 📊 Métriques de Succès

**Avant de passer aux nouvelles fonctionnalités** :
- ✅ Couverture tests ≥ 80%
- ✅ Aucune vulnérabilité critique (scan dépendances)
- ✅ CI/CD opérationnel (green builds)
- ✅ Déploiement production fonctionnel (uptime > 99%)
- ✅ Backups automatiques testés (restauration validée)
- ✅ Documentation complète (guides utilisateur + admin)

**Timeline réaliste** :
- Phase 1 (Tests & Sécurité) : 3-4 semaines
- Phase 2 (Déploiement) : 1-2 semaines
- Phase 3 (Nouvelles features) : À partir de Mars-Avril 2026

**Principe** : **Qualité > Quantité** - Mieux vaut une application stable et sécurisée qu'une application riche en fonctionnalités mais instable.

---

## 📝 Notes & Décisions Stratégiques

### Principes de Développement

1. **Qualité avant Quantité** : Préférer une application stable avec moins de fonctionnalités qu'une application riche mais instable
2. **Tests Obligatoires** : Toute nouvelle fonctionnalité doit avoir des tests (unitaires + intégration minimum)
3. **Sécurité by Design** : Validation inputs, permissions, rate limiting sur tous les nouveaux endpoints
4. **Documentation Continue** : Chaque version majeure doit inclure mise à jour documentation
5. **Feedback Utilisateur** : Prioriser les fonctionnalités selon retours réels d'utilisation

### Changements de Priorités (Février 2026)

**Nouvelles orientations** :
- ✅ **v1.9.0 Tests & Sécurité** : Nouvelle priorité HAUTE (ajoutée) - Consolider l'existant
- ✅ **v1.8.0 Alertes Email** : Scope réduit aux alertes stock bas uniquement (notifications in-app reportées)
- ✅ **Déploiement** : Focus sur solutions simples (NAS + VPN) plutôt que cloud complexe
- ✅ **v2.0.0 PWA** : Préférée à React Native (même codebase, déploiement immédiat)

**Fonctionnalités reportées** :
- Notifications in-app (badge compteur) → v1.9.0 ou ultérieur
- Dashboard analytique → Priorité basse (selon besoin utilisateur)
- Kubernetes / Architecture microservices → Seulement si scaling réel requis

### Versioning Sémantique

**Format** : `MAJEUR.MINEUR.PATCH` (ex: v1.6.0)

- **MAJEUR** : Breaking changes (migration DB requise, changements API incompatibles)
- **MINEUR** : Nouvelles fonctionnalités (rétro-compatible)
- **PATCH** : Correctifs bugs, optimisations (rétro-compatible)

**Exemples** :
- v1.6.0 → v1.7.0 : Nouvelle fonctionnalité (Dashboard analytique) - MINEUR
- v1.7.0 → v1.7.1 : Correctif bug dashboard - PATCH
- v1.9.0 → v2.0.0 : PWA (architecture modifiée) - MAJEUR

### Versions Complétées

- ✅ **v1.6.0 (2026-02-12)** : Multi-utilisateurs & Permissions - 4 rôles, 23+ permissions, audit trail sur 11 modèles
- ✅ **v1.5.0 (2026-02-11)** : Gestion des commandes - Workflow BROUILLON→ENVOYEE→RECUE, PDF, mise à jour stock automatique
- ✅ **v1.4.0 (2026-02-11)** : Emplacements physiques - Vue Plan d'atelier interactive, 3 niveaux hiérarchiques, QR codes
- ✅ **v1.3.1 (2026-02-11)** : Exports données de référence + Scan codes-barres articles
- ✅ **v1.3.0 (2026-02-10)** : Système de Fournisseurs - Many-to-many avec articles, prix_fournisseur, commandes
- ✅ **v1.2.0 (2026-02-10)** : Gestion des Photos - Upload 5 photos/article, thumbnails, lightbox
- ✅ **v1.1.0 (2026-02-08)** : Catégories hiérarchiques - 2 niveaux, double select cascadé
- ✅ **v1.0.0 (2026-01-XX)** : Application de base - CRUD complet, authentification JWT, exports CSV/PDF

### Métriques Projet (au 2026-02-12)

**Backend** :
- 11 modèles SQLAlchemy (User, Article, Categorie, Tag, Photo, Fournisseur, Emplacement, Mouvement, Commande, LigneCommande)
- 10 routers FastAPI (auth, articles, categories, tags, photos, fournisseurs, emplacements, mouvements, commandes, rapports, users)
- ~3500 lignes de code Python (sans commentaires)
- SQLite database avec ~15 tables

**Frontend** :
- 14 pages React (Dashboard, Articles, Categories, Tags, Fournisseurs, Emplacements, PlanAtelier, ScanQRCode, Mouvements, Commandes, NouvelleCommande, Rapports, Users, Login/Register)
- ~25 composants réutilisables
- ~4000 lignes de code JSX (sans commentaires)
- React Query pour state management

**Tests** :
- ⚠️ Couverture actuelle : ~0% (à développer en v1.9.0)
- Objectif v1.9.0 : ≥80%

**Déploiement** :
- Docker Compose (développement local ✅)
- NAS/VPS (en cours de documentation)
- Portable Windows v1.1.0 (démo uniquement)

---

**Dernière révision** : 2026-02-12
**Maintenu par** : Cedric + Claude Sonnet 4.5
**Prochain review** : Mars 2026 (après phase Tests & Sécurité)
