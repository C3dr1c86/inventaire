# Guide de Déploiement - Application Inventaire

## Déploiement rapide avec Docker Compose

### 1. Préparation

git clone https://github.com/C3dr1c86/inventaire.git
cd inventaire
cp .env.example .env

### 2. Configuration

Générer une clé secrète et éditer .env:

openssl rand -hex 32

### 3. Démarrage

docker compose pull
docker compose up -d

### 4. Accès

- Frontend: http://localhost
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

### 5. Commandes utiles

docker compose down        # Arrêter
docker compose restart    # Redémarrer
docker compose logs -f    # Voir les logs
