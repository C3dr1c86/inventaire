# Guide de déploiement via interface web UGOS

## Étape 1 : Se connecter à l'interface UGOS

1. Ouvrez votre navigateur
2. Allez sur : **http://192.168.1.37**
3. Connectez-vous avec vos identifiants

## Étape 2 : Accéder à Docker

1. Dans le menu principal, cliquez sur **Docker** ou **Container Manager**
2. Allez dans l'onglet **Projets** ou **Projects**

## Étape 3 : Créer le projet Inventaire

1. Cliquez sur **+ Créer** ou **+ Create Project**
2. Remplissez les informations :
   - **Nom du projet** : `inventaire`
   - **Description** : `Application de gestion d'inventaire v1.6.0`

## Étape 4 : Coller le docker-compose.yml

Dans l'éditeur de configuration, **COPIEZ-COLLEZ** ce contenu :

```yaml
version: '3.8'

services:
  backend:
    image: ghcr.io/c3dr1c86/inventaire/backend:latest
    container_name: inventaire-backend
    restart: unless-stopped
    environment:
      - SECRET_KEY=ac68ceb02c5ca196e5d82e7290f1c053e08cd865caaea43ffe1da3fe7ad27ca8
      - DATABASE_URL=sqlite:///./database/inventaire.db
      - CORS_ORIGINS=http://192.168.1.37,http://localhost,http://localhost:80
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
      - VITE_API_URL=http://192.168.1.37/api
    ports:
      - "80:80"
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

networks:
  inventaire-network:
    driver: bridge

volumes:
  backend_data:
  frontend_assets:
```

## Étape 5 : Configuration des variables (si demandé)

Si l'interface vous demande de saisir les variables d'environnement séparément :

### Backend :
- `SECRET_KEY` = `ac68ceb02c5ca196e5d82e7290f1c053e08cd865caaea43ffe1da3fe7ad27ca8`
- `DATABASE_URL` = `sqlite:///./database/inventaire.db`
- `CORS_ORIGINS` = `http://192.168.1.37,http://localhost,http://localhost:80`

### Frontend :
- `VITE_API_URL` = `http://192.168.1.37/api`

## Étape 6 : Configurer les ports

Si l'interface affiche les ports séparément :
- Frontend : **80** (externe) → **80** (interne)

**IMPORTANT** : Si le port 80 est déjà utilisé sur votre NAS, changez-le :
- Remplacez `"80:80"` par `"8080:80"` dans le docker-compose.yml
- Vous accéderez alors à l'application sur http://192.168.1.37:8080

## Étape 7 : Démarrer le projet

1. Vérifiez que tout est correct
2. Cliquez sur **Créer et démarrer** ou **Create and Start**
3. Attendez 2-3 minutes le téléchargement des images Docker

## Étape 8 : Vérifier le déploiement

### Dans l'interface UGOS :

1. Allez dans **Docker** > **Conteneurs**
2. Vous devriez voir :
   - ✅ `inventaire-backend` - Status: Running
   - ✅ `inventaire-frontend` - Status: Running

### Dans votre navigateur :

Ouvrez : **http://192.168.1.37**

Vous devriez voir la page de connexion de l'application Inventaire !

## Étape 9 : Créer votre premier utilisateur

1. Sur la page de connexion, cliquez sur **S'inscrire**
2. Remplissez le formulaire :
   - **Nom d'utilisateur** : admin
   - **Email** : votre@email.com
   - **Mot de passe** : (choisissez un mot de passe sécurisé)
3. Cliquez sur **S'inscrire**
4. Connectez-vous avec vos identifiants

🎉 **Félicitations ! L'application est déployée !**

---

## Dépannage

### Le port 80 est déjà utilisé

Si vous voyez une erreur "port already in use" :

1. Dans l'éditeur docker-compose.yml, changez la ligne :
   ```yaml
   ports:
     - "8080:80"  # Au lieu de "80:80"
   ```
2. Redémarrez le projet
3. Accédez à : http://192.168.1.37:8080

### Les conteneurs ne démarrent pas

1. Vérifiez les logs dans **Docker** > **Conteneurs** > Cliquez sur le conteneur > **Logs**
2. Vérifiez que les images ont bien été téléchargées
3. Vérifiez que Docker a assez de mémoire (minimum 2 GB)

### L'application ne charge pas

1. Vérifiez que les deux conteneurs sont bien "Running"
2. Attendez 1-2 minutes après le démarrage (le backend doit initialiser la base de données)
3. Vérifiez les logs du backend pour voir s'il y a des erreurs

---

## Gestion de l'application

### Redémarrer l'application

**Docker** > **Projets** > `inventaire` > **Redémarrer**

### Arrêter l'application

**Docker** > **Projets** > `inventaire` > **Arrêter**

### Voir les logs

**Docker** > **Conteneurs** > Cliquez sur `inventaire-backend` ou `inventaire-frontend` > **Logs**

### Mettre à jour vers une nouvelle version

1. Arrêtez le projet
2. **Docker** > **Images** > Supprimez les anciennes images
3. Redémarrez le projet (il téléchargera automatiquement les nouvelles images)

---

## Sauvegarde des données

Les données sont stockées dans les volumes Docker :
- **Base de données** : `data/database/inventaire.db`
- **Exports** : `data/exports/`
- **Uploads** : `data/uploads/`

Pour sauvegarder, utilisez la fonction **Backup** de UGOS sur le projet Docker.
