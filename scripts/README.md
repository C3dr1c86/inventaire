# Scripts - Application Inventaire

Ce dossier contient tous les scripts utilitaires pour le développement et le déploiement de l'application.

## 🚀 Scripts de développement local

### Windows (.bat)

- **`start-backend.bat`** - Démarre le serveur backend FastAPI (uvicorn)
- **`start-frontend.bat`** - Démarre le serveur de développement frontend (Vite)
- **`lanceur inventaire local.bat`** - Lance backend ET frontend en même temps

### Linux/Mac (.sh)

- **`start-backend.sh`** - Démarre le serveur backend FastAPI (uvicorn)
- **`start-frontend.sh`** - Démarre le serveur de développement frontend (Vite)
- **`start-dev.sh`** - Lance backend ET frontend en même temps (version Linux/Mac)

## 🗄️ Scripts de base de données

### Windows (.bat)

- **`reset-database.bat`** - Supprime et recrée la base de données avec des données de test
- **`seed-database.bat`** - Ajoute des données de test à la base existante

**⚠️ ATTENTION** : `reset-database.bat` supprime TOUTES les données existantes !

**Données de test créées** :
- 1 utilisateur (admin/admin)
- 8 catégories hiérarchiques (Matériaux, Consommables, Outillage + sous-catégories)
- 5 tags (Prioritaire, Fragile, Nouveau, Promotion, Stock limité)
- 3 fournisseurs (BricoMax, Outillage Pro, Bois & Matériaux)
- 10 emplacements (2 zones, 3 étagères, 5 boîtes)
- 10 articles variés avec tags et fournisseurs
- 10 mouvements de stock

## 🔧 Scripts de configuration

### Git Setup

- **`setup-git-v1.1.bat`** (Windows) - Configure Git pour le projet
- **`setup-git-v1.1.sh`** (Linux/Mac) - Configure Git pour le projet

Ces scripts configurent :
- L'identité Git (nom et email)
- Les hooks pre-commit
- Les alias Git utiles
- Le fichier .gitignore

## 📖 Utilisation

### Démarrage rapide (développement)

**Windows :**
```batch
# Lancer l'application complète
scripts\lanceur inventaire local.bat

# OU lancer backend et frontend séparément
scripts\start-backend.bat
scripts\start-frontend.bat
```

**Linux/Mac :**
```bash
# Lancer l'application complète
./scripts/start-dev.sh

# OU lancer backend et frontend séparément
./scripts/start-backend.sh
./scripts/start-frontend.sh
```

### Réinitialisation de la base de données

**Windows :**
```batch
# Supprimer et recréer avec données de test
scripts\reset-database.bat

# Ou juste ajouter des données de test
scripts\seed-database.bat
```

**💡 Cas d'usage :**
- Après avoir ajouté de nouveaux modèles (ex: Commande, LigneCommande)
- Pour revenir à un état propre avec des données de test
- Pour tester l'application rapidement sans saisir manuellement les données

### Configuration Git

**Windows :**
```batch
scripts\setup-git-v1.1.bat
```

**Linux/Mac :**
```bash
chmod +x scripts/setup-git-v1.1.sh
./scripts/setup-git-v1.1.sh
```

## 🐳 Scripts Docker

Pour le déploiement Docker, voir les scripts dans le dossier **`deployment/`** :
- `deployment/docker-local/` - Déploiement local
- `deployment/docker-nas/` - Déploiement NAS (Ugreen/Synology)
- `deployment/raspberry-pi/` - Déploiement Raspberry Pi
- `deployment/portable-demo/` - Version portable Windows

## 📝 Notes

- **Windows** : Les fichiers `.bat` sont pour Windows
- **Linux/Mac** : Les fichiers `.sh` sont pour Linux/Mac (pensez à les rendre exécutables avec `chmod +x`)
- Pour plus d'informations sur les scripts, voir [`docs/SCRIPTS_README.md`](../docs/SCRIPTS_README.md)
- Pour le démarrage rapide complet, voir [`docs/DEMARRAGE_RAPIDE.md`](../docs/DEMARRAGE_RAPIDE.md)

---

**Dernière mise à jour** : 2026-02-11
