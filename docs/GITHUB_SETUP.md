# Guide d'Activation CI/CD GitHub - Inventaire

Guide étape par étape pour activer les workflows GitHub Actions et déployer automatiquement.

## 📋 Prérequis

- [x] Compte GitHub créé
- [x] Git installé localement
- [x] Code à jour avec tous les commits Phase 1-6

## 🚀 Étape 1 : Créer le Repository GitHub

### 1.1 Créer le Repository

1. Aller sur https://github.com/new
2. **Repository name** : `inventaire`
3. **Description** : "Application de gestion d'inventaire multi-plateforme (FastAPI + React)"
4. **Visibility** : Private ou Public (votre choix)
5. ⚠️ **NE PAS** cocher "Initialize with README" (vous avez déjà un README)
6. ⚠️ **NE PAS** ajouter .gitignore ou license (déjà présents)
7. Cliquer **"Create repository"**

### 1.2 Configurer le Remote

```bash
# Dans votre répertoire local
cd c:\Users\cedri\Desktop\inventaire

# Vérifier remote actuel
git remote -v

# Si le remote pointe vers "votre-username", le mettre à jour
git remote set-url origin https://github.com/VOTRE-VRAI-USERNAME/inventaire.git

# Exemple avec username "cedric123":
# git remote set-url origin https://github.com/cedric123/inventaire.git

# Vérifier que c'est correct
git remote -v
```

### 1.3 Pousser le Code Initial

```bash
# Vérifier qu'on est sur la branche principale
git branch

# Si sur "master", la renommer en "main" (recommandé par GitHub)
git branch -M main

# Pousser le code avec tous les commits
git push -u origin main

# Vérifier sur GitHub que le code est bien là
# https://github.com/VOTRE-USERNAME/inventaire
```

## ⚙️ Étape 2 : Activer GitHub Actions

### 2.1 Activer les Workflows

