# 🔧 Guide de correction manuelle sur NAS Ugreen

## Symptôme
Le frontend ne peut pas se connecter au backend via Tailscale.
Erreur dans la console : `ERR_NAME_NOT_RESOLVED` pour `inventaire-backend:8000`

## Cause
Le fichier `docker-compose.yml` sur le NAS contient encore l'ancienne configuration :
```yaml
environment:
  - VITE_API_URL=http://inventaire-backend:8000/api  # ❌ INCORRECT
```

Au lieu de :
```yaml
environment:
  - VITE_API_URL=/api  # ✅ CORRECT
```

## Solution : 3 étapes simples

### 🔹 Étape 1 : Copier le fichier corrigé

**Copiez** le fichier `docker-compose-tailscale.yml` corrigé vers le NAS.

#### Via l'interface web (recommandé) :

1. Ouvrez votre navigateur : `http://192.168.1.37`
2. Connectez-vous avec vos identifiants
3. Ouvrez le **Gestionnaire de fichiers** (File Manager)
4. Naviguez vers : `/home/Cédric/docker/inventaire/`
5. Uploadez le fichier `docker-compose-tailscale.yml` depuis votre PC :
   - Chemin PC : `C:\Users\cedri\Desktop\inventaire\deployment\nas\docker-compose-tailscale.yml`
   - Renommez-le en `docker-compose.yml` (sans `-tailscale`)

#### Via WinSCP/FTP (alternative) :

1. Installez WinSCP : https://winscp.net/
2. Connectez-vous au NAS :
   - Hôte : `192.168.1.37`
   - Utilisateur : `Cédric` (ou `admin`)
   - Protocole : SFTP (si SSH activé) ou FTP
3. Copiez `docker-compose-tailscale.yml` → `/home/Cédric/docker/inventaire/docker-compose.yml`

---

### 🔹 Étape 2 : Redémarrer les conteneurs

#### Via Container Manager (interface web) :

1. Ouvrez **Container Manager** dans l'interface web du NAS
2. Trouvez le projet `inventaire` (ou les conteneurs individuels)
3. Cliquez sur **Stop** (arrêter tous les conteneurs)
4. Attendez qu'ils soient tous arrêtés
5. Cliquez sur **Start** (redémarrer)

#### Via terminal SSH (si SSH fonctionne) :

```bash
ssh Cédric@192.168.1.37
cd /home/Cédric/docker/inventaire
docker compose down
docker compose up -d
```

#### Via l'app UGOS (mobile/tablette) :

1. Ouvrez l'app UGOS
2. Allez dans Docker / Conteneurs
3. Arrêtez et redémarrez le stack `inventaire`

---

### 🔹 Étape 3 : Vérifier que ça fonctionne

1. **Attendez 60 secondes** que tous les conteneurs démarrent
2. Ouvrez votre navigateur : https://inventaire-nas.tail53f399.ts.net
3. Ouvrez les **DevTools** (F12) → Onglet **Console**
4. Rafraîchissez la page (Ctrl+F5)
5. Vérifiez dans la console :
   - ✅ Si vous voyez des requêtes vers `/api/...` → **Succès !**
   - ❌ Si vous voyez encore `inventaire-backend:8000` → Recommencez l'étape 1

---

## 🔍 Vérification rapide

### Vérifier env-config.js

Une fois les conteneurs redémarrés, allez sur :
https://inventaire-nas.tail53f399.ts.net/env-config.js

Vous devriez voir :
```javascript
window.ENV = {
  VITE_API_URL: "/api"
};
```

Si vous voyez `"http://inventaire-backend:8000/api"`, le fichier n'a pas été mis à jour.

---

## ❓ Problèmes courants

### "Je ne trouve pas le dossier /home/Cédric/docker/inventaire"

Essayez ces chemins alternatifs :
- `/volume1/docker/inventaire`
- `/docker/inventaire`
- `/home/admin/docker/inventaire`

Ou utilisez la recherche dans le File Manager.

### "Container Manager ne démarre pas les conteneurs"

Vérifiez les logs :
1. Container Manager → Conteneurs
2. Cliquez sur `inventaire-backend` → **Logs**
3. Cherchez les erreurs

### "SSH ne fonctionne toujours pas"

Activez SSH sur le NAS :
1. Interface web → Paramètres → Services réseau
2. Activez **SSH** (port 22)
3. Redémarrez le NAS
4. Réessayez : `ssh admin@192.168.1.37`

---

## 📞 Besoin d'aide ?

Si rien ne fonctionne, partagez :
1. Les logs du conteneur `inventaire-frontend`
2. Le contenu de `env-config.js`
3. Les erreurs dans la console navigateur
