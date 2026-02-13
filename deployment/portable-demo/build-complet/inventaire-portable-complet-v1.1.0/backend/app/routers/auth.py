"""
Routes d'authentification.

Gère l'inscription, la connexion et la récupération des informations utilisateur.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app import models, schemas, crud
from app.database import get_db
from app.auth import create_access_token, get_current_user


router = APIRouter()


@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    Créer un nouveau compte utilisateur.

    **Mode mono-utilisateur** : Un seul utilisateur peut être créé.
    Si un utilisateur existe déjà, retourne une erreur 400.

    Args:
        user: Informations de l'utilisateur à créer
        db: Session de base de données

    Returns:
        L'utilisateur créé (sans le mot de passe)

    Raises:
        HTTPException 400: Si un utilisateur existe déjà ou si les données sont invalides
    """
    # Vérifier si un utilisateur existe déjà (mono-utilisateur)
    existing_users = db.query(models.User).count()
    if existing_users > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un utilisateur existe déjà. Cette application ne supporte qu'un seul compte."
        )

    # Créer l'utilisateur (le CRUD gère la validation unicité username/email + hashage password)
    return crud.create_user(db, user)


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """
    Se connecter et obtenir un token JWT.

    Utilise le format OAuth2 standard (form-data avec username et password).

    Args:
        form_data: Formulaire OAuth2 avec username et password
        db: Session de base de données

    Returns:
        Token JWT d'accès

    Raises:
        HTTPException 401: Si le username ou le mot de passe est incorrect
    """
    # Authentifier l'utilisateur
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nom d'utilisateur ou mot de passe incorrect",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Compte utilisateur inactif"
        )

    # Créer le token JWT
    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    """
    Récupérer les informations de l'utilisateur connecté.

    Nécessite un token JWT valide dans le header Authorization.

    Args:
        current_user: Utilisateur actuel (extrait du token)

    Returns:
        Informations de l'utilisateur connecté
    """
    return current_user
