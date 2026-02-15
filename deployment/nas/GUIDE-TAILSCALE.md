# Guide Tailscale - Accès VPN sécurisé (100% Gratuit)

## 🎯 Objectif

Accéder à votre application Inventaire depuis n'importe où via un **VPN privé moderne** :
- ✅ **100% Gratuit** jusqu'à 100 appareils
- ✅ **Aucun domaine nécessaire** (URL automatique fournie)
- ✅ **HTTPS automatique** avec certificat SSL gratuit
- ✅ **Très sécurisé** (WireGuard VPN)
- ✅ **Zero configuration** de réseau
- ✅ **Pas d'ouverture de ports** sur votre box
- ✅ **Plus simple** que Cloudflare Tunnel

**Différence avec Cloudflare Tunnel** :
- ⚠️ Nécessite installer Tailscale sur **chaque appareil** qui accède à l'app (téléphone, PC, tablette)
- ✅ Pas besoin de domaine
- ✅ Accès privé uniquement (pas public sur Internet)

---

## 📋 Prérequis

1. **Compte Tailscale** (gratuit) : https://login.tailscale.com/start
2. **Application Inventaire** déjà déployée sur le NAS
3. **5 minutes** de configuration

---

## 🚀 Étape 1 : Créer un compte Tailscale

### 1.1 S'inscrire

1. Allez sur https://login.tailscale.com/start
2. Connectez-vous avec :
   - **GitHub** (recommandé)
   - **Google**
   - **Microsoft**
   - Email

3. Acceptez les conditions d'utilisation

### 1.2 Récupérer votre Auth Key

1. Une fois connecté, allez dans **Settings** (engrenage en haut à droite)
2. Cliquez sur **Keys** dans le menu de gauche
3. Cliquez sur **Generate auth key**
4. Configurez :
   - **Description** : `NAS Ugreen Inventaire`
   - **Reusable** : ✅ (cochez)
   - **Ephemeral** : ❌ (ne cochez pas)
   - **Expiration** : `90 days` (ou `No expiration`)
   - **Tags** : (laisser vide)

5. Cliquez sur **Generate key**
6. **Copiez la clé** qui ressemble à :
   ```
   tskey-auth-kVxyz1234CNTRL-abcdefghijklmnopqrstuvwxyz1234567890
   ```

⚠️ **Gardez cette clé secrète** - c'est la clé d'accès à votre réseau privé !

---

## 🐳 Étape 2 : Déployer Tailscale sur le NAS

### 2.1 Créer le docker-compose avec Tailscale

Vous allez ajouter le service Tailscale à votre docker-compose actuel.

**Nouveau fichier : `docker-compose-tailscale.yml`**

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/c3dr1c86/inventaire/backend:latest
    container_name: inventaire-backend
    restart: unless-stopped
    user: "0:0"
    environment:
      - SECRET_KEY=ac68ceb02c5ca196e5d82e7290f1c053e08cd865caaea43ffe1da3fe7ad27ca8
      - DATABASE_URL=sqlite:///./database/inventaire.db
      # CORS : Autoriser le domaine Tailscale (sera mis à jour après)
      - CORS_ORIGINS=https://inventaire-nas.tail1234.ts.net,http://localhost
    volumes:
      - ./data/database:/app/database
      - ./data/exports:/app/exports
      - ./data/uploads:/app/uploads
    networks:
      - inventaire-network

  frontend:
    image: ghcr.io/c3dr1c86/inventaire/frontend:latest
    container_name: inventaire-frontend
    restart: unless-stopped
    environment:
      - VITE_API_URL=http://inventaire-backend:8000/api
    networks:
      - inventaire-network

  tailscale:
    image: tailscale/tailscale:latest
    container_name: inventaire-tailscale
    restart: unless-stopped
    hostname: inventaire-nas
    environment:
      # IMPORTANT: Remplacez par votre Auth Key Tailscale
      - TS_AUTHKEY=tskey-auth-VOTRE_CLE_ICI
      - TS_STATE_DIR=/var/lib/tailscale
      - TS_SOCKET=/var/run/tailscale/tailscaled.sock
      # Activer HTTPS automatique avec certificats Tailscale
      - TS_SERVE_CONFIG=/config/tailscale-serve.json
      - TS_EXTRA_ARGS=--advertise-tags=tag:container
    volumes:
      - tailscale-state:/var/lib/tailscale
      - /dev/net/tun:/dev/net/tun
      - ./tailscale-config:/config
    cap_add:
      - NET_ADMIN
      - NET_RAW
    networks:
      - inventaire-network
    sysctls:
      - net.ipv4.ip_forward=1
      - net.ipv6.conf.all.forwarding=1

  # Proxy pour exposer le frontend via Tailscale avec HTTPS
  tailscale-proxy:
    image: nginx:alpine
    container_name: inventaire-tailscale-proxy
    restart: unless-stopped
    depends_on:
      - frontend
      - tailscale
    volumes:
      - ./nginx-tailscale.conf:/etc/nginx/conf.d/default.conf:ro
    network_mode: "service:tailscale"

