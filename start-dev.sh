#!/bin/bash
# Script de demarrage rapide de l'application complete (Backend + Frontend)

echo "========================================"
echo "  Application Inventaire"
echo "  Demarrage en mode developpement"
echo "========================================"
echo ""

# Verifier si Python est installe
if ! command -v python3 &> /dev/null; then
    echo "[ERREUR] Python n'est pas installe"
    exit 1
fi

# Verifier si Node.js est installe
if ! command -v node &> /dev/null; then
    echo "[ERREUR] Node.js n'est pas installe"
    exit 1
fi

echo "[OK] Python et Node.js sont installes"
echo ""

# Verifier l'environnement backend
if [ ! -f "backend/venv/bin/activate" ]; then
    echo "[INFO] Creation de l'environnement virtuel Python..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    echo "[INFO] Installation des dependances Python..."
    pip install -r requirements.txt
    cd ..
    echo ""
fi

# Verifier les dependances frontend
if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Installation des dependances Node.js..."
    cd frontend
    npm install
    cd ..
    echo ""
fi

echo "========================================"
echo "  Demarrage des serveurs..."
echo "========================================"
echo ""
echo "Backend API : http://localhost:8000"
echo "Frontend    : http://localhost:5173"
echo ""
echo "Documentation API : http://localhost:8000/docs"
echo ""
echo "[CTRL+C pour arreter les serveurs]"
echo "========================================"
echo ""

# Fonction pour nettoyer les processus en arriere-plan a la sortie
cleanup() {
    echo ""
    echo "[INFO] Arret des serveurs..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Demarrer le backend en arriere-plan
echo "[INFO] Demarrage du backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit pret
sleep 3

# Demarrer le frontend en arriere-plan
echo "[INFO] Demarrage du frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "[INFO] Les deux serveurs sont en cours d'execution"
echo "[INFO] Backend PID: $BACKEND_PID"
echo "[INFO] Frontend PID: $FRONTEND_PID"
echo ""

# Attendre 5 secondes puis ouvrir le navigateur
sleep 5

# Detecter le systeme d'exploitation et ouvrir le navigateur
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:5173
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5173
    fi
fi

echo "[INFO] Pour arreter l'application, appuyez sur CTRL+C"

# Attendre indefiniment (les processus tournent en arriere-plan)
wait
