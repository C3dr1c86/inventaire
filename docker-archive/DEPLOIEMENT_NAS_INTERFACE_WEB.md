# Déploiement sur NAS Ugreen via Interface Web Docker

Guide pas à pas pour déployer l'application d'inventaire sur un NAS Ugreen en utilisant l'interface web Docker (sans SSH).

## Prérequis

- NAS Ugreen avec Docker installé
- Accès à l'interface web du NAS
- Connexion réseau entre votre PC et le NAS
- Docker Desktop installé sur votre PC (pour construire les images)

## Vue d'ensemble

Le déploiement se fait en 4 étapes :
1. **Construire les images** sur votre PC
2. **Transférer les fichiers** vers le NAS
3. **Importer les images** dans Docker du NAS
4. **Créer et démarrer le stack** Docker

---

## Étape 1 : Construire les images Docker sur votre PC

Sur votre PC Windows, ouvrez un terminal PowerShell ou CMD dans le dossier du projet.

### 1.1 Construire les images

```bash
cd c:\Users\cedri\Desktop\inventaire
scripts\build-images.bat
```

Le script va :
- Construire l'image backend (`inventaire-backend:latest`)
- Construire l'image frontend (`inventaire-frontend:latest`)
- Créer le dossier `docker-images/`
- Exporter les images en fichiers `.tar`

**Résultat attendu :**
```
docker-images/
├── inventaire-backend.tar  (~200 MB)
└── inventaire-frontend.tar (~150 MB)
```

### 1.2 Vérifier les images créées

```bash
dir docker-images
```

Vous devriez voir les deux fichiers `.tar`.

---

## Étape 2 : Transférer les fichiers vers le NAS

### 2.1 Créer le dossier sur le NAS

Via l'explorateur de fichiers Windows (ou l'interface web du NAS) :

1. Ouvrez l'explorateur Windows
2. Tapez dans la barre d'adresse : `\\votre-ip-nas` (ex: `\\192.168.1.100`)
3. Entrez vos identifiants NAS si demandé
4. Créez un dossier : `docker/inventaire`

### 2.2 Transférer les fichiers nécessaires

Copiez ces fichiers/dossiers vers `\\votre-ip-nas\docker\inventaire\` :

**Fichiers obligatoires :**
- `docker-compose.yml` (ou `docker-compose-prebuilt.yml` renommé en `docker-compose.yml`)
- `.env` (à créer, voir ci-dessous)
- Dossier `docker-images/` (avec les 2 fichiers .tar)

**Structure finale sur le NAS :**
```
/docker/inventaire/
├── docker-compose.yml
├── .env
└── docker-images/
    ├── inventaire-backend.tar
    └── inventaire-frontend.tar
```

### 2.3 Créer le fichier .env

Sur le NAS, créez un fichier `.env` avec ce contenu (adaptez les valeurs) :

```env
# Clé secrète JWT (générer avec : openssl rand -hex 32)
SECRET_KEY=votre_cle_secrete_aleatoire_de_32_caracteres_minimum

# IP du NAS sur le réseau local
HOST_IP=192.168.1.100

# Optionnel : Origines CORS supplémentaires
# CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://192.168.1.100
```

**⚠️ IMPORTANT** : Remplacez `192.168.1.100` par l'IP réelle de votre NAS.

Pour générer une clé secrète sécurisée :
- Sous Windows : Utilisez un générateur en ligne ou tapez une longue chaîne aléatoire (minimum 32 caractères)
- Sous Linux/Mac : `openssl rand -hex 32`

---

## Étape 3 : Importer les images dans Docker du NAS

### 3.1 Accéder à l'interface Docker du NAS

1. Ouvrez votre navigateur web
2. Allez sur l'interface du NAS : `http://votre-ip-nas:5000` (le port peut varier selon votre NAS)
3. Connectez-vous avec vos identifiants
4. Ouvrez l'application **Docker** ou **Container Manager**

### 3.2 Importer les images

**Option A : Via l'interface web (si disponible)**

Si votre interface Docker a une option "Import" ou "Load Image" :

1. Cliquez sur **Images** dans le menu Docker
2. Cherchez un bouton **"Importer"**, **"Charger"** ou **"Load"**
3. Sélectionnez `inventaire-backend.tar`
4. Attendez la fin de l'import
5. Répétez pour `inventaire-frontend.tar`

**Option B : Via SSH (alternative)**

Si l'interface ne permet pas l'import, vous devrez activer SSH temporairement :

```bash
# Se connecter au NAS
ssh admin@votre-ip-nas

# Aller dans le dossier
cd /volume1/docker/inventaire/docker-images

# Importer les images
docker load -i inventaire-backend.tar
docker load -i inventaire-frontend.tar

# Vérifier les images importées
docker images | grep inventaire
```

Vous devriez voir :
```
inventaire-backend    latest    ...    ...    ...
inventaire-frontend   latest    ...    ...    ...
```

---

## Étape 4 : Créer et démarrer le stack Docker

### 4.1 Préparer le fichier docker-compose.yml

