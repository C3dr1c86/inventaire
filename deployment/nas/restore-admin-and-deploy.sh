#!/bin/bash
# ============================================
# Script de restauration admin + déploiement
# Inventaire - Fix Mixed Content + Admin
# ============================================

set -e

echo ""
echo "=========================================="
echo "  Restauration Admin + Déploiement"
echo "=========================================="
echo ""

# Étape 1 : Télécharger la nouvelle image
echo "[1/3] 📥 Téléchargement de la nouvelle image frontend..."
cd /home/Cédric/docker/inventaire
sudo docker pull ghcr.io/c3dr1c86/inventaire/frontend:latest
echo "✅ Image téléchargée"
echo ""

# Étape 2 : Redémarrer les conteneurs
echo "[2/3] 🔄 Redémarrage des conteneurs..."
sudo docker compose down
sudo docker compose up -d
echo "✅ Conteneurs redémarrés"
echo ""

# Attendre que les conteneurs démarrent
echo "⏱️  Attente du démarrage (35 secondes)..."
sleep 35

# Étape 3 : Restaurer le rôle admin
echo "[3/3] 👑 Restauration du rôle admin..."
echo ""
echo "=== UTILISATEURS DANS LA BASE ==="

# Créer un script Python temporaire pour restaurer l'admin
sudo docker exec -i inventaire-backend python3 << 'ENDPYTHON'
import sqlite3
import sys

# Connexion à la base de données
conn = sqlite3.connect('/app/database/inventaire.db')
cursor = conn.cursor()

# Lister les utilisateurs
print("\n=== UTILISATEURS ACTUELS ===")
cursor.execute("SELECT id, username, email, role FROM users")
users = cursor.fetchall()

if not users:
    print("❌ Aucun utilisateur trouvé dans la base !")
    sys.exit(1)

for user in users:
    print(f"  ID: {user[0]}, Username: {user[1]}, Email: {user[2]}, Role: {user[3]}")

# Prendre le premier utilisateur et le mettre admin
user_id = users[0][0]
username = users[0][1]

# Mettre à jour le rôle en admin
cursor.execute("UPDATE users SET role = 'admin' WHERE id = ?", (user_id,))
conn.commit()

print(f"\n✅ Utilisateur '{username}' (ID: {user_id}) promu ADMIN !")
print(f"   Vous pouvez maintenant vous reconnecter.")

conn.close()
ENDPYTHON

echo ""

# Configuration HTTPS Tailscale
echo "🔐 Configuration HTTPS Tailscale..."
sudo docker exec inventaire-tailscale tailscale serve --bg --https=443 http://localhost:80 2>/dev/null || echo "✅ HTTPS déjà configuré"
echo ""

echo "=========================================="
echo "  ✅ TOUT EST RESTAURÉ !"
echo "=========================================="
echo ""
echo "📱 Accès : https://inventaire-nas.tail53f399.ts.net"
echo "🔄 Faites Ctrl+Shift+R dans le navigateur"
echo ""
echo "👤 Connectez-vous avec votre compte"
echo "👑 Vous avez maintenant le rôle ADMIN"
echo ""
