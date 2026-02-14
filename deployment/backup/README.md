# Scripts de Backup Automatisés - Inventaire

Scripts de sauvegarde et restauration pour l'application Inventaire avec rétention intelligente.

## 📦 Contenu

- **backup.sh** : Script principal de backup automatisé
- **restore.sh** : Script de restauration depuis un backup
- **test-backup.sh** : Test automatisé d'intégrité des backups
- **check-disk-space.sh** : Vérification espace disque
- **crontab.example** : Exemple de configuration cron

## 🚀 Installation Rapide

### 1. Copier les scripts

```bash
# Sur votre serveur/NAS
cd /app/deployment/backup

# Rendre exécutables
chmod +x backup.sh restore.sh test-backup.sh check-disk-space.sh
```

### 2. Configurer le cron

```bash
# Éditer le crontab
crontab -e

# Ajouter le backup quotidien à 2h00
0 2 * * * /app/deployment/backup/backup.sh >> /app/backups/backup.log 2>&1

# Ajouter le test mensuel (1er de chaque mois à 3h00)
0 3 1 * * /app/deployment/backup/test-backup.sh >> /app/backups/test.log 2>&1
```

### 3. Tester manuellement

```bash
# Exécuter un backup immédiat
./backup.sh

# Vérifier les logs
tail -f /app/backups/backup.log
```

## 📋 Utilisation

### Backup Manuel

```bash
# Backup immédiat
cd /app/deployment/backup
./backup.sh

# Backups créés dans:
# - /app/backups/daily/backup_YYYYMMDD.tar.gz (quotidien)
# - /app/backups/weekly/backup_YYYY_WWW.tar.gz (hebdomadaire, dimanche)
# - /app/backups/monthly/backup_YYYYMM.tar.gz (mensuel, 1er du mois)
```

### Restauration depuis Backup

```bash
# Lister les backups disponibles
ls -lh /app/backups/daily/*.tar.gz
ls -lh /app/backups/weekly/*.tar.gz
ls -lh /app/backups/monthly/*.tar.gz

# Restaurer un backup spécifique
./restore.sh /app/backups/daily/backup_20260214.tar.gz

# Suivre les instructions affichées
# ⚠️ ATTENTION: Cette opération écrase les données actuelles !
```

### Test d'Intégrité

```bash
# Tester le dernier backup quotidien
./test-backup.sh

# Tester un backup spécifique
./test-backup.sh /app/backups/weekly/backup_2026_W07.tar.gz

# Résultats dans /tmp/backup_test_YYYYMMDD.log
```

## 🔧 Configuration

### Variables d'Environnement

Créer un fichier `.env` ou définir dans le crontab :

```bash
# Répertoire de stockage des backups
BACKUP_DIR=/app/backups

# Chemin vers la base de données
DATABASE_PATH=/app/data/database/inventaire.db

# Répertoire des uploads (photos)
UPLOADS_PATH=/app/data/uploads

# Répertoire des exports
EXPORTS_PATH=/app/data/exports

# Remote cloud (optionnel, nécessite rclone configuré)
RCLONE_REMOTE=backblaze  # ou gdrive, s3, etc.
```

### Politique de Rétention

Par défaut :

- **Quotidiens** : 7 derniers jours
- **Hebdomadaires** : 4 dernières semaines
- **Mensuels** : 12 derniers mois

Modifier dans `backup.sh` lignes 73-91.

## 🌩️ Synchronisation Cloud (Optionnel)

### Configuration Rclone

```bash
# Installer rclone
curl https://rclone.org/install.sh | sudo bash

# Configurer un remote (exemple: Backblaze B2)
rclone config

# Nom du remote: backblaze
# Type: b2
# Application Key ID: xxx
# Application Key: yyy

# Tester
rclone ls backblaze:inventaire-backups
```

### Activer le Sync Automatique

Dans le crontab, décommenter :

```cron
# Sync vers cloud toutes les 6 heures
0 */6 * * * RCLONE_REMOTE=backblaze /app/deployment/backup/backup.sh
```