Si vous avez transféré `docker-compose-prebuilt.yml`, renommez-le en `docker-compose.yml`.

Contenu du fichier à utiliser (docker-compose-prebuilt.yml) :

```yaml
services:
  # Backend FastAPI
  backend:
    image: inventaire-backend:latest
    container_name: inventaire_backend
    ports:
      - "8000:8000"
    volumes:
      - ./data/database:/app/database
      - ./data/exports:/app/exports
    environment:
      - SECRET_KEY=${SECRET_KEY:-changez-cette-cle-secrete-en-production}
      - DATABASE_URL=sqlite:///database/inventaire.db
    restart: unless-stopped
    networks:
      - inventaire_network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/docs"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend React
  frontend:
    image: inventaire-frontend:latest
    container_name: inventaire_frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_URL=http://${HOST_IP:-localhost}:8000/api
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - inventaire_network

networks:
  inventaire_network:
    driver: bridge

volumes:
  database_data:
  exports_data:
```

### 4.2 Créer les dossiers de données

Sur le NAS, dans `/volume1/docker/inventaire/`, créez ces dossiers :

```
mkdir -p data/database
mkdir -p data/exports
```

Ou via l'interface web du NAS, créez :
```
/docker/inventaire/data/database/
/docker/inventaire/data/exports/
```

### 4.3 Créer le stack dans l'interface Docker

**Méthode selon l'interface de votre NAS Ugreen :**

#### Interface type Portainer / Container Manager moderne :

1. Dans l'interface Docker, allez dans **Stacks** ou **Compose**
2. Cliquez sur **"Add Stack"** ou **"Create"**
3. Donnez un nom : `inventaire`
4. **Choisissez une méthode** :

   **Option 1 - Upload du fichier :**
   - Cliquez sur "Upload"
   - Sélectionnez votre `docker-compose.yml`

   **Option 2 - Copier-coller :**
   - Collez le contenu du `docker-compose.yml` dans l'éditeur web

5. **Variables d'environnement** (section "Environment" ou "Env file") :
   - Ajoutez : `SECRET_KEY=votre_cle_secrete`
   - Ajoutez : `HOST_IP=192.168.1.100` (votre IP NAS)

6. Cliquez sur **"Deploy"** ou **"Start"**

#### Interface type Docker classique :

1. Allez dans **Container** > **Create**
2. Passez en mode "Docker Compose"
3. Collez le contenu du fichier
4. Configurez les variables d'environnement
5. Cliquez sur "Apply" ou "Create"

---

## Étape 5 : Vérifier le déploiement

### 5.1 Vérifier les conteneurs

Dans l'interface Docker du NAS, section **Containers** :

Vous devriez voir 2 conteneurs en état **Running** :
- `inventaire_backend` (port 8000)
- `inventaire_frontend` (port 80)

### 5.2 Vérifier les logs

Pour chaque conteneur, cliquez sur "Logs" ou "View logs" :

**Backend** - Doit afficher :
```
>> Demarrage de l'application...
>> Application prete !
INFO:     Started server process
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Frontend** - Doit afficher des logs Nginx

### 5.3 Tester l'accès

Depuis n'importe quel appareil sur votre réseau local :

1. **Frontend** : Ouvrez `http://votre-ip-nas/` (ex: `http://192.168.1.100/`)
   - Vous devriez voir la page de connexion de l'application

2. **API Backend** : Ouvrez `http://votre-ip-nas:8000/docs`
   - Vous devriez voir la documentation Swagger de l'API

3. **Healthcheck API** : Ouvrez `http://votre-ip-nas:8000/api/health`
   - Vous devriez voir : `{"status":"healthy","message":"L'API fonctionne correctement"}`

---

## Étape 6 : Première utilisation

### 6.1 Créer votre compte utilisateur

1. Ouvrez l'application : `http://votre-ip-nas/`
2. Cliquez sur **"Créer un compte"**
3. Remplissez le formulaire :
   - **Username** : admin (ou votre choix)
   - **Email** : admin@example.com (ou votre email)
   - **Mot de passe** : minimum 8 caractères
   - **Confirmer mot de passe**
4. Cliquez sur **"S'inscrire"**

**Note** : L'application est en mode mono-utilisateur. Une fois le premier compte créé, l'inscription sera bloquée.

### 6.2 Se connecter

Après l'inscription, vous êtes automatiquement connecté et redirigé vers le **Dashboard**.

### 6.3 Commencer à utiliser l'application

1. **Créer des catégories** : Électronique, Alimentation, Fournitures...
2. **Ajouter des articles** : Nom, quantité, prix, catégorie...
3. **Enregistrer des mouvements** : Entrées et sorties de stock
4. **Consulter les rapports** : Stock bas, valeur totale...
5. **Exporter les données** : CSV ou PDF

---

## Gestion et maintenance

### Arrêter l'application

Dans l'interface Docker du NAS :
1. Sélectionnez le stack `inventaire`
2. Cliquez sur **"Stop"** ou **"Down"**

Ou pour chaque conteneur individuellement :
1. Sélectionnez le conteneur
2. Cliquez sur **"Stop"**

