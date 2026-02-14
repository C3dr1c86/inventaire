"""
Routes API pour la gestion des commandes fournisseurs.

Endpoints:
- GET /api/commandes - Liste paginée des commandes (avec filtres)
- GET /api/commandes/{id} - Récupère une commande
- POST /api/commandes - Crée une nouvelle commande
- PUT /api/commandes/{id} - Modifie une commande (BROUILLON seulement)
- DELETE /api/commandes/{id} - Supprime une commande (BROUILLON seulement)
- POST /api/commandes/{id}/envoyer - Passe la commande à ENVOYEE
- POST /api/commandes/{id}/recevoir - Réceptionne la commande (met à jour stock)
- POST /api/commandes/{id}/annuler - Annule la commande
- GET /api/commandes/{id}/pdf - Génère le PDF du bon de commande
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional

from app import crud, schemas, models
from app.database import get_db
from app.auth import get_current_user
from app.services.export_service import export_commande_pdf

# Créer le router
router = APIRouter()


@router.get("/", response_model=schemas.PaginatedCommandes)
def liste_commandes(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à sauter"),
    limit: int = Query(100, ge=1, le=500, description="Nombre d'éléments à retourner"),
    statut: Optional[str] = Query(
        None, description="Filtre par statut (BROUILLON, ENVOYEE, RECUE, ANNULEE)"
    ),
    fournisseur_id: Optional[int] = Query(None, description="Filtre par fournisseur"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère la liste paginée de toutes les commandes avec filtres optionnels.

    Filtres disponibles :
    - **statut** : BROUILLON, ENVOYEE, RECUE, ANNULEE
    - **fournisseur_id** : ID du fournisseur

    Args:
        skip: Nombre de commandes à sauter (pagination)
        limit: Nombre maximum de commandes à retourner
        statut: Filtre par statut
        fournisseur_id: Filtre par fournisseur
        db: Session de base de données

    Returns:
        Liste paginée de commandes avec le total
    """
    commandes, total = crud.get_commandes(
        db, skip=skip, limit=limit, statut=statut, fournisseur_id=fournisseur_id
    )

    return schemas.PaginatedCommandes(
        items=commandes, total=total, skip=skip, limit=limit
    )


@router.get("/{commande_id}", response_model=schemas.CommandeResponse)
def lire_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Récupère une commande spécifique par son ID.

    Args:
        commande_id: ID de la commande
        db: Session de base de données

    Returns:
        Commande trouvée avec fournisseur et lignes

    Raises:
        HTTPException 404: Si la commande n'existe pas
    """
    commande = crud.get_commande(db, commande_id)
    if not commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande {commande_id} non trouvée",
        )
    return commande


@router.post(
    "/", response_model=schemas.CommandeResponse, status_code=status.HTTP_201_CREATED
)
def creer_commande(
    commande: schemas.CommandeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Crée une nouvelle commande avec statut BROUILLON.

    Valide que :
    - Le fournisseur existe
    - Le numéro de commande est unique
    - Il y a au moins une ligne de commande
    - Chaque article existe

    Calcule automatiquement le montant_total.

    Args:
        commande: Données de la commande à créer
        db: Session de base de données
        current_user: Utilisateur créateur

    Returns:
        Commande créée avec ses lignes

    Raises:
        HTTPException 400: Si le numéro de commande existe déjà
        HTTPException 404: Si le fournisseur ou un article n'existe pas
    """
    return crud.create_commande(db, commande, current_user)


@router.put("/{commande_id}", response_model=schemas.CommandeResponse)
def modifier_commande(
    commande_id: int,
    commande_update: schemas.CommandeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Met à jour une commande existante.

    Restrictions :
    - Impossible de modifier une commande RECUE ou ANNULEE
    - Les lignes ne peuvent être modifiées que pour les commandes BROUILLON

    Args:
        commande_id: ID de la commande à modifier
        commande_update: Nouvelles données
        db: Session de base de données

    Returns:
        Commande mise à jour

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si modification interdite
    """
    return crud.update_commande(db, commande_id, commande_update, current_user)


@router.delete("/{commande_id}", response_model=schemas.MessageResponse)
def supprimer_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Supprime une commande.

    Restriction : Seules les commandes BROUILLON peuvent être supprimées.

    Args:
        commande_id: ID de la commande à supprimer
        db: Session de base de données

    Returns:
        Message de confirmation

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si la commande n'est pas BROUILLON
    """
    crud.delete_commande(db, commande_id)
    return schemas.MessageResponse(
        message=f"Commande {commande_id} supprimée avec succès"
    )


@router.post("/{commande_id}/envoyer", response_model=schemas.CommandeResponse)
def envoyer_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Envoie une commande (BROUILLON → ENVOYEE).

    Définit automatiquement date_commande = now()

    Args:
        commande_id: ID de la commande
        db: Session de base de données

    Returns:
        Commande avec statut mis à jour

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si le changement de statut est interdit
    """
    return crud.update_commande_statut(db, commande_id, "ENVOYEE", current_user)


@router.post("/{commande_id}/recevoir", response_model=schemas.CommandeResponse)
def recevoir_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Réceptionne une commande (ENVOYEE → RECUE).

    Actions automatiques :
    - Met à jour quantite_recue = quantite_commandee pour chaque ligne
    - Incrémente article.quantite de quantite_recue
    - Crée un mouvement ENTREE pour chaque ligne
    - Définit date_reception_reelle = now()

    Args:
        commande_id: ID de la commande
        db: Session de base de données

    Returns:
        Commande réceptionnée avec stock mis à jour

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si la commande n'est pas ENVOYEE
    """
    commande = crud.recevoir_commande(db, commande_id)
    # Mettre à jour le statut après réception
    crud.update_commande_statut(db, commande_id, "RECUE", current_user)
    return commande


@router.post("/{commande_id}/annuler", response_model=schemas.CommandeResponse)
def annuler_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Annule une commande (BROUILLON ou ENVOYEE → ANNULEE).

    Statut final : impossible de revenir en arrière après annulation.

    Args:
        commande_id: ID de la commande
        db: Session de base de données

    Returns:
        Commande annulée

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si la commande est déjà RECUE ou ANNULEE
    """
    return crud.update_commande_statut(db, commande_id, "ANNULEE", current_user)


@router.get("/{commande_id}/pdf")
def generer_pdf_commande(
    commande_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """
    Génère le PDF du bon de commande.

    Format : Document professionnel avec en-tête, détails fournisseur,
    tableau des lignes, et montant total.

    Args:
        commande_id: ID de la commande
        db: Session de base de données

    Returns:
        PDF en tant que fichier téléchargeable

    Raises:
        HTTPException 404: Si la commande n'existe pas
    """
    commande = crud.get_commande(db, commande_id)
    if not commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande {commande_id} non trouvée",
        )

    # Générer le PDF
    pdf_bytes = export_commande_pdf(commande)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=commande_{commande.numero_commande}.pdf"
        },
    )
