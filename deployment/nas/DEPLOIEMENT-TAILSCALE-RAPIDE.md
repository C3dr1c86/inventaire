# Déploiement Rapide Tailscale - NAS Ugreen (100% Gratuit)

## 🚀 Installation en 10 minutes

### ✅ Avantages Tailscale

- **100% Gratuit** (pas de domaine à acheter)
- **Très simple** à configurer
- **Très sécurisé** (VPN WireGuard)
- **HTTPS automatique** avec certificat Tailscale
- **Aucun port à ouvrir** sur votre box

### ⚠️ Limitation

- Nécessite installer **Tailscale sur chaque appareil** qui accède à l'app (téléphone, PC, tablette)
- Accès privé uniquement (pas une URL publique)

---

## 📋 Étape 1 : Créer compte Tailscale et obtenir Auth Key

### 1.1 S'inscrire

1. Allez sur https://login.tailscale.com/start
2. Connectez-vous avec **GitHub**, **Google**, ou **Microsoft**
3. Acceptez les conditions

### 1.2 Générer l'Auth Key

1. Une fois connecté : **Settings** (⚙️) > **Keys**
2. Cliquez sur **"Generate auth key"**
3. Configurez :
   - **Description** : `NAS Inventaire`
   - **Reusable** : ✅ Cochez
   - **Ephemeral** : ❌ Ne cochez pas
   - **Expiration** : `90 days` (ou `No expiration`)
4. Cliquez sur **"Generate key"**
5. **Copiez la clé** :
   ```
   tskey-auth-kVxyz1234CNTRL-abcdefghijklmnopqrstuvwxyz1234567890
   ```

⚠️ **Gardez cette clé secrète !**

---

## 📝 Étape 2 : Préparer les fichiers

### 2.1 Créer nginx-tailscale.conf

Sur votre NAS, créez le fichier `/home/Cédric/docker/inventaire/nginx-tailscale.conf` :

```nginx
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://inventaire-frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /api {
        proxy_pass http://inventaire-backend:8000/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 120s;
    }
}
```

### 2.2 Modifier docker-compose-tailscale.yml

Remplacez **2 lignes** dans `docker-compose-tailscale.yml` :

```yaml
# Ligne 11 : CORS_ORIGINS (sera mis à jour après)
- CORS_ORIGINS=https://inventaire-nas.tail1234.ts.net,http://localhost

# Ligne 44 : Votre Auth Key Tailscale
- TS_AUTHKEY=tskey-auth-VOTRE_CLE_ICI
```

---

## 🐳 Étape 3 : Déployer sur le NAS

### Option A : Via interface UGOS (Recommandé)

1. Ouvrez http://192.168.1.37
2. **Docker** > **Projets** > `inventaire`
3. Cliquez sur **"Éditer"**
4. Remplacez par le contenu de `docker-compose-tailscale.yml` (modifié)
5. Cliquez sur **"Mettre à jour et redémarrer"**
6. **IMPORTANT** : Uploadez aussi le fichier `nginx-tailscale.conf` dans le même dossier

### Option B : Via SSH

```bash
cd /home/Cédric/docker/inventaire

# Créer le fichier nginx-tailscale.conf (copiez le contenu ci-dessus)
nano nginx-tailscale.conf

# Arrêter les conteneurs actuels
sudo docker compose down

# Démarrer avec Tailscale
sudo docker compose -f docker-compose-tailscale.yml up -d

# Vérifier les logs Tailscale
sudo docker logs -f inventaire-tailscale
```

**Vous devriez voir** :
```
Logged in!
Tailscale started successfully
```

---

## 🔗 Étape 4 : Récupérer l'URL Tailscale

### 4.1 Vérifier la connexion

1. Allez sur https://login.tailscale.com/admin/machines
2. Vous devriez voir **"inventaire-nas"** dans la liste (peut prendre 30 secondes)
3. Cliquez dessus pour voir les détails

### 4.2 Activer HTTPS

1. Sur la page de la machine "inventaire-nas"
2. Section **"Tailscale SSH"** (ou **"HTTPS"**)
3. Cliquez sur **"Enable HTTPS"**
4. Copiez l'URL fournie :
   ```
   https://inventaire-nas.tail1a2b3c.ts.net
   ```

### 4.3 Mettre à jour CORS