networks:
  inventaire-network:
    driver: bridge

volumes:
  tailscale-state:
```

### 2.2 Créer la configuration Nginx pour le proxy

Créez le fichier `nginx-tailscale.conf` :

```nginx
server {
    listen 80;
    server_name _;

    # Proxy vers le frontend
    location / {
        proxy_pass http://inventaire-frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy vers le backend API
    location /api {
        proxy_pass http://inventaire-backend:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2.3 Créer la configuration Tailscale Serve

Créez le dossier et fichier `tailscale-config/tailscale-serve.json` :

```bash
mkdir -p tailscale-config
```

Contenu du fichier `tailscale-serve.json` :

```json
{
  "TCP": {
    "443": {
      "HTTPS": true
    }
  },
  "Web": {
    "inventaire-nas:443": {
      "Handlers": {
        "/": {
          "Proxy": "http://127.0.0.1:80"
        }
      }
    }
  }
}
```

### 2.4 Déployer sur le NAS

#### Option A : Via interface UGOS

1. Ouvrez http://192.168.1.37
2. **Docker** > **Projets** > `inventaire`
3. Cliquez sur **"Éditer"**
4. Remplacez par le contenu de `docker-compose-tailscale.yml` (avec votre Auth Key)
5. Via SSH, créez les fichiers de config :
   ```bash
   cd /home/Cédric/docker/inventaire
   # Créez nginx-tailscale.conf et tailscale-config/tailscale-serve.json
   ```
6. Cliquez sur **"Mettre à jour et redémarrer"**

#### Option B : Via SSH

```bash
cd /home/Cédric/docker/inventaire

# Créer les fichiers de configuration
mkdir -p tailscale-config

# Créez nginx-tailscale.conf (copiez le contenu ci-dessus)
nano nginx-tailscale.conf

# Créez tailscale-serve.json (copiez le contenu ci-dessus)
nano tailscale-config/tailscale-serve.json

# Arrêter l'ancienne version
sudo docker compose down

# Démarrer avec Tailscale
sudo docker compose -f docker-compose-tailscale.yml up -d

# Vérifier les logs
sudo docker logs -f inventaire-tailscale
```

Vous devriez voir :
```
Logged in!
Tailscale started successfully
```

---

## 🔗 Étape 3 : Récupérer l'URL Tailscale

### 3.1 Vérifier la connexion

1. Allez sur https://login.tailscale.com/admin/machines
2. Vous devriez voir **"inventaire-nas"** dans la liste
3. Cliquez sur le nom pour voir les détails

### 3.2 Obtenir l'URL HTTPS

Votre NAS est maintenant accessible via :
```
https://inventaire-nas.tail<VOTRE-ID>.ts.net
```

**Exemple** : `https://inventaire-nas.tail1a2b3c.ts.net`

📋 **Copiez cette URL** - c'est votre adresse d'accès externe !

### 3.3 Mettre à jour CORS_ORIGINS

Maintenant que vous avez l'URL Tailscale, mettez à jour le backend :

Dans `docker-compose-tailscale.yml`, ligne 12 :
```yaml
- CORS_ORIGINS=https://inventaire-nas.tail1a2b3c.ts.net,http://localhost
```

Redémarrez le backend :
```bash
sudo docker restart inventaire-backend
```

---

## 📱 Étape 4 : Installer Tailscale sur vos appareils

Pour accéder à l'application depuis l'extérieur, **chaque appareil** doit avoir Tailscale installé.

### 4.1 Android

1. Téléchargez **Tailscale** sur Google Play Store
2. Ouvrez l'app et connectez-vous (même compte que l'étape 1)
3. Activez le VPN (bouton bleu)
4. Ouvrez Chrome et allez sur `https://inventaire-nas.tail1a2b3c.ts.net`

### 4.2 iPhone/iPad

1. Téléchargez **Tailscale** sur l'App Store
2. Ouvrez l'app et connectez-vous
3. Activez le VPN
4. Ouvrez Safari et allez sur `https://inventaire-nas.tail1a2b3c.ts.net`

### 4.3 Windows

1. Téléchargez Tailscale : https://tailscale.com/download/windows
2. Installez et connectez-vous
3. Ouvrez votre navigateur et allez sur `https://inventaire-nas.tail1a2b3c.ts.net`

### 4.4 Mac

1. Téléchargez Tailscale : https://tailscale.com/download/mac
2. Installez et connectez-vous
3. Ouvrez votre navigateur et allez sur `https://inventaire-nas.tail1a2b3c.ts.net`

### 4.5 Linux

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

---

## ✅ Étape 5 : Tester

1. **Sur votre téléphone** (avec Tailscale activé)
2. Allez sur `https://inventaire-nas.tail1a2b3c.ts.net`
3. ✅ Vous devriez voir la page de connexion !

🎉 **Félicitations !** Votre application est accessible depuis n'importe où via Tailscale !

---

## 🔒 Sécurité et contrôle d'accès

### Approuver les nouveaux appareils

Par défaut, tous les appareils connectés à votre compte Tailscale peuvent accéder au NAS.

**Pour plus de sécurité** :

1. Allez sur https://login.tailscale.com/admin/settings/keys
2. Activez **"Require device approval"**
3. Désormais, chaque nouvel appareil nécessitera votre approbation manuelle

### Partager l'accès avec d'autres personnes

**Option 1 : Invitation via email**
1. https://login.tailscale.com/admin/settings/users
2. Cliquez sur **"Invite user"**
3. Entrez l'email de la personne
4. Elle recevra une invitation à rejoindre votre réseau Tailscale

**Option 2 : Sharing (accès temporaire)**
1. https://login.tailscale.com/admin/machines
2. Cliquez sur votre NAS "inventaire-nas"
3. Section **"Share"**
4. Générez un lien de partage avec expiration

### Révoquer l'accès

1. https://login.tailscale.com/admin/machines
2. Cliquez sur l'appareil à révoquer
3. **"Disable key"** ou **"Delete device"**

---

## 🛠️ Maintenance

### Voir les logs Tailscale

```bash
sudo docker logs -f inventaire-tailscale
```

### Redémarrer Tailscale

```bash
sudo docker restart inventaire-tailscale
```

### Vérifier l'état du réseau

```bash
sudo docker exec inventaire-tailscale tailscale status
```

Affiche tous les appareils connectés :
```
100.64.0.1   inventaire-nas     cedric@     linux   -
100.64.0.2   iphone-cedric      cedric@     iOS     -
100.64.0.3   laptop-cedric      cedric@     windows -
```

### Voir votre IP Tailscale

```bash
sudo docker exec inventaire-tailscale tailscale ip
```

### Tester la connectivité entre appareils

Depuis votre PC (avec Tailscale actif) :
```bash
ping inventaire-nas
```

---

## 🆘 Dépannage

### Tailscale ne se connecte pas

**Symptôme** : Logs montrent "Authentication failed"

**Solutions** :
1. Vérifiez que l'Auth Key est correct (pas d'espaces)
2. Vérifiez que la clé n'a pas expiré : https://login.tailscale.com/admin/settings/keys
3. Générez une nouvelle clé et redéployez

### Le NAS n'apparaît pas dans la liste des machines

**Cause** : Conteneur Tailscale pas démarré ou erreur de configuration

**Solutions** :
```bash
# Vérifier que le conteneur tourne
sudo docker ps | grep tailscale

# Voir les logs
sudo docker logs inventaire-tailscale

# Redémarrer
sudo docker restart inventaire-tailscale
```

### "502 Bad Gateway" sur l'URL Tailscale

**Cause** : Le proxy Nginx ne trouve pas le frontend

**Solutions** :
```bash
# Vérifier que tous les conteneurs sont up
sudo docker ps

# Vérifier le réseau
sudo docker network inspect inventaire-network

# Redémarrer le proxy
sudo docker restart inventaire-tailscale-proxy
```

### Erreurs CORS dans le navigateur

**Cause** : L'URL Tailscale n'est pas dans CORS_ORIGINS

**Solution** :
1. Mettez à jour `CORS_ORIGINS` dans docker-compose avec votre vraie URL Tailscale
2. Redémarrez : `sudo docker restart inventaire-backend`

### L'app fonctionne sur PC mais pas sur mobile

**Cause** : Tailscale pas activé sur le téléphone

**Solutions** :
1. Ouvrez l'app Tailscale sur votre téléphone
2. Vérifiez que le toggle VPN est activé (bleu)
3. Vérifiez que vous êtes connecté au bon compte
4. Essayez de désactiver/réactiver le VPN

---

## 📊 Performances

**Latence ajoutée par Tailscale** : ~10-30ms (très faible, souvent imperceptible)

**Débit** :
- Tailscale utilise WireGuard (très performant)
- Débit limité uniquement par votre connexion Internet
- Pas de limitation artificielle

**Batterie mobile** :
- Impact minimal sur la batterie
- WireGuard est très optimisé pour mobile
- Consommation comparable à un VPN classique

---

## 💰 Coûts

| Fonctionnalité | Gratuit | Payant |
|----------------|---------|--------|
| **Nombre d'appareils** | 100 | Illimité |
| **Nombre d'utilisateurs** | 3 | Illimité |
| **Bande passante** | Illimitée | Illimitée |
| **HTTPS automatique** | ✅ | ✅ |
| **Support** | Communauté | Email/Chat |
| **Prix** | 0€ | 5$/mois/utilisateur |

Pour usage personnel : **0€ pour toujours** ✅

---

## 🔄 Accès local ET Tailscale en même temps

Vous pouvez garder l'accès local (192.168.1.37:8080) **en plus** de Tailscale.

Ajoutez simplement les ports dans `docker-compose-tailscale.yml` :

```yaml
frontend:
  # ... autres configs
  ports:
    - "8080:80"  # Accès local

backend:
  # ... autres configs
  ports:
    - "8000:8000"  # API locale
```

**Résultat** :
- **Chez vous** : http://192.168.1.37:8080 (rapide, pas de VPN)
- **À l'extérieur** : https://inventaire-nas.tail1a2b3c.ts.net (via Tailscale)

---

## 📱 Créer un raccourci sur téléphone

### Android

1. Activez Tailscale
2. Ouvrez Chrome
3. Allez sur `https://inventaire-nas.tail1a2b3c.ts.net`
4. Menu (⋮) > **"Ajouter à l'écran d'accueil"**
5. Nommez-le "Inventaire"

### iPhone

1. Activez Tailscale
2. Ouvrez Safari
3. Allez sur `https://inventaire-nas.tail1a2b3c.ts.net`
4. Bouton partage > **"Sur l'écran d'accueil"**
5. Nommez-le "Inventaire"

---

## 🆚 Tailscale vs Cloudflare Tunnel

| Critère | Tailscale | Cloudflare Tunnel |
|---------|-----------|-------------------|
| **Prix** | Gratuit | Gratuit |
| **Domaine nécessaire** | ❌ Non | ✅ Oui (1-10€/an) |
| **Installation client** | ✅ Requise sur chaque appareil | ❌ Pas requise |
| **Accès public** | ❌ VPN privé uniquement | ✅ URL publique |
| **HTTPS** | ✅ Automatique | ✅ Automatique |
| **Sécurité** | ⭐⭐⭐⭐⭐ Très élevée | ⭐⭐⭐⭐ Élevée |
| **Performances** | ⭐⭐⭐⭐⭐ Excellentes | ⭐⭐⭐⭐ Très bonnes |
| **Complexité setup** | ⭐⭐⭐⭐ Très simple | ⭐⭐⭐ Moyenne |
| **Partage avec amis** | ⭐⭐ (doivent installer Tailscale) | ⭐⭐⭐⭐⭐ (URL simple) |

**Choisissez Tailscale si** :
- ✅ Vous ne voulez rien payer du tout
- ✅ Accès privé uniquement (vous + famille)
- ✅ Vous êtes à l'aise avec installer une app sur vos appareils

**Choisissez Cloudflare Tunnel si** :
- ✅ Vous voulez partager l'URL publiquement
- ✅ Vous ne voulez pas installer d'app sur les appareils clients
- ✅ Vous avez un domaine (ou ok pour payer 1-2€/an)

---

## 📚 Ressources

- [Documentation Tailscale](https://tailscale.com/kb/)
- [Tailscale sur Docker](https://tailscale.com/kb/1282/docker)
- [Tailscale HTTPS](https://tailscale.com/kb/1153/enabling-https)
- [Admin Console](https://login.tailscale.com/admin)

---

**Guide créé le** : 2026-02-15
**Version application** : v1.6.2
**Testé sur** : Ugreen DXP2800 NAS
