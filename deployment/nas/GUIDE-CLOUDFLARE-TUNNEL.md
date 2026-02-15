# Guide Cloudflare Tunnel - Accès externe sécurisé

## 🎯 Objectif

Accéder à votre application Inventaire depuis n'importe où sur Internet de manière **100% sécurisée** :
- ✅ **Pas d'ouverture de ports** sur votre box Internet
- ✅ **HTTPS automatique** (certificat SSL gratuit)
- ✅ **Protection DDoS** par Cloudflare
- ✅ **Nom de domaine** inclus (ex: inventaire.votredomaine.com)
- ✅ **Gratuit** pour usage personnel

---

## 📋 Prérequis

1. **Compte Cloudflare** (gratuit) : https://dash.cloudflare.com/sign-up
2. **Un nom de domaine** (vous avez 2 options) :
   - **Option A** : Utiliser un domaine que vous possédez déjà
   - **Option B** : Obtenir un domaine gratuit (ex: Freenom .tk, .ml, .ga - voir annexe)

---

## 🚀 Étape 1 : Configurer Cloudflare

### 1.1 Créer un compte Cloudflare

1. Allez sur https://dash.cloudflare.com/sign-up
2. Créez votre compte (email + mot de passe)
3. Vérifiez votre email

### 1.2 Ajouter votre domaine à Cloudflare

1. Sur le dashboard Cloudflare, cliquez sur **"Add a Site"**
2. Entrez votre nom de domaine (ex: `mondomaine.com`)
3. Choisissez le plan **"Free"** (gratuit)
4. Cloudflare va scanner vos DNS actuels
5. Cliquez sur **"Continue"**

### 1.3 Changer les nameservers

Cloudflare va vous donner 2 nameservers (ex: `chad.ns.cloudflare.com` et `lucy.ns.cloudflare.com`)

1. Connectez-vous à votre registrar de domaine (Namecheap, GoDaddy, OVH, etc.)
2. Remplacez les nameservers par ceux de Cloudflare
3. Attendez la propagation DNS (5 minutes à 24 heures)

> **Note** : Si vous utilisez un domaine gratuit Freenom, les nameservers sont dans "Management Tools > Nameservers"

### 1.4 Activer le proxy Cloudflare

1. Dans Cloudflare, allez dans l'onglet **DNS**
2. Vérifiez que le nuage ☁️ est **orange** (proxied) pour votre domaine
3. Si gris, cliquez dessus pour le passer en orange

---

## 🔑 Étape 2 : Créer le Tunnel Cloudflare

### 2.1 Accéder à Zero Trust

1. Dans le dashboard Cloudflare, cliquez sur votre domaine
2. Dans le menu de gauche, cliquez sur **"Zero Trust"**
3. Si première utilisation, créez un "team name" (ex: `mon-inventaire`)

### 2.2 Créer le Tunnel

1. Menu **"Access"** > **"Tunnels"** (ou "Networks > Tunnels" selon version)
2. Cliquez sur **"Create a tunnel"**
3. Choisissez **"Cloudflared"**
4. Donnez un nom au tunnel : `inventaire-nas`
5. Cliquez sur **"Save tunnel"**

### 2.3 Récupérer le Token

**IMPORTANT** : Cloudflare va afficher une commande comme celle-ci :

```bash
cloudflared service install eyJhIjoiNzg5YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODkiLCJ0IjoiMTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5MDEyIiwicyI6Ik1USXpORFUyTnpnNU1ERXlNelF6TkRVMk56ZzVNREV5TXpRek5EVTJOVFU9In0=
```

📝 **Copiez UNIQUEMENT le token** (la longue chaîne après `install`) :
```
eyJhIjoiNzg5YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODk3YWRmODkiLCJ0IjoiMTIzNDU2NzgtMTIzNC0xMjM0LTEyMzQtMTIzNDU2Nzg5MDEyIiwicyI6Ik1USXpORFUyTnpnNU1ERXlNelF6TkRVMk56ZzVNREV5TXpRek5EVTJOVFU9In0=
```

⚠️ **Gardez ce token SECRET** - c'est la clé d'accès à votre tunnel !

### 2.4 Configurer le sous-domaine

1. Sur la page du tunnel, section **"Public Hostname"**
2. Cliquez sur **"Add a public hostname"**
3. Remplissez :
   - **Subdomain** : `inventaire` (ou autre nom de votre choix)
   - **Domain** : Sélectionnez votre domaine dans la liste
   - **Path** : (laisser vide)
   - **Type** : `HTTP`
   - **URL** : `inventaire-frontend:80`

