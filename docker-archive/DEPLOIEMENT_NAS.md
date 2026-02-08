# Déploiement sur NAS Ugreen avec Docker

Ce guide explique comment déployer l'application d'inventaire sur votre NAS Ugreen avec Docker.

## Prérequis

- NAS Ugreen avec Docker installé
- Accès SSH au NAS ou interface web Docker
- Au moins 1 GB d'espace disque disponible

## Étapes de déploiement

### 1. Préparer les fichiers sur le NAS

Transférez tout le dossier `inventaire` sur votre NAS. Vous pouvez utiliser :
- **FTP/SFTP** : Avec FileZilla ou WinSCP
- **SMB** : Copier directement via le partage réseau
- **SCP** : `scp -r inventaire/ user@nas-ip:/path/to/destination/`

Emplacement recommandé sur le NAS : `/volume1/docker/inventaire/`

### 2. Configuration

#### 2.1 Créer le fichier .env

Connectez-vous en SSH au NAS :
```bash
ssh admin@votre-nas-ip
cd /volume1/docker/inventaire
```

Créez le fichier `.env` à partir de l'exemple :
```bash
cp .env.example .env
nano .env
```

Modifiez les valeurs :
```env
# Générez une clé secrète sécurisée
SECRET_KEY=votre-cle-secrete-aleatoire-de-32-caracteres-minimum

# IP de votre NAS sur le réseau local
HOST_IP=192.168.1.100  # Remplacez par l'IP de votre NAS
```

> **Astuce** : Pour générer une clé secrète sécurisée :
> ```bash
> openssl rand -hex 32
> ```

#### 2.2 Créer les répertoires de données

```bash
mkdir -p data/database
mkdir -p data/exports
```

### 3. Lancer l'application

#### Option A : Via SSH (Recommandé)

```bash
cd /volume1/docker/inventaire
docker-compose up -d
```

#### Option B : Via l'interface web Docker du NAS

1. Ouvrez l'application Docker sur votre NAS
2. Allez dans "Compose" ou "Stack"
3. Créez un nouveau stack nommé "inventaire"
4. Collez le contenu de `docker-compose.yml`
5. Cliquez sur "Deploy" ou "Démarrer"

### 4. Vérifier le déploiement

Après 1-2 minutes, vérifiez que les conteneurs sont démarrés :
```bash
docker-compose ps
```

Vous devriez voir :
```
NAME                   STATUS    PORTS
inventaire_backend     Up        0.0.0.0:8000->8000/tcp
inventaire_frontend    Up        0.0.0.0:80->80/tcp
```

### 5. Accéder à l'application

Depuis n'importe quel appareil sur votre réseau local :

- **Frontend** : http://votre-nas-ip/ (ex: http://192.168.1.100/)
- **API Backend** : http://votre-nas-ip:8000/docs
- **Documentation API** : http://votre-nas-ip:8000/docs

> Si le port 80 est déjà utilisé, modifiez dans `docker-compose.yml` :
> ```yaml
> ports:
>   - "8080:80"  # Utiliser le port 8080 au lieu de 80
> ```
> L'application sera alors accessible sur http://votre-nas-ip:8080/

### 6. Créer le premier compte

Lors de la première connexion :
1. Cliquez sur "Créer un compte"
2. Renseignez vos identifiants
3. Connectez-vous

## Commandes utiles

### Voir les logs

```bash
# Tous les logs
docker-compose logs

# Logs du backend uniquement
docker-compose logs backend

# Logs du frontend uniquement
docker-compose logs frontend

# Suivre les logs en temps réel
docker-compose logs -f
```

### Redémarrer l'application

```bash
docker-compose restart
```

### Arrêter l'application

```bash
docker-compose down
```

### Mettre à jour l'application

```bash
# Arrêter et supprimer les conteneurs
docker-compose down

# Télécharger les nouvelles sources (ou copier les fichiers mis à jour)

# Reconstruire les images
docker-compose build --no-cache

# Redémarrer
docker-compose up -d
```

### Sauvegarder les données

Les données importantes se trouvent dans :
- **Base de données** : `data/database/inventaire.db`
- **Exports** : `data/exports/`

Pour sauvegarder :
```bash
cd /volume1/docker/inventaire
tar -czf backup-inventaire-$(date +%Y%m%d).tar.gz data/
```

Pour restaurer :
```bash
tar -xzf backup-inventaire-YYYYMMDD.tar.gz
```

## Dépannage

### Le frontend ne se connecte pas au backend

Vérifiez que `HOST_IP` dans `.env` correspond bien à l'IP de votre NAS :
```bash
cat .env | grep HOST_IP
```

Si besoin, modifiez et redémarrez :
```bash
nano .env
docker-compose restart frontend
```

### Port 80 déjà utilisé

Modifiez `docker-compose.yml` pour utiliser un autre port :
```yaml
frontend:
  ports:
    - "8080:80"  # Au lieu de "80:80"
```

Puis redémarrez :
```bash
docker-compose down
docker-compose up -d
```

### Erreur "Permission denied" pour la base de données

Vérifiez les permissions :
```bash
chmod -R 755 data/
chown -R 1000:1000 data/
```

### Les conteneurs ne démarrent pas

Vérifiez les logs d'erreur :
```bash
docker-compose logs
```

Vérifiez que les ports ne sont pas déjà utilisés :
```bash
netstat -tulpn | grep -E ':(80|8000)'
```

## Performances

### Ressources recommandées

- **CPU** : 1 cœur minimum (2 recommandés)
- **RAM** : 512 MB minimum (1 GB recommandé)
- **Disque** : 500 MB + espace pour les données

### Optimisation

Pour limiter les ressources utilisées, ajoutez dans `docker-compose.yml` :

```yaml
backend:
  deploy:
    resources:
      limits:
        cpus: '0.5'
        memory: 512M
```

## Sécurité

### Accès depuis Internet (Optionnel)

**⚠️ Non recommandé pour une application mono-utilisateur**

Si vous souhaitez quand même exposer l'application sur Internet :

1. **Utilisez un reverse proxy** (Nginx Proxy Manager, Traefik)
2. **Activez HTTPS** avec Let's Encrypt
3. **Changez les ports par défaut**
4. **Utilisez un mot de passe fort**
5. **Mettez à jour régulièrement** les dépendances

### Sauvegardes automatiques

Créez un cron job sur le NAS :
```bash
crontab -e
```

Ajoutez (sauvegarde quotidienne à 2h du matin) :
```
0 2 * * * cd /volume1/docker/inventaire && tar -czf /volume1/backups/inventaire-$(date +\%Y\%m\%d).tar.gz data/
```

## Support

Pour toute question ou problème :
1. Vérifiez d'abord les logs : `docker-compose logs`
2. Consultez la documentation API : http://votre-nas-ip:8000/docs
3. Vérifiez que tous les conteneurs sont en cours d'exécution : `docker-compose ps`
