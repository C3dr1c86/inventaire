# Déploiement sur NAS (Synology/QNAP/Ugreen)

Ce guide explique comment déployer l'application Inventaire sur votre NAS en utilisant les images Docker pré-construites.

## Prérequis

- NAS avec Docker installé (Container Station pour QNAP, Docker pour Synology/Ugreen)
- Accès SSH au NAS
- Au moins 2 GB de RAM disponible
- 10 GB d'espace disque libre

## Méthode 1 : Déploiement automatisé depuis PC (Recommandé)

### Configuration initiale

1. **Créer un fichier `.env` sur votre PC** dans le dossier `deployment/nas/`:

```bash
# Copier le fichier d'exemple
cp .env.example .env
```

2. **Éditer `.env` avec vos paramètres**:

```env
# Connexion au NAS
NAS_HOST=192.168.1.100        # IP de votre NAS
NAS_USER=admin                 # Utilisateur SSH
NAS_DEPLOY_PATH=/volume1/docker/inventaire  # Chemin de déploiement

# Configuration application
SECRET_KEY=YOUR-SECRET-KEY-HERE-GENERATE-WITH-OPENSSL
VITE_API_URL=http://192.168.1.100/api  # URL de votre NAS
CORS_ORIGINS=http://192.168.1.100,http://localhost

# Port d'accès (changez si port 80 déjà utilisé)
FRONTEND_PORT=80
```

3. **Générer une clé secrète JWT**:

```bash
# Windows (Git Bash / WSL)
openssl rand -hex 32

# Copier le résultat dans SECRET_KEY dans .env
```

### Déploiement

#### Windows

```batch
cd deployment\nas
deploy.bat
```

#### Linux/Mac

```bash
cd deployment/nas
chmod +x deploy.sh
./deploy.sh
```

**Le script va automatiquement**:
1. Se connecter au NAS via SSH
2. Créer les dossiers nécessaires
3. Copier docker-compose.yml et .env
4. Télécharger les images Docker depuis GitHub Container Registry
5. Démarrer les conteneurs

### Vérification

Après le déploiement:

1. **Vérifier que les conteneurs tournent**:

```bash
ssh admin@192.168.1.100
cd /volume1/docker/inventaire
docker-compose ps

# Vous devriez voir:
# inventaire-backend    running
# inventaire-frontend   running
```

2. **Accéder à l'application**:

```
http://192.168.1.100
```

3. **Créer le premier utilisateur** (première connexion):

- Cliquez sur "S'inscrire"
- Créez un compte admin

## Méthode 2 : Déploiement manuel via interface NAS

### 1. Préparer les fichiers

Sur votre PC, créez un dossier `inventaire` avec:

```
inventaire/
├── docker-compose.yml
└── .env
```

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/c3dr1c86/inventaire/backend:latest
    container_name: inventaire-backend
    restart: unless-stopped
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=sqlite:///./database/inventaire.db
      - CORS_ORIGINS=${CORS_ORIGINS}
    volumes:
      - ./data/database:/app/database
      - ./data/exports:/app/exports
      - ./data/uploads:/app/uploads
    healthcheck:
      test: python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health').read()" || exit 1
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - inventaire-network

  frontend:
    image: ghcr.io/c3dr1c86/inventaire/frontend:latest
    container_name: inventaire-frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=${VITE_API_URL}
    ports:
      - "${FRONTEND_PORT:-80}:80"
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - inventaire-network

networks:
  inventaire-network:
    driver: bridge

volumes:
  backend_data:
  frontend_assets:
```

**.env**:
```env
SECRET_KEY=GENERATE-WITH-OPENSSL-RAND-HEX-32
VITE_API_URL=http://192.168.1.100/api
CORS_ORIGINS=http://192.168.1.100,http://localhost
FRONTEND_PORT=80
```

### 2. Transférer sur le NAS

1. Ouvrir File Station / File Manager sur votre NAS
2. Créer un dossier `/docker/inventaire`
3. Uploader `docker-compose.yml` et `.env`

### 3. Déployer via Container Station

#### Synology

1. Ouvrir **Docker** > **Projet**
2. Cliquer sur **Créer** > **Depuis docker-compose**
3. Sélectionner le fichier `docker-compose.yml`
4. Nommer le projet: `inventaire`
5. Démarrer

#### QNAP

1. Ouvrir **Container Station**
2. Aller dans **Créer**
3. Choisir **Créer une application**
4. Coller le contenu de `docker-compose.yml`
5. Démarrer

#### Ugreen

1. Ouvrir **UGOS** > **Docker**
2. Créer un nouveau projet Docker Compose
3. Uploader `docker-compose.yml`
4. Démarrer

## Méthode 3 : Ligne de commande SSH (Avancé)

```bash
# Se connecter au NAS
ssh admin@192.168.1.100

