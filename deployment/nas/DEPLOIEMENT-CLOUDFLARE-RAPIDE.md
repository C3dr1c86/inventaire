# Déploiement Rapide Cloudflare Tunnel - NAS Ugreen

## 🚀 Installation en 5 minutes

### Étape 1 : Obtenir le token Cloudflare

1. Créez un compte sur https://dash.cloudflare.com
2. Ajoutez votre domaine (ou utilisez un domaine gratuit Freenom)
3. Allez dans **Zero Trust** > **Networks** > **Tunnels**
4. Cliquez sur **"Create a tunnel"**
5. Nommez-le : `inventaire-nas`
6. **Copiez le token** qui ressemble à :
   ```
   eyJhIjoiNzg5YWRmODk3YWRm...très_long_token...
   ```
7. Dans **Public Hostname**, configurez :
   - **Subdomain** : `inventaire`
   - **Domain** : Votre domaine
   - **Service Type** : `HTTP`
   - **URL** : `inventaire-frontend:80`

### Étape 2 : Modifier le docker-compose.yml

Copiez le fichier `docker-compose-cloudflare.yml` et modifiez 2 lignes :

```yaml
# Ligne 12 : Remplacez par votre domaine
- CORS_ORIGINS=https://inventaire.VOTRE-DOMAINE.com,http://localhost

# Ligne 45 : Remplacez par votre token
command: tunnel --no-autoupdate run --token VOTRE_TOKEN_CLOUDFLARE
```

### Étape 3 : Déployer sur le NAS

#### Option A : Via interface UGOS (Recommandé)

1. Ouvrez http://192.168.1.37
2. **Docker** > **Projets** > `inventaire`
3. Cliquez sur **"Éditer"**
4. Collez le contenu du fichier modifié
5. Cliquez sur **"Mettre à jour et redémarrer"**

#### Option B : Via SSH

```bash
cd /home/Cédric/docker/inventaire

# Télécharger le fichier mis à jour
# (ou créez-le avec nano/vi)

# Arrêter les conteneurs
sudo docker compose down

# Démarrer avec Cloudflare
sudo docker compose up -d

# Vérifier les logs
sudo docker logs -f inventaire-cloudflared
```

### Étape 4 : Tester

1. Depuis votre téléphone (4G/5G, pas WiFi)
2. Allez sur `https://inventaire.VOTRE-DOMAINE.com`
3. ✅ Vous devriez voir la page de connexion !

---

## 🔍 Vérifications

### Le tunnel est-il connecté ?

```bash
sudo docker logs inventaire-cloudflared
```

Vous devriez voir :
```
INF Connection established connIndex=0
INF Registered tunnel connection
```

### Le backend répond-il ?

```bash
sudo docker exec inventaire-cloudflared wget -O- http://inventaire-backend:8000/api/health
```

Doit retourner : `{"status":"healthy"}`

### Le frontend est-il accessible ?

```bash
sudo docker exec inventaire-cloudflared wget -O- http://inventaire-frontend:80
```

Doit retourner du HTML.

---

## 🛠️ Commandes utiles

### Voir tous les logs

```bash
sudo docker compose logs -f
```

### Redémarrer uniquement Cloudflare

```bash
sudo docker restart inventaire-cloudflared
```

### Vérifier l'état des conteneurs

```bash
sudo docker ps
```

Les 3 conteneurs doivent être "Up" :
- `inventaire-backend`
- `inventaire-frontend`
- `inventaire-cloudflared`

---

## ⚠️ Problèmes courants

### "502 Bad Gateway" sur le site

**Cause** : Le tunnel est connecté mais ne trouve pas le frontend

**Solution** :
```bash
# Vérifier que les 3 conteneurs sont sur le même réseau
sudo docker network inspect inventaire-network

# Redémarrer le frontend
sudo docker restart inventaire-frontend inventaire-cloudflared
```

### "Invalid credentials" dans les logs Cloudflare

**Cause** : Token incorrect

**Solution** :
1. Vérifiez qu'il n'y a pas d'espaces avant/après le token
2. Régénérez un nouveau token sur Cloudflare Zero Trust
3. Mettez à jour le docker-compose.yml
4. Redémarrez : `sudo docker compose up -d`

### Erreurs CORS dans la console du navigateur

**Cause** : Votre domaine Cloudflare n'est pas dans CORS_ORIGINS

**Solution** :
```yaml
# Dans docker-compose.yml, section backend :
environment:
  - CORS_ORIGINS=https://inventaire.VOTRE-DOMAINE.com,http://localhost
```

Puis :
```bash
sudo docker restart inventaire-backend
```

---

## 🔒 Sécurité recommandée

### Ajouter une authentification Cloudflare Access

1. Dans Cloudflare Zero Trust, **Access** > **Applications**
2. **Add an application** > **Self-hosted**
3. **Application domain** : `inventaire.VOTRE-DOMAINE.com`
4. Créez une policy :
   - **Emails ending in** : `@votre-email.com`

✅ Cloudflare demandera maintenant un code par email avant d'accéder à l'app

---

## 📱 Accès depuis mobile

### Créer un raccourci

**Android** :
1. Ouvrez Chrome
2. Menu (⋮) > **"Ajouter à l'écran d'accueil"**

**iPhone** :
1. Ouvrez Safari
2. Bouton partage > **"Sur l'écran d'accueil"**

---

## 📊 Configuration résumée

| Élément | Valeur |
|---------|--------|
| **Accès externe** | https://inventaire.VOTRE-DOMAINE.com |
| **Accès local** | http://192.168.1.37:8080 (si ports exposés) |
| **Backend** | Port 8000 (réseau interne Docker) |
| **Frontend** | Port 80 (réseau interne Docker) |
| **Cloudflare Tunnel** | Aucun port exposé sur le NAS |
| **HTTPS** | Automatique via Cloudflare |
| **Certificat SSL** | Gratuit Cloudflare Universal SSL |

---

**Guide créé le** : 2026-02-15
**Pour NAS** : Ugreen DXP2800
**Version** : v1.6.2
