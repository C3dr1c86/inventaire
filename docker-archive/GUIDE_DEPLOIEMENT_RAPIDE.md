# Guide de déploiement rapide - NAS Ugreen (192.168.1.37)

## ✅ Étapes à suivre

### 1. Attendre la fin de la construction des images (en cours...)

Vous verrez deux images créées :
- `inventaire-backend:latest`
- `inventaire-frontend:latest`

### 2. Exporter les images en fichiers .tar

Une fois les builds terminés, exportez les images :

```bash
# Créer le dossier pour les exports
mkdir docker-images

# Exporter le backend
docker save -o docker-images/inventaire-backend.tar inventaire-backend:latest

# Exporter le frontend
docker save -o docker-images/inventaire-frontend.tar inventaire-frontend:latest
```

**Résultat attendu :**
```
docker-images/
├── inventaire-backend.tar  (~200 MB)
└── inventaire-frontend.tar (~150 MB)
```

---

## 3. Transférer les fichiers vers le NAS

### Via l'explorateur Windows :

1. **Ouvrez l'explorateur de fichiers**
2. **Tapez dans la barre d'adresse** : `\\192.168.1.37`
3. **Entrez vos identifiants** si demandé
4. **Créez l'arborescence** suivante (si elle n'existe pas) :
   ```
   \\192.168.1.37\
   └── docker\
       └── inventaire\
           ├── docker-images\
           └── data\
               ├── database\
               └── exports
   ```

5. **Copiez ces fichiers** depuis `c:\Users\cedri\Desktop\inventaire\` vers `\\192.168.1.37\docker\inventaire\` :

   **Obligatoires :**
   - ✅ `docker-compose-prebuilt.yml` → **RENOMMER en** `docker-compose.yml`
   - ✅ `.env.nas` → **RENOMMER en** `.env`
   - ✅ Dossier `docker-images\` complet (avec les 2 fichiers .tar)

   **Structure finale sur le NAS :**
   ```
   \\192.168.1.37\docker\inventaire\
   ├── docker-compose.yml  (ancien docker-compose-prebuilt.yml)
   ├── .env                (ancien .env.nas)
   ├── docker-images\
   │   ├── inventaire-backend.tar
   │   └── inventaire-frontend.tar
   └── data\
       ├── database\
       └── exports\
   ```

**💡 Astuce** : Vous pouvez aussi utiliser un client FTP/SFTP comme FileZilla si vous préférez.

---

## 4. Importer les images dans l'interface Docker du NAS

### 4.1 Accéder à l'interface Docker

1. Ouvrez votre navigateur
2. Allez sur l'interface de votre NAS Ugreen
3. Ouvrez l'application **Docker** ou **Container Manager**

### 4.2 Importer les images

L'interface Docker Ugreen a généralement deux options :

**Option A - Si vous avez un bouton "Import" dans la section Images :**

1. Cliquez sur **"Images"** dans le menu
2. Cherchez **"Import"**, **"Charger"** ou **"Load Image"**
3. Parcourir et sélectionner : `docker-images/inventaire-backend.tar`
4. Attendez la fin de l'import (barre de progression)
5. Répétez pour : `docker-images/inventaire-frontend.tar`

**Option B - Si pas d'option d'import dans l'UI (solution SSH) :**

Si l'interface ne permet pas l'import direct, vous devrez passer par SSH :

1. **Activez SSH** sur votre NAS (dans les paramètres réseau)
2. **Ouvrez PowerShell** sur votre PC :
   ```bash
   ssh admin@192.168.1.37
   # Entrez votre mot de passe NAS

   # Aller dans le dossier
   cd /volume1/docker/inventaire/docker-images

   # Importer les images
   docker load -i inventaire-backend.tar
   docker load -i inventaire-frontend.tar

   # Vérifier
   docker images | grep inventaire
   ```

   Vous devriez voir :
   ```
   inventaire-backend    latest   ...
   inventaire-frontend   latest   ...
   ```

3. **Désactivez SSH** si vous ne l'utilisez pas habituellement

---

## 5. Créer et démarrer le stack Docker

### 5.1 Créer le stack/compose

Dans l'interface Docker Ugreen :

1. **Cherchez la section** : **"Compose"**, **"Stacks"**, ou **"Projects"**
2. **Cliquez sur** : **"Créer"**, **"Add"** ou **"+"**
3. **Nom du stack** : `inventaire`
4. **Méthode d'import** (choisir selon votre interface) :

   **Méthode 1 - Upload de fichier :**
   - Cliquez sur "Upload" ou "Browse"
   - Sélectionnez le fichier `docker-compose.yml` depuis le NAS

   **Méthode 2 - Copier-coller :**
   - Ouvrez le fichier `docker-compose.yml` avec le Bloc-notes
   - Copiez tout le contenu
   - Collez dans l'éditeur web de l'interface Docker

   **Méthode 3 - Chemin du fichier :**
   - Indiquez le chemin : `/volume1/docker/inventaire/docker-compose.yml`

5. **Variables d'environnement** (section "Environment" si disponible) :
   - `SECRET_KEY` : (voir fichier .env)
   - `HOST_IP` : `192.168.1.37`

   ⚠️ **Note** : Si l'interface lit automatiquement le fichier `.env`, vous n'avez rien à faire.

6. **Cliquez sur** : **"Deploy"**, **"Start"**, **"Create"** ou **"Démarrer"**

### 5.2 Attendre le démarrage

L'interface devrait afficher :
- ⏳ Backend : Démarrage... (10-30 secondes)
- ⏳ Frontend : Démarrage... (5-10 secondes)

Puis :
- ✅ `inventaire_backend` : Running
- ✅ `inventaire_frontend` : Running

---

## 6. Vérifier le fonctionnement

### 6.1 Vérifier les conteneurs

Dans l'interface Docker, section **"Containers"** :

Vous devriez voir 2 conteneurs avec l'état **"Running"** ou **"Up"** :
- 🟢 `inventaire_backend` (port 8000)
- 🟢 `inventaire_frontend` (port 80)

### 6.2 Consulter les logs

**Pour le backend :**
1. Cliquez sur le conteneur `inventaire_backend`
2. Cliquez sur **"Logs"** ou **"Console"**
3. Vérifiez que vous voyez :
   ```
   >> Demarrage de l'application...
   >> Application prete !
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

