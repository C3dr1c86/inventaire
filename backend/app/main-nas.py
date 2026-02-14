"""
Point d'entrée de l'application FastAPI.

Configure l'application, les middlewares CORS, et enregistre les routes.
VERSION NAS : CORS permissif pour le réseau local
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
import os

# Créer l'instance FastAPI
app = FastAPI(
    title="API Gestion d'Inventaire",
    description="API REST pour gérer un inventaire d'articles avec suivi des mouvements de stock",
    version="1.0.0",
    docs_url="/docs",  # Documentation Swagger UI
    redoc_url="/redoc",  # Documentation ReDoc
)

# Configuration CORS pour permettre les requêtes depuis le frontend
# VERSION NAS : Accepte toutes les origines du réseau local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Accepte toutes les origines (développement sur réseau local)
    allow_credentials=True,
    allow_methods=["*"],  # Autoriser toutes les méthodes (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Autoriser tous les headers
)


@app.on_event("startup")
async def startup_event():
    """
    Événement exécuté au démarrage de l'application.
    Initialise la base de données et crée les tables si nécessaire.
    """
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
from app.routers import categories, articles, mouvements, rapports, tags, auth

# Inclure les routers dans l'application
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(categories.router, prefix="/api/categories", tags=["Catégories"])
app.include_router(articles.router, prefix="/api/articles", tags=["Articles"])
app.include_router(mouvements.router, prefix="/api/mouvements", tags=["Mouvements"])
app.include_router(rapports.router, prefix="/api/rapports", tags=["Rapports"])
app.include_router(tags.router, prefix="/api/tags", tags=["Tags"])


if __name__ == "__main__":
    import uvicorn

    # Configuration pour le développement
    uvicorn.run(
        "app.main:app",
        host=os.getenv("API_HOST", "0.0.0.0"),
        port=int(os.getenv("API_PORT", 8000)),
        reload=True,  # Auto-reload en développement
    )
