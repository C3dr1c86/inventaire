#!/bin/bash
# Script de demarrage rapide du backend FastAPI

echo "========================================"
echo "  Demarrage du Backend (FastAPI)"
echo "========================================"
echo ""

cd backend

# Verifier si le venv existe
if [ ! -f "venv/bin/activate" ]; then
    echo "[ERREUR] Environnement virtuel non trouve !"
    echo "Veuillez creer le venv d'abord avec : python -m venv venv"
    echo "Puis installer les dependances avec : pip install -r requirements.txt"
    exit 1
fi

# Activer le venv et demarrer le serveur
echo "Activation de l'environnement virtuel..."
source venv/bin/activate

echo "Demarrage du serveur FastAPI sur http://localhost:8000"
echo ""
echo "[CTRL+C pour arreter le serveur]"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
