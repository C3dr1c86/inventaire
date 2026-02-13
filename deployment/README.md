# Configurations de Déploiement

Ce dossier contient les configurations pour différents environnements de déploiement.

## ⚠️ IMPORTANT

**NE JAMAIS modifier les fichiers sources** dans `backend/` et `frontend/`.

Les configurations ici sont des **copies adaptées** pour chaque environnement.

---

## 📁 Structure

### `docker-local/`
Configuration Docker pour tests locaux sur votre machine.

- **Stack** : Backend + Frontend + SQLite
- **Port** : 80
- **URL** : http://localhost
- **Utilité** : Tester le déploiement avant envoi sur NAS

### `docker-nas/`
Configuration Docker pour NAS Ugreen/Synology (production maison).

- **Stack** : Backend + Frontend + SQLite/PostgreSQL
- **Port** : 8080 (personnalisable)
- **URL** : http://192.168.x.x:8080
- **Volumes** : Montés sur NAS pour persistence
- **Utilité** : Déploiement final sur votre réseau local

### `production/`
Configuration complète pour VPS cloud (optionnel).

- **Stack** : Backend + Frontend + PostgreSQL + Redis + Nginx SSL
- **Domain** : inventaire.mondomaine.com
- **SSL** : Let's Encrypt automatique
- **Monitoring** : Prometheus + Grafana
- **Utilité** : Déploiement internet public avec haute disponibilité

### `staging/`
Configuration pour environnement de test pré-production.

- **Utilité** : Tester nouvelles versions avant déploiement production

---

## 🚀 Workflow de Déploiement

### 1. Développement

```bash
# Travailler sur les fichiers sources
cd backend/
cd frontend/

# Tester localement avec serveurs dev
uvicorn app.main:app --reload
npm run dev
```

### 2. Test Docker Local

```bash
# Copier et adapter configuration
cd deployment/docker-local/

# Build et lancer
docker-compose up --build

# Accès : http://localhost
```

### 3. Déploiement NAS

```bash
# Copier et adapter configuration
cd deployment/docker-nas/

# Construire images
docker build -t inventaire-backend:latest ../../backend/
docker build -t inventaire-frontend:latest ../../frontend/

# Exporter
docker save inventaire-backend:latest -o inventaire-backend.tar
docker save inventaire-frontend:latest -o inventaire-frontend.tar

# Transférer vers NAS et lancer
scp *.tar user@nas:/path/
ssh user@nas
docker load -i inventaire-backend.tar
docker load -i inventaire-frontend.tar
docker-compose up -d
```

### 4. Déploiement Production (Optionnel)

```bash
cd deployment/production/
./deploy.sh
```

---

## 📝 Prochaines Étapes

1. ✅ Structure créée
2. [ ] Créer fichiers Docker pour `docker-local/`
3. [ ] Tester build Docker local
4. [ ] Adapter pour `docker-nas/`
5. [ ] Déployer sur NAS

---

**Voir** `docs/ROADMAP.md` pour planning complet
**Voir** `docs/DEPLOYMENT.md` pour guides détaillés