Maintenant que vous avez l'URL, **mettez à jour le backend** :

1. Éditez `docker-compose-tailscale.yml`, ligne 11 :
   ```yaml
   - CORS_ORIGINS=https://inventaire-nas.tail1a2b3c.ts.net,http://localhost
   ```
   (Remplacez par votre vraie URL)

2. Redémarrez le backend :
   ```bash
   sudo docker restart inventaire-backend
   ```

---

## 📱 Étape 5 : Installer Tailscale sur vos appareils

Pour accéder à l'app, **chaque appareil** doit avoir Tailscale.

### Android

1. **Google Play Store** > Recherchez **"Tailscale"**
2. Installez et ouvrez l'app
3. Connectez-vous (même compte qu'à l'étape 1)
4. Activez le VPN (bouton bleu)
5. Ouvrez Chrome : `https://inventaire-nas.tail1a2b3c.ts.net`

### iPhone/iPad

1. **App Store** > Recherchez **"Tailscale"**
2. Installez et ouvrez l'app
3. Connectez-vous
4. Activez le VPN
5. Ouvrez Safari : `https://inventaire-nas.tail1a2b3c.ts.net`

### Windows

1. Téléchargez : https://tailscale.com/download/windows
2. Installez et connectez-vous
3. L'icône Tailscale apparaît dans la barre système
4. Navigateur : `https://inventaire-nas.tail1a2b3c.ts.net`

### Mac

1. Téléchargez : https://tailscale.com/download/mac
2. Installez et connectez-vous
3. Navigateur : `https://inventaire-nas.tail1a2b3c.ts.net`

---

## ✅ Étape 6 : Tester

1. **Sur votre téléphone** avec Tailscale activé (4G/5G)
2. Allez sur `https://inventaire-nas.tail1a2b3c.ts.net`
3. ✅ Vous devriez voir la page de connexion !

🎉 **Bravo !** L'application est accessible de partout via Tailscale !

---

## 🔍 Vérifications

### Le conteneur Tailscale est-il démarré ?

```bash
sudo docker ps | grep tailscale
```

Doit afficher 2 conteneurs :
- `inventaire-tailscale`
- `inventaire-tailscale-proxy`

### Tailscale est-il connecté ?

```bash
sudo docker logs inventaire-tailscale | grep "Logged in"
```

Doit afficher : `Logged in!`

### Voir tous les appareils connectés

```bash
sudo docker exec inventaire-tailscale tailscale status
```

Affiche :
```
100.64.0.1   inventaire-nas     cedric@     linux   -
100.64.0.2   iphone-cedric      cedric@     iOS     -
```

### Tester le proxy

```bash
sudo docker exec inventaire-tailscale-proxy wget -O- http://localhost/
```

Doit retourner du HTML (page React).

---

## 🛠️ Commandes utiles

### Voir tous les logs

```bash
sudo docker compose -f docker-compose-tailscale.yml logs -f
```

### Redémarrer Tailscale

```bash
sudo docker restart inventaire-tailscale inventaire-tailscale-proxy
```

### Obtenir l'IP Tailscale du NAS

```bash
sudo docker exec inventaire-tailscale tailscale ip -4
```

Retourne : `100.64.0.1` (exemple)

### Vérifier l'état des conteneurs

```bash
sudo docker ps
```

Les 4 conteneurs doivent être "Up" :
- `inventaire-backend`
- `inventaire-frontend`
- `inventaire-tailscale`
- `inventaire-tailscale-proxy`

---

## ⚠️ Problèmes courants

### "Authentication failed" dans les logs

**Cause** : Auth Key incorrect ou expiré

**Solution** :
1. Vérifiez qu'il n'y a pas d'espaces dans la clé
2. Générez une nouvelle clé : https://login.tailscale.com/admin/settings/keys
3. Mettez à jour le docker-compose.yml
4. Redémarrez : `sudo docker restart inventaire-tailscale`

### Le NAS n'apparaît pas dans la liste des machines

**Cause** : Conteneur pas démarré ou problème réseau

**Solution** :
```bash
# Vérifier les logs
sudo docker logs inventaire-tailscale

# Si erreur "/dev/net/tun", vérifier que TUN est disponible
ls -l /dev/net/tun

# Redémarrer le conteneur
sudo docker restart inventaire-tailscale
```

