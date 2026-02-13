# Production Cloud - Configuration Complète

Configuration Docker pour déploiement sur VPS cloud (optionnel - usage futur).

## 🎯 Objectif

Déployer l'application sur internet public avec SSL, monitoring et haute disponibilité.

## 📦 Stack Complète

- **Backend** : FastAPI + uvicorn
- **Frontend** : Build React + Nginx
- **Database** : PostgreSQL (au lieu de SQLite pour scalabilité)
- **Cache** : Redis pour sessions et cache queries
- **Reverse Proxy** : Nginx avec SSL (Let's Encrypt)
- **Monitoring** : Prometheus + Grafana
- **Logs** : Loki pour centralisation
- **Backup** : Automatique quotidien vers S3/Backblaze

## 🌐 Infrastructure

**Prérequis** :
- VPS : 2 CPU, 4GB RAM, 50GB SSD
- Domain : `inventaire.mondomaine.com`
- DNS : A record pointant vers IP du VPS

## 📁 Fichiers (à créer)

```
production/
├── README.md (ce fichier)
├── docker-compose.prod.yml    # Stack production complète
├── backend.Dockerfile          # Build backend optimisé
├── frontend.Dockerfile         # Build frontend optimisé
├── nginx-ssl.conf              # Nginx avec SSL
├── .env.production             # Variables sensibles (ne pas committer)
├── certbot/                    # Certificats SSL
│   └── init-letsencrypt.sh     # Script initialisation SSL
├── prometheus/
│   └── prometheus.yml          # Config monitoring
├── grafana/
│   └── dashboards/             # Dashboards personnalisés
└── scripts/
    ├── deploy.sh               # Déploiement initial
    ├── update.sh               # Mise à jour version
    └── backup.sh               # Script backup database
```

## 🚀 Déploiement Initial

### 1. Configuration serveur

```bash
# SSH sur VPS
ssh root@votre-vps-ip

# Installer Docker + Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cloner dépôt
git clone https://github.com/votre-username/inventaire.git
cd inventaire/deployment/production/
```

### 2. Configuration variables

```bash
# Copier exemple et éditer
cp .env.production.example .env.production
nano .env.production
```

Variables importantes :
```env
# Domain
DOMAIN=inventaire.mondomaine.com
ADMIN_EMAIL=vous@email.com

# Database PostgreSQL
POSTGRES_USER=inventaire
POSTGRES_PASSWORD=<générer mot de passe fort>
POSTGRES_DB=inventaire_db

# Backend
SECRET_KEY=<générer avec openssl rand -hex 32>
DATABASE_URL=postgresql://inventaire:password@postgres:5432/inventaire_db

# Redis
REDIS_URL=redis://redis:6379/0
```

### 3. Initialiser SSL

```bash
./certbot/init-letsencrypt.sh
```

### 4. Déployer

```bash
./scripts/deploy.sh
```

Ce script :
1. Build toutes les images
2. Lance docker-compose
3. Initialise database PostgreSQL
4. Configure certificats SSL
5. Lance Prometheus + Grafana

### 5. Accès

- **Application** : https://inventaire.mondomaine.com
- **Swagger API** : https://inventaire.mondomaine.com/api/docs
- **Grafana** : https://inventaire.mondomaine.com:3000 (admin/admin)
- **Prometheus** : https://inventaire.mondomaine.com:9090

## 🔄 Mises à Jour

```bash
# Sur VPS
cd /path/to/inventaire/deployment/production/

# Pull nouvelle version
git pull origin main

# Rebuild et redémarrer
./scripts/update.sh v1.2.0
```

Le script `update.sh` :
1. Backup database automatique
2. Build nouvelles images
3. Redémarrage gracieux (zero-downtime)
4. Vérification santé

## 💾 Backups

### Automatique (Cron quotidien)

```bash
# Crontab
0 2 * * * /path/to/inventaire/deployment/production/scripts/backup.sh
```

Le script backup :
1. Dump PostgreSQL
2. Compress en .tar.gz
3. Upload vers S3/Backblaze
4. Nettoie backups > 30 jours

### Manuel

```bash
./scripts/backup.sh
```

## 📊 Monitoring

### Prometheus Metrics

Endpoints exposés :
- `backend:8000/metrics` : Métriques FastAPI
- `postgres:9187/metrics` : Métriques PostgreSQL
- `redis:9121/metrics` : Métriques Redis

### Grafana Dashboards

Dashboards pré-configurés :
- **Overview** : CPU, RAM, Disk, Network
- **Application** : Requêtes/s, latence, erreurs
- **Database** : Connexions, queries lentes
- **Business** : Articles créés, mouvements, utilisateurs actifs

## 🛡️ Sécurité

### Checklist

- [x] **SSL/TLS** : Certificat Let's Encrypt auto-renouvelé
- [x] **Firewall** : UFW configuré (ports 80, 443, 22 uniquement)
- [x] **Secrets** : .env.production non committé (.gitignore)
- [x] **Database** : PostgreSQL non exposé publiquement
- [x] **Backup** : Quotidien automatique chiffré
- [ ] **Rate Limiting** : Nginx limite requêtes/IP (à configurer)
- [ ] **Fail2Ban** : Bannir IPs suspectes (à installer)
- [ ] **2FA** : Authentification à deux facteurs (v1.6.0)

### Logs Centralisés

```bash
# Consulter logs
docker logs inventaire_backend -f --tail 100

# Logs Loki (si configuré)
http://inventaire.mondomaine.com:3100
```

## 🔧 Dépannage

### Certificat SSL expiré

```bash
docker-compose run --rm certbot renew
docker-compose restart nginx
```

### Database migration

```bash
# Backup avant migration
./scripts/backup.sh

# Migration Alembic (si implémentée)
docker exec inventaire_backend alembic upgrade head
```

### Rollback version

```bash
# Restaurer backup
./scripts/restore.sh backup-2026-02-08.tar.gz

# Relancer ancienne version
git checkout v1.1.0
./scripts/update.sh v1.1.0
```

## 💰 Coûts Estimés

| Service | Provider | Coût/mois |
|---------|----------|-----------|
| VPS 2CPU/4GB | Hetzner/OVH | ~5-10€ |
| Domain .com | Namecheap | ~1€ |
| SSL | Let's Encrypt | Gratuit |
| Backup S3 50GB | Backblaze B2 | ~0.5€ |
| **TOTAL** | | **~7-12€/mois** |

## 📝 Prochaines Étapes

1. [ ] Acheter domain et VPS (optionnel - pas urgent)
2. [ ] Créer docker-compose.prod.yml
3. [ ] Créer scripts deploy.sh, update.sh, backup.sh
4. [ ] Configurer Prometheus + Grafana
5. [ ] Tester déploiement sur VPS de test

---

**Note** : Cette configuration est **optionnelle** et pour usage futur si besoin d'accès internet public.

Pour usage maison, `docker-nas/` suffit amplement.

---

**Retour** : [deployment/README.md](../README.md)
