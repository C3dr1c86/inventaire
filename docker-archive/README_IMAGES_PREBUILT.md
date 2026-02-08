# Déploiement avec Images Docker Pré-construites

Ce guide explique comment utiliser les images Docker pré-construites pour un déploiement ultra-rapide sans avoir à builder les images sur le NAS.

## Avantages

✅ **Déploiement plus rapide** : Pas besoin de builder sur le NAS
✅ **Moins de ressources** : Le NAS n'a pas besoin de builder les images
✅ **Reproductible** : Même image testée partout
✅ **Hors ligne** : Pas besoin d'internet sur le NAS

---

## Méthode 1 : Build sur PC Windows

### Étape 1 : Builder les images sur votre PC

```batch
# Lancez le script de build
build-images.bat
```

Le script va :
1. ✅ Builder l'image backend (Python/FastAPI)
2. ✅ Builder l'image frontend (React/Nginx)
3. ✅ Exporter les images en fichiers .tar (ou .tar.gz)
4. ✅ Les placer dans le dossier `docker-images/`

**Temps estimé** : 5-10 minutes selon votre PC

### Étape 2 : Transférer les images sur le NAS

#### Option A : Via SMB (Partage réseau)

1. Ouvrez l'explorateur Windows
2. Allez sur `\\votre-nas-ip\docker\inventaire\`
3. Copiez le dossier `docker-images\` entier

#### Option B : Via SCP (si SSH activé)

```batch
scp -r docker-images admin@votre-nas-ip:/volume1/docker/inventaire/
```

### Étape 3 : Charger les images sur le NAS

Connectez-vous en SSH au NAS :

```bash
ssh admin@votre-nas-ip
cd /volume1/docker/inventaire
```

Chargez les images :

```bash
# Si fichiers .tar (non compressés)
docker load -i docker-images/inventaire-backend.tar
docker load -i docker-images/inventaire-frontend.tar

# Si fichiers .tar.gz (compressés)
gunzip -c docker-images/inventaire-backend.tar.gz | docker load
gunzip -c docker-images/inventaire-frontend.tar.gz | docker load
```

### Étape 4 : Vérifier les images

```bash
docker images | grep inventaire
```

Vous devriez voir :
```
inventaire-backend    latest    abc123...   xxx MB
inventaire-frontend   latest    def456...   xxx MB
```

### Étape 5 : Configurer l'application

```bash
# Créer le fichier .env
cp .env.example .env
nano .env

# Modifier SECRET_KEY et HOST_IP
```

### Étape 6 : Lancer avec docker-compose-prebuilt.yml

```bash
docker-compose -f docker-compose-prebuilt.yml up -d
```

**Important** : Utilisez bien `docker-compose-prebuilt.yml`, pas `docker-compose.yml` (qui tenterait de rebuild).

### Étape 7 : Accéder à l'application

Ouvrez dans votre navigateur :
- **Frontend** : http://votre-nas-ip/
- **API** : http://votre-nas-ip:8000/docs

---

## Méthode 2 : Build sur PC Linux/Mac

### Étape 1 : Builder les images

```bash
# Rendre le script exécutable
chmod +x build-images.sh

# Lancer le build
./build-images.sh
```

### Étape 2 : Transférer les images

```bash
# Via SCP
scp -r docker-images/ admin@votre-nas-ip:/volume1/docker/inventaire/

# OU via rsync (plus rapide pour gros fichiers)
rsync -avz docker-images/ admin@votre-nas-ip:/volume1/docker/inventaire/docker-images/
```

### Étapes 3-7

Suivez les mêmes étapes que pour Windows à partir de l'étape 3.

---

## Méthode 3 : Build directement sur le NAS (classique)

Si vous préférez builder directement sur le NAS :

```bash
ssh admin@votre-nas-ip
cd /volume1/docker/inventaire

