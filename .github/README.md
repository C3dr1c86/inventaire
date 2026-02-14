# GitHub Actions CI/CD - Inventaire

Documentation des workflows automatisés pour CI/CD.

## 📋 Workflows Disponibles

### 1. CI - Tests & Lint (`ci.yml`)

**Déclenchement** : Push ou Pull Request sur `main`, `master`, `develop`

**Jobs** :
- **backend-lint** : Black + Flake8
- **backend-tests** : pytest avec couverture (seuil: 60%)
- **frontend-lint** : ESLint
- **frontend-tests** : Vitest avec couverture
- **security-scan** : detect-secrets

**Badges** :
```markdown
![CI Status](https://github.com/VOTRE-USER/inventaire/actions/workflows/ci.yml/badge.svg)
```

### 2. Docker Build & Push (`docker-build.yml`)

**Déclenchement** :
- Automatique : Tags `v*.*.*` (ex: `v1.9.0`)
- Manuel : Workflow dispatch

**Actions** :
- Build images backend + frontend
- Push vers GitHub Container Registry (ghcr.io)
- Création release GitHub automatique
- Tags multiples : `latest`, `v1.9.0`, `v1.9`, `v1`, `sha-abc123`

**Images publiées** :
```bash
ghcr.io/VOTRE-USER/inventaire/backend:latest
ghcr.io/VOTRE-USER/inventaire/frontend:latest
```

### 3. Dependency Review (`dependency-review.yml`)

**Déclenchement** : Pull Requests vers `main`/`master`

**Actions** :
- Scan vulnérabilités nouvelles dépendances
- Safety check (Python)
- NPM audit (Node.js)
- Commentaire automatique dans PR

### 4. Dependabot (`dependabot.yml`)

**Fréquence** : Hebdomadaire (lundi 6h00)

**Updates automatiques** :
- Python pip (backend)
- NPM (frontend)
- GitHub Actions
- Docker base images

**Limite** : 5 PR max simultanées

## 🚀 Configuration Initiale

### 1. Activer GitHub Actions

```bash
# Dans votre dépôt GitHub:
Settings → Actions → General → Allow all actions
```

### 2. Secrets Requis

Aller dans `Settings → Secrets and variables → Actions` :

**Optionnels** (pour badges couverture) :
- `CODECOV_TOKEN` : Token Codecov (si vous utilisez codecov.io)

**Automatiques** (fournis par GitHub) :
- `GITHUB_TOKEN` : Utilisé automatiquement pour build Docker

### 3. Permissions GitHub Container Registry

```bash
# Dans Settings → Actions → General → Workflow permissions:
☑️ Read and write permissions
☑️ Allow GitHub Actions to create and approve pull requests
```

### 4. Premier Build Docker

```bash
# Créer et pusher un tag
git tag v1.9.0
git push origin v1.9.0

# Le workflow docker-build.yml se déclenche automatiquement
```

## 📊 Badges pour README

Ajouter en haut du `README.md` :

```markdown
# Inventaire d'Atelier

![CI Status](https://github.com/VOTRE-USER/inventaire/actions/workflows/ci.yml/badge.svg)
![Docker Build](https://github.com/VOTRE-USER/inventaire/actions/workflows/docker-build.yml/badge.svg)
![Backend Coverage](https://codecov.io/gh/VOTRE-USER/inventaire/branch/main/graph/badge.svg?flag=backend)
![Frontend Coverage](https://codecov.io/gh/VOTRE-USER/inventaire/branch/main/graph/badge.svg?flag=frontend)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/github/v/release/VOTRE-USER/inventaire)
```

## 🔧 Modification des Workflows

### Changer le seuil de couverture

**Backend** (fichier `.github/workflows/ci.yml` ligne 57) :
```yaml
- name: Check coverage threshold
  run: coverage report --fail-under=60  # Changer 60 → votre seuil
```

**Frontend** : Modifier `frontend/vitest.config.js` :
```javascript
coverage: {
  statements: 15,  // Votre seuil
  branches: 15,
  functions: 15,
  lines: 15
}
```

### Ajouter un nouveau job

```yaml
my-custom-job:
  name: Mon Job Personnalisé
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run custom script
      run: ./scripts/my-script.sh
```

## 📖 Exemples d'Utilisation

### Déploiement Automatique sur Tag

```bash
# 1. Finaliser les changements
git add .
git commit -m "feat: nouvelle fonctionnalité"

# 2. Créer un tag versionné
git tag v1.10.0

# 3. Pusher avec tags
git push origin main --tags

# 4. GitHub Actions va automatiquement:
#    - Exécuter les tests
#    - Builder les images Docker
#    - Les pusher vers ghcr.io
#    - Créer une release GitHub
```

### Pull Request Workflow

```bash
# 1. Créer une branche
git checkout -b feature/ma-fonctionnalite

# 2. Faire des changements et commit
git add .
git commit -m "feat: ajouter fonctionnalité X"

# 3. Pusher
git push origin feature/ma-fonctionnalite

# 4. Créer PR sur GitHub
# GitHub Actions va automatiquement:
#    - Lint le code (Black, ESLint)
#    - Exécuter les tests
#    - Scanner les secrets
#    - Review les dépendances
#    - Afficher résultats dans PR
```

## 🐛 Debugging

### Workflow échoue

```bash
# 1. Voir les logs dans GitHub:
Actions → Sélectionner le workflow échoué → Cliquer sur le job rouge

# 2. Reproduire localement:
# Backend
cd backend
black --check .
flake8 .
pytest --cov

# Frontend
cd frontend
npm run lint
npm test
```

### Image Docker ne se construit pas

```bash
# Tester localement
docker build -t test-backend ./backend
docker build -t test-frontend ./frontend

# Vérifier les logs GitHub Actions
Actions → docker-build.yml → Voir les étapes échouées
```

## 📚 Ressources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Codecov Documentation](https://docs.codecov.com/)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)

## 🔄 Maintenance

### Mettre à jour les versions Actions

Dependabot crée automatiquement des PR pour mettre à jour les actions.

**Manuellement** :
```bash
# Vérifier versions disponibles:
# https://github.com/actions/checkout/releases
# https://github.com/actions/setup-python/releases
# https://github.com/actions/setup-node/releases

# Modifier .github/workflows/*.yml
- uses: actions/checkout@v4  # ← Dernière version
```

---

**Dernière mise à jour** : 2026-02-14 (Phase 5 - v1.9.0)
