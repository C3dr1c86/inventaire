"""
Service de traitement des photos d'articles.

Ce module gère :
- Validation des fichiers uploadés (type MIME, taille)
- Sauvegarde des fichiers dans le système de fichiers
- Génération de miniatures (thumbnails) avec Pillow
- Suppression des fichiers
"""

from PIL import Image
import os
from pathlib import Path
from fastapi import UploadFile, HTTPException
import shutil
from typing import Tuple
from datetime import datetime

# Configuration
UPLOAD_DIR = Path("uploads/articles")
THUMBNAIL_SIZE = (150, 150)
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]


def validate_photo(file: UploadFile) -> None:
    """
    Valide le type MIME du fichier uploadé.

    Args:
        file: Fichier uploadé

    Raises:
        HTTPException: Si le type de fichier n'est pas supporté
    """
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Type de fichier non supporté. Formats acceptés : {', '.join(ALLOWED_MIME_TYPES)}",
        )


def save_photo(article_id: int, file: UploadFile) -> Tuple[str, str, int]:
    """
    Sauvegarde la photo et génère la miniature.

    Args:
        article_id: ID de l'article
        file: Fichier uploadé

    Returns:
        Tuple[filepath, thumbnail_path, file_size] : Chemins relatifs et taille du fichier

    Raises:
        HTTPException: En cas d'erreur lors de la sauvegarde ou génération de miniature
    """
    # Créer répertoires si nécessaires
    article_dir = UPLOAD_DIR / str(article_id)
    thumbnail_dir = article_dir / "thumbnails"
    article_dir.mkdir(parents=True, exist_ok=True)
    thumbnail_dir.mkdir(exist_ok=True)

    # Générer nom de fichier unique avec timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = Path(file.filename).suffix.lower()
    filename = f"photo_{timestamp}{ext}"

    filepath = article_dir / filename
    thumbnail_path = thumbnail_dir / filename

    try:
        # Sauvegarder fichier original
        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Obtenir la taille du fichier
        file_size = os.path.getsize(filepath)

        # Générer miniature
        generate_thumbnail(filepath, thumbnail_path)

        # Retourner chemins relatifs depuis le répertoire uploads/
        return (
            str(filepath.relative_to("uploads")),
            str(thumbnail_path.relative_to("uploads")),
            file_size,
        )

    except Exception as e:
        # Nettoyer en cas d'erreur
        if filepath.exists():
            os.remove(filepath)
        if thumbnail_path.exists():
            os.remove(thumbnail_path)

        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la sauvegarde de la photo : {str(e)}",
        )


def generate_thumbnail(source_path: Path, thumbnail_path: Path) -> None:
    """
    Génère une miniature 150x150 en gardant le ratio d'aspect.

    Convertit les images avec canal alpha (PNG) en RGB avec fond blanc
    avant de sauvegarder en JPEG.

    Args:
        source_path: Chemin du fichier source
        thumbnail_path: Chemin de destination de la miniature

    Raises:
        HTTPException: En cas d'erreur lors de la génération
    """
    try:
        with Image.open(source_path) as img:
            # Convertir en RGB si nécessaire (pour PNG avec alpha ou images en palette)
            if img.mode in ("RGBA", "LA", "P"):
                # Créer un fond blanc
                background = Image.new("RGB", img.size, (255, 255, 255))

                # Convertir en RGBA si en mode palette
                if img.mode == "P":
                    img = img.convert("RGBA")

                # Coller l'image sur le fond blanc en utilisant le canal alpha comme masque
                if img.mode in ("RGBA", "LA"):
                    background.paste(img, mask=img.split()[-1])
                else:
                    background.paste(img)

                img = background

            # Créer miniature en gardant le ratio
            # LANCZOS offre la meilleure qualité pour le redimensionnement
            img.thumbnail(THUMBNAIL_SIZE, Image.Resampling.LANCZOS)

            # Sauvegarder avec optimisation et qualité 85
            img.save(thumbnail_path, quality=85, optimize=True)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la génération de la miniature : {str(e)}",
        )


def delete_photo_files(filepath: str, thumbnail_path: str) -> None:
    """
    Supprime les fichiers photo et miniature du système de fichiers.

    Args:
        filepath: Chemin relatif du fichier original
        thumbnail_path: Chemin relatif de la miniature

    Note:
        N'échoue pas si les fichiers n'existent pas (nettoyage permissif).
    """
    # Construire chemins complets
    full_path = Path("uploads") / filepath
    full_thumbnail_path = Path("uploads") / thumbnail_path

    # Supprimer si existent
    try:
        if full_path.exists():
            os.remove(full_path)
    except Exception as e:
        print(f"Erreur lors de la suppression du fichier {full_path}: {str(e)}")

    try:
        if full_thumbnail_path.exists():
            os.remove(full_thumbnail_path)
    except Exception as e:
        print(
            f"Erreur lors de la suppression de la miniature {full_thumbnail_path}: {str(e)}"
        )
