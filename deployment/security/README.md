# Guide de Sécurité - Inventaire

Documentation des bonnes pratiques de sécurité et scripts de vérification.

## 🔒 Secrets Management

### Installation detect-secrets

```bash
# Backend
cd backend
source venv/bin/activate  # ou venv\Scripts\activate sur Windows
pip install detect-secrets

# Vérifier installation
detect-secrets --version
```

### Scan Initial

```bash
# Générer la baseline initiale (première fois)
cd /path/to/inventaire
detect-secrets scan > .secrets.baseline

# Ou utiliser le script
chmod +x deployment/security/scan-secrets.sh
./deployment/security/scan-secrets.sh --update-baseline
```

### Utilisation Quotidienne

```bash
# Scanner le code (avant commit)
./deployment/security/scan-secrets.sh

# Si nouveaux secrets détectés:
# 1. Vérifier s'ils sont légitimes
# 2. Les retirer du code et utiliser variables d'env
# 3. Révoquer les clés exposées si nécessaire

# Si faux positifs:
./deployment/security/scan-secrets.sh --update-baseline
git add .secrets.baseline
git commit -m "chore: mise à jour baseline detect-secrets"
```

### Pre-commit Hooks

```bash
# Installer pre-commit
pip install pre-commit

# Activer les hooks
cd /path/to/inventaire
pre-commit install

# Les hooks s'exécuteront automatiquement avant chaque commit
# Test manuel:
pre-commit run --all-files
```

## 🔑 Variables d'Environnement Sécurisées

### Génération Secrets

```bash
# SECRET_KEY (JWT, sessions)
openssl rand -hex 32

# Autre secret aléatoire
openssl rand -base64 32

# UUID
uuidgen
```

### Fichier .env Production

**IMPORTANT** : Ne JAMAIS committer le fichier `.env` !

Créer `.env` à la racine du projet :

```bash
# Sécurité (OBLIGATOIRE)
SECRET_KEY=<générer avec: openssl rand -hex 32>

# Database (optionnel, défaut: SQLite local)
DATABASE_URL=sqlite:///./data/database/inventaire.db

# Email / SMTP (optionnel, pour alertes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password  # Pas votre mot de passe Gmail !
SMTP_FROM=noreply@inventaire.local

# Backup Cloud (optionnel, nécessite rclone)
RCLONE_REMOTE=backblaze

# Monitoring (optionnel)
SENTRY_DSN=https://...@sentry.io/...
LOG_LEVEL=INFO
```

### Vérification Configuration

```bash
# Vérifier que toutes les variables requises sont définies
chmod +x deployment/security/check-env-vars.sh
./deployment/security/check-env-vars.sh

# Sortie attendue:
# ✓ SECRET_KEY définie (64 caractères)
# ✓ SECRET_KEY fort (64 caractères)
# ✓ SECRET_KEY a une bonne entropie
# ✓ Aucun secret hardcodé détecté
```

## 🛡️ Bonnes Pratiques

### 1. Ne JAMAIS Hardcoder de Secrets

**❌ MAUVAIS** :

```python
# backend/app/config.py
SECRET_KEY = "my-super-secret-key-123"  # JAMAIS FAIRE ÇA !
SMTP_PASSWORD = "admin123"              # JAMAIS !
```

**✅ BON** :

```python
# backend/app/config.py
import os

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY doit être défini dans .env")

SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", None)
```

### 2. Utiliser .gitignore

Vérifier que ces patterns sont dans `.gitignore` :

```gitignore
# Secrets et configuration
.env
.env.local
.env.production
*.pem
*.key
*.crt

# Données sensibles
database/inventaire.db
data/
backups/
uploads/

# Logs
*.log
logs/
```

### 3. Rotation des Secrets

**SECRET_KEY JWT** (rotation tous les 6 mois recommandé) :

```bash
# 1. Générer nouveau secret
NEW_KEY=$(openssl rand -hex 32)

# 2. Mettre à jour .env
sed -i "s/SECRET_KEY=.*/SECRET_KEY=$NEW_KEY/" .env

# 3. Redémarrer l'application
docker-compose restart backend

# ⚠️ Les utilisateurs devront se reconnecter (tokens invalidés)
```

**SMTP Password** (rotation si compromis) :

1. Générer nouveau app password dans Gmail/Outlook
2. Mettre à jour `.env` : `SMTP_PASSWORD=nouveau-password`
3. Redémarrer : `docker-compose restart`

### 4. Chiffrement des Backups

Chiffrer les backups avant upload cloud :

```bash
# Chiffrer (AES-256)
gpg --symmetric --cipher-algo AES256 backup.tar.gz
# Demande passphrase (STOCKER SÉCURISEMENT !)

# Déchiffrer
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
```

Modifier `deployment/backup/backup.sh` pour activer automatiquement (ligne 108).

## 📋 Checklist Sécurité Production

Avant déploiement en production :

- [ ] `SECRET_KEY` généré aléatoirement (64+ caractères)
- [ ] Aucun secret hardcodé (vérifier avec `./scan-secrets.sh`)
- [ ] Fichier `.env` créé et non committé
- [ ] Variables d'environnement vérifiées (`./check-env-vars.sh`)
- [ ] Pre-commit hooks installés (`pre-commit install`)
- [ ] HTTPS activé (certificat Let's Encrypt)
- [ ] Rate limiting configuré (voir Phase 2)
- [ ] Backups automatiques activés (cron quotidien)
- [ ] Logs avec rotation configurés (30 jours)
- [ ] Firewall actif (ports 80, 443, 22 seulement)
- [ ] Updates automatiques activées (unattended-upgrades)

## 🚨 Incident Response

### Secret Compromis

**Si un secret a été commité par erreur** :

```bash
# 1. Révoquer immédiatement le secret compromis
# (Régénérer SECRET_KEY, changer SMTP password, etc.)

# 2. Nettoyer l'historique git (DANGEREUX !)
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch chemin/vers/fichier-avec-secret' \
  --prune-empty --tag-name-filter cat -- --all

# 3. Forcer push (si dépôt privé)
git push origin --force --all

# 4. Informer les collaborateurs de refaire git clone

# 5. Mettre à jour .secrets.baseline
./deployment/security/scan-secrets.sh --update-baseline
```

**Alternative recommandée** : Révoquer la clé et démarrer nouveau repo propre.

### Scan de Vulnérabilités

```bash
# Backend (Python)
pip install safety
safety check --json

# Frontend (Node.js)
cd frontend
npm audit
npm audit fix  # Fix automatique si disponible

# Docker images
docker scan inventaire-backend:latest
docker scan inventaire-frontend:latest
```

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [detect-secrets Documentation](https://github.com/Yelp/detect-secrets)
- [12 Factor App - Config](https://12factor.net/config)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/)

---

**Dernière mise à jour** : 2026-02-14
**Maintenu par** : Cedric + Claude Sonnet 4.5