### "502 Bad Gateway" sur l'URL Tailscale

**Cause** : Le proxy ne trouve pas le frontend

**Solution** :
```bash
# Vérifier que le fichier nginx-tailscale.conf existe
ls -l nginx-tailscale.conf

# Vérifier les logs du proxy
sudo docker logs inventaire-tailscale-proxy

# Redémarrer le proxy
sudo docker restart inventaire-tailscale-proxy
```

### Erreurs CORS dans le navigateur

**Cause** : URL Tailscale pas dans CORS_ORIGINS

**Solution** :
```yaml
# Mettre à jour dans docker-compose-tailscale.yml :
environment:
  - CORS_ORIGINS=https://inventaire-nas.tail1a2b3c.ts.net,http://localhost
```

Puis :
```bash
sudo docker restart inventaire-backend
```

### L'app fonctionne sur PC mais pas sur mobile

**Solutions** :
1. Vérifiez que Tailscale est **activé** sur le mobile (toggle bleu)
2. Vérifiez que vous êtes connecté au **bon compte** Tailscale
3. Essayez de désactiver/réactiver le VPN
4. Réinstallez l'app Tailscale si nécessaire

---

## 🔒 Sécurité

### Approuver manuellement les nouveaux appareils

1. https://login.tailscale.com/admin/settings/keys
2. Activez **"Require device approval"**
3. Désormais, chaque nouvel appareil nécessite votre approbation

### Partager avec un ami

**Option 1 : Inviter via email**
1. https://login.tailscale.com/admin/settings/users
2. **"Invite user"** > Entrez l'email
3. Votre ami rejoindra votre réseau Tailscale

**Option 2 : Sharing temporaire**
1. https://login.tailscale.com/admin/machines
2. Cliquez sur "inventaire-nas"
3. Section **"Share"** > Générez un lien avec expiration

### Révoquer un appareil

1. https://login.tailscale.com/admin/machines
2. Cliquez sur l'appareil
3. **"Disable key"** ou **"Delete device"**

---

## 📱 Créer un raccourci sur téléphone

### Android

1. Ouvrez Chrome
2. Allez sur `https://inventaire-nas.tail1a2b3c.ts.net`
3. Menu (⋮) > **"Ajouter à l'écran d'accueil"**
4. Nommez-le "Inventaire"

✅ Icône sur votre écran d'accueil !

### iPhone

1. Ouvrez Safari
2. Allez sur `https://inventaire-nas.tail1a2b3c.ts.net`
3. Bouton partage > **"Sur l'écran d'accueil"**
4. Nommez-le "Inventaire"

✅ Icône sur votre écran d'accueil !

---

## 🔄 Garder aussi l'accès local (optionnel)

Si vous voulez **toujours pouvoir accéder** via http://192.168.1.37:8080 en local :

Ajoutez ces lignes dans `docker-compose-tailscale.yml` :

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
- **Chez vous** : http://192.168.1.37:8080 (rapide, sans VPN)
- **À l'extérieur** : https://inventaire-nas.tail1a2b3c.ts.net (via Tailscale)

---

## 📊 Résumé configuration

| Élément | Valeur |
|---------|--------|
| **Accès externe** | https://inventaire-nas.tail1a2b3c.ts.net |
| **Accès local** | http://192.168.1.37:8080 (si ports exposés) |
| **HTTPS** | Automatique via Tailscale |
| **Certificat SSL** | Gratuit Tailscale |
| **Prix** | 0€ pour toujours |
| **VPN requis** | Oui (sur chaque appareil) |
| **Domaine requis** | Non |

---

## 💰 Coûts

- **Tailscale** : Gratuit jusqu'à 100 appareils ✅
- **Domaine** : Pas nécessaire ✅
- **HTTPS** : Gratuit ✅

**Total** : **0€ pour toujours** 🎉

---

## 📚 Liens utiles

- **Admin Console** : https://login.tailscale.com/admin
- **Téléchargements** : https://tailscale.com/download
- **Documentation** : https://tailscale.com/kb/
- **Support** : https://tailscale.com/contact/support/

---

**Guide créé le** : 2026-02-15
**Pour NAS** : Ugreen DXP2800
**Version** : v1.6.2
**Coût total** : 0€