**Pour le frontend :**
1. Cliquez sur le conteneur `inventaire_frontend`
2. Cliquez sur **"Logs"**
3. Vous devriez voir des logs Nginx

**❌ Si vous voyez des erreurs dans les logs** :
- Notez l'erreur exacte
- Vérifiez que le fichier `.env` est bien présent
- Vérifiez que les dossiers `data/database` et `data/exports` existent

### 6.3 Tester l'accès depuis votre PC

Ouvrez votre navigateur et testez ces URLs :

1. **Frontend de l'application** :
   - 🌐 http://192.168.1.37/
   - Vous devriez voir la page de **connexion/inscription**

2. **Documentation API** :
   - 🌐 http://192.168.1.37:8000/docs
   - Vous devriez voir l'interface **Swagger UI**

3. **Health check** :
   - 🌐 http://192.168.1.37:8000/api/health
   - Vous devriez voir : `{"status":"healthy","message":"L'API fonctionne correctement"}`

**✅ Si tout fonctionne** : Passez à l'étape 7 !

**❌ Si ça ne fonctionne pas** :
- Vérifiez que les conteneurs sont bien démarrés
- Consultez les logs pour identifier l'erreur
- Vérifiez que votre pare-feu/routeur autorise l'accès aux ports 80 et 8000

---

## 7. Première utilisation - Créer votre compte

1. **Ouvrez l'application** : http://192.168.1.37/
2. **Cliquez sur** : **"Créer un compte"**
3. **Remplissez le formulaire** :
   - Username : `admin` (ou votre choix)
   - Email : `admin@example.com` (ou votre email)
   - Mot de passe : Minimum 8 caractères
   - Confirmer le mot de passe
4. **Cliquez sur** : **"S'inscrire"**

Vous serez automatiquement connecté et redirigé vers le **Dashboard** ! 🎉

**⚠️ Important** : L'application est en **mode mono-utilisateur**. Une fois ce compte créé, personne d'autre ne pourra s'inscrire.

---

## 8. Utilisation courante

### Démarrer l'application
- Dans l'interface Docker du NAS, sélectionnez le stack `inventaire`
- Cliquez sur **"Start"**

### Arrêter l'application
- Sélectionnez le stack `inventaire`
- Cliquez sur **"Stop"**

### Accéder à l'application
- Depuis n'importe quel appareil sur votre réseau local
- Ouvrez : http://192.168.1.37/

### Sauvegarder vos données
Les données sont stockées dans :
- `\\192.168.1.37\docker\inventaire\data\database\inventaire.db`
- `\\192.168.1.37\docker\inventaire\data\exports\`

**💡 Conseil** : Copiez régulièrement le dossier `data` sur votre PC pour avoir une sauvegarde.

---

## 🆘 Problèmes courants

### "Failed to fetch" ou erreur CORS
**Solution** : Vérifiez que `HOST_IP=192.168.1.37` dans le fichier `.env`

### Port 80 déjà utilisé
**Solution** :
1. Ouvrez `docker-compose.yml`
2. Ligne `ports:` du frontend, changez `"80:80"` en `"8080:80"`
3. Redéployez le stack
4. Accédez via : http://192.168.1.37:8080/

### "Un utilisateur existe déjà" mais j'ai oublié mon mot de passe
**Solution** :
1. Arrêtez le stack
2. Supprimez : `\\192.168.1.37\docker\inventaire\data\database\inventaire.db`
3. Redémarrez le stack
4. Créez un nouveau compte

### Les conteneurs ne démarrent pas
**Solution** : Consultez les logs dans l'interface Docker pour identifier l'erreur

---

## 📱 Accès depuis votre smartphone/tablette

Une fois l'application déployée :
1. Connectez votre appareil au **même réseau WiFi** que le NAS
2. Ouvrez le navigateur mobile
3. Allez sur : http://192.168.1.37/
4. L'interface est **responsive** et s'adapte automatiquement

---

## ✅ Checklist complète

- [ ] Images Docker construites (backend + frontend)
- [ ] Images exportées en fichiers .tar
- [ ] Fichiers transférés vers le NAS (docker-compose.yml, .env, docker-images/)
- [ ] Dossiers data/database et data/exports créés
- [ ] Images importées dans l'interface Docker du NAS
- [ ] Stack Docker créé et démarré
- [ ] Conteneurs en état "Running"
- [ ] Application accessible sur http://192.168.1.37/
- [ ] Compte utilisateur créé
- [ ] Premier test : créer une catégorie et un article

---

**🎉 Félicitations ! Votre application d'inventaire est maintenant déployée sur votre NAS Ugreen !**

Pour aller plus loin, consultez la documentation complète dans le dossier `docs/`.