1. Aller sur votre repo : `https://github.com/VOTRE-USERNAME/inventaire`
2. Cliquer sur l'onglet **"Actions"**
3. GitHub détecte automatiquement vos workflows (.github/workflows/*.yml)
4. Cliquer **"I understand my workflows, go ahead and enable them"**

### 2.2 Configurer les Permissions

**Settings → Actions → General** :

1. **Actions permissions** :
   - ☑️ Allow all actions and reusable workflows

2. **Workflow permissions** :
   - ☑️ Read and write permissions
   - ☑️ Allow GitHub Actions to create and approve pull requests

3. Cliquer **"Save"**

### 2.3 Activer GitHub Container Registry (pour Docker)

**Settings → Packages** :

1. Package creation : ☑️ Public (si repo public) ou Private (si repo privé)
2. Package deletion and restoration : ☑️ Enable

Aucune configuration supplémentaire n'est nécessaire - GHCR est automatique avec `GITHUB_TOKEN`.

## 🧪 Étape 3 : Tester le CI (Tests Automatiques)

### 3.1 Déclencher le Workflow CI Manuellement

```bash
# Le workflow CI se déclenche automatiquement sur push
# Mais on peut le forcer pour tester

# Faire un petit changement (optionnel)
echo "" >> README.md

# Commit et push
git add README.md
git commit -m "test: trigger CI workflow"
git push origin main
```

### 3.2 Vérifier les Workflows en Cours

1. Aller sur **Actions** dans votre repo GitHub
2. Vous devriez voir le workflow **"CI - Tests & Lint"** en cours (🟡 orange)
3. Cliquer dessus pour voir les détails
4. Observer les 5 jobs en parallèle :
   - **backend-lint** (Black + Flake8)
   - **backend-tests** (pytest)
   - **frontend-lint** (ESLint)
   - **frontend-tests** (Vitest)
   - **security-scan** (detect-secrets)

### 3.3 Résultats Attendus

**✅ Succès attendu** :
- backend-lint : ✅ (si code formaté avec Black)
- backend-tests : ✅ (201 tests passent)
- frontend-lint : ⚠️ Peut échouer si erreurs ESLint (voir section Troubleshooting)
- frontend-tests : ✅ (82 tests passent)
- security-scan : ✅ (baseline à jour)

**Si un job échoue** : Voir section [Troubleshooting](#troubleshooting) plus bas.

## 🐳 Étape 4 : Créer le Premier Release (Build Docker)

### 4.1 Créer un Tag Versionné

```bash
# S'assurer que tout est commité
git status

# Créer le tag v1.9.0
git tag -a v1.9.0 -m "Release v1.9.0 - Tests & Sécurité Production"

# Pousser le tag vers GitHub
git push origin v1.9.0
```

### 4.2 Observer le Build Docker

1. Aller sur **Actions** → Workflow **"Docker Build & Push"**
2. Le workflow se déclenche automatiquement sur le tag `v1.9.0`
3. Observer les 3 jobs :
   - **build-backend** : Build image backend (~2-5 min)
   - **build-frontend** : Build image frontend (~2-5 min)
   - **create-release** : Création release GitHub

### 4.3 Vérifier les Résultats

**Images Docker publiées** :

1. Aller sur le profil de votre repo → **Packages**
2. Vous devriez voir 2 packages :
   - `inventaire/backend`
   - `inventaire/frontend`

3. Chaque package a plusieurs tags :
   - `latest`
   - `1.9.0`
   - `1.9`
   - `1`
   - `sha-abc123`

**Release GitHub créée** :

1. Aller sur **Releases** (sidebar droite)
2. Vous devriez voir **"v1.9.0"**
3. Les release notes sont générées automatiquement

## 📥 Étape 5 : Utiliser les Images Docker

### 5.1 Pull les Images depuis GHCR

```bash
# Se connecter à GitHub Container Registry
echo "VOTRE_GITHUB_TOKEN" | docker login ghcr.io -u VOTRE-USERNAME --password-stdin

# Générer un token sur: https://github.com/settings/tokens
# Permissions requises: read:packages

# Pull les images
docker pull ghcr.io/VOTRE-USERNAME/inventaire/backend:latest
docker pull ghcr.io/VOTRE-USERNAME/inventaire/frontend:latest

# Ou une version spécifique
docker pull ghcr.io/VOTRE-USERNAME/inventaire/backend:1.9.0
```

### 5.2 Déployer avec docker-compose (Images Pré-buildées)

Créer `docker-compose-prod.yml` :

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/VOTRE-USERNAME/inventaire/backend:latest
    container_name: inventaire_backend
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=sqlite:///./data/database/inventaire.db
    volumes:
      - ./data:/app/data
      - ./backups:/app/backups
    ports:
      - "8000:8000"
    restart: unless-stopped

  frontend:
    image: ghcr.io/VOTRE-USERNAME/inventaire/frontend:latest
    container_name: inventaire_frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

Démarrer :

```bash
# Créer .env avec SECRET_KEY
echo "SECRET_KEY=$(openssl rand -hex 32)" > .env

# Démarrer
docker-compose -f docker-compose-prod.yml up -d

# Vérifier
docker ps
curl http://localhost/api/health
```

## 🔧 Troubleshooting

### ❌ Workflow CI Échoue - backend-lint

**Erreur** : "Black would reformat X files"

**Solution** :
```bash
# Formater tout le code backend
cd backend
black .

# Commit et push
git add .
git commit -m "style: format backend with Black"
git push origin main
```

### ❌ Workflow CI Échoue - frontend-lint

**Erreur** : ESLint trouve des erreurs

**Solution** :
```bash
# Voir les erreurs
cd frontend
npm run lint

# Auto-fix si possible
npm run lint -- --fix

# Commit et push
git add .
git commit -m "style: fix ESLint errors"
git push origin main
```

### ❌ Workflow CI Échoue - backend-tests

**Erreur** : "Coverage threshold not met (X% < 60%)"

**Solution** :
```bash
# Vérifier couverture localement
cd backend
pytest --cov=app --cov-report=term

# Si < 60%, ajouter des tests ou ajuster le seuil dans .github/workflows/ci.yml
# Ligne 57: coverage report --fail-under=60  # Changer 60 → 50 temporairement
```

### ❌ Workflow CI Échoue - security-scan

**Erreur** : "Nouveaux secrets détectés"

**Solution** :
```bash
# Scanner localement
./deployment/security/scan-secrets.sh

# Si faux positifs, mettre à jour la baseline
./deployment/security/scan-secrets.sh --update-baseline

# Commit et push
git add .secrets.baseline
git commit -m "chore: update secrets baseline"
git push origin main
```

### ❌ Build Docker Échoue

**Erreur** : "Failed to build image"

**Solution** :
```bash
# Tester build localement
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend

# Si échec, vérifier les logs pour l'erreur spécifique
# Souvent : dépendances manquantes dans requirements.txt ou package.json
```

### ❌ Cannot Push to GHCR

**Erreur** : "Permission denied"

**Solution** :

1. Vérifier permissions dans **Settings → Actions → General** :
   - ☑️ Read and write permissions

2. Si repo privé, vérifier Package visibility :
   - **Settings → Packages** → Cliquer sur package → **Package settings**
   - Change visibility : Public (ou garder Private si voulu)

## 📊 Étape 6 : Badges README (Optionnel)

### 6.1 Mettre à Jour les URLs des Badges

Éditer `README.md` et remplacer `VOTRE-USER` par votre vrai username :

```markdown
[![CI Status](https://github.com/cedric123/inventaire/actions/workflows/ci.yml/badge.svg)](https://github.com/cedric123/inventaire/actions/workflows/ci.yml)
[![Docker Build](https://github.com/cedric123/inventaire/actions/workflows/docker-build.yml/badge.svg)](https://github.com/cedric123/inventaire/actions/workflows/docker-build.yml)
```

### 6.2 Badges Codecov (Optionnel)

Si vous voulez des badges de couverture dynamiques :

1. Créer compte sur https://codecov.io
2. Connecter votre repo GitHub
3. Obtenir `CODECOV_TOKEN`
4. Dans **GitHub Settings → Secrets → Actions → New repository secret** :
   - Name : `CODECOV_TOKEN`
   - Value : `<votre-token>`
5. Les workflows CI uploadent automatiquement la couverture

## ✅ Checklist Finale

- [ ] Repository GitHub créé
- [ ] Remote Git configuré correctement
- [ ] Code poussé sur GitHub (`git push origin main`)
- [ ] GitHub Actions activées (Settings → Actions)
- [ ] Permissions configurées (Read and write)
- [ ] Workflow CI exécuté avec succès (tous les jobs ✅)
- [ ] Tag `v1.9.0` créé et poussé
- [ ] Workflow Docker Build réussi
- [ ] Images Docker publiées sur GHCR
- [ ] Release GitHub créée
- [ ] Badges README mis à jour (URLs correctes)

## 🎉 Félicitations !

Votre pipeline CI/CD est maintenant opérationnel ! 🚀

**À chaque push sur `main`** :
- Tests automatiques (backend + frontend)
- Lint automatique (Black, Flake8, ESLint)
- Scan sécurité (detect-secrets)

**À chaque tag `vX.Y.Z`** :
- Build automatique images Docker
- Publication sur GitHub Container Registry
- Création release GitHub avec notes automatiques

**Chaque semaine (Dependabot)** :
- PR automatiques pour updates dépendances
- Python pip, NPM, GitHub Actions, Docker

---

**Prochaines étapes recommandées** :

1. **Déployer en production** avec les images Docker buildées
2. **Configurer Codecov** pour badges de couverture dynamiques
3. **Créer branche `develop`** pour workflow GitFlow
4. **Phase 4 Tests E2E** (Playwright) - optionnel mais recommandé

**Support** :

- Documentation workflows : `.github/README.md`
- Sécurité : `docs/SECURITY.md`
- Backup : `deployment/backup/README.md`

---

**Dernière mise à jour** : 2026-02-14
