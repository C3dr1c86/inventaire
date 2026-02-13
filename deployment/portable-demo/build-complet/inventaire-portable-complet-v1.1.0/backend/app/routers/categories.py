"""
Routes API pour la gestion des catégories.

Endpoints:
- GET /api/categories - Liste toutes les catégories
- GET /api/categories/{id} - Récupère une catégorie
- POST /api/categories - Crée une catégorie
- PUT /api/categories/{id} - Modifie une catégorie
- DELETE /api/categories/{id} - Supprime une catégorie
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.database import get_db
from app.auth import get_current_user

# Créer le router
router = APIRouter()


@router.get("/", response_model=List[schemas.CategorieResponse])
def liste_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère la liste de toutes les catégories.

    Args:
        skip: Nombre de catégories à sauter (pagination)
        limit: Nombre maximum de catégories à retourner
        db: Session de base de données (injectée automatiquement)

    Returns:
        Liste des catégories
    """
    categories = crud.get_categories(db, skip=skip, limit=limit)
    return categories


@router.get("/racines", response_model=List[schemas.CategorieResponse])
def liste_categories_racines(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère uniquement les catégories racines (niveau 0).

    Utile pour le premier select du double cascadé dans ArticleForm.

    Returns:
        Liste des catégories sans parent (parent_id = NULL)
    """
    categories = crud.get_categories_racines(db)
    return categories


@router.get("/tree", response_model=List[schemas.CategorieResponse])
def arbre_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère l'arbre complet des catégories avec sous-catégories.

    Retourne une structure hiérarchique avec les catégories racines
    et leurs children chargés.

    Returns:
        Liste des catégories racines avec leurs sous-catégories dans 'children'

    Example:
        [
            {
                "id": 1,
                "nom": "Matériaux",
                "parent_id": null,
                "children": [
                    {"id": 6, "nom": "Bois", "parent_id": 1},
                    {"id": 7, "nom": "Métal", "parent_id": 1}
                ]
            },
            ...
        ]
    """
    tree = crud.get_categories_tree(db)
    return tree


@router.get("/{categorie_id}", response_model=schemas.CategorieResponse)
def lire_categorie(
    categorie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère une catégorie spécifique par son ID.

    Args:
        categorie_id: ID de la catégorie
        db: Session de base de données

    Returns:
        Catégorie trouvée

    Raises:
        HTTPException 404: Si la catégorie n'existe pas
    """
    categorie = crud.get_categorie(db, categorie_id)
    if not categorie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {categorie_id} non trouvée"
        )
    return categorie


@router.post("/", response_model=schemas.CategorieResponse, status_code=status.HTTP_201_CREATED)
def creer_categorie(
    categorie: schemas.CategorieCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Crée une nouvelle catégorie.

    Args:
        categorie: Données de la catégorie à créer
        db: Session de base de données

    Returns:
        Catégorie créée

    Raises:
        HTTPException 400: Si une catégorie avec ce nom existe déjà
    """
    return crud.create_categorie(db, categorie)


@router.put("/{categorie_id}", response_model=schemas.CategorieResponse)
def modifier_categorie(
    categorie_id: int,
    categorie_update: schemas.CategorieUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Met à jour une catégorie existante.

    Args:
        categorie_id: ID de la catégorie à modifier
        categorie_update: Nouvelles données
        db: Session de base de données

    Returns:
        Catégorie mise à jour

    Raises:
        HTTPException 404: Si la catégorie n'existe pas
        HTTPException 400: Si le nouveau nom est déjà utilisé
    """
    return crud.update_categorie(db, categorie_id, categorie_update)


@router.delete("/{categorie_id}", response_model=schemas.MessageResponse)
def supprimer_categorie(
    categorie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Supprime une catégorie.

    Args:
        categorie_id: ID de la catégorie à supprimer
        db: Session de base de données

    Returns:
        Message de confirmation

    Raises:
        HTTPException 404: Si la catégorie n'existe pas

    Note:
        Les articles de cette catégorie ne seront pas supprimés,
        leur categorie_id sera mis à NULL.
    """
    crud.delete_categorie(db, categorie_id)
    return schemas.MessageResponse(
        message=f"Catégorie {categorie_id} supprimée avec succès"
    )


@router.get("/{categorie_id}/children", response_model=List[schemas.CategorieResponse])
def sous_categories(
    categorie_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère les sous-catégories d'une catégorie donnée.

    Utile pour le second select du double cascadé (filtré par parent_id).

    Args:
        categorie_id: ID de la catégorie parente

    Returns:
        Liste des sous-catégories de cette catégorie

    Raises:
        HTTPException 404: Si la catégorie parente n'existe pas
    """
    # Vérifier que la catégorie existe
    categorie = crud.get_categorie(db, categorie_id)
    if not categorie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Catégorie introuvable"
        )

    children = crud.get_children(db, categorie_id)
    return children
