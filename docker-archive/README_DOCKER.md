# Application d'Inventaire - Déploiement Docker

Application full-stack de gestion d'inventaire avec authentification JWT.

## Démarrage rapide (Local)

```bash
# 1. Copier le fichier d'environnement
cp .env.example .env

# 2. Modifier .env et changer la clé secrète
nano .env

# 3. Lancer l'application
docker-compose up -d

# 4. Accéder à l'application
# Frontend: http://localhost
# API: http://localhost:8000/docs
```

## Déploiement sur NAS Ugreen

Consultez le guide détaillé : [DEPLOIEMENT_NAS.md](./DEPLOIEMENT_NAS.md)

**Résumé rapide** :
1. Transférez les fichiers sur votre NAS
2. Créez le fichier `.env` avec votre configuration
3. Lancez `docker-compose up -d`
4. Accédez via http://votre-nas-ip/

## Structure du projet

```
inventaire/
├── backend/              # API FastAPI
│   ├── app/             # Code source
│   ├── Dockerfile       # Image Docker backend
│   └── requirements.txt # Dépendances Python
├── frontend/            # Application React
│   ├── src/            # Code source
│   ├── Dockerfile      # Image Docker frontend
│   └── nginx.conf      # Configuration Nginx
├── docs/               # Documentation
├── scripts/            # Scripts de déploiement
├── docker-compose.yml  # Orchestration Docker
├── .env.example        # Configuration exemple
└── data/               # Données persistantes (créé automatiquement)
    ├── database/       # Base de données SQLite
    └── exports/        # Fichiers exportés
```

## Ports utilisés

- **80** : Frontend (interface web)
- **8000** : Backend (API REST)

## Commandes Docker

```bash
# Démarrer
docker-compose up -d

# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f

# Redémarrer
docker-compose restart

# Reconstruire après modification
docker-compose build --no-cache
docker-compose up -d
```

## Sauvegarde

Les données importantes sont dans le dossier `data/` :
```bash
# Sauvegarder
tar -czf backup-inventaire-$(date +%Y%m%d).tar.gz data/

# Restaurer
tar -xzf backup-inventaire-YYYYMMDD.tar.gz
```

## Variables d'environnement

Fichier `.env` :
```env
SECRET_KEY=votre-cle-secrete-jwt-minimum-32-caracteres
HOST_IP=192.168.1.100  # IP de votre NAS/serveur
```

## Fonctionnalités

✅ Gestion des articles avec catégories et tags
✅ Suivi des mouvements de stock (entrées/sorties)
✅ Alertes de stock bas
✅ Recherche et filtres avancés
✅ Tri par colonnes
✅ Export CSV et PDF
✅ Authentification JWT
✅ Responsive (mobile, tablette, desktop)

## Technologies

- **Backend** : Python 3.11, FastAPI, SQLAlchemy, SQLite
- **Frontend** : React 18, Vite, React Query, React Router
- **Déploiement** : Docker, Nginx

## Support

Documentation complète : [DEPLOIEMENT_NAS.md](./DEPLOIEMENT_NAS.md)
