"""
Routes de gestion des utilisateurs (admin only).

Endpoints pour créer, lister, modifier les rôles/permissions, et désactiver des utilisateurs.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app import models, schemas, crud
from app.database import get_db
from app.permissions import require_admin

router = APIRouter()


@router.get("/", response_model=List[schemas.UserResponse], dependencies=[Depends(require_admin)])
def list_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Liste tous les utilisateurs (admin only).

    Args:
        skip: Nombre d'enregistrements à sauter
        limit: Nombre maximum d'enregistrements à retourner
        db: Session de base de données

    Returns:
        Liste des utilisateurs
    """
    return crud.get_users(db, skip=skip, limit=limit)


@router.post("/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_user_with_role(
    user: schemas.UserCreateAdmin,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Crée un nouvel utilisateur avec un rôle spécifique (admin only).

    Args:
        user: Informations de l'utilisateur à créer (avec rôle)
        db: Session de base de données
        current_user: Utilisateur qui crée (admin)

    Returns:
        L'utilisateur créé

    Raises:
        HTTPException 400: Si le username ou email existe déjà
    """
    # Créer l'utilisateur (crud.create_user gère la validation)
    db_user = crud.create_user(db, user, current_user)

    # Définir le rôle si différent du défaut
    if user.role != models.RoleEnum.CONSULTATION:
        db_user.role = user.role
        db.commit()
        db.refresh(db_user)

    return db_user


@router.get("/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(require_admin)])
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    """
    Récupère les détails d'un utilisateur (admin only).

    Args:
        user_id: ID de l'utilisateur
        db: Session de base de données

    Returns:
        L'utilisateur

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
    """
    user = crud.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur {user_id} non trouvé"
        )
    return user


@router.put("/{user_id}/role", response_model=schemas.UserResponse, dependencies=[Depends(require_admin)])
def change_user_role(
    user_id: int,
    role_update: schemas.RoleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Change le rôle d'un utilisateur (admin only).

    Validations :
    - Admin ne peut pas changer son propre rôle

    Args:
        user_id: ID de l'utilisateur
        role_update: Nouveau rôle
        db: Session de base de données
        current_user: Utilisateur qui effectue le changement

    Returns:
        L'utilisateur avec le nouveau rôle

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
        HTTPException 400: Si tentative de modifier son propre rôle
    """
    return crud.update_user_role(db, user_id, role_update.role, current_user)


@router.put("/{user_id}/permissions", response_model=schemas.UserResponse, dependencies=[Depends(require_admin)])
def update_user_permissions(
    user_id: int,
    permissions_update: schemas.PermissionsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Met à jour les permissions custom d'un utilisateur (admin only).

    Si permissions = None, réinitialise aux permissions par défaut du rôle.

    Args:
        user_id: ID de l'utilisateur
        permissions_update: Nouvelles permissions
        db: Session de base de données
        current_user: Utilisateur qui effectue la modification

    Returns:
        L'utilisateur avec les nouvelles permissions

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
    """
    return crud.update_user_permissions(db, user_id, permissions_update.permissions, current_user)


@router.delete("/{user_id}", response_model=schemas.UserResponse, dependencies=[Depends(require_admin)])
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """
    Désactive un utilisateur (is_active = False) (admin only).

    Validations :
    - Admin ne peut pas se désactiver lui-même
    - Il doit rester au moins 1 admin actif

    Args:
        user_id: ID de l'utilisateur à désactiver
        db: Session de base de données
        current_user: Utilisateur qui effectue la désactivation

    Returns:
        L'utilisateur désactivé

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
        HTTPException 400: Si tentative de se désactiver ou si dernier admin
    """
    return crud.deactivate_user(db, user_id, current_user)
