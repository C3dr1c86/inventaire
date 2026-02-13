"""
Routes API pour la gestion des articles.

Endpoints:
- GET /api/articles - Liste tous les articles (avec recherche et filtres)
- GET /api/articles/{id} - Récupère un article
- GET /api/articles/{id}/barcode - Génère le code-barre pour le SKU
- POST /api/articles - Crée un article
- PUT /api/articles/{id} - Modifie un article (avec tags)
- DELETE /api/articles/{id} - Supprime un article
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional
from io import BytesIO
import barcode
from barcode.writer import ImageWriter

from app import crud, schemas, models
from app.database import get_db
from app.auth import get_current_user
from app.permissions import require_permission

# Créer le router
router = APIRouter()


@router.get("/", response_model=schemas.PaginatedArticles)
def liste_articles(
    skip: int = Query(0, ge=0, description="Nombre d'éléments à sauter"),
    limit: int = Query(100, ge=1, le=500, description="Nombre d'éléments à retourner"),
    search: Optional[str] = Query(None, description="Terme de recherche (nom, description, SKU)"),
    categorie_id: Optional[int] = Query(None, description="Filtre par catégorie"),
    tag_id: Optional[int] = Query(None, description="Filtre par tag"),
    fournisseur_id: Optional[int] = Query(None, description="Filtre par fournisseur"),
    emplacement_id: Optional[str] = Query(None, description="Filtre par emplacement ('null' pour articles sans emplacement)"),
    stock_bas: bool = Query(False, description="Afficher uniquement les articles en stock bas"),
    sort_by: Optional[str] = Query(None, description="Colonne pour le tri (id, nom, sku, quantite, prix_unitaire, valeur, categorie)"),
    order: str = Query("asc", pattern="^(asc|desc)$", description="Ordre de tri (asc ou desc)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère la liste de tous les articles avec pagination, filtres et tri.

    Paramètres de filtrage disponibles :
    - **search** : Recherche dans le nom, description et SKU
    - **categorie_id** : Filtre par catégorie
    - **tag_id** : Filtre par tag
    - **fournisseur_id** : Filtre par fournisseur
    - **emplacement_id** : Filtre par emplacement (utilisez 'null' pour les articles sans emplacement)
    - **stock_bas** : Si true, affiche uniquement les articles dont la quantité < quantite_min

    Paramètres de tri disponibles :
    - **sort_by** : Colonne pour le tri (id, nom, sku, quantite, prix_unitaire, valeur, categorie)
    - **order** : Ordre de tri (asc ou desc)

    Args:
        skip: Nombre d'articles à sauter (pagination)
        limit: Nombre maximum d'articles à retourner
        search: Terme de recherche
        categorie_id: ID de la catégorie pour filtrer
        tag_id: ID du tag pour filtrer
        fournisseur_id: ID du fournisseur pour filtrer
        stock_bas: Filtre stock bas
        sort_by: Colonne pour le tri
        order: Ordre de tri
        db: Session de base de données

    Returns:
        Liste paginée d'articles avec le total
    """
    # Gérer le cas spécial emplacement_id='null' pour filtrer les articles sans emplacement
    emplacement_filter = None
    if emplacement_id is not None:
        if emplacement_id == 'null':
            emplacement_filter = 'null'  # Signal spécial pour articles sans emplacement
        else:
            try:
                emplacement_filter = int(emplacement_id)
            except ValueError:
                pass  # Ignorer si la valeur n'est pas un entier valide

    articles, total = crud.get_articles(
        db,
        skip=skip,
        limit=limit,
        search=search,
        categorie_id=categorie_id,
        tag_id=tag_id,
        fournisseur_id=fournisseur_id,
        emplacement_id=emplacement_filter,
        stock_bas=stock_bas,
        sort_by=sort_by,
        order=order
    )

    return schemas.PaginatedArticles(
        items=articles,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{article_id}", response_model=schemas.ArticleResponse)
def lire_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Récupère un article spécifique par son ID.

    Args:
        article_id: ID de l'article
        db: Session de base de données

    Returns:
        Article trouvé avec sa catégorie

    Raises:
        HTTPException 404: Si l'article n'existe pas
    """
    article = crud.get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé"
        )
    return article


@router.post("/", response_model=schemas.ArticleResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_permission("articles", "create"))])
def creer_article(
    article: schemas.ArticleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Crée un nouvel article.

    Args:
        article: Données de l'article à créer
        db: Session de base de données

    Returns:
        Article créé

    Raises:
        HTTPException 400: Si le SKU existe déjà
        HTTPException 404: Si la catégorie spécifiée n'existe pas
    """
    return crud.create_article(db, article, current_user)


@router.put("/{article_id}", response_model=schemas.ArticleResponse, dependencies=[Depends(require_permission("articles", "update"))])
def modifier_article(
    article_id: int,
    article_update: schemas.ArticleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Met à jour un article existant.

    Args:
        article_id: ID de l'article à modifier
        article_update: Nouvelles données
        db: Session de base de données

    Returns:
        Article mis à jour

    Raises:
        HTTPException 404: Si l'article n'existe pas
        HTTPException 400: Si le nouveau SKU est déjà utilisé

    Note:
        Pour modifier la quantité en stock, utilisez plutôt l'endpoint
        de création de mouvement (/api/mouvements) pour garder un historique.
    """
    return crud.update_article(db, article_id, article_update, current_user)


@router.delete("/{article_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_permission("articles", "delete"))])
def supprimer_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Supprime un article.

    Args:
        article_id: ID de l'article à supprimer
        db: Session de base de données

    Returns:
        Message de confirmation

    Raises:
        HTTPException 404: Si l'article n'existe pas

    Note:
        La suppression d'un article supprime également tous ses mouvements
        (cascade delete).
    """
    crud.delete_article(db, article_id)
    return schemas.MessageResponse(
        message=f"Article {article_id} supprimé avec succès"
    )


@router.get("/{article_id}/barcode")
def generer_code_barre(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Génère le code-barre pour le SKU d'un article.

    Args:
        article_id: ID de l'article
        db: Session de base de données

    Returns:
        Image PNG du code-barre

    Raises:
        HTTPException 404: Si l'article n'existe pas
        HTTPException 400: Si l'article n'a pas de SKU
    """
    article = crud.get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé"
        )

    if not article.sku:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet article n'a pas de SKU"
        )

    # Générer le code-barre au format CODE128 (supporte alphanumériques)
    try:
        CODE128 = barcode.get_barcode_class('code128')
        code_barre = CODE128(article.sku, writer=ImageWriter())

        # Configurer les options d'écriture
        options = {
            'module_width': 0.3,  # Largeur des barres
            'module_height': 10.0,  # Hauteur du code-barre
            'quiet_zone': 2.0,  # Marge autour
            'font_size': 10,  # Taille de la police pour le texte
            'text_distance': 3.0,  # Distance entre le code-barre et le texte
            'write_text': True  # Afficher le texte du SKU
        }

        # Générer l'image en mémoire
        buffer = BytesIO()
        code_barre.write(buffer, options=options)
        buffer.seek(0)

        return StreamingResponse(
            buffer,
            media_type="image/png",
            headers={
                "Content-Disposition": f"inline; filename=barcode_{article.sku}.png"
            }
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la génération du code-barre : {str(e)}"
        )
