# Déploiement Raspberry Pi 3B+ / 4

Configuration optimisée pour Raspberry Pi (ARM architecture).

## 🎯 Objectif

Héberger l'application d'inventaire sur Raspberry Pi pour usage maison 24/7.

## 📊 Compatibilité

| Modèle | RAM | CPU | Statut |
|--------|-----|-----|--------|
| **Raspberry Pi 3B+** | 1GB | Quad-core ARM A53 @ 1.4GHz | ✅ Testé et fonctionnel |
| **Raspberry Pi 4** | 2/4/8GB | Quad-core ARM A72 @ 1.5GHz | ✅ Recommandé |
| Raspberry Pi 3B | 1GB | Quad-core ARM A53 @ 1.2GHz | ⚠️ Possible (lent) |
| Raspberry Pi Zero | 512MB | Single-core ARM | ❌ Insuffisant |

## 🚀 Prérequis

### Matériel

- ✅ Raspberry Pi 3B+ ou supérieur
- ✅ Alimentation officielle (5V/2.5A minimum)
- ✅ **SSD USB 128GB** (fortement recommandé au lieu de carte SD)
- ✅ Carte microSD 16GB (pour OS seulement)
- ✅ Boîtier avec ventilateur (recommandé pour éviter throttling)
- ✅ Câble Ethernet (Wi-Fi OK mais Ethernet préférable)

### Logiciel

- **OS** : Raspberry Pi OS Lite 64-bit (pas de GUI nécessaire)
- **Docker** : v20.10+ avec support ARM
- **Docker Compose** : v2.0+

---

## 📋 Installation Complète

### Étape 1 : Préparer Raspberry Pi

#### 1.1 Flasher Raspberry Pi OS