# Créer le dossier de déploiement
mkdir -p /volume1/docker/inventaire
cd /volume1/docker/inventaire

# Créer docker-compose.yml
nano docker-compose.yml
# (coller le contenu du docker-compose.yml ci-dessus)

# Créer .env
nano .env
# (remplir avec vos valeurs)

# Télécharger les images
docker-compose pull

# Démarrer les conteneurs
docker-compose up -d

# Vérifier les logs
docker-compose logs -f
```

## Gestion des conteneurs

### Commandes utiles

```bash
# Voir les conteneurs en cours
docker-compose ps

# Voir les logs
docker-compose logs -f

# Redémarrer les conteneurs
docker-compose restart

# Arrêter les conteneurs
docker-compose stop

# Démarrer les conteneurs
docker-compose start

# Supprimer les conteneurs (garde les données)
docker-compose down

# Supprimer conteneurs ET volumes (PERD TOUTES LES DONNÉES)
docker-compose down -v
```

### Mettre à jour vers une nouvelle version

```bash
cd /volume1/docker/inventaire

# Télécharger les nouvelles images
docker-compose pull

# Redémarrer avec les nouvelles images
docker-compose up -d

# Vérifier que tout fonctionne
docker-compose ps
docker-compose logs
```

## Sauvegarde des données

### Emplacement des données

- **Base de données**: `./data/database/inventaire.db`
- **Exports**: `./data/exports/`
- **Uploads**: `./data/uploads/`

### Créer une sauvegarde manuelle

```bash
# Se connecter au NAS
ssh admin@192.168.1.100
cd /volume1/docker/inventaire

# Créer un dossier de backup
mkdir -p backups

# Backup avec horodatage
tar -czf backups/inventaire-backup-$(date +%Y%m%d-%H%M%S).tar.gz data/

# Vérifier le backup
ls -lh backups/
```

### Script de sauvegarde automatique (Cron)

```bash
# Créer un script de backup
nano /volume1/docker/inventaire/backup.sh

# Contenu du script:
#!/bin/bash
BACKUP_DIR="/volume1/docker/inventaire/backups"
DATA_DIR="/volume1/docker/inventaire/data"
DATE=$(date +%Y%m%d-%H%M%S)

# Créer le backup
tar -czf "$BACKUP_DIR/inventaire-backup-$DATE.tar.gz" "$DATA_DIR"

# Garder seulement les 7 derniers backups
cd "$BACKUP_DIR"
ls -t | tail -n +8 | xargs -r rm

echo "Backup terminé: inventaire-backup-$DATE.tar.gz"

# Rendre exécutable
chmod +x backup.sh

# Ajouter au cron (backup quotidien à 2h du matin)
crontab -e
# Ajouter cette ligne:
0 2 * * * /volume1/docker/inventaire/backup.sh >> /volume1/docker/inventaire/backups/backup.log 2>&1
```

## Dépannage

### Les conteneurs ne démarrent pas

```bash
# Vérifier les logs
docker-compose logs

# Problème courant: Port 80 déjà utilisé
# Solution: Changer FRONTEND_PORT dans .env
FRONTEND_PORT=8080
docker-compose up -d
```

### Erreur de connexion à l'API

1. Vérifier que VITE_API_URL dans `.env` correspond à l'IP de votre NAS
2. Vérifier que CORS_ORIGINS inclut l'IP de votre NAS
3. Redémarrer les conteneurs après modification de `.env`

```bash
docker-compose restart
```

### Base de données corrompue

```bash
# Restaurer depuis un backup
cd /volume1/docker/inventaire
tar -xzf backups/inventaire-backup-YYYYMMDD-HHMMSS.tar.gz
docker-compose restart
```

### Voir les logs en temps réel

```bash
# Tous les conteneurs
docker-compose logs -f

# Backend seulement
docker-compose logs -f backend

# Frontend seulement
docker-compose logs -f frontend
```

## Accès depuis l'extérieur (HTTPS avec Let's Encrypt)

Voir [HTTPS-SETUP.md](../production/HTTPS-SETUP.md) pour configurer:
- Nom de domaine
- Reverse proxy Nginx
- Certificat SSL Let's Encrypt
- Renouvellement automatique

## Support

En cas de problème:
1. Vérifier les logs: `docker-compose logs`
2. Vérifier que les ports ne sont pas déjà utilisés
3. Vérifier que le NAS a assez de RAM/disque
4. Consulter [DEPLOYMENT.md](../../DEPLOYMENT.md) pour plus de détails
