#!/bin/bash
# Script de demarrage rapide du frontend React

echo "========================================"
echo "  Demarrage du Frontend (React)"
echo "========================================"
echo ""

cd frontend

# Verifier si node_modules existe
if [ ! -d "node_modules" ]; then
    echo "[AVERTISSEMENT] node_modules non trouve !"
    echo "Installation des dependances..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERREUR] Echec de l'installation des dependances"
        exit 1
    fi
fi

echo "Demarrage du serveur de developpement Vite sur http://localhost:5173"
echo ""
echo "[CTRL+C pour arreter le serveur]"
echo ""

npm run dev
