# Docker Local - Configuration de Test

Configuration Docker pour tester le déploiement en local avant envoi sur NAS.

## 🎯 Objectif

Valider que l'application fonctionne correctement dans des conteneurs Docker **avant** de déployer sur le NAS.

## 📦 Stack

- **Backend** : FastAPI + uvicorn dans conteneur Python
- **Frontend** : Build React servi par Nginx
- **Database** : SQLite dans volume Docker
- **Reverse Proxy** : Nginx pour routing /api → backend
- **Port** : 80 (http://localhost)

## 📁 Fichiers (à créer)

```
docker-local/
├── README.md (ce fichier)
├── docker-compose.yml        # Orchestration conteneurs
├── backend.Dockerfile         # Build image backend
├── frontend.Dockerfile        # Build image frontend
├── nginx.conf                 # Configuration Nginx
└── .env.local                 # Variables d'environnement
```

## 🚀 Utilisation

### 1. Build images

```bash
cd deployment/docker-local/
docker-compose build
```

### 2. Lancer stack

```bash
docker-compose up -d
```

### 3. Accès

- **Frontend** : http://localhost
- **Backend API** : http://localhost/api
- **Swagger Docs** : http://localhost/api/docs

### 4. Logs

```bash
# Tous les conteneurs
docker-compose logs -f

# Backend seulement
docker-compose logs -f backend

# Frontend seulement
docker-compose logs -f frontend
```

### 5. Arrêter

```bash
docker-compose down
```

### 6. Nettoyer (supprime volumes)

```bash
docker-compose down -v
```

## ⚠️ Différences avec Dev Local

| Aspect | Dev Local | Docker Local |
|--------|-----------|--------------|
| Backend | uvicorn --reload | uvicorn production |
| Frontend | Vite dev server | Build statique + Nginx |
| Database | `backend/database/inventaire.db` | Volume Docker |
| CORS | Autorisé pour :5173 | Pas de CORS (même origine) |
| Hot Reload | ✅ Oui | ❌ Non (rebuild nécessaire) |

## 📝 Prochaines Étapes

1. [ ] Créer `docker-compose.yml`
2. [ ] Créer Dockerfiles
3. [ ] Créer `nginx.conf`
4. [ ] Tester build
5. [ ] Valider que tout fonctionne
6. [ ] Adapter pour `docker-nas/`

---

**Retour** : [deployment/README.md](../README.md)