**Sur PC Windows** :
1. Télécharger [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Insérer carte microSD
3. Choisir OS : **Raspberry Pi OS Lite (64-bit)**
4. Configurer :
   - Hostname : `inventaire-pi`
   - SSH : Activer
   - Wi-Fi : Configurer (si pas Ethernet)
   - User/Password : Définir
5. Flasher

#### 1.2 Préparer SSD USB

```bash
# Sur Raspberry Pi (après premier boot)
ssh pi@inventaire-pi.local

# Identifier SSD
lsblk
# Exemple : /dev/sda

# Formater en ext4
sudo mkfs.ext4 /dev/sda1

# Créer point de montage
sudo mkdir -p /mnt/ssd

# Monter
sudo mount /dev/sda1 /mnt/ssd

# Montage automatique au boot
echo '/dev/sda1 /mnt/ssd ext4 defaults 0 2' | sudo tee -a /etc/fstab

# Vérifier
df -h
```

### Étape 2 : Installer Docker

```bash
# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Ajouter user au groupe docker
sudo usermod -aG docker $USER

# Redémarrer pour appliquer
sudo reboot

# Vérifier (après reboot)
docker --version
docker compose version
```

### Étape 3 : Configurer stockage Docker sur SSD

```bash
# Arrêter Docker
sudo systemctl stop docker

# Créer dossier sur SSD
sudo mkdir -p /mnt/ssd/docker

# Sauvegarder config existante
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak 2>/dev/null || true

# Configurer Docker pour utiliser SSD
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "data-root": "/mnt/ssd/docker",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Déplacer données existantes (si nécessaire)
sudo rsync -aP /var/lib/docker/ /mnt/ssd/docker/

# Redémarrer Docker
sudo systemctl start docker

# Vérifier
docker info | grep "Docker Root Dir"
# Doit afficher : /mnt/ssd/docker
```

---

## 🐳 Déploiement Application

### Option A : Images pré-construites (RECOMMANDÉ)

**Sur votre PC Windows** :

```bash
# 1. Construire images multi-arch
cd deployment/raspberry-pi/
scripts\build-arm.bat

# Cela crée :
# - inventaire-backend:arm64
# - inventaire-frontend:arm64

# 2. Exporter en .tar
docker save inventaire-backend:arm64 -o inventaire-backend-arm64.tar
docker save inventaire-frontend:arm64 -o inventaire-frontend-arm64.tar

# 3. Transférer vers Raspberry Pi
scp inventaire-backend-arm64.tar pi@inventaire-pi.local:/home/pi/
scp inventaire-frontend-arm64.tar pi@inventaire-pi.local:/home/pi/
scp docker-compose.yml pi@inventaire-pi.local:/home/pi/
scp .env.production pi@inventaire-pi.local:/home/pi/.env
```

**Sur Raspberry Pi** :

```bash
ssh pi@inventaire-pi.local

# Charger images
docker load -i inventaire-backend-arm64.tar
docker load -i inventaire-frontend-arm64.tar

# Créer dossiers
mkdir -p /mnt/ssd/inventaire/{database,exports,uploads}

# Lancer application
docker compose up -d

# Vérifier logs
docker compose logs -f
```

### Option B : Build direct sur Raspberry Pi (LENT)

**Attention** : Build peut prendre **30-60 minutes** sur RPi 3B+.

```bash
# Cloner dépôt
git clone https://github.com/votre-username/inventaire.git
cd inventaire/deployment/raspberry-pi/

# Build (LENT !)
docker compose build

# Lancer
docker compose up -d
```

---

## ⚙️ Configuration

### docker-compose.yml (optimisé RPi)

```yaml
version: '3.8'

services:
  backend:
    image: inventaire-backend:arm64
    container_name: inventaire_backend
    restart: unless-stopped
    environment:
      - DATABASE_URL=sqlite:///./database/inventaire.db
      - SECRET_KEY=${SECRET_KEY}
      - API_HOST=0.0.0.0
      - API_PORT=8000
    volumes:
      - /mnt/ssd/inventaire/database:/app/database
      - /mnt/ssd/inventaire/exports:/app/exports
      - /mnt/ssd/inventaire/uploads:/app/uploads
    mem_limit: 256m        # Limiter RAM
    mem_reservation: 128m
    cpus: 2                # Utiliser 2 cores max
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: inventaire-frontend:arm64
    container_name: inventaire_frontend
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend
    mem_limit: 128m        # Nginx très léger
    mem_reservation: 64m
    cpus: 1
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### .env.production

```env
# Backend
SECRET_KEY=<générer avec : openssl rand -hex 32>
DATABASE_URL=sqlite:///./database/inventaire.db
API_HOST=0.0.0.0
API_PORT=8000

# Frontend
VITE_API_URL=/api

# Raspberry Pi
HOST_IP=192.168.1.XXX    # IP de votre RPi
EXTERNAL_PORT=8080
```

---

## 🌡️ Monitoring & Performance

### Température CPU

```bash
# Vérifier température (doit rester < 70°C)
vcgencmd measure_temp

# Monitoring continu
watch -n 2 vcgencmd measure_temp
```

**Si > 70°C** : Ajouter ventilateur ou dissipateur.

### RAM Usage

```bash
# Utilisation RAM
free -h

# RAM utilisée par Docker
docker stats --no-stream
```

### Logs Docker

```bash
# Logs backend
docker logs inventaire_backend -f --tail 100

# Logs frontend
docker logs inventaire_frontend -f --tail 100
```

---

## 🔧 Optimisations Raspberry Pi

### 1. Désactiver Swap sur SD Card (utiliser SSD)

```bash
# Désactiver swap SD
sudo dphys-swapfile swapoff
sudo dphys-swapfile uninstall
sudo systemctl disable dphys-swapfile

# Créer swap sur SSD (2GB)
sudo dd if=/dev/zero of=/mnt/ssd/swapfile bs=1M count=2048
sudo chmod 600 /mnt/ssd/swapfile
sudo mkswap /mnt/ssd/swapfile
sudo swapon /mnt/ssd/swapfile

# Montage auto
echo '/mnt/ssd/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 2. Réduire logs Docker (économiser espace)

Déjà configuré dans `daemon.json` (max 3 fichiers x 10MB).

### 3. Activer auto-restart conteneurs

Déjà configuré dans `docker-compose.yml` avec `restart: unless-stopped`.

---

## 🛡️ Sécurité

### Firewall (UFW)

```bash
# Installer UFW
sudo apt install ufw -y

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser port application (réseau local uniquement)
sudo ufw allow from 192.168.1.0/24 to any port 8080

# Activer
sudo ufw enable
```

### Backup automatique

```bash
# Créer script backup
sudo tee /mnt/ssd/backup-inventaire.sh > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/mnt/ssd/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec inventaire_backend sqlite3 /app/database/inventaire.db ".backup /app/database/backup-$DATE.db"

# Compresser
tar -czf $BACKUP_DIR/inventaire-$DATE.tar.gz \
    /mnt/ssd/inventaire/database/backup-$DATE.db \
    /mnt/ssd/inventaire/exports \
    /mnt/ssd/inventaire/uploads

# Nettoyer backups > 7 jours
find $BACKUP_DIR -name "inventaire-*.tar.gz" -mtime +7 -delete

# Nettoyer backup temporaire
rm /mnt/ssd/inventaire/database/backup-$DATE.db
EOF

sudo chmod +x /mnt/ssd/backup-inventaire.sh

# Cron quotidien à 2h du matin
(crontab -l 2>/dev/null; echo "0 2 * * * /mnt/ssd/backup-inventaire.sh") | crontab -
```

---

## 🚀 Accès Application

**URL** : http://192.168.1.XXX:8080 (remplacer par IP de votre RPi)

**Trouver IP Raspberry Pi** :
```bash
hostname -I
```

---

## 🔄 Mises à jour

```bash
# Sur PC : Build nouvelle version ARM
cd deployment/raspberry-pi/
scripts\build-arm.bat
scripts\export-arm.bat

# Transférer vers RPi
scp inventaire-*.tar pi@inventaire-pi.local:/home/pi/

# Sur RPi : Charger et redémarrer
ssh pi@inventaire-pi.local
docker load -i inventaire-backend-arm64.tar
docker load -i inventaire-frontend-arm64.tar
docker compose up -d
```

---

## 💡 Conseils

### ✅ Avantages RPi 3B+

- Consommation : ~5W (vs 50-100W NAS)
- Silencieux
- Peu coûteux
- Compact

### ⚠️ Limitations

- Pas pour usage professionnel / haute charge
- Max 5-10 utilisateurs simultanés
- Pas de redondance / haute disponibilité
- Build Docker lent (utiliser PC pour build)

### 🎯 Idéal pour

- Inventaire personnel/familial
- Atelier hobbyiste
- Prototype / tests
- Apprentissage DevOps

---

## 📝 Prochaines Étapes

1. [ ] Flasher Raspberry Pi OS
2. [ ] Connecter SSD USB
3. [ ] Installer Docker
4. [ ] Transférer images depuis PC
5. [ ] Lancer application
6. [ ] Configurer backup automatique

---

**Besoin d'aide ?** Consulter [docs/ROADMAP.md](../../docs/ROADMAP.md)
