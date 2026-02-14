# Guide de Sécurité Production - Inventaire

Documentation complète des mesures de sécurité pour déploiement production.

## 📋 Checklist Sécurité (Phase 6 - v1.9.0)

### ✅ Backup & Restauration
- [x] Scripts backup automatisés (`deployment/backup/`)
- [x] Rétention: 7 quotidiens + 4 hebdomadaires + 12 mensuels
- [x] Test automatisé de restauration mensuel
- [x] Sync cloud optionnel (rclone)
- [x] Vérification espace disque

### ✅ Secrets Management
- [x] detect-secrets configuré (`.secrets.baseline`)
- [x] Pre-commit hooks (Black, ESLint, secrets scan)
- [x] Validation variables d'environnement
- [x] Génération secrets sécurisés (openssl)
- [x] Documentation rotation clés

### 🔄 HTTPS & Chiffrement
- [ ] Certificat Let's Encrypt (Traefik auto-renew)
- [ ] HSTS headers (Strict-Transport-Security)
- [ ] Redirection HTTP → HTTPS automatique
- [ ] TLS 1.2+ uniquement (pas SSLv3/TLS1.0)

### 🔄 Logging & Monitoring
- [ ] Logs structurés JSON
- [ ] Rotation logs (30 jours, 100 MB max)
- [ ] Logs échecs authentification
- [ ] Monitoring uptime (Uptime Kuma)

### ✅ Déjà Implémenté (Phases 1-2)
- [x] Rate limiting (5 tentatives login / 15 min)
- [x] Validation inputs (XSS, injection SQL)
- [x] Protection CSRF (SameSite cookies)
- [x] Permissions granulaires (JWT avec role)
- [x] Tests sécurité (201 tests backend, 82 tests frontend)

## 🚀 Déploiement Sécurisé Rapide

### Option A: NAS/Serveur Local (Recommandé)

```bash
# 1. Cloner le projet
git clone https://github.com/votre-user/inventaire.git
cd inventaire

# 2. Configurer .env
cp .env.example .env
nano .env  # Générer SECRET_KEY avec: openssl rand -hex 32

# 3. Build Docker
docker-compose build

# 4. Démarrer
docker-compose up -d

# 5. Configurer backups quotidiens
crontab -e
# Ajouter: 0 2 * * * /path/to/inventaire/deployment/backup/backup.sh
```

### Option B: VPS Cloud (HTTPS automatique)

```bash
# 1-2. Comme Option A

# 3. Configurer domaine DNS
# Pointer inventaire.example.com vers IP du VPS

# 4. Démarrer avec Traefik (HTTPS auto)
docker-compose -f docker-compose-traefik.yml up -d

# 5. Vérifier HTTPS
curl https://inventaire.example.com/api/health
```

## 🔒 Configuration HTTPS (Traefik)

### docker-compose-traefik.yml

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --certificatesresolvers.letsencrypt.acme.email=admin@example.com
      - --certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./letsencrypt:/letsencrypt
    networks:
      - web

  backend:
    build: ./backend
    labels:
      - traefik.enable=true
      - traefik.http.routers.backend.rule=Host(`inventaire.example.com`) && PathPrefix(`/api`)
      - traefik.http.routers.backend.entrypoints=websecure
      - traefik.http.routers.backend.tls.certresolver=letsencrypt
      # Redirection HTTP → HTTPS
      - traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https
      - traefik.http.routers.backend-http.rule=Host(`inventaire.example.com`)
      - traefik.http.routers.backend-http.entrypoints=web
      - traefik.http.routers.backend-http.middlewares=redirect-to-https
    environment:
      - SECRET_KEY=${SECRET_KEY}
    networks:
      - web

  frontend:
    build: ./frontend
    labels:
      - traefik.enable=true
      - traefik.http.routers.frontend.rule=Host(`inventaire.example.com`)
      - traefik.http.routers.frontend.entrypoints=websecure
      - traefik.http.routers.frontend.tls.certresolver=letsencrypt
      - traefik.http.routers.frontend-http.rule=Host(`inventaire.example.com`)
      - traefik.http.routers.frontend-http.entrypoints=web
      - traefik.http.routers.frontend-http.middlewares=redirect-to-https
    networks:
      - web

