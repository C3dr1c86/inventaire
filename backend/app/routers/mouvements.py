"""
Routes API pour la gestion des mouvements de stock.

Endpoints:
- GET /api/mouvements - Liste tous les mouvements
- GET /api/mouvements/{id} - Récupère un mouvement
- POST /api/mouvements - Crée un mouvement (entrée/sortie)
- DELETE /api/mouvements/{id} - Supprime un mouvement (admin/gestionnaire)
- GET /api/mouvements/article/{article_id} - Historique d'un article
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app import crud, schemas, models
from app.database import get_db
from app.auth import get_current_user
from app.permissions import require_permission

# Créer le router
router = APIRouter()


@router.get("/", response_model=schemas.PaginatedMouvements)
def liste_mouvements(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à sauter"),
    limit: int = Query(100, ge=1, le=500, description="Nombre d'éléments à retourner"),
    article_id: Optional[int] = Query(None, description="Filtre par article"),
    type_mouvement: Optional[str] = Query(
        None, pattern="^(ENTREE|SORTIE)$", description="Filtre par type"
    ),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère la liste de tous les mouvements avec pagination et filtres.

    Les mouvements sont triés par date décroissante (plus récent en premier).

    Paramètres de filtrage disponibles :
    - **article_id** : Affiche uniquement les mouvements d'un article spécifique
    - **type_mouvement** : Filtre par type (ENTREE ou SORTIE)

    Args:
        skip: Nombre de mouvements à sauter (pagination)
        limit: Nombre maximum de mouvements à retourner
        article_id: ID de l'article pour filtrer
        type_mouvement: Type de mouvement ('ENTREE' ou 'SORTIE')
        db: Session de base de données

    Returns:
        Liste paginée de mouvements avec le total
    """
    mouvements, total = crud.get_mouvements(
        db, skip=skip, limit=limit, article_id=article_id, type_mouvement=type_mouvement
    )

    return schemas.PaginatedMouvements(
        items=mouvements, total=total, skip=skip, limit=limit
    )


@router.get("/article/{article_id}", response_model=schemas.PaginatedMouvements)
def historique_article(
    article_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère l'historique complet des mouvements d'un article spécifique.

    Args:
        article_id: ID de l'article
        skip: Nombre de mouvements à sauter (pagination)
        limit: Nombre maximum de mouvements à retourner
        db: Session de base de données

    Returns:
        Liste paginée des mouvements de l'article

    Raises:
        HTTPException 404: Si l'article n'existe pas
    """
    # Vérifier que l'article existe
    article = crud.get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    mouvements, total = crud.get_mouvements(
        db, skip=skip, limit=limit, article_id=article_id
    )

    return schemas.PaginatedMouvements(
        items=mouvements, total=total, skip=skip, limit=limit
    )


@router.get("/{mouvement_id}", response_model=schemas.MouvementWithArticle)
def lire_mouvement(
    mouvement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère un mouvement spécifique par son ID.

    Args:
        mouvement_id: ID du mouvement
        db: Session de base de données

    Returns:
        Mouvement trouvé avec les détails de l'article

    Raises:
        HTTPException 404: Si le mouvement n'existe pas
    """
    mouvement = crud.get_mouvement(db, mouvement_id)
    if not mouvement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Mouvement {mouvement_id} non trouvé",
        )
    return mouvement


@router.post(
    "/",
    response_model=schemas.MouvementWithArticle,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_permission("mouvements", "create"))],
)
def creer_mouvement(
    mouvement: schemas.MouvementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Crée un nouveau mouvement de stock (entrée ou sortie).

    Cette opération met automatiquement à jour la quantité en stock de l'article.

    **Pour une ENTREE** : La quantité de l'article augmente
    **Pour une SORTIE** : La quantité de l'article diminue

    Le mouvement enregistre :
    - La quantité avant le mouvement
    - La quantité après le mouvement
    - La date et l'heure du mouvement
    - Un motif optionnel

    Args:
        mouvement: Données du mouvement à créer
        db: Session de base de données

    Returns:
        Mouvement créé avec les détails de l'article

    Raises:
        HTTPException 404: Si l'article n'existe pas
        HTTPException 400: Si la quantité en stock est insuffisante pour une sortie

    Example:
        ```json
        {
            "article_id": 1,
            "type": "ENTREE",
            "quantite": 50,
            "motif": "Réapprovisionnement fournisseur"
        }
        ```
    """
    return crud.create_mouvement(db, mouvement, current_user)


@router.delete(
    "/{mouvement_id}",
    response_model=schemas.MessageResponse,
    dependencies=[Depends(require_permission("mouvements", "delete"))],
)
def supprimer_mouvement(
    mouvement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Supprime un mouvement de l'historique.

    IMPORTANT : Le stock de l'article n'est PAS modifié lors de la suppression.
    Vérifiez et corrigez le stock manuellement si nécessaire.

    Accessible aux : Administrateurs et Gestionnaires

    Args:
        mouvement_id: ID du mouvement à supprimer
        db: Session de base de données

    Returns:
        Message de confirmation

    Raises:
        HTTPException 404: Si le mouvement n'existe pas
        HTTPException 403: Si l'utilisateur n'a pas la permission mouvements:delete
    """
    crud.delete_mouvement(db, mouvement_id)
    return schemas.MessageResponse(
        message=f"Mouvement {mouvement_id} supprimé avec succès"
    )
