"""
Script de lancement du backend pour version portable.

Lance uvicorn avec la configuration appropriée pour la version démo portable.
"""
import os
import sys
from pathlib import Path

# Ajouter le dossier app au PYTHONPATH
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Charger les variables d'environnement
from dotenv import load_dotenv
env_file = backend_dir / ".env.portable"
if env_file.exists():
    load_dotenv(env_file)
else:
    # Définir variables par défaut si .env.portable n'existe pas
    os.environ.setdefault("DATABASE_URL", "sqlite:///./database/inventaire.db")
    os.environ.setdefault("SECRET_KEY", "portable-demo-secret-key-change-in-production")
    os.environ.setdefault("API_HOST", "127.0.0.1")
    os.environ.setdefault("API_PORT", "8000")

# Créer le dossier database s'il n'existe pas
database_dir = backend_dir / "database"
database_dir.mkdir(exist_ok=True)

# Initialiser la base de données si elle n'existe pas
db_file = database_dir / "inventaire.db"
if not db_file.exists():
    print("Initialisation de la base de données...")
    from app.database import init_db
    init_db()
    print("Base de données créée avec succès !")

# Lancer uvicorn
if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "127.0.0.1")
    port = int(os.getenv("API_PORT", "8000"))

    print(f"Démarrage du serveur backend sur http://{host}:{port}")
    print("Appuyez sur Ctrl+C pour arrêter le serveur")

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        log_level="info",
        access_log=True
    )