4. Cliquez sur **"Save hostname"**

**Résultat** : Votre app sera accessible sur `https://inventaire.votredomaine.com`

---

## 🐳 Étape 3 : Déployer sur le NAS

### 3.1 Créer le fichier docker-compose mis à jour

Sur votre NAS (via SSH ou interface UGOS), remplacez le contenu de `docker-compose.yml` par :

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
      - CORS_ORIGINS=https://inventaire.votredomaine.com,http://localhost
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
      - VITE_API_URL=http://inventaire-backend:8000/api
    depends_on:
      backend:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - inventaire-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: inventaire-cloudflared
    restart: unless-stopped
    command: tunnel --no-autoupdate run --token VOTRE_TOKEN_ICI
    networks:
      - inventaire-network
    depends_on:
      - frontend

networks:
  inventaire-network:
    driver: bridge
```

### 3.2 Remplacer le token

⚠️ **IMPORTANT** : Remplacez `VOTRE_TOKEN_ICI` par le token copié à l'étape 2.3

### 3.3 Mettre à jour CORS_ORIGINS

Remplacez `https://inventaire.votredomaine.com` par votre vrai domaine (ex: `https://inventaire.mondomaine.com`)

### 3.4 Déployer

#### Option A : Via SSH

```bash
cd /home/Cédric/docker/inventaire

# Arrêter l'ancienne version
sudo docker compose down

# Démarrer avec Cloudflare Tunnel
sudo docker compose up -d

# Vérifier les logs du tunnel
sudo docker logs -f inventaire-cloudflared
```

Vous devriez voir :
```
2026-02-15 10:30:45 INF Connection established connIndex=0
2026-02-15 10:30:45 INF Registered tunnel connection
```

#### Option B : Via UGOS Interface Web

1. Connectez-vous à http://192.168.1.37
2. **Docker** > **Projets** > `inventaire`
3. Cliquez sur **"Éditer"**
4. Remplacez le contenu du docker-compose.yml par le nouveau
5. Cliquez sur **"Mettre à jour et redémarrer"**

---

## ✅ Étape 4 : Tester l'accès externe

1. **Depuis votre téléphone** (désactivez le WiFi, utilisez la 4G/5G)
2. Allez sur `https://inventaire.votredomaine.com`
3. Vous devriez voir la page de connexion de l'application Inventaire

🎉 **Félicitations !** Votre application est accessible depuis Internet de manière sécurisée !

---

## 🔒 Étape 5 : Sécuriser l'accès (RECOMMANDÉ)

### Option A : Ajouter une authentification Cloudflare Access

1. Dans Cloudflare Zero Trust, allez dans **"Access"** > **"Applications"**
2. Cliquez sur **"Add an application"** > **"Self-hosted"**
3. Remplissez :
   - **Application name** : `Inventaire`
   - **Session duration** : `24 hours`
   - **Application domain** : `inventaire.votredomaine.com`
4. Créez une **Policy** :
   - **Policy name** : `Accès Email`
   - **Action** : `Allow`
   - **Rule** : `Emails ending in: @votreemail.com` (votre email personnel)
5. Cliquez sur **"Save"**

**Résultat** : Cloudflare demandera une authentification par email AVANT d'accéder à l'app.

### Option B : Limiter l'accès par pays

1. Dans Cloudflare, allez dans **"Security"** > **"WAF"**
2. Créez une règle de pare-feu :
   - **When incoming requests match** : `Country is not in France`
   - **Then** : `Block`

**Résultat** : Seules les connexions depuis la France seront autorisées.

---

## 🛠️ Maintenance

### Voir les logs du tunnel

```bash
sudo docker logs -f inventaire-cloudflared
```

### Redémarrer le tunnel

```bash
sudo docker restart inventaire-cloudflared
```

### Supprimer le tunnel

1. Dans Cloudflare Zero Trust, allez dans **"Networks"** > **"Tunnels"**
2. Cliquez sur les 3 points à côté de votre tunnel
3. Cliquez sur **"Delete"**

---

## 🆘 Dépannage

### Le tunnel ne se connecte pas

**Symptôme** : `docker logs inventaire-cloudflared` affiche des erreurs

