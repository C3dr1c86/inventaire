"""
Routes API pour la gestion des tags.

Endpoints:
- GET /api/tags - Liste tous les tags
- GET /api/tags/{id} - Récupère un tag
- POST /api/tags - Crée un tag
- PUT /api/tags/{id} - Modifie un tag
- DELETE /api/tags/{id} - Supprime un tag
- POST /api/tags/{tag_id}/articles/{article_id} - Associe un tag à un article
- DELETE /api/tags/{tag_id}/articles/{article_id} - Retire un tag d'un article
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.database import get_db
from app.auth import get_current_user

router = APIRouter()


@router.get("/", response_model=List[schemas.TagResponse])
def liste_tags(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère la liste de tous les tags."""
    tags = crud.get_tags(db, skip=skip, limit=limit)
    return tags


@router.get("/{tag_id}", response_model=schemas.TagResponse)
def lire_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Récupère un tag spécifique par son ID."""
    tag = crud.get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} non trouvé"
        )
    return tag


@router.post("/", response_model=schemas.TagResponse, status_code=status.HTTP_201_CREATED)
def creer_tag(
    tag: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Crée un nouveau tag."""
    return crud.create_tag(db, tag)


@router.put("/{tag_id}", response_model=schemas.TagResponse)
def modifier_tag(
    tag_id: int,
    tag_update: schemas.TagUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Met à jour un tag existant."""
    return crud.update_tag(db, tag_id, tag_update)


@router.delete("/{tag_id}", response_model=schemas.MessageResponse)
def supprimer_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Supprime un tag."""
    crud.delete_tag(db, tag_id)
    return schemas.MessageResponse(
        message=f"Tag {tag_id} supprimé avec succès"
    )


@router.post("/{tag_id}/articles/{article_id}", response_model=schemas.ArticleResponse)
def associer_tag_article(
    tag_id: int,
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Associe un tag à un article."""
    return crud.add_tag_to_article(db, article_id, tag_id)


@router.delete("/{tag_id}/articles/{article_id}", response_model=schemas.ArticleResponse)
def retirer_tag_article(
    tag_id: int,
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retire un tag d'un article."""
    return crud.remove_tag_from_article(db, article_id, tag_id)
