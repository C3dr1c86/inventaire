"""
Configuration de la base de données SQLite avec SQLAlchemy.

Ce module configure la connexion à la base de données et fournit
une session pour les opérations CRUD.
"""

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# URL de connexion à la base de données SQLite
# En mode test, utiliser une database en mémoire
if os.getenv("TESTING") == "1":
    DATABASE_URL = "sqlite:///:memory:"
else:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./database/inventaire.db")

# Créer le moteur SQLAlchemy
# check_same_thread=False est nécessaire pour SQLite avec FastAPI
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=False,  # Mettre à True pour voir les requêtes SQL dans les logs
)


# Activer les clés étrangères pour SQLite
# SQLite ne les active pas par défaut
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """Active les contraintes de clés étrangères pour SQLite."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Créer une session locale pour les opérations de base de données
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe de base pour tous les modèles SQLAlchemy
Base = declarative_base()


def get_db():
    """
    Générateur de dépendance pour obtenir une session de base de données.

    Utilisé dans les routes FastAPI avec Depends(get_db).
    La session est automatiquement fermée après utilisation.

    Yields:
        Session: Session de base de données SQLAlchemy

    Example:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            items = db.query(Item).all()
            return items
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialise la base de données en créant toutes les tables.

    À appeler au démarrage de l'application pour créer les tables
    si elles n'existent pas déjà.
    """
    # Créer le dossier database s'il n'existe pas
    os.makedirs("database", exist_ok=True)

    # Importer tous les modèles pour que Base les connaisse
    from app import models  # noqa: F401

    # Créer toutes les tables
    Base.metadata.create_all(bind=engine)
    print(">> Base de donnees initialisee avec succes")
