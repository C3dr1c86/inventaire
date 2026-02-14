"""
Module d'authentification JWT.

Gère la création et la validation des tokens JWT, ainsi que le hachage des mots de passe.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional
from os import getenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

# Configuration JWT
# SECRET_KEY doit être définie dans la variable d'environnement SECRET_KEY
# Pour générer une clé : openssl rand -hex 32
SECRET_KEY = getenv(
    "SECRET_KEY", "dev-key-CHANGEZ-CETTE-CLE-EN-PRODUCTION-utilisez-openssl-rand-hex-32"
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 heures (mono-utilisateur)

# Configuration bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme pour extraire le token du header Authorization
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Vérifie qu'un mot de passe en clair correspond au hash.

    Args:
        plain_password: Mot de passe en clair
        hashed_password: Hash bcrypt du mot de passe

    Returns:
        True si le mot de passe correspond, False sinon
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hache un mot de passe avec bcrypt.

    Args:
        password: Mot de passe en clair

    Returns:
        Hash bcrypt du mot de passe
    """
    return pwd_context.hash(password)


def create_access_token(
    data: dict, user: models.User, expires_delta: Optional[timedelta] = None
) -> str:
    """
    Crée un token JWT enrichi avec user_id et role.

    Args:
        data: Données à encoder dans le token (généralement {"sub": username})
        user: Utilisateur pour lequel créer le token
        expires_delta: Durée de validité du token (par défaut: ACCESS_TOKEN_EXPIRE_MINUTES)

    Returns:
        Token JWT signé contenant : username, user_id, role, exp
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # Enrichir le payload avec user_id et role
    to_encode.update(
        {
            "exp": expire,
            "user_id": user.id,
            "role": user.role.value,  # Convertir l'enum en string
        }
    )

    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[schemas.TokenData]:
    """
    Décode et valide un token JWT enrichi.

    Args:
        token: Token JWT à décoder

    Returns:
        TokenData contenant username, user_id, role si valide, None sinon
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None

        # Extraire les données enrichies du JWT
        user_id: int = payload.get("user_id")
        role: str = payload.get("role")

        return schemas.TokenData(username=username, user_id=user_id, role=role)
    except JWTError:
        return None


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> models.User:
    """
    Dépendance FastAPI pour récupérer l'utilisateur actuel depuis le token JWT.

    Args:
        token: Token JWT extrait du header Authorization
        db: Session de base de données

    Returns:
        Utilisateur actuel

    Raises:
        HTTPException 401: Si le token est invalide ou l'utilisateur n'existe pas
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Impossible de valider les informations d'identification",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token_data = decode_access_token(token)
    if token_data is None or token_data.username is None:
        raise credentials_exception

    # Récupérer l'utilisateur depuis la base de données
    user = (
        db.query(models.User)
        .filter(models.User.username == token_data.username)
        .first()
    )
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Utilisateur inactif"
        )

    return user
