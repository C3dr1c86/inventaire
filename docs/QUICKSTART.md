# Démarrage Rapide - Application d'Inventaire

## ⚡ Déploiement ULTRA-RAPIDE (Images Pré-construites)

**La méthode la plus rapide !** Build sur votre PC, déploiement automatique sur le NAS.

### Windows

1. **Modifiez la configuration** dans `scripts/deploy-to-nas.bat` :
   ```batch
   set NAS_IP=192.168.1.100    # Votre IP NAS
   set NAS_USER=admin          # Votre user NAS
   ```

2. **Double-cliquez sur** `scripts/deploy-to-nas.bat`

3. **C'est tout !** Le script :
   - ✅ Build les images Docker sur votre PC
   - ✅ Les transfère sur votre NAS
   - ✅ Les installe et démarre l'application

4. **Accédez** : http://192.168.1.100/

### Linux/Mac

```bash
# Configurer (optionnel)
export NAS_IP=192.168.1.100
export NAS_USER=admin

# Déployer
chmod +x scripts/deploy-to-nas.sh
./scripts/deploy-to-nas.sh
```

📚 **Guide détaillé** : [README_IMAGES_PREBUILT.md](./README_IMAGES_PREBUILT.md)

---

## 🚀 Déploiement Classique sur NAS Ugreen

### Étape 1 : Transférer les fichiers

1. Copiez tout le dossier `inventaire/` sur votre NAS
   - Via SMB/CIFS : Copiez dans un dossier partagé
   - Emplacement recommandé : `/volume1/docker/inventaire/`

### Étape 2 : Configuration

1. Connectez-vous en SSH au NAS :
   ```bash
   ssh admin@<IP-du-NAS>
   cd /volume1/docker/inventaire
   ```

2. Lancez le script de configuration :
   ```bash
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

   OU configurez manuellement :
   ```bash
   cp .env.example .env
   nano .env
   # Modifiez SECRET_KEY et HOST_IP avec l'IP de votre NAS
   ```

### Étape 3 : Lancer l'application

```bash
docker-compose up -d
```

### Étape 4 : Accéder

Depuis n'importe quel appareil sur votre réseau :
- **Application** : http://192.168.1.100/ (remplacez par l'IP de votre NAS)
- **Documentation API** : http://192.168.1.100:8000/docs

### Étape 5 : Premier compte

1. Cliquez sur "Créer un compte"
2. Renseignez vos identifiants
3. Commencez à utiliser l'application !

---

## 💻 Déploiement Local (Windows/Mac/Linux)

### Prérequis

- Docker Desktop installé
- Git (optionnel)

### Installation Windows

1. Double-cliquez sur `scripts/setup.bat`
2. Suivez les instructions
3. Lancez `docker-compose up -d`
4. Ouvrez http://localhost/

### Installation Linux/Mac

1. Lancez `./scripts/setup.sh`
2. Suivez les instructions
3. Lancez `docker-compose up -d`
4. Ouvrez http://localhost/

---

## 🔧 Commandes Utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Mettre à jour (après avoir copié les nouveaux fichiers)
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 📱 Accès depuis votre téléphone/tablette

Une fois l'application déployée sur votre NAS :
1. Assurez-vous que votre appareil est sur le même réseau WiFi
2. Ouvrez le navigateur
3. Allez sur http://IP-DU-NAS/
4. Ajoutez un raccourci sur l'écran d'accueil (option "Ajouter à l'écran d'accueil")

---

## 📚 Documentation Complète

- **Déploiement NAS détaillé** : [DEPLOIEMENT_NAS.md](./DEPLOIEMENT_NAS.md)
- **Guide Docker** : [README_DOCKER.md](./README_DOCKER.md)
- **Documentation projet** : [README.md](../README.md)

---

## ❓ Problèmes Courants

### Erreur "Port already in use"

Le port 80 est déjà utilisé. Modifiez `docker-compose.yml` :
```yaml
frontend:
  ports:
    - "8080:80"  # Au lieu de "80:80"
```

### Frontend ne se connecte pas au backend

Vérifiez le fichier `.env` :
```bash
cat .env
# HOST_IP doit être l'IP de votre NAS, pas localhost
```

### Impossible de se connecter depuis un autre appareil

Vérifiez :
1. Le pare-feu de votre NAS n'est pas actif
2. Vous êtes bien sur le même réseau
3. L'IP dans `.env` est correcte

---

## 💾 Sauvegarde Rapide

```bash
# Sauvegarder
cd /volume1/docker/inventaire
tar -czf backup-$(date +%Y%m%d).tar.gz data/

# Restaurer
tar -xzf backup-YYYYMMDD.tar.gz
```

---

**Besoin d'aide ?** Consultez [DEPLOIEMENT_NAS.md](./DEPLOIEMENT_NAS.md) pour plus de détails.
