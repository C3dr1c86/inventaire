"""
Routes API pour la gestion des fournisseurs.

Endpoints:
- GET /api/fournisseurs - Liste tous les fournisseurs
- GET /api/fournisseurs/{id} - Récupère un fournisseur
- POST /api/fournisseurs - Crée un fournisseur
- PUT /api/fournisseurs/{id} - Modifie un fournisseur
- DELETE /api/fournisseurs/{id} - Supprime un fournisseur
- POST /api/fournisseurs/{fournisseur_id}/articles/{article_id} - Associe un fournisseur à un article
- DELETE /api/fournisseurs/{fournisseur_id}/articles/{article_id} - Retire un fournisseur d'un article
- GET /api/fournisseurs/{fournisseur_id}/articles - Liste les articles d'un fournisseur
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[schemas.FournisseurResponse])
def liste_fournisseurs(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère la liste de tous les fournisseurs."""
    fournisseurs = crud.get_fournisseurs(db, skip=skip, limit=limit)
    return fournisseurs


@router.get("/{fournisseur_id}", response_model=schemas.FournisseurResponse)
def lire_fournisseur(
    fournisseur_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère un fournisseur spécifique par son ID."""
    fournisseur = crud.get_fournisseur(db, fournisseur_id)
    if not fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {fournisseur_id} non trouvé"
        )
    return fournisseur


@router.post("/", response_model=schemas.FournisseurResponse, status_code=status.HTTP_201_CREATED)
def creer_fournisseur(
    fournisseur: schemas.FournisseurCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crée un nouveau fournisseur."""
    return crud.create_fournisseur(db, fournisseur, current_user)


@router.put("/{fournisseur_id}", response_model=schemas.FournisseurResponse)
def modifier_fournisseur(
    fournisseur_id: int,
    fournisseur_update: schemas.FournisseurUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Met à jour un fournisseur existant."""
    return crud.update_fournisseur(db, fournisseur_id, fournisseur_update, current_user)


@router.delete("/{fournisseur_id}", response_model=schemas.MessageResponse)
def supprimer_fournisseur(
    fournisseur_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Supprime un fournisseur."""
    crud.delete_fournisseur(db, fournisseur_id)
    return schemas.MessageResponse(
        message=f"Fournisseur {fournisseur_id} supprimé avec succès"
    )


@router.post("/{fournisseur_id}/articles/{article_id}", response_model=schemas.ArticleResponse)
def associer_fournisseur_article(
    fournisseur_id: int,
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Associe un fournisseur à un article."""
    return crud.add_fournisseur_to_article(db, article_id, fournisseur_id)


@router.delete("/{fournisseur_id}/articles/{article_id}", response_model=schemas.ArticleResponse)
def retirer_fournisseur_article(
    fournisseur_id: int,
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retire un fournisseur d'un article."""
    return crud.remove_fournisseur_from_article(db, article_id, fournisseur_id)


@router.get("/{fournisseur_id}/articles", response_model=List[schemas.ArticleResponse])
def liste_articles_fournisseur(
    fournisseur_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère la liste des articles d'un fournisseur."""
    return crud.get_articles_by_fournisseur(db, fournisseur_id, skip=skip, limit=limit)
