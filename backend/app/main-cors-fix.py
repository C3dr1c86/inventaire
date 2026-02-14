"""
Point d'entrée de l'application FastAPI.

Configure l'application, les middlewares CORS, et enregistre les routes.
VERSION NAS : CORS ultra-permissif avec gestion explicite des OPTIONS
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.database import init_db
import os

# Créer l'instance FastAPI
app = FastAPI(
    title="API Gestion d'Inventaire",
    description="API REST pour gérer un inventaire d'articles avec suivi des mouvements de stock",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Middleware pour gérer les OPTIONS explicitement AVANT CORS
@app.middleware("http")
async def handle_options(request: Request, call_next):
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                "Access-Control-Allow-Headers": "*",
                "Access-Control-Allow-Credentials": "true",
                "Access-Control-Max-Age": "3600",
            },
        )
    response = await call_next(request)
    return response


# Configuration CORS ultra-permissive
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Accepte toutes les origines
    allow_credentials=True,
    allow_methods=["*"],  # Toutes les méthodes
    allow_headers=["*"],  # Tous les headers
    expose_headers=["*"],
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
