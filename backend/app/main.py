"""
Point d'entrée de l'application FastAPI.

Configure l'application et enregistre les routes.
VERSION NGINX PROXY : Pas besoin de CORS car tout vient de la même origine
"""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from app.database import init_db
import os

# Charger les variables d'environnement depuis le fichier .env
from dotenv import load_dotenv

load_dotenv()

# Créer l'instance FastAPI
app = FastAPI(
    title="API Gestion d'Inventaire",
    description="API REST pour gérer un inventaire d'articles avec suivi des mouvements de stock",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    # Note : redirect_slashes=False est nécessaire seulement pour Docker avec Nginx reverse proxy
    # En développement local, on laisse le comportement par défaut (True)
    # pour que /api/categories redirige vers /api/categories/
)

# Configuration CORS pour le développement local
# En production avec Nginx reverse proxy, CORS n'est pas nécessaire
from fastapi.middleware.cors import CORSMiddleware

origins = os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://localhost:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Origines autorisées
    allow_credentials=True,  # Autoriser les cookies/headers d'authentification
    allow_methods=["*"],  # Autoriser toutes les méthodes HTTP
    allow_headers=["*"],  # Autoriser tous les headers
)


@app.on_event("startup")
async def startup_event():
    """
    Événement exécuté au démarrage de l'application.
    Initialise la base de données et crée les tables si nécessaire.
    """
    # Skip init_db en mode test (la database de test est gérée par pytest)
    if os.getenv("TESTING") != "1":
        print(">> Demarrage de l'application...")
        init_db()
        print(">> Application prete !")


@app.get("/")
async def root():
    """
    Route racine - Page d'accueil de l'API.

    Returns:
        dict: Message de bienvenue avec lien vers la documentation
    """
    return {
        "message": "Bienvenue sur l'API de gestion d'inventaire",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "running",
    }


@app.get("/api/health")
async def health_check():
    """
    Endpoint de vérification de santé de l'API.

    Utilisé pour vérifier que l'API est opérationnelle.

    Returns:
        dict: Status de l'API
    """
    return {"status": "healthy", "message": "L'API fonctionne correctement"}


# Importer les routers
from app.routers import (
    categories,
    articles,
    mouvements,
    rapports,
    tags,
    fournisseurs,
    auth,
    photos,
    emplacements,
    commandes,
    users,
)

# Inclure les routers dans l'application
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Utilisateurs"])
app.include_router(categories.router, prefix="/api/categories", tags=["Catégories"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(mouvements.router, prefix="/api/mouvements", tags=["Mouvements"])
app.include_router(rapports.router, prefix="/api/rapports", tags=["Rapports"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])
app.include_router(
    fournisseurs.router, prefix="/api/fournisseurs", tags=["Fournisseurs"]
)
app.include_router(
    emplacements.router, prefix="/api/emplacements", tags=["Emplacements"]
)
app.include_router(photos.router, prefix="/api/articles", tags=["Photos"])
app.include_router(commandes.router, prefix="/api/commandes", tags=["Commandes"])

# Configuration du serving de fichiers statiques pour les photos
# IMPORTANT : Monter APRÈS tous les include_router() pour ne pas interférer avec les routes API
UPLOAD_DIR = "uploads"
os.makedirs(os.path.join(UPLOAD_DIR, "articles"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


if __name__ == "__main__":
    import uvicorn

    # Configuration pour le développement
    uvicorn.run(
        "app.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True,  # Auto-reload en développement
    )