networks:
  web:
    external: true
```

### HSTS Headers (Security Headers)

Ajouter middleware Traefik pour headers sécurité :

```yaml
# Dans traefik service, ajouter:
- traefik.http.middlewares.security-headers.headers.stsSeconds=31536000
- traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true
- traefik.http.middlewares.security-headers.headers.stsPreload=true
- traefik.http.middlewares.security-headers.headers.forceSTSHeader=true
- traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true
- traefik.http.middlewares.security-headers.headers.browserXssFilter=true
- traefik.http.middlewares.security-headers.headers.frameDeny=true
```

## 📊 Logging Production

### Configuration Backend (Python)

```python
# backend/app/logging_config.py
import logging.config
import json
from datetime import datetime

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": "%(message)s",
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter"
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "stream": "ext://sys.stdout"
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "formatter": "json",
            "filename": "/app/logs/application.log",
            "maxBytes": 100 * 1024 * 1024,  # 100 MB
            "backupCount": 5
        }
    },
    "loggers": {
        "uvicorn": {"level": "INFO", "handlers": ["console", "file"]},
        "app": {"level": "INFO", "handlers": ["console", "file"]}
    }
}

# Dans main.py:
import logging.config
from app.logging_config import LOGGING_CONFIG

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("app")
```

### Rotation Logs (logrotate)

```
# /etc/logrotate.d/inventaire
/app/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    sharedscripts
    postrotate
        docker-compose exec backend kill -USR1 1
    endscript
}
```

## 🛡️ Hardening Supplémentaire

### Firewall (UFW)

```bash
# Activer firewall
sudo ufw enable

# Autoriser seulement SSH, HTTP, HTTPS
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (redirect vers HTTPS)
sudo ufw allow 443/tcp  # HTTPS

# Vérifier
sudo ufw status
```

### Fail2ban (Protection brute force)

```ini
# /etc/fail2ban/jail.d/inventaire.conf
[inventaire-auth]
enabled = true
port = http,https
filter = inventaire-auth
logpath = /app/logs/application.log
maxretry = 5
bantime = 3600
findtime = 600

# /etc/fail2ban/filter.d/inventaire-auth.conf
[Definition]
failregex = ^.*"username": ".*", "success": false.*$
ignoreregex =
```

### Auto-updates (unattended-upgrades)

```bash
# Installer
sudo apt install unattended-upgrades

# Configurer
sudo dpkg-reconfigure -plow unattended-upgrades

# Vérifier
sudo systemctl status unattended-upgrades
```

## 📅 Maintenance Régulière

### Hebdomadaire
- [ ] Vérifier logs d'erreurs : `tail -100 /app/logs/application.log`
- [ ] Vérifier espace disque : `df -h`
- [ ] Vérifier backups : `ls -lh /app/backups/daily/`

### Mensuel (1er du mois)
- [ ] Test de restauration automatique (cron)
- [ ] Vérifier certificat HTTPS : `echo | openssl s_client -connect inventaire.example.com:443 2>/dev/null | openssl x509 -noout -dates`
- [ ] Scan vulnérabilités : `docker scan inventaire-backend:latest`
- [ ] Audit logs échecs auth

### Semestriel
- [ ] Rotation SECRET_KEY (users doivent se reconnecter)
- [ ] Review permissions utilisateurs
- [ ] Update dépendances : `pip list --outdated`, `npm outdated`

## 🆘 Contacts & Support

- **Documentation** : `docs/`
- **Issues GitHub** : https://github.com/votre-user/inventaire/issues
- **Email support** : admin@example.com

---

**Dernière mise à jour** : 2026-02-14 (Phase 6 - v1.9.0)
