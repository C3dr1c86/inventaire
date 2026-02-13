# Docker NAS - Configuration Production Maison

Configuration Docker pour déploiement sur NAS Ugreen/Synology (réseau local).

## 🎯 Objectif

Déployer l'application sur votre NAS pour accès 24/7 sur votre réseau local.

## 📦 Stack

- **Backend** : FastAPI + uvicorn
- **Frontend** : Build React + Nginx
- **Database** : SQLite OU PostgreSQL (selon choix)
- **Volumes** : Montés sur NAS pour persistence
- **Port** : 8080 (personnalisable)
- **Réseau** : Accessible sur http://192.168.x.x:8080

## 📁 Fichiers (à créer)

```
docker-nas/
├── README.md (ce fichier)
├── docker-compose.yml        # Orchestration pour NAS
├── backend.Dockerfile         # Build backend optimisé
├── frontend.Dockerfile        # Build frontend optimisé
├── nginx.conf                 # Config Nginx avec reverse proxy
├── .env.production            # Variables d'environnement NAS
├── scripts/
│   ├── build.bat              # Build images sur PC Windows
│   ├── export.bat             # Exporter images en .tar
│   ├── deploy-to-nas.bat      # Déployer vers NAS (SCP + SSH)
│   └── update.bat             # Mise à jour version
```

## 🚀 Workflow de Déploiement

### 1. Build images sur PC

```bash
cd deployment/docker-nas/
scripts\build.bat
```

Cela construit :
- `inventaire-backend:latest`
- `inventaire-frontend:latest`

### 2. Exporter images

```bash
scripts\export.bat
```

Crée :
- `inventaire-backend.tar`
- `inventaire-frontend.tar`

### 3. Transférer vers NAS

```bash
scripts\deploy-to-nas.bat
```

Ce script :
1. Transfère les .tar via SCP
2. Se connecte en SSH au NAS
3. Charge les images Docker
4. Lance docker-compose
5. Affiche l'URL d'accès

### 4. Accès application

**URL** : http://192.168.x.x:8080 (IP de votre NAS)

## ⚙️ Configuration

### Variables d'environnement (.env.production)

```env
# Backend
DATABASE_URL=sqlite:///./database/inventaire.db
SECRET_KEY=<générer avec openssl rand -hex 32>
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_URL=/api

# NAS
HOST_IP=192.168.1.100        # IP de votre NAS
EXTERNAL_PORT=8080           # Port exposé
```

### Volumes NAS

```yaml
volumes:
  database:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /volume1/docker/inventaire/database  # Chemin NAS
```

## 🔄 Mises à jour

### Mise à jour manuelle

```bash
# 1. Sur PC : Build nouvelle version
cd deployment/docker-nas/
scripts\build.bat

# 2. Exporter
scripts\export.bat

# 3. Déployer
scripts\deploy-to-nas.bat
```

### Mise à jour automatique (futur)

Script `update.bat` avec version :

```bash
scripts\update.bat v1.2.0
```

## 🛡️ Sécurité

- [ ] Changer SECRET_KEY par défaut
- [ ] Configurer firewall NAS (autoriser port 8080 seulement réseau local)
- [ ] Backup automatique database (cron quotidien NAS)
- [ ] Optionnel : HTTPS avec certificat auto-signé

## 📊 Monitoring

Accès logs :

```bash
# SSH sur NAS
ssh admin@192.168.x.x

# Logs backend
docker logs inventaire_backend -f

# Logs frontend
docker logs inventaire_frontend -f
```

## 🔧 Dépannage

### Erreur 404 sur /api

→ Vérifier `redirect_slashes=False` dans `backend/app/main.py`

### Erreur CORS

→ Vérifier que frontend utilise `/api` (chemin relatif) et non `http://localhost:8000/api`

### Base de données vide après redémarrage

→ Vérifier que volume database est bien monté sur NAS

## 📝 Prochaines Étapes

1. [ ] Copier fichiers depuis `docker-local/` et adapter
2. [ ] Créer scripts `build.bat`, `export.bat`, `deploy-to-nas.bat`
3. [ ] Configurer `.env.production`
4. [ ] Tester déploiement sur NAS
5. [ ] Documenter IP et port d'accès

---

**Retour** : [deployment/README.md](../README.md)