## 📊 Monitoring

### Vérifier l'État des Backups

```bash
# Logs du dernier backup
tail -50 /app/backups/backup.log

# Nombre de backups par type
echo "Quotidiens: $(ls /app/backups/daily/*.tar.gz 2>/dev/null | wc -l)"
echo "Hebdomadaires: $(ls /app/backups/weekly/*.tar.gz 2>/dev/null | wc -l)"
echo "Mensuels: $(ls /app/backups/monthly/*.tar.gz 2>/dev/null | wc -l)"

# Espace disque utilisé
du -sh /app/backups
```

### Alertes Email (Optionnel)

Nécessite `mailutils` ou `sendmail` configuré :

```cron
# Recevoir email en cas d'échec
MAILTO=admin@example.com
0 2 * * * /app/deployment/backup/backup.sh || echo "Backup failed!" | mail -s "ALERTE: Backup Échec" admin@example.com
```

## 🔒 Sécurité

### Permissions Recommandées

```bash
# Scripts accessibles en lecture/exécution uniquement
chmod 750 /app/deployment/backup/*.sh

# Backups accessibles uniquement par l'utilisateur
chmod 700 /app/backups
chmod 600 /app/backups/*/*.tar.gz
```

### Chiffrement des Backups (Recommandé pour Cloud)

```bash
# Chiffrer avant upload
gpg --symmetric --cipher-algo AES256 backup.tar.gz

# Déchiffrer pour restauration
gpg --decrypt backup.tar.gz.gpg > backup.tar.gz
```

Modifier `backup.sh` ligne 108 pour activer le chiffrement automatique.

## 🧪 Test de Restauration Mensuel

**IMPORTANT** : Tester la restauration régulièrement pour s'assurer que les backups sont valides !

```bash
# Test automatisé (recommandé)
./test-backup.sh

# Test complet manuel (1 fois par mois)
# 1. Créer une VM ou conteneur de test
docker run -it --rm -v /app/backups:/backups ubuntu bash

# 2. Restaurer le backup
./restore.sh /backups/daily/backup_YYYYMMDD.tar.gz

# 3. Démarrer l'application et vérifier
docker-compose up -d
curl http://localhost/api/health

# 4. Vérifier les données
sqlite3 /app/data/database/inventaire.db "SELECT COUNT(*) FROM articles;"
```

## 📅 Exemple de Routine Mensuelle

**1er du mois** :

- [x] Backup mensuel automatique (cron 0 3 1 \* \*)
- [x] Test de restauration automatique (cron 0 3 1 \* \*)
- [ ] Vérifier logs : `cat /app/backups/test.log`
- [ ] Vérifier espace disque : `df -h`
- [ ] (Optionnel) Télécharger backup mensuel localement

## 🆘 Troubleshooting

### Backup Échoue

```bash
# Vérifier les logs
tail -100 /app/backups/backup.log

# Vérifier l'espace disque
df -h /app

# Vérifier les permissions
ls -la /app/data/database/inventaire.db
ls -ld /app/backups
```

### Restauration Échoue

```bash
# Vérifier l'intégrité de l'archive
tar -tzf backup.tar.gz | head -20

# Tester l'extraction
mkdir /tmp/test
tar -xzf backup.tar.gz -C /tmp/test
ls -lR /tmp/test
```

### Checksum MD5 Mismatch

```bash
# Recalculer le checksum
md5sum backup.tar.gz

# Comparer avec le fichier .md5
cat backup.tar.gz.md5

# Si différent : archive corrompue, utiliser backup précédent
```

## 📞 Support

En cas de problème :

1. Consulter `/app/backups/backup.log`
2. Exécuter `./test-backup.sh` pour diagnostic
3. Vérifier l'espace disque : `df -h`
4. Vérifier les permissions : `ls -la /app/backups`

---

**Dernière mise à jour** : 2026-02-14
**Testé avec** : Docker Compose, Ubuntu 22.04, Debian 11
