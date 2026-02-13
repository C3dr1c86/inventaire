"""
Système de gestion des permissions.

Ce module définit :
- Les permissions par défaut pour chaque rôle
- Les fonctions de vérification de permissions
- Les dépendances FastAPI pour protéger les endpoints
"""

from fastapi import Depends, HTTPException, status
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models import User

from app.auth import get_current_user
from app.models import RoleEnum


# ====================================================================
# PERMISSIONS PAR DÉFAUT PAR RÔLE
# ====================================================================

DEFAULT_PERMISSIONS = {
    RoleEnum.ADMIN: [
        "*:*"  # Wildcard : Accès complet à tout
    ],

    RoleEnum.GESTIONNAIRE: [
        # Articles
        "articles:read",
        "articles:create",
        "articles:update",
        "articles:delete",
        "articles:export",

        # Catégories
        "categories:read",
        "categories:create",
        "categories:update",
        "categories:delete",

        # Mouvements
        "mouvements:read",
        "mouvements:create",
        "mouvements:update",
        "mouvements:delete",

        # Commandes
        "commandes:read",
        "commandes:create",
        "commandes:update",
        "commandes:delete",
        "commandes:export",

        # Fournisseurs
        "fournisseurs:read",
        "fournisseurs:create",
        "fournisseurs:update",
        "fournisseurs:delete",

        # Emplacements
        "emplacements:read",
        "emplacements:create",
        "emplacements:update",
        "emplacements:delete",

        # Tags
        "tags:read",
        "tags:create",
        "tags:update",
        "tags:delete",

        # Rapports
        "rapports:read",
        "rapports:export"
    ],

    RoleEnum.TECHNICIEN: [
        # Articles (lecture seule)
        "articles:read",

        # Catégories (lecture seule)
        "categories:read",

        # Mouvements (création SORTIE seulement + lecture)
        "mouvements:read",
        "mouvements:create",  # Validation métier : seulement SORTIE

        # Commandes (lecture seule)
        "commandes:read",

        # Fournisseurs (lecture seule)
        "fournisseurs:read",

        # Emplacements (lecture seule)
        "emplacements:read",

        # Tags (lecture seule)
        "tags:read",

        # Rapports (lecture seule)
        "rapports:read"
    ],

    RoleEnum.CONSULTATION: [
        # Lecture seule sur tout
        "articles:read",
        "categories:read",
        "mouvements:read",
        "commandes:read",
        "fournisseurs:read",
        "emplacements:read",
        "tags:read",
        "rapports:read"
    ]
}


# ====================================================================
# FONCTIONS DE VÉRIFICATION DES PERMISSIONS
# ====================================================================

def has_permission(user: "User", resource: str, action: str) -> bool:
    """
    Vérifie si un utilisateur a une permission spécifique.

    Args:
        user: L'utilisateur à vérifier
        resource: La ressource (ex: "articles", "users", "commandes")
        action: L'action (ex: "read", "create", "update", "delete", "export")

    Returns:
        True si l'utilisateur a la permission, False sinon

    Exemples:
        >>> has_permission(admin_user, "articles", "delete")  # True
        >>> has_permission(technicien_user, "users", "create")  # False
    """
    # 1. Vérifier permissions custom (overrides)
    if user.permissions:
        # Permission exacte
        if f"{resource}:{action}" in user.permissions:
            return True
        # Wildcard resource
        if f"{resource}:*" in user.permissions:
            return True
        # Wildcard complet
        if "*:*" in user.permissions:
            return True

    # 2. Vérifier permissions par défaut du rôle
    role_permissions = DEFAULT_PERMISSIONS.get(user.role, [])

    # Permission exacte
    if f"{resource}:{action}" in role_permissions:
        return True
    # Wildcard resource
    if f"{resource}:*" in role_permissions:
        return True
    # Wildcard complet
    if "*:*" in role_permissions:
        return True

    return False


def get_user_permissions(user: "User") -> list[str]:
    """
    Récupère la liste complète des permissions d'un utilisateur.

    Combine les permissions par défaut du rôle avec les permissions custom.

    Args:
        user: L'utilisateur

    Returns:
        Liste de permissions au format "resource:action"
    """
    permissions = set()

    # Permissions du rôle
    role_permissions = DEFAULT_PERMISSIONS.get(user.role, [])
    permissions.update(role_permissions)

    # Permissions custom (overrides)
    if user.permissions:
        permissions.update(user.permissions)

    return list(permissions)


# ====================================================================
# DÉPENDANCES FASTAPI
# ====================================================================

def require_permission(resource: str, action: str):
    """
    Dépendance FastAPI pour vérifier une permission.

    Lève une HTTPException 403 si l'utilisateur n'a pas la permission.

    Args:
        resource: La ressource à protéger
        action: L'action requise

    Returns:
        Fonction de dépendance FastAPI

    Exemples d'utilisation dans les routers :
        @router.post("/", dependencies=[Depends(require_permission("articles", "create"))])
        def create_article(...):
            pass

        @router.delete("/{id}")
        def delete_article(
            id: int,
            current_user: User = Depends(require_permission("articles", "delete"))
        ):
            pass
    """
    def permission_checker(current_user: "User" = Depends(get_current_user)) -> "User":
        if not has_permission(current_user, resource, action):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission refusée : {resource}:{action}. Rôle requis insuffisant."
            )
        return current_user

    return permission_checker


def require_admin(current_user: "User" = Depends(get_current_user)) -> "User":
    """
    Dépendance FastAPI pour vérifier que l'utilisateur est Admin.

    Raccourci pour les endpoints réservés aux administrateurs.

    Raises:
        HTTPException 403: Si l'utilisateur n'est pas admin

    Exemples:
        @router.get("/users", dependencies=[Depends(require_admin)])
        def list_users(...):
            pass
    """
    if current_user.role != RoleEnum.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux administrateurs"
        )
    return current_user
