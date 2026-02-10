"""
Routes API pour la gestion des photos d'articles.

Endpoints disponibles :
- POST   /{article_id}/photos        : Upload une photo pour un article
- DELETE /{article_id}/photos/{photo_id} : Supprime une photo
- GET    /{article_id}/photos        : Récupère toutes les photos d'un article
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from app import crud, models, schemas
from app.database import get_db
from app.auth import get_current_user
from app.services import photo_service


router = APIRouter()


@router.post("/{article_id}/photos", response_model=schemas.PhotoResponse, status_code=201)
async def upload_photo(
    article_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Upload une photo pour un article.

    **Validations** :
    - Type MIME : image/jpeg, image/png, image/webp
    - Taille max : 5 MB
    - Maximum 5 photos par article

    **Actions** :
    - Sauvegarde le fichier dans `uploads/articles/{article_id}/`
    - Génère une miniature 150x150 dans `uploads/articles/{article_id}/thumbnails/`
    - Crée un enregistrement en base de données

    Args:
        article_id: ID de l'article
        file: Fichier image uploadé
        db: Session de base de données
        current_user: Utilisateur authentifié

    Returns:
        PhotoResponse : La photo créée avec ses URLs

    Raises:
        HTTPException 400: Type de fichier non supporté, taille dépassée, ou limite atteinte
        HTTPException 404: Article introuvable
        HTTPException 500: Erreur lors de la sauvegarde
    """
    # Validation du type de fichier
    photo_service.validate_photo(file)

    # Vérifier que le fichier ne dépasse pas 5 MB
    file.file.seek(0, 2)  # Aller à la fin du fichier
    file_size = file.file.tell()
    file.file.seek(0)  # Revenir au début

    if file_size > photo_service.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Fichier trop volumineux. Taille maximum : {photo_service.MAX_FILE_SIZE / (1024*1024):.1f} MB"
        )

    # Sauvegarder photo et générer miniature
    try:
        filepath, thumbnail_path, actual_file_size = photo_service.save_photo(article_id, file)
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la sauvegarde : {str(e)}")

    # Créer enregistrement en base
    db_photo = crud.create_photo(
        db=db,
        article_id=article_id,
        filename=file.filename,
        filepath=filepath,
        thumbnail_path=thumbnail_path,
        file_size=actual_file_size,
        mime_type=file.content_type
    )

    return db_photo


@router.delete("/{article_id}/photos/{photo_id}", status_code=204)
def delete_photo(
    article_id: int,
    photo_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Supprime une photo.

    **Validations** :
    - Photo existe
    - Photo appartient à l'article spécifié

    **Actions** :
    - Supprime les fichiers (original + miniature) du système de fichiers
    - Supprime l'enregistrement en base de données

    Args:
        article_id: ID de l'article
        photo_id: ID de la photo à supprimer
        db: Session de base de données
        current_user: Utilisateur authentifié

    Returns:
        None (status 204 No Content)

    Raises:
        HTTPException 404: Photo introuvable
        HTTPException 400: Photo n'appartient pas à l'article spécifié
    """
    # Récupérer la photo
    db_photo = crud.get_photo(db, photo_id)

    if not db_photo:
        raise HTTPException(status_code=404, detail="Photo introuvable")

    # Vérifier que la photo appartient à l'article
    if db_photo.article_id != article_id:
        raise HTTPException(
            status_code=400,
            detail=f"Cette photo n'appartient pas à l'article {article_id}"
        )

    # Supprimer les fichiers du système de fichiers
    try:
        photo_service.delete_photo_files(db_photo.filepath, db_photo.thumbnail_path)
    except Exception as e:
        # Log l'erreur mais continue la suppression en base
        print(f"Erreur lors de la suppression des fichiers : {str(e)}")

    # Supprimer l'enregistrement en base
    crud.delete_photo(db, photo_id)

    return None


@router.get("/{article_id}/photos", response_model=List[schemas.PhotoResponse])
def get_article_photos(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère toutes les photos d'un article.

    Args:
        article_id: ID de l'article
        db: Session de base de données
        current_user: Utilisateur authentifié

    Returns:
        Liste des photos de l'article

    Raises:
        HTTPException 404: Article introuvable
    """
    # Vérifier que l'article existe
    article = crud.get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")

    photos = crud.get_photos_by_article(db, article_id)
    return photos