### Redémarrer l'application

1. Sélectionnez le stack ou les conteneurs
2. Cliquez sur **"Start"** ou **"Restart"**

### Voir les logs

1. Sélectionnez un conteneur
2. Cliquez sur **"Logs"** ou **"Console"**
3. Consultez les messages d'erreur éventuels

### Sauvegarder les données

Les données importantes se trouvent dans :
- **Base de données** : `/volume1/docker/inventaire/data/database/inventaire.db`
- **Exports** : `/volume1/docker/inventaire/data/exports/`

**Sauvegarde recommandée** :
1. Copiez ces dossiers régulièrement sur votre PC
2. Ou configurez une sauvegarde automatique du NAS

### Mettre à jour l'application

Pour mettre à jour vers une nouvelle version :

1. Sur votre PC, récupérez la nouvelle version du code
2. Reconstruisez les images : `scripts\build-images.bat`
3. Transférez les nouveaux fichiers `.tar` vers le NAS
4. Dans l'interface Docker :
   - Arrêtez le stack
   - Supprimez les anciennes images
   - Importez les nouvelles images
   - Redémarrez le stack

---

## Dépannage

### Problème : Les conteneurs ne démarrent pas

**Vérifiez** :
1. Les images sont bien importées : `docker images | grep inventaire`
2. Les dossiers `data/database` et `data/exports` existent
3. Le fichier `.env` est présent avec les bonnes valeurs
4. Les ports 80 et 8000 ne sont pas déjà utilisés

**Solution** : Consultez les logs des conteneurs pour identifier l'erreur

### Problème : "Failed to fetch" ou erreur CORS

**Cause** : Le frontend ne peut pas contacter le backend

**Solution** :
1. Vérifiez que `HOST_IP` dans `.env` correspond à l'IP réelle du NAS
2. Vérifiez que le backend est bien démarré (logs + `http://ip-nas:8000/docs`)
3. Redémarrez le conteneur frontend après modification du `.env`

### Problème : "Un utilisateur existe déjà" mais je ne me souviens pas du compte

**Solution** :
1. Arrêtez le stack Docker
2. Supprimez le fichier : `/volume1/docker/inventaire/data/database/inventaire.db`
3. Redémarrez le stack
4. La base sera recréée vide, vous pourrez créer un nouveau compte

### Problème : Port 80 déjà utilisé

**Solution** :
1. Modifiez `docker-compose.yml` ligne `ports:` du frontend
2. Changez `"80:80"` en `"8080:80"` (ou autre port libre)
3. Redéployez le stack
4. Accédez via : `http://ip-nas:8080/`

### Problème : Base de données verrouillée

**Solution** :
1. Arrêtez tous les conteneurs
2. Attendez 10 secondes
3. Redémarrez les conteneurs

### Problème : Impossible d'importer les images

**Cause** : Interface Docker limitée

**Solution alternative** :
1. Activez SSH sur le NAS temporairement
2. Transférez les `.tar` via SCP ou SMB
3. Connectez-vous en SSH : `ssh admin@ip-nas`
4. Importez manuellement : `docker load -i /volume1/docker/inventaire/docker-images/inventaire-backend.tar`
5. Désactivez SSH si vous ne l'utilisez pas

---

## Accès depuis l'extérieur (optionnel)

Pour accéder à l'application depuis Internet :

### Option 1 : VPN (Recommandé)
1. Configurez un serveur VPN sur votre NAS (WireGuard, OpenVPN)
2. Connectez-vous au VPN depuis l'extérieur
3. Accédez à l'application via l'IP locale : `http://192.168.1.100/`

### Option 2 : Port Forwarding (Moins sécurisé)
1. Sur votre routeur, redirigez un port externe vers le port 80 du NAS
2. Utilisez un DNS dynamique (DynDNS, No-IP...)
3. **ATTENTION** : Exposer l'application sur Internet nécessite des mesures de sécurité supplémentaires (HTTPS, pare-feu, authentification renforcée)

**⚠️ RECOMMANDATION** : Utilisez l'application uniquement sur votre réseau local ou via VPN pour des raisons de sécurité.

---

## Résumé des commandes utiles (si SSH activé)

```bash
# Se connecter au NAS
ssh admin@192.168.1.100

# Voir les conteneurs
docker ps

# Voir les logs backend
docker logs inventaire_backend

# Voir les logs frontend
docker logs inventaire_frontend

# Redémarrer un conteneur
docker restart inventaire_backend

# Arrêter le stack
cd /volume1/docker/inventaire
docker-compose down

# Démarrer le stack
docker-compose up -d

# Vérifier l'état
docker-compose ps
```

---

## Support

Pour toute question ou problème :
1. Consultez les logs des conteneurs
2. Vérifiez la documentation complète dans `docs/DEPLOIEMENT_NAS.md`
3. Vérifiez les issues sur le dépôt GitHub

---

**Version du guide** : 1.0
**Date** : 2026-02-06
**Compatible avec** : NAS Ugreen avec Docker
