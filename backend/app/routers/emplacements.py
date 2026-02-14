"""
Routes API pour la gestion des emplacements physiques.

Ce module fournit les endpoints pour créer, lire, mettre à jour et supprimer
les emplacements (Zones, Étagères, Boîtes) et générer des QR codes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from .. import crud, models, schemas
from ..database import get_db
from ..auth import get_current_user
from ..services import qrcode_service

router = APIRouter()


@router.get("/", response_model=List[schemas.EmplacementResponse])
def liste_emplacements(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère la liste de tous les emplacements (structure plate).

    Args:
        skip: Pagination - nombre d'éléments à sauter
        limit: Pagination - nombre maximum d'éléments à retourner
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Liste des emplacements
    """
    return crud.get_emplacements(db, skip=skip, limit=limit)


@router.get("/racines", response_model=List[schemas.EmplacementResponse])
def liste_emplacements_racines(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Récupère uniquement les Zones (emplacements racines, parent_id = NULL).

    Args:
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Liste des Zones
    """
    return crud.get_emplacements_racines(db)


@router.get("/tree", response_model=List[schemas.EmplacementResponse])
def arbre_emplacements(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
):
    """
    Récupère l'arbre hiérarchique complet (3 niveaux : Zone → Étagère → Boîte).

    IMPORTANT: Utilise joinedload DEUX FOIS pour charger les 3 niveaux
    et éviter les requêtes N+1.

    Args:
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Liste des Zones avec children imbriqués
    """
    return crud.get_emplacements_tree(db)


@router.get("/{emplacement_id}", response_model=schemas.EmplacementResponse)
def recuperer_emplacement(
    emplacement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère un emplacement par son ID.

    Args:
        emplacement_id: ID de l'emplacement
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Emplacement trouvé

    Raises:
        HTTPException 404: Si l'emplacement n'existe pas
    """
    emplacement = crud.get_emplacement(db, emplacement_id)
    if not emplacement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement {emplacement_id} non trouvé",
        )
    return emplacement


@router.get(
    "/{emplacement_id}/children", response_model=List[schemas.EmplacementResponse]
)
def recuperer_sous_emplacements(
    emplacement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère les sous-emplacements directs d'un parent.

    Args:
        emplacement_id: ID de l'emplacement parent
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Liste des enfants directs
    """
    return crud.get_children_emplacement(db, emplacement_id)


@router.get("/{emplacement_id}/articles", response_model=List[schemas.ArticleResponse])
def recuperer_articles_emplacement(
    emplacement_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère tous les articles stockés dans un emplacement.

    Args:
        emplacement_id: ID de l'emplacement
        skip: Pagination - nombre d'éléments à sauter
        limit: Pagination - nombre maximum d'éléments à retourner
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Liste des articles de l'emplacement

    Raises:
        HTTPException 404: Si l'emplacement n'existe pas
    """
    return crud.get_articles_by_emplacement(db, emplacement_id, skip=skip, limit=limit)


@router.get("/suggestions/category/{categorie_id}")
def suggestions_par_categorie(
    categorie_id: int,
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Suggère des emplacements pour un nouvel article basé sur sa catégorie.

    Analyse les emplacements des articles existants de la même catégorie
    et retourne les plus fréquemment utilisés.

    Args:
        categorie_id: ID de la catégorie
        limit: Nombre maximum de suggestions (défaut: 5)
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Liste de suggestions avec emplacement, nombre d'articles et raison

    Raises:
        HTTPException 404: Si la catégorie n'existe pas
    """
    return crud.get_emplacements_suggestions_by_category(db, categorie_id, limit)


@router.get("/{emplacement_id}/qrcode")
def generer_qrcode(
    emplacement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Génère un QR code pour l'emplacement (téléchargement PNG).

    Le QR code contient : "emplacement:{id}:{code}"

    Args:
        emplacement_id: ID de l'emplacement
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        StreamingResponse: Image PNG du QR code

    Raises:
        HTTPException 404: Si l'emplacement n'existe pas
    """
    emplacement = crud.get_emplacement(db, emplacement_id)
    if not emplacement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement {emplacement_id} non trouvé",
        )

    # Générer QR code avec format : "emplacement:id:code"
    qr_data = f"emplacement:{emplacement.id}:{emplacement.code}"
    qr_image = qrcode_service.generate_qrcode(qr_data)

    # Retourner l'image PNG
    return StreamingResponse(
        qr_image,
        media_type="image/png",
        headers={
            "Content-Disposition": f"attachment; filename=qrcode_{emplacement.code}.png"
        },
    )


@router.post(
    "/", response_model=schemas.EmplacementResponse, status_code=status.HTTP_201_CREATED
)
def creer_emplacement(
    emplacement: schemas.EmplacementCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Crée un nouvel emplacement.

    Validations :
    - Code unique
    - Maximum 3 niveaux hiérarchiques (Zone → Étagère → Boîte)
    - Pas de boucles circulaires

    Args:
        emplacement: Données de l'emplacement à créer
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Emplacement créé

    Raises:
        HTTPException 400: Si le code existe déjà ou hiérarchie invalide
        HTTPException 404: Si le parent n'existe pas
    """
    return crud.create_emplacement(db, emplacement, current_user)


@router.put("/{emplacement_id}", response_model=schemas.EmplacementResponse)
def modifier_emplacement(
    emplacement_id: int,
    emplacement: schemas.EmplacementUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Met à jour un emplacement existant.

    Validations :
    - Code unique (si modifié)
    - Hiérarchie valide (si parent_id modifié)

    Args:
        emplacement_id: ID de l'emplacement
        emplacement: Nouvelles données
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Returns:
        Emplacement mis à jour

    Raises:
        HTTPException 404: Si l'emplacement n'existe pas
        HTTPException 400: Si le code est en double ou hiérarchie invalide
    """
    return crud.update_emplacement(db, emplacement_id, emplacement, current_user)


@router.delete("/{emplacement_id}", status_code=status.HTTP_204_NO_CONTENT)
def supprimer_emplacement(
    emplacement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Supprime un emplacement.

    IMPORTANT: Bloque si l'emplacement a des sous-emplacements OU des articles associés.

    Args:
        emplacement_id: ID de l'emplacement
        db: Session de base de données (injection)
        current_user: Utilisateur authentifié (injection)

    Raises:
        HTTPException 404: Si l'emplacement n'existe pas
        HTTPException 400: Si l'emplacement a des enfants ou des articles
    """
    crud.delete_emplacement(db, emplacement_id)
    return None