# Build et démarrage
docker-compose up -d
```

Cette méthode utilise le `docker-compose.yml` classique qui build les images.

---

## Tailles des images

**Estimations** :
- Backend : ~150-200 MB compressé
- Frontend : ~40-60 MB compressé

**Total** : ~200-260 MB à transférer

---

## Mise à jour de l'application

### Option A : Rebuild complet sur PC

1. Modifiez le code source
2. Relancez `build-images.bat` (ou `.sh`)
3. Transférez les nouvelles images sur le NAS
4. Sur le NAS :
   ```bash
   # Arrêter
   docker-compose -f docker-compose-prebuilt.yml down

   # Recharger les images
   gunzip -c docker-images/inventaire-backend.tar.gz | docker load
   gunzip -c docker-images/inventaire-frontend.tar.gz | docker load

   # Redémarrer
   docker-compose -f docker-compose-prebuilt.yml up -d
   ```

### Option B : Rebuild sur le NAS

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## Commandes utiles

### Voir les images chargées

```bash
docker images
```

### Voir l'espace disque utilisé

```bash
docker system df
```

### Nettoyer les anciennes images

```bash
# Supprimer les images non utilisées
docker image prune -a

# Nettoyer tout (images, volumes, caches)
docker system prune -a --volumes
```

### Sauvegarder une image spécifique

```bash
docker save -o ma-sauvegarde.tar inventaire-backend:latest
```

### Charger une image depuis une sauvegarde

```bash
docker load -i ma-sauvegarde.tar
```

---

## Dépannage

### Erreur "image not found"

Les images n'ont pas été chargées correctement. Vérifiez :
```bash
docker images | grep inventaire
```

Si vide, rechargez les images :
```bash
gunzip -c docker-images/inventaire-backend.tar.gz | docker load
gunzip -c docker-images/inventaire-frontend.tar.gz | docker load
```

### Erreur "no space left on device"

Le NAS manque d'espace disque. Nettoyez :
```bash
docker system prune -a
```

### Les conteneurs ne démarrent pas

Vérifiez les logs :
```bash
docker-compose -f docker-compose-prebuilt.yml logs
```

### Erreur lors du transfert SCP

Vérifiez que SSH est activé sur votre NAS et que vous utilisez les bons identifiants.

---

## Comparaison des méthodes

| Méthode | Avantages | Inconvénients |
|---------|-----------|---------------|
| **Images pré-construites** | ✅ Rapide<br>✅ Léger sur NAS<br>✅ Testé sur PC | ⚠️ Transfert de fichiers<br>⚠️ ~250 MB à copier |
| **Build sur NAS** | ✅ Aucun transfert<br>✅ Toujours à jour | ⚠️ Plus lent<br>⚠️ Utilise CPU/RAM du NAS<br>⚠️ Nécessite internet |

---

## Scripts de déploiement automatique

Vous pouvez créer un script qui fait tout automatiquement :

```bash
#!/bin/bash
# deploy-to-nas.sh

NAS_IP="192.168.1.100"
NAS_USER="admin"

echo "🔨 Build des images..."
./build-images.sh

echo "📤 Transfert vers le NAS..."
scp -r docker-images/ $NAS_USER@$NAS_IP:/volume1/docker/inventaire/

echo "🚀 Déploiement sur le NAS..."
ssh $NAS_USER@$NAS_IP << 'EOF'
cd /volume1/docker/inventaire
docker-compose -f docker-compose-prebuilt.yml down
gunzip -c docker-images/inventaire-backend.tar.gz | docker load
gunzip -c docker-images/inventaire-frontend.tar.gz | docker load
docker-compose -f docker-compose-prebuilt.yml up -d
EOF

echo "✅ Déploiement terminé !"
echo "🌐 Application disponible sur http://$NAS_IP/"
```

---

## Support

Pour toute question :
1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez les images : `docker images`
3. Consultez [DEPLOIEMENT_NAS.md](./DEPLOIEMENT_NAS.md)