**Solutions** :
1. Vérifiez que le token est correct (pas d'espaces, pas de retours à la ligne)
2. Vérifiez que le conteneur `inventaire-frontend` est bien démarré
3. Vérifiez la connectivité Internet du NAS : `ping 1.1.1.1`

### Le site affiche "502 Bad Gateway"

**Cause** : Le tunnel est connecté mais ne trouve pas le frontend

**Solutions** :
1. Vérifiez que `inventaire-frontend` est bien sur le réseau `inventaire-network`
2. Vérifiez le hostname dans Cloudflare : doit être `inventaire-frontend:80` (pas `localhost`)
3. Testez la connectivité interne :
   ```bash
   sudo docker exec inventaire-cloudflared wget -O- http://inventaire-frontend:80
   ```

### Erreurs CORS

**Cause** : L'URL Cloudflare n'est pas dans `CORS_ORIGINS`

**Solution** :
1. Ajoutez votre domaine dans `CORS_ORIGINS` du backend
2. Redémarrez : `sudo docker restart inventaire-backend`

### Le tunnel se déconnecte souvent

**Cause** : Problème de connexion Internet du NAS

**Solutions** :
1. Vérifiez la stabilité de votre connexion Internet
2. Ajoutez `--protocol http2` à la commande cloudflared :
   ```yaml
   command: tunnel --no-autoupdate run --protocol http2 --token VOTRE_TOKEN
   ```

---

## 📱 Accès depuis smartphone

### Android

1. Ouvrez Chrome ou Firefox
2. Allez sur `https://inventaire.votredomaine.com`
3. Menu > **"Ajouter à l'écran d'accueil"** pour créer un raccourci

### iOS (iPhone/iPad)

1. Ouvrez Safari
2. Allez sur `https://inventaire.votredomaine.com`
3. Appuyez sur le bouton de partage
4. **"Sur l'écran d'accueil"**

---

## 📊 Performances

**Latence ajoutée par Cloudflare** : ~20-50ms (négligeable)

**Bande passante** :
- Cloudflare ne limite PAS la bande passante sur le plan gratuit
- Votre seule limitation sera votre connexion Internet upload

**Cache** :
- Cloudflare met en cache les fichiers statiques (CSS, JS, images)
- Le backend n'est PAS mis en cache (données toujours à jour)

---

## 💰 Coûts

- **Cloudflare Tunnel** : Gratuit ✅
- **Cloudflare Access** (auth par email) : Gratuit jusqu'à 50 utilisateurs ✅
- **Nom de domaine** :
  - Gratuit avec Freenom (.tk, .ml, .ga)
  - ~10€/an pour .com/.fr chez Namecheap/OVH

**Total pour usage personnel** : 0€ à 10€/an

---

## 🔐 Sécurité - Bonnes pratiques

✅ **À FAIRE** :
- Activer Cloudflare Access (authentification par email)
- Utiliser un mot de passe fort pour l'application
- Limiter l'accès par pays si possible
- Surveiller les logs régulièrement
- Garder le token Cloudflare SECRET

❌ **À NE PAS FAIRE** :
- Partager le token publiquement (GitHub, forums, etc.)
- Désactiver HTTPS (toujours utiliser https://)
- Ouvrir les ports 80/443 sur votre box (Cloudflare Tunnel rend ça inutile)

---

## 🌐 Annexe : Obtenir un nom de domaine gratuit

### Option 1 : Freenom (gratuit .tk, .ml, .ga)

1. Allez sur https://www.freenom.com
2. Recherchez un nom de domaine disponible
3. Choisissez **"Get it now!"**
4. **Period** : `12 Months @ FREE`
5. Créez un compte
6. Confirmez votre email

**Limitations** :
- Renouvellement manuel tous les 12 mois
- Moins professionnel (.tk, .ml)
- Peut être révoqué si inactif

### Option 2 : Sous-domaine DuckDNS (gratuit)

**Incompatible avec Cloudflare Tunnel** - Nécessite une solution différente

### Option 3 : Acheter un domaine (recommandé pour usage pro)

**Registrars recommandés** :
- **Namecheap** : .com à partir de 10€/an
- **OVH** : .fr à partir de 6€/an
- **Google Domains** : .com à partir de 12€/an

---

## 📚 Ressources

- [Documentation officielle Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Cloudflare Status](https://www.cloudflarestatus.com/)

---

**Guide créé le** : 2026-02-15
**Version application** : v1.6.2
**Testé sur** : Ugreen DXP2800 NAS
