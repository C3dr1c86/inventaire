# Archive Docker

Ce dossier contient tous les fichiers liés au déploiement Docker qui ont été mis de côté pour se concentrer sur le développement local.

## Contenu

### Images Docker exportées (.tar)
- `inventaire-backend-*.tar` - Images Docker du backend FastAPI
- `inventaire-frontend-*.tar` - Images Docker du frontend React

### Fichiers de configuration Docker
- `docker-compose*.yml` - Différentes configurations Docker Compose testées
- `Dockerfile.backend` - Dockerfile du backend
- `Dockerfile.frontend` - Dockerfile du frontend
- `docker-entrypoint.sh` - Script d'entrée pour le conteneur frontend
- `nginx.conf` / `nginx-proxy.conf` - Configurations Nginx pour le reverse proxy

### Scripts de build
- `rebuild-*.bat` - Scripts Windows pour reconstruire les images

### Documentation
- `DEPLOIEMENT_NAS*.md` - Guides de déploiement sur NAS Ugreen/Synology
- `README_DOCKER.md` - Documentation Docker
- `GUIDE_DEPLOIEMENT_RAPIDE.md` - Guide rapide de déploiement

## Problèmes rencontrés

Le déploiement Docker nécessitait une architecture Nginx reverse proxy complexe pour éviter les problèmes CORS. Les points critiques étaient :

1. **`redirect_slashes=False`** dans FastAPI pour éviter les redirections 307
2. **env-config.js** généré au runtime avec chemin relatif `/api`
3. **Nginx** comme reverse proxy pour que tout vienne de la même origine

Ces problèmes sont documentés dans `CLAUDE.md` section "Architecture Nginx Reverse Proxy".

## Pour reprendre plus tard

Si vous souhaitez reprendre le déploiement Docker :
1. Restaurez les fichiers nécessaires depuis cette archive
2. Consultez `CLAUDE.md` section "Architecture Nginx Reverse Proxy"
3. Utilisez `docker-compose-nginx-proxy.yml` comme base
4. Assurez-vous que `redirect_slashes=False` est dans `backend/app/main.py`

## Date d'archivage

2026-02-07
