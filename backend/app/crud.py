"""
Opérations CRUD (Create, Read, Update, Delete) pour la base de données.

Ce module contient toutes les fonctions d'accès aux données pour les catégories,
articles et mouvements.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError
from typing import Optional, List, Union
from app import models, schemas
from fastapi import HTTPException, status
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# CRUD CATÉGORIES
# ============================================================================


def get_categorie(db: Session, categorie_id: int) -> Optional[models.Categorie]:
    """
    Récupère une catégorie par son ID.

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie

    Returns:
        Catégorie trouvée ou None
    """
    return (
        db.query(models.Categorie).filter(models.Categorie.id == categorie_id).first()
    )


def get_categorie_by_nom(db: Session, nom: str) -> Optional[models.Categorie]:
    """
    Récupère une catégorie par son nom.

    Args:
        db: Session de base de données
        nom: Nom de la catégorie

    Returns:
        Catégorie trouvée ou None
    """
    return db.query(models.Categorie).filter(models.Categorie.nom == nom).first()


def get_categories(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Categorie]:
    """
    Récupère la liste de toutes les catégories avec pagination.

    Args:
        db: Session de base de données
        skip: Nombre de catégories à sauter (pagination)
        limit: Nombre maximum de catégories à retourner

    Returns:
        Liste des catégories
    """
    return db.query(models.Categorie).offset(skip).limit(limit).all()


def create_categorie(
    db: Session, categorie: schemas.CategorieCreate, current_user: models.User
) -> models.Categorie:
    """
    Crée une nouvelle catégorie.

    Valide :
    - Pas de nom en double pour les catégories de même niveau (même parent)
    - Contraintes hiérarchiques (max 2 niveaux, pas de boucles)

    Args:
        db: Session de base de données
        categorie: Données de la catégorie à créer
        current_user: Utilisateur créant la catégorie (pour audit trail)

    Returns:
        Catégorie créée

    Raises:
        HTTPException: Si une catégorie avec ce nom existe déjà pour ce parent
        HTTPException: Si les contraintes hiérarchiques ne sont pas respectées
    """
    # Validation hiérarchique
    validate_hierarchy(db, None, categorie.parent_id)

    # Vérifier unicité du nom pour le même parent
    existing = (
        db.query(models.Categorie)
        .filter(models.Categorie.nom == categorie.nom)
        .filter(models.Categorie.parent_id == categorie.parent_id)
        .first()
    )

    if existing:
        parent_name = (
            "racine"
            if categorie.parent_id is None
            else f"parent ID {categorie.parent_id}"
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Une catégorie '{categorie.nom}' existe déjà pour {parent_name}",
        )

    # Créer la catégorie avec audit trail
    db_categorie = models.Categorie(
        **categorie.model_dump(), created_by=current_user.id
    )
    db.add(db_categorie)
    db.commit()
    db.refresh(db_categorie)
    return db_categorie


def update_categorie(
    db: Session,
    categorie_id: int,
    categorie_update: schemas.CategorieUpdate,
    current_user: models.User,
) -> models.Categorie:
    """
    Met à jour une catégorie existante.

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie à mettre à jour
        categorie_update: Nouvelles données
        current_user: Utilisateur effectuant la modification (pour audit trail)

    Returns:
        Catégorie mise à jour

    Raises:
        HTTPException: Si la catégorie n'existe pas
    """
    db_categorie = get_categorie(db, categorie_id)
    if not db_categorie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {categorie_id} non trouvée",
        )

    # Si le parent_id est modifié, valider la hiérarchie
    update_data = categorie_update.model_dump(exclude_unset=True)
    if (
        "parent_id" in update_data
        and update_data["parent_id"] != db_categorie.parent_id
    ):
        validate_hierarchy(db, categorie_id, update_data["parent_id"])

    # Mettre à jour les champs modifiés
    for field, value in update_data.items():
        setattr(db_categorie, field, value)

    # Audit trail
    db_categorie.updated_by = current_user.id

    db.commit()
    db.refresh(db_categorie)
    return db_categorie


def delete_categorie(db: Session, categorie_id: int) -> bool:
    """
    Supprime une catégorie.

    VALIDATION : Empêche la suppression si la catégorie a des sous-catégories.
    Les articles associés sont reclassés en "Sans catégorie" (categorie_id = NULL).

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie à supprimer

    Returns:
        True si suppression réussie

    Raises:
        HTTPException: Si la catégorie n'existe pas
        HTTPException: Si la catégorie a des sous-catégories
    """
    db_categorie = get_categorie(db, categorie_id)
    if not db_categorie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {categorie_id} non trouvée",
        )

    # VALIDATION : Bloquer suppression si enfants
    if has_children(db, categorie_id):
        children_count = len(db_categorie.children)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer '{db_categorie.nom}' car elle contient {children_count} sous-catégorie(s). Supprimez d'abord les sous-catégories.",
        )

    # Supprimer la catégorie (articles mis à NULL grâce à ondelete="SET NULL")
    db.delete(db_categorie)
    db.commit()
    return True


# ============================================================================
# CRUD CATÉGORIES - Fonctions hiérarchiques
# ============================================================================


def get_categories_racines(db: Session) -> List[models.Categorie]:
    """
    Récupère uniquement les catégories racines (parent_id = NULL).

    Returns:
        Liste des catégories de niveau 0 (sans parent)
    """
    return db.query(models.Categorie).filter(models.Categorie.parent_id == None).all()


def get_categories_tree(db: Session) -> List[models.Categorie]:
    """
    Récupère l'arbre complet des catégories avec relations chargées (joinedload).

    Charge en une seule requête les catégories racines et leurs enfants
    pour éviter les requêtes N+1.

    Returns:
        Liste des catégories racines avec leurs children chargés
    """
    from sqlalchemy.orm import joinedload

    categories_racines = (
        db.query(models.Categorie)
        .filter(models.Categorie.parent_id == None)
        .options(joinedload(models.Categorie.children))
        .all()
    )

    return categories_racines


def get_children(db: Session, parent_id: int) -> List[models.Categorie]:
    """
    Récupère les sous-catégories d'une catégorie donnée.

    Args:
        db: Session de base de données
        parent_id: ID de la catégorie parente

    Returns:
        Liste des sous-catégories (niveau 1) de cette catégorie
    """
    return (
        db.query(models.Categorie).filter(models.Categorie.parent_id == parent_id).all()
    )


def has_children(db: Session, categorie_id: int) -> bool:
    """
    Vérifie si une catégorie a des sous-catégories.

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie à vérifier

    Returns:
        True si la catégorie a au moins une sous-catégorie
    """
    count = (
        db.query(models.Categorie)
        .filter(models.Categorie.parent_id == categorie_id)
        .count()
    )
    return count > 0


def validate_hierarchy(
    db: Session, categorie_id: Optional[int], parent_id: Optional[int]
) -> None:
    """
    Valide les contraintes hiérarchiques avant création/modification.

    Lève HTTPException si :
    - Tentative de créer plus de 2 niveaux (parent est déjà une sous-catégorie)
    - Tentative de créer une boucle circulaire (parent = self)

    Args:
        categorie_id: ID de la catégorie modifiée (None si création)
        parent_id: ID du parent souhaité (None = catégorie racine)

    Raises:
        HTTPException 404: Si le parent spécifié n'existe pas
        HTTPException 400: Si les contraintes hiérarchiques ne sont pas respectées
    """
    # Si pas de parent, c'est une catégorie racine → OK
    if parent_id is None:
        return

    # Vérifier que le parent existe
    parent = get_categorie(db, parent_id)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie parente avec ID {parent_id} introuvable",
        )

    # VALIDATION 1 : Limiter à 2 niveaux
    # Si le parent a déjà un parent, on essaie de créer un 3e niveau → INTERDIT
    if parent.parent_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de créer une sous-catégorie de '{parent.nom}' car elle est déjà une sous-catégorie. Maximum 2 niveaux autorisés.",
        )

    # VALIDATION 2 : Empêcher boucles circulaires (si modification)
    # Une catégorie ne peut pas devenir parente d'elle-même
    if categorie_id is not None and parent_id == categorie_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une catégorie ne peut pas être son propre parent",
        )


# ============================================================================
# CRUD ARTICLES
# ============================================================================


def get_article(db: Session, article_id: int) -> Optional[models.Article]:
    """
    Récupère un article par son ID avec sa catégorie, son emplacement, ses tags, ses photos et ses fournisseurs.

    Args:
        db: Session de base de données
        article_id: ID de l'article

    Returns:
        Article trouvé ou None
    """
    return (
        db.query(models.Article)
        .options(joinedload(models.Article.categorie))
        .options(joinedload(models.Article.emplacement))
        .options(joinedload(models.Article.tags))
        .options(joinedload(models.Article.photos))
        .options(joinedload(models.Article.fournisseurs))
        .filter(models.Article.id == article_id)
        .first()
    )


def get_article_by_sku(db: Session, sku: str) -> Optional[models.Article]:
    """
    Récupère un article par son SKU.

    Args:
        db: Session de base de données
        sku: Code SKU de l'article

    Returns:
        Article trouvé ou None
    """
    return db.query(models.Article).filter(models.Article.sku == sku).first()


def get_articles(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    categorie_id: Optional[int] = None,
    tag_id: Optional[int] = None,
    fournisseur_id: Optional[int] = None,
    emplacement_id: Optional[Union[int, str]] = None,
    stock_bas: bool = False,
    sort_by: Optional[str] = None,
    order: str = "asc",
) -> tuple[List[models.Article], int]:
    """
    Récupère la liste des articles avec filtres, tri et pagination.

    Args:
        db: Session de base de données
        skip: Nombre d'articles à sauter (pagination)
        limit: Nombre maximum d'articles à retourner
        search: Terme de recherche (cherche dans nom et description)
        categorie_id: Filtre par catégorie
        tag_id: Filtre par tag
        fournisseur_id: Filtre par fournisseur
        emplacement_id: Filtre par emplacement
        stock_bas: Si True, retourne uniquement les articles en stock bas
        sort_by: Colonne pour le tri (id, nom, sku, quantite, prix_unitaire, categorie)
        order: Ordre de tri (asc ou desc)

    Returns:
        Tuple (liste des articles, nombre total)
    """
    query = (
        db.query(models.Article)
        .options(joinedload(models.Article.categorie))
        .options(joinedload(models.Article.emplacement))
        .options(joinedload(models.Article.tags))
        .options(joinedload(models.Article.photos))
        .options(joinedload(models.Article.fournisseurs))
    )

    # Filtre de recherche
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Article.nom.ilike(search_pattern),
                models.Article.description.ilike(search_pattern),
                models.Article.sku.ilike(search_pattern),
            )
        )

    # Filtre par catégorie (inclut les sous-catégories si la catégorie est parente)
    if categorie_id:
        # Récupérer la catégorie sélectionnée
        categorie = (
            db.query(models.Categorie)
            .filter(models.Categorie.id == categorie_id)
            .first()
        )
        if categorie:
            # Si la catégorie a des sous-catégories, inclure leur ID dans le filtre
            if categorie.children:
                # Créer une liste avec l'ID de la catégorie parente + tous les IDs des enfants
                categorie_ids = [categorie_id] + [
                    child.id for child in categorie.children
                ]
                query = query.filter(models.Article.categorie_id.in_(categorie_ids))
            else:
                # Pas de sous-catégories, filtre simple
                query = query.filter(models.Article.categorie_id == categorie_id)
        else:
            # La catégorie n'existe pas, filtre simple pour éviter erreur
            query = query.filter(models.Article.categorie_id == categorie_id)

    # Filtre par tag
    if tag_id:
        query = query.join(models.Article.tags).filter(models.Tag.id == tag_id)

    # Filtre par fournisseur
    if fournisseur_id:
        query = query.join(models.Article.fournisseurs).filter(
            models.Fournisseur.id == fournisseur_id
        )

    # Filtre par emplacement
    if emplacement_id:
        if emplacement_id == "null":
            # Filtre articles sans emplacement
            query = query.filter(models.Article.emplacement_id.is_(None))
        else:
            query = query.filter(models.Article.emplacement_id == emplacement_id)

    # Filtre stock bas
    if stock_bas:
        query = query.filter(models.Article.quantite < models.Article.quantite_min)

    # Appliquer le tri
    if sort_by:
        # Mapping des colonnes autorisées pour le tri
        sort_columns = {
            "id": models.Article.id,
            "nom": models.Article.nom,
            "sku": models.Article.sku,
            "quantite": models.Article.quantite,
            "prix_unitaire": models.Article.prix_unitaire,
            "valeur": models.Article.quantite * models.Article.prix_unitaire,
            "categorie": models.Categorie.nom,
        }

        if sort_by in sort_columns:
            # Joindre la table catégorie si on trie par catégorie
            if sort_by == "categorie":
                query = query.join(
                    models.Categorie,
                    models.Article.categorie_id == models.Categorie.id,
                    isouter=True,
                )

            # Appliquer l'ordre de tri
            sort_column = sort_columns[sort_by]
            if order.lower() == "desc":
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())

    # Compter le total avant pagination
    total = query.count()

    # Appliquer la pagination
    articles = query.offset(skip).limit(limit).all()

    return articles, total


def create_article(
    db: Session, article: schemas.ArticleCreate, current_user: models.User
) -> models.Article:
    """
    Crée un nouvel article.

    Args:
        db: Session de base de données
        article: Données de l'article à créer
        current_user: Utilisateur créant l'article (pour audit trail)

    Returns:
        Article créé

    Raises:
        HTTPException: Si le SKU existe déjà ou la catégorie n'existe pas
    """
    # Vérifier que le SKU n'existe pas déjà (si fourni)
    if article.sku and get_article_by_sku(db, article.sku):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un article avec le SKU '{article.sku}' existe déjà",
        )

    # Vérifier que la catégorie existe (si fournie)
    if article.categorie_id and not get_categorie(db, article.categorie_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {article.categorie_id} non trouvée",
        )

    # Valider la capacité de l'emplacement (si fourni)
    if article.emplacement_id:
        validate_emplacement_capacite(db, article.emplacement_id, article.quantite)

    # Extraire les tag_ids et fournisseur_ids avant de créer l'article
    article_data = article.model_dump()
    tag_ids = article_data.pop("tag_ids", [])
    fournisseur_ids = article_data.pop("fournisseur_ids", [])

    # Créer l'article avec audit trail
    db_article = models.Article(**article_data, created_by=current_user.id)
    db.add(db_article)

    # Associer les tags si fournis
    if tag_ids:
        for tag_id in tag_ids:
            tag = get_tag(db, tag_id)
            if tag:
                db_article.tags.append(tag)

    # Associer les fournisseurs si fournis
    if fournisseur_ids:
        for fournisseur_id in fournisseur_ids:
            fournisseur = get_fournisseur(db, fournisseur_id)
            if fournisseur:
                db_article.fournisseurs.append(fournisseur)

    db.commit()
    db.refresh(db_article)
    return db_article


def update_article(
    db: Session,
    article_id: int,
    article_update: schemas.ArticleUpdate,
    current_user: models.User,
) -> models.Article:
    """
    Met à jour un article existant.

    Args:
        db: Session de base de données
        article_id: ID de l'article à mettre à jour
        article_update: Nouvelles données
        current_user: Utilisateur effectuant la modification (pour audit trail)

    Returns:
        Article mis à jour

    Raises:
        HTTPException: Si l'article n'existe pas
    """
    db_article = get_article(db, article_id)
    if not db_article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    # Vérifier que le nouveau SKU n'est pas déjà pris
    if article_update.sku:
        existing = get_article_by_sku(db, article_update.sku)
        if existing and existing.id != article_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un article avec le SKU '{article_update.sku}' existe déjà",
            )

    # Vérifier que la catégorie existe (si modifiée)
    if article_update.categorie_id and not get_categorie(
        db, article_update.categorie_id
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {article_update.categorie_id} non trouvée",
        )

    # Valider la capacité de l'emplacement (si modifié)
    if article_update.emplacement_id is not None:
        # Calculer delta de quantité si l'emplacement change
        ancienne_quantite = (
            db_article.quantite
            if db_article.emplacement_id == article_update.emplacement_id
            else 0
        )
        nouvelle_quantite = (
            article_update.quantite
            if article_update.quantite is not None
            else db_article.quantite
        )
        delta_quantite = nouvelle_quantite - ancienne_quantite
        validate_emplacement_capacite(db, article_update.emplacement_id, delta_quantite)

    # Mettre à jour les champs modifiés
    update_data = article_update.model_dump(exclude_unset=True)

    # Extraire les tag_ids et fournisseur_ids s'ils sont présents
    tag_ids = update_data.pop("tag_ids", None)
    fournisseur_ids = update_data.pop("fournisseur_ids", None)

    # Mettre à jour les champs simples
    for field, value in update_data.items():
        setattr(db_article, field, value)

    # Mettre à jour les tags si fournis
    if tag_ids is not None:
        # Remplacer tous les tags existants par les nouveaux
        db_article.tags.clear()
        for tag_id in tag_ids:
            tag = get_tag(db, tag_id)
            if tag:
                db_article.tags.append(tag)

    # Mettre à jour les fournisseurs si fournis
    if fournisseur_ids is not None:
        # Remplacer tous les fournisseurs existants par les nouveaux
        db_article.fournisseurs.clear()
        for fournisseur_id in fournisseur_ids:
            fournisseur = get_fournisseur(db, fournisseur_id)
            if fournisseur:
                db_article.fournisseurs.append(fournisseur)

    # Audit trail
    db_article.updated_by = current_user.id

    db.commit()
    db.refresh(db_article)
    return db_article


def delete_article(db: Session, article_id: int) -> bool:
    """
    Supprime un article.

    Args:
        db: Session de base de données
        article_id: ID de l'article à supprimer

    Returns:
        True si suppression réussie

    Raises:
        HTTPException: Si l'article n'existe pas
    """
    db_article = get_article(db, article_id)
    if not db_article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    db.delete(db_article)
    db.commit()
    return True


# ============================================================================
# CRUD MOUVEMENTS
# ============================================================================


def get_mouvement(db: Session, mouvement_id: int) -> Optional[models.Mouvement]:
    """
    Récupère un mouvement par son ID.

    Args:
        db: Session de base de données
        mouvement_id: ID du mouvement

    Returns:
        Mouvement trouvé ou None
    """
    return (
        db.query(models.Mouvement)
        .options(
            joinedload(models.Mouvement.article).joinedload(models.Article.categorie)
        )
        .filter(models.Mouvement.id == mouvement_id)
        .first()
    )


def get_mouvements(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    article_id: Optional[int] = None,
    type_mouvement: Optional[str] = None,
) -> tuple[List[models.Mouvement], int]:
    """
    Récupère la liste des mouvements avec filtres et pagination.

    Args:
        db: Session de base de données
        skip: Nombre de mouvements à sauter (pagination)
        limit: Nombre maximum de mouvements à retourner
        article_id: Filtre par article
        type_mouvement: Filtre par type ('ENTREE' ou 'SORTIE')

    Returns:
        Tuple (liste des mouvements, nombre total)
    """
    query = (
        db.query(models.Mouvement)
        .options(
            joinedload(models.Mouvement.article).joinedload(models.Article.categorie)
        )
        .order_by(models.Mouvement.created_at.desc())
    )

    # Filtre par article
    if article_id:
        query = query.filter(models.Mouvement.article_id == article_id)

    # Filtre par type
    if type_mouvement:
        query = query.filter(models.Mouvement.type == type_mouvement)

    # Compter le total avant pagination
    total = query.count()

    # Appliquer la pagination
    mouvements = query.offset(skip).limit(limit).all()

    return mouvements, total


def create_mouvement(
    db: Session, mouvement: schemas.MouvementCreate, current_user: models.User
) -> models.Mouvement:
    """
    Crée un nouveau mouvement et met à jour le stock de l'article.

    Cette fonction est TRANSACTIONNELLE : soit tout réussit, soit tout échoue.

    Args:
        db: Session de base de données
        mouvement: Données du mouvement à créer
        current_user: Utilisateur créant le mouvement (pour audit trail)

    Returns:
        Mouvement créé

    Raises:
        HTTPException: Si l'article n'existe pas ou stock insuffisant
    """
    # Récupérer l'article
    article = get_article(db, mouvement.article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {mouvement.article_id} non trouvé",
        )

    # Calculer la nouvelle quantité
    quantite_avant = article.quantite

    if mouvement.type == "ENTREE":
        quantite_apres = quantite_avant + mouvement.quantite
    else:  # SORTIE
        if quantite_avant < mouvement.quantite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant. Stock actuel: {quantite_avant}, "
                f"quantité demandée: {mouvement.quantite}",
            )
        quantite_apres = quantite_avant - mouvement.quantite

    # Créer le mouvement avec audit trail
    db_mouvement = models.Mouvement(
        article_id=mouvement.article_id,
        type=mouvement.type,
        quantite=mouvement.quantite,
        quantite_avant=quantite_avant,
        quantite_apres=quantite_apres,
        motif=mouvement.motif,
        created_by=current_user.id,
    )

    # Mettre à jour la quantité de l'article
    article.quantite = quantite_apres

    # Sauvegarder dans une transaction
    try:
        db.add(db_mouvement)
        db.commit()
        db.refresh(db_mouvement)
        return db_mouvement
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Erreur d'intégrité lors de la création du mouvement: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Données invalides pour le mouvement",
        )
    except Exception as e:
        db.rollback()
        logger.error(
            f"Erreur inattendue lors de la création du mouvement: {e}", exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur serveur lors de la création du mouvement",
        )


# ============================================================================
# FONCTIONS POUR LES RAPPORTS
# ============================================================================


def get_articles_stock_bas(db: Session) -> List[models.Article]:
    """
    Récupère tous les articles dont le stock est en dessous du seuil minimum.

    Args:
        db: Session de base de données

    Returns:
        Liste des articles en stock bas
    """
    return (
        db.query(models.Article)
        .options(joinedload(models.Article.categorie))
        .options(joinedload(models.Article.tags))
        .filter(models.Article.quantite < models.Article.quantite_min)
        .all()
    )


def get_valeur_totale_stock(db: Session) -> dict:
    """
    Calcule la valeur totale du stock et les détails par catégorie.

    Optimisé pour éviter les requêtes N+1 en utilisant GROUP BY.

    Args:
        db: Session de base de données

    Returns:
        Dictionnaire avec valeur totale et détails par catégorie
    """
    from sqlalchemy import func, case

    # Valeur totale et nombre d'articles - Une seule requête avec agrégation
    totaux = db.query(
        func.count(models.Article.id).label("nombre_articles"),
        func.sum(models.Article.quantite * models.Article.prix_unitaire).label(
            "valeur_totale"
        ),
    ).first()

    nombre_articles = totaux[0] if totaux else 0
    valeur_totale = float(totaux[1]) if totaux and totaux[1] else 0.0

    # Détails par catégorie - Une seule requête avec JOIN et GROUP BY
    # Utilise COALESCE pour gérer les articles sans catégorie
    resultats = (
        db.query(
            func.coalesce(models.Categorie.nom, "Sans catégorie").label("categorie"),
            func.count(models.Article.id).label("nombre_articles"),
            func.sum(models.Article.quantite * models.Article.prix_unitaire).label(
                "valeur"
            ),
        )
        .outerjoin(models.Categorie, models.Article.categorie_id == models.Categorie.id)
        .group_by(models.Categorie.nom)
        .all()
    )

    details_par_categorie = [
        {
            "categorie": resultat.categorie,
            "nombre_articles": resultat.nombre_articles,
            "valeur": float(resultat.valeur) if resultat.valeur else 0.0,
        }
        for resultat in resultats
    ]

    return {
        "valeur_totale": valeur_totale,
        "nombre_articles": nombre_articles,
        "details_par_categorie": details_par_categorie,
    }


def get_statistiques(db: Session) -> dict:
    """
    Récupère les statistiques globales de l'inventaire.

    Args:
        db: Session de base de données

    Returns:
        Dictionnaire avec les statistiques
    """
    nombre_articles = db.query(models.Article).count()
    nombre_categories = db.query(models.Categorie).count()
    valeur_info = get_valeur_totale_stock(db)
    nombre_stock_bas = (
        db.query(models.Article)
        .filter(models.Article.quantite < models.Article.quantite_min)
        .count()
    )

    return {
        "nombre_articles": nombre_articles,
        "nombre_categories": nombre_categories,
        "valeur_totale_stock": valeur_info["valeur_totale"],
        "nombre_articles_stock_bas": nombre_stock_bas,
    }


# ============================================================================
# CRUD TAGS
# ============================================================================


def get_tag(db: Session, tag_id: int) -> Optional[models.Tag]:
    """
    Récupère un tag par son ID.

    Args:
        db: Session de base de données
        tag_id: ID du tag

    Returns:
        Tag trouvé ou None
    """
    return db.query(models.Tag).filter(models.Tag.id == tag_id).first()


def get_tag_by_nom(db: Session, nom: str) -> Optional[models.Tag]:
    """
    Récupère un tag par son nom.

    Args:
        db: Session de base de données
        nom: Nom du tag

    Returns:
        Tag trouvé ou None
    """
    return db.query(models.Tag).filter(models.Tag.nom == nom).first()


def get_tags(db: Session, skip: int = 0, limit: int = 100) -> List[models.Tag]:
    """
    Récupère tous les tags.

    Args:
        db: Session de base de données
        skip: Pagination
        limit: Limite de résultats

    Returns:
        Liste des tags
    """
    return db.query(models.Tag).offset(skip).limit(limit).all()


def create_tag(
    db: Session, tag: schemas.TagCreate, current_user: models.User
) -> models.Tag:
    """
    Crée un nouveau tag.

    Args:
        db: Session de base de données
        tag: Données du tag
        current_user: Utilisateur créant le tag (pour audit trail)

    Returns:
        Tag créé

    Raises:
        HTTPException: Si un tag avec ce nom existe déjà
    """
    if get_tag_by_nom(db, tag.nom):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un tag avec le nom '{tag.nom}' existe déjà",
        )

    db_tag = models.Tag(**tag.model_dump(), created_by=current_user.id)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def update_tag(
    db: Session, tag_id: int, tag_update: schemas.TagUpdate, current_user: models.User
) -> models.Tag:
    """
    Met à jour un tag.

    Args:
        db: Session de base de données
        tag_id: ID du tag
        tag_update: Nouvelles données
        current_user: Utilisateur effectuant la modification (pour audit trail)

    Returns:
        Tag mis à jour

    Raises:
        HTTPException: Si le tag n'existe pas
    """
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tag {tag_id} non trouvé"
        )

    # Vérifier unicité du nom si modifié
    if tag_update.nom:
        existing = get_tag_by_nom(db, tag_update.nom)
        if existing and existing.id != tag_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un tag avec le nom '{tag_update.nom}' existe déjà",
            )

    update_data = tag_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tag, field, value)

    # Audit trail
    db_tag.updated_by = current_user.id

    db.commit()
    db.refresh(db_tag)
    return db_tag


def delete_tag(db: Session, tag_id: int) -> bool:
    """
    Supprime un tag.

    Args:
        db: Session de base de données
        tag_id: ID du tag

    Returns:
        True si succès

    Raises:
        HTTPException: Si le tag n'existe pas
    """
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tag {tag_id} non trouvé"
        )

    db.delete(db_tag)
    db.commit()
    return True


def add_tag_to_article(db: Session, article_id: int, tag_id: int) -> models.Article:
    """
    Associe un tag à un article.

    Args:
        db: Session de base de données
        article_id: ID de l'article
        tag_id: ID du tag

    Returns:
        Article avec ses tags

    Raises:
        HTTPException: Si l'article ou le tag n'existe pas
    """
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    tag = get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tag {tag_id} non trouvé"
        )

    # Vérifier si le tag n'est pas déjà associé
    if tag not in article.tags:
        article.tags.append(tag)
        db.commit()
        db.refresh(article)

    return article


def remove_tag_from_article(
    db: Session, article_id: int, tag_id: int
) -> models.Article:
    """
    Retire un tag d'un article.

    Args:
        db: Session de base de données
        article_id: ID de l'article
        tag_id: ID du tag

    Returns:
        Article avec ses tags

    Raises:
        HTTPException: Si l'article ou le tag n'existe pas
    """
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    tag = get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail=f"Tag {tag_id} non trouvé"
        )

    if tag in article.tags:
        article.tags.remove(tag)
        db.commit()
        db.refresh(article)

    return article


# ============================================================================
# CRUD FOURNISSEURS
# ============================================================================


def get_fournisseur(db: Session, fournisseur_id: int) -> Optional[models.Fournisseur]:
    """
    Récupère un fournisseur par son ID.

    Args:
        db: Session de base de données
        fournisseur_id: ID du fournisseur

    Returns:
        Fournisseur trouvé ou None
    """
    return (
        db.query(models.Fournisseur)
        .filter(models.Fournisseur.id == fournisseur_id)
        .first()
    )


def get_fournisseur_by_nom(db: Session, nom: str) -> Optional[models.Fournisseur]:
    """
    Récupère un fournisseur par son nom.

    Args:
        db: Session de base de données
        nom: Nom du fournisseur

    Returns:
        Fournisseur trouvé ou None
    """
    return db.query(models.Fournisseur).filter(models.Fournisseur.nom == nom).first()


def get_fournisseurs(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Fournisseur]:
    """
    Récupère tous les fournisseurs.

    Args:
        db: Session de base de données
        skip: Pagination
        limit: Limite de résultats

    Returns:
        Liste des fournisseurs
    """
    return db.query(models.Fournisseur).offset(skip).limit(limit).all()


def create_fournisseur(
    db: Session, fournisseur: schemas.FournisseurCreate, current_user: models.User
) -> models.Fournisseur:
    """
    Crée un nouveau fournisseur.

    Args:
        db: Session de base de données
        fournisseur: Données du fournisseur
        current_user: Utilisateur créant le fournisseur (pour audit trail)

    Returns:
        Fournisseur créé

    Raises:
        HTTPException: Si un fournisseur avec ce nom existe déjà
    """
    if get_fournisseur_by_nom(db, fournisseur.nom):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un fournisseur avec le nom '{fournisseur.nom}' existe déjà",
        )

    db_fournisseur = models.Fournisseur(
        **fournisseur.model_dump(), created_by=current_user.id
    )
    db.add(db_fournisseur)
    db.commit()
    db.refresh(db_fournisseur)
    return db_fournisseur


def update_fournisseur(
    db: Session,
    fournisseur_id: int,
    fournisseur_update: schemas.FournisseurUpdate,
    current_user: models.User,
) -> models.Fournisseur:
    """
    Met à jour un fournisseur.

    Args:
        db: Session de base de données
        fournisseur_id: ID du fournisseur
        fournisseur_update: Nouvelles données
        current_user: Utilisateur effectuant la modification (pour audit trail)

    Returns:
        Fournisseur mis à jour

    Raises:
        HTTPException: Si le fournisseur n'existe pas ou si le nom est déjà pris
    """
    db_fournisseur = get_fournisseur(db, fournisseur_id)
    if not db_fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {fournisseur_id} non trouvé",
        )

    # Vérifier unicité du nom si modifié
    if fournisseur_update.nom:
        existing = get_fournisseur_by_nom(db, fournisseur_update.nom)
        if existing and existing.id != fournisseur_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un fournisseur avec le nom '{fournisseur_update.nom}' existe déjà",
            )

    update_data = fournisseur_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_fournisseur, field, value)

    # Audit trail
    db_fournisseur.updated_by = current_user.id

    db.commit()
    db.refresh(db_fournisseur)
    return db_fournisseur


def delete_fournisseur(db: Session, fournisseur_id: int) -> bool:
    """
    Supprime un fournisseur.

    Args:
        db: Session de base de données
        fournisseur_id: ID du fournisseur

    Returns:
        True si succès

    Raises:
        HTTPException: Si le fournisseur n'existe pas ou est associé à des articles
    """
    db_fournisseur = get_fournisseur(db, fournisseur_id)
    if not db_fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {fournisseur_id} non trouvé",
        )

    # Vérifier si le fournisseur est associé à des articles
    if db_fournisseur.articles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer le fournisseur '{db_fournisseur.nom}' car il est associé à {len(db_fournisseur.articles)} article(s)",
        )

    db.delete(db_fournisseur)
    db.commit()
    return True


def add_fournisseur_to_article(
    db: Session, article_id: int, fournisseur_id: int
) -> models.Article:
    """
    Associe un fournisseur à un article.

    Args:
        db: Session de base de données
        article_id: ID de l'article
        fournisseur_id: ID du fournisseur

    Returns:
        Article avec ses fournisseurs

    Raises:
        HTTPException: Si l'article ou le fournisseur n'existe pas
    """
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    fournisseur = get_fournisseur(db, fournisseur_id)
    if not fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {fournisseur_id} non trouvé",
        )

    # Vérifier si le fournisseur n'est pas déjà associé
    if fournisseur not in article.fournisseurs:
        article.fournisseurs.append(fournisseur)
        db.commit()
        db.refresh(article)

    return article


def remove_fournisseur_from_article(
    db: Session, article_id: int, fournisseur_id: int
) -> models.Article:
    """
    Retire un fournisseur d'un article.

    Args:
        db: Session de base de données
        article_id: ID de l'article
        fournisseur_id: ID du fournisseur

    Returns:
        Article avec ses fournisseurs

    Raises:
        HTTPException: Si l'article ou le fournisseur n'existe pas
    """
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé",
        )

    fournisseur = get_fournisseur(db, fournisseur_id)
    if not fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {fournisseur_id} non trouvé",
        )

    if fournisseur in article.fournisseurs:
        article.fournisseurs.remove(fournisseur)
        db.commit()
        db.refresh(article)

    return article


def get_articles_by_fournisseur(
    db: Session, fournisseur_id: int, skip: int = 0, limit: int = 100
) -> List[models.Article]:
    """
    Récupère tous les articles d'un fournisseur.

    Args:
        db: Session de base de données
        fournisseur_id: ID du fournisseur
        skip: Pagination
        limit: Limite de résultats

    Returns:
        Liste des articles du fournisseur

    Raises:
        HTTPException: Si le fournisseur n'existe pas
    """
    fournisseur = get_fournisseur(db, fournisseur_id)
    if not fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {fournisseur_id} non trouvé",
        )

    return (
        db.query(models.Article)
        .join(models.article_fournisseurs)
        .filter(models.article_fournisseurs.c.fournisseur_id == fournisseur_id)
        .options(joinedload(models.Article.categorie))
        .options(joinedload(models.Article.tags))
        .options(joinedload(models.Article.photos))
        .options(joinedload(models.Article.fournisseurs))
        .offset(skip)
        .limit(limit)
        .all()
    )


# ============================================================================
# FONCTIONS CRUD POUR LES EMPLACEMENTS
# ============================================================================


def validate_emplacement_hierarchy(
    db: Session, parent_id: Optional[int], current_id: Optional[int] = None
) -> None:
    """
    Valide la hiérarchie des emplacements (max 3 niveaux).

    Args:
        db: Session de base de données
        parent_id: ID de l'emplacement parent
        current_id: ID de l'emplacement actuel (pour éviter boucles circulaires)

    Raises:
        HTTPException: Si la hiérarchie est invalide
    """
    if parent_id is None:
        return  # Pas de parent = Zone (niveau 0) → OK

    # Vérifier que le parent existe
    parent = get_emplacement(db, parent_id)
    if not parent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement parent {parent_id} non trouvé",
        )

    # Empêcher boucles circulaires (parent = self)
    if current_id and parent_id == current_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un emplacement ne peut pas être son propre parent",
        )

    # Bloquer si parent est niveau 2 (Boîte) → Empêche 4e niveau
    if parent.niveau >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de créer un sous-emplacement sous '{parent.code}' (niveau {parent.niveau}). Maximum 3 niveaux : Zone → Étagère → Boîte",
        )


def validate_emplacement_capacite(
    db: Session, emplacement_id: int, delta_quantite: int
) -> None:
    """
    Valide que l'ajout d'articles ne dépasse pas la capacité max.

    Args:
        db: Session de base de données
        emplacement_id: ID de l'emplacement
        delta_quantite: Quantité à ajouter (peut être négative)

    Raises:
        HTTPException: Si la capacité est dépassée
    """
    emplacement = get_emplacement(db, emplacement_id)
    if not emplacement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement {emplacement_id} non trouvé",
        )

    # Si capacite_max = NULL, pas de limite
    if emplacement.capacite_max is None:
        return

    # Calculer quantité actuelle
    quantite_actuelle = sum(article.quantite for article in emplacement.articles)

    # Vérifier dépassement
    nouvelle_quantite = quantite_actuelle + delta_quantite
    if nouvelle_quantite > emplacement.capacite_max:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Capacité de l'emplacement '{emplacement.code}' dépassée. "
            f"Disponible: {emplacement.capacite_max - quantite_actuelle}, "
            f"Demandé: {delta_quantite}, "
            f"Capacité max: {emplacement.capacite_max}",
        )


def has_children_emplacement(db: Session, emplacement_id: int) -> bool:
    """
    Vérifie si un emplacement a des sous-emplacements.

    Args:
        db: Session de base de données
        emplacement_id: ID de l'emplacement

    Returns:
        True si l'emplacement a des enfants, False sinon
    """
    count = (
        db.query(models.Emplacement)
        .filter(models.Emplacement.parent_id == emplacement_id)
        .count()
    )
    return count > 0


def get_emplacement(db: Session, emplacement_id: int) -> Optional[models.Emplacement]:
    """
    Récupère un emplacement par son ID.

    Args:
        db: Session de base de données
        emplacement_id: ID de l'emplacement

    Returns:
        Emplacement ou None si non trouvé
    """
    return (
        db.query(models.Emplacement)
        .filter(models.Emplacement.id == emplacement_id)
        .first()
    )


def get_emplacement_by_code(db: Session, code: str) -> Optional[models.Emplacement]:
    """
    Récupère un emplacement par son code.

    Args:
        db: Session de base de données
        code: Code de l'emplacement

    Returns:
        Emplacement ou None si non trouvé
    """
    return db.query(models.Emplacement).filter(models.Emplacement.code == code).first()


def get_emplacements(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Emplacement]:
    """
    Récupère tous les emplacements (structure plate).

    Args:
        db: Session de base de données
        skip: Pagination
        limit: Limite de résultats

    Returns:
        Liste des emplacements
    """
    return (
        db.query(models.Emplacement)
        .order_by(models.Emplacement.code)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_emplacements_racines(db: Session) -> List[models.Emplacement]:
    """
    Récupère uniquement les Zones (emplacements racines).

    Args:
        db: Session de base de données

    Returns:
        Liste des Zones (parent_id = NULL)
    """
    return (
        db.query(models.Emplacement)
        .filter(models.Emplacement.parent_id == None)
        .order_by(models.Emplacement.code)
        .all()
    )


def get_emplacements_tree(db: Session) -> List[models.Emplacement]:
    """
    Récupère l'arbre hiérarchique complet (3 niveaux).

    IMPORTANT: Utilise joinedload DEUX FOIS pour charger 3 niveaux
    et éviter les requêtes N+1.

    Args:
        db: Session de base de données

    Returns:
        Liste des Zones avec children imbriqués (3 niveaux)
    """
    return (
        db.query(models.Emplacement)
        .filter(models.Emplacement.parent_id == None)
        .options(
            joinedload(models.Emplacement.children).joinedload(
                models.Emplacement.children
            )  # 2e fois pour children.children
        )
        .order_by(models.Emplacement.code)
        .all()
    )


def get_children_emplacement(db: Session, parent_id: int) -> List[models.Emplacement]:
    """
    Récupère les sous-emplacements directs d'un parent.

    Args:
        db: Session de base de données
        parent_id: ID de l'emplacement parent

    Returns:
        Liste des enfants directs
    """
    return (
        db.query(models.Emplacement)
        .filter(models.Emplacement.parent_id == parent_id)
        .order_by(models.Emplacement.code)
        .all()
    )


def create_emplacement(
    db: Session, emplacement: schemas.EmplacementCreate, current_user: models.User
) -> models.Emplacement:
    """
    Crée un nouvel emplacement.

    Args:
        db: Session de base de données
        emplacement: Données de l'emplacement
        current_user: Utilisateur créant l'emplacement (pour audit trail)

    Returns:
        Emplacement créé

    Raises:
        HTTPException: Si le code existe déjà ou hiérarchie invalide
    """
    # Vérifier unicité du code
    if get_emplacement_by_code(db, emplacement.code):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un emplacement avec le code '{emplacement.code}' existe déjà",
        )

    # Valider hiérarchie
    validate_emplacement_hierarchy(db, emplacement.parent_id)

    # Créer l'emplacement avec audit trail
    db_emplacement = models.Emplacement(
        code=emplacement.code,
        description=emplacement.description,
        capacite_max=emplacement.capacite_max,
        parent_id=emplacement.parent_id,
        created_by=current_user.id,
    )

    db.add(db_emplacement)
    db.commit()
    db.refresh(db_emplacement)
    return db_emplacement


def update_emplacement(
    db: Session,
    emplacement_id: int,
    emplacement: schemas.EmplacementUpdate,
    current_user: models.User,
) -> models.Emplacement:
    """
    Met à jour un emplacement existant.

    Args:
        db: Session de base de données
        emplacement_id: ID de l'emplacement
        emplacement: Nouvelles données
        current_user: Utilisateur effectuant la modification (pour audit trail)

    Returns:
        Emplacement mis à jour

    Raises:
        HTTPException: Si non trouvé, code en double, ou hiérarchie invalide
    """
    db_emplacement = get_emplacement(db, emplacement_id)
    if not db_emplacement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement {emplacement_id} non trouvé",
        )

    # Vérifier unicité du code (si modifié)
    if emplacement.code and emplacement.code != db_emplacement.code:
        if get_emplacement_by_code(db, emplacement.code):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un emplacement avec le code '{emplacement.code}' existe déjà",
            )

    # Valider hiérarchie (si parent_id modifié)
    if (
        emplacement.parent_id is not None
        and emplacement.parent_id != db_emplacement.parent_id
    ):
        validate_emplacement_hierarchy(
            db, emplacement.parent_id, current_id=emplacement_id
        )

    # Mettre à jour les champs
    if emplacement.code is not None:
        db_emplacement.code = emplacement.code
    if emplacement.description is not None:
        db_emplacement.description = emplacement.description
    if emplacement.capacite_max is not None:
        db_emplacement.capacite_max = emplacement.capacite_max
    if emplacement.parent_id is not None:
        db_emplacement.parent_id = emplacement.parent_id

    # Audit trail
    db_emplacement.updated_by = current_user.id

    db.commit()
    db.refresh(db_emplacement)
    return db_emplacement


def delete_emplacement(db: Session, emplacement_id: int) -> bool:
    """
    Supprime un emplacement.

    IMPORTANT: Bloque si l'emplacement a des enfants OU des articles associés.

    Args:
        db: Session de base de données
        emplacement_id: ID de l'emplacement

    Returns:
        True si supprimé

    Raises:
        HTTPException: Si non trouvé, a des enfants ou des articles
    """
    db_emplacement = get_emplacement(db, emplacement_id)
    if not db_emplacement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement {emplacement_id} non trouvé",
        )

    # DOUBLE validation (différence avec Catégories)

    # 1. Bloquer si sous-emplacements
    if has_children_emplacement(db, emplacement_id):
        children_count = len(db_emplacement.children)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer '{db_emplacement.code}' car il contient {children_count} sous-emplacement(s). Supprimez-les d'abord.",
        )

    # 2. Bloquer si articles associés
    if db_emplacement.articles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer '{db_emplacement.code}' car il contient {len(db_emplacement.articles)} article(s). Reclassez-les d'abord.",
        )

    # Supprimer
    db.delete(db_emplacement)
    db.commit()
    return True


def get_articles_by_emplacement(
    db: Session, emplacement_id: int, skip: int = 0, limit: int = 100
) -> List[models.Article]:
    """
    Récupère tous les articles d'un emplacement.

    Args:
        db: Session de base de données
        emplacement_id: ID de l'emplacement
        skip: Pagination
        limit: Limite de résultats

    Returns:
        Liste des articles de l'emplacement

    Raises:
        HTTPException: Si l'emplacement n'existe pas
    """
    emplacement = get_emplacement(db, emplacement_id)
    if not emplacement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Emplacement {emplacement_id} non trouvé",
        )

    return (
        db.query(models.Article)
        .filter(models.Article.emplacement_id == emplacement_id)
        .options(joinedload(models.Article.categorie))
        .options(joinedload(models.Article.emplacement))
        .options(joinedload(models.Article.tags))
        .options(joinedload(models.Article.photos))
        .options(joinedload(models.Article.fournisseurs))
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_emplacements_suggestions_by_category(
    db: Session, categorie_id: int, limit: int = 5
) -> List[dict]:
    """
    Suggère des emplacements pour un article basé sur sa catégorie.

    Analyse où sont stockés les autres articles de la même catégorie
    et retourne les emplacements les plus fréquemment utilisés.

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie
        limit: Nombre maximum de suggestions à retourner

    Returns:
        Liste de dictionnaires avec les suggestions d'emplacements
        Format: [{"emplacement": Emplacement, "count": int}, ...]
    """
    from sqlalchemy import func

    # Vérifier que la catégorie existe
    categorie = get_categorie(db, categorie_id)
    if not categorie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {categorie_id} non trouvée",
        )

    # Trouver les emplacements les plus utilisés pour cette catégorie
    # GROUP BY emplacement_id et compter le nombre d'articles
    results = (
        db.query(
            models.Article.emplacement_id, func.count(models.Article.id).label("count")
        )
        .filter(models.Article.categorie_id == categorie_id)
        .filter(models.Article.emplacement_id.isnot(None))
        .group_by(models.Article.emplacement_id)
        .order_by(func.count(models.Article.id).desc())
        .limit(limit)
        .all()
    )

    # Charger les détails complets des emplacements
    suggestions = []
    for emplacement_id, count in results:
        emplacement = get_emplacement(db, emplacement_id)
        if emplacement:
            suggestions.append(
                {
                    "emplacement": emplacement,
                    "count": count,
                    "raison": f"{count} article(s) de cette catégorie",
                }
            )

    return suggestions


# ============================================================================
# FONCTIONS CRUD POUR LES UTILISATEURS
# ============================================================================


def get_user(db: Session, user_id: int) -> Optional[models.User]:
    """
    Récupère un utilisateur par son ID.

    Args:
        db: Session de base de données
        user_id: ID de l'utilisateur

    Returns:
        L'utilisateur ou None s'il n'existe pas
    """
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    """
    Récupère un utilisateur par son username.

    Args:
        db: Session de base de données
        username: Nom d'utilisateur

    Returns:
        L'utilisateur ou None s'il n'existe pas
    """
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    """
    Récupère un utilisateur par son email.

    Args:
        db: Session de base de données
        email: Adresse email

    Returns:
        L'utilisateur ou None s'il n'existe pas
    """
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(
    db: Session, user: schemas.UserCreate, current_user: Optional[models.User] = None
) -> models.User:
    """
    Crée un nouvel utilisateur avec un mot de passe haché.

    Args:
        db: Session de base de données
        user: Schéma de création d'utilisateur
        current_user: Utilisateur qui crée (optionnel, None pour inscription)

    Returns:
        L'utilisateur créé

    Raises:
        HTTPException 400: Si le username ou l'email existe déjà
    """
    from app.auth import get_password_hash

    # Vérifier unicité du username
    if get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce nom d'utilisateur existe déjà",
        )

    # Vérifier unicité de l'email
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cet email existe déjà"
        )

    # Hasher le mot de passe
    hashed_password = get_password_hash(user.password)

    # Créer l'utilisateur
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True,
        created_by=current_user.id if current_user else None,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def authenticate_user(
    db: Session, username: str, password: str
) -> Optional[models.User]:
    """
    Authentifie un utilisateur avec son username et mot de passe.

    Args:
        db: Session de base de données
        username: Nom d'utilisateur
        password: Mot de passe en clair

    Returns:
        L'utilisateur si les credentials sont valides, None sinon
    """
    from app.auth import verify_password

    user = get_user_by_username(db, username)
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    return user


def get_users(db: Session, skip: int = 0, limit: int = 100) -> list[models.User]:
    """
    Récupère la liste de tous les utilisateurs avec pagination.

    Args:
        db: Session de base de données
        skip: Nombre d'enregistrements à sauter
        limit: Nombre maximum d'enregistrements à retourner

    Returns:
        Liste des utilisateurs
    """
    return (
        db.query(models.User)
        .order_by(models.User.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def update_user_role(
    db: Session, user_id: int, new_role: models.RoleEnum, current_user: models.User
) -> models.User:
    """
    Change le rôle d'un utilisateur.

    Validations :
    - L'utilisateur cible existe
    - L'utilisateur actuel ne peut pas changer son propre rôle

    Args:
        db: Session de base de données
        user_id: ID de l'utilisateur à modifier
        new_role: Nouveau rôle
        current_user: Utilisateur qui effectue la modification

    Returns:
        L'utilisateur modifié

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
        HTTPException 400: Si tentative de modifier son propre rôle
    """
    # Récupérer l'utilisateur cible
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur {user_id} non trouvé",
        )

    # Empêcher un utilisateur de modifier son propre rôle
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de modifier votre propre rôle",
        )

    # Mettre à jour le rôle
    user.role = new_role
    user.updated_by = current_user.id

    db.commit()
    db.refresh(user)

    return user


def update_user_permissions(
    db: Session,
    user_id: int,
    permissions: Optional[list[str]],
    current_user: models.User,
) -> models.User:
    """
    Met à jour les permissions custom d'un utilisateur.

    Si permissions = None, réinitialise aux permissions par défaut du rôle.

    Args:
        db: Session de base de données
        user_id: ID de l'utilisateur à modifier
        permissions: Liste de permissions (format "resource:action") ou None
        current_user: Utilisateur qui effectue la modification

    Returns:
        L'utilisateur modifié

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
    """
    # Récupérer l'utilisateur cible
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur {user_id} non trouvé",
        )

    # Mettre à jour les permissions (None = reset)
    user.permissions = permissions
    user.updated_by = current_user.id

    db.commit()
    db.refresh(user)

    return user


def deactivate_user(
    db: Session, user_id: int, current_user: models.User
) -> models.User:
    """
    Désactive un utilisateur (is_active = False).

    Validations :
    - L'utilisateur cible existe
    - L'utilisateur actuel ne peut pas se désactiver lui-même
    - Il doit rester au moins 1 admin actif

    Args:
        db: Session de base de données
        user_id: ID de l'utilisateur à désactiver
        current_user: Utilisateur qui effectue la désactivation

    Returns:
        L'utilisateur désactivé

    Raises:
        HTTPException 404: Si l'utilisateur n'existe pas
        HTTPException 400: Si tentative de se désactiver soi-même ou si c'est le dernier admin
    """
    # Récupérer l'utilisateur cible
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Utilisateur {user_id} non trouvé",
        )

    # Empêcher de se désactiver soi-même
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de vous désactiver vous-même",
        )

    # Vérifier qu'il reste au moins 1 admin actif
    if user.role == models.RoleEnum.ADMIN and user.is_active:
        active_admins = (
            db.query(models.User)
            .filter(
                models.User.role == models.RoleEnum.ADMIN, models.User.is_active == True
            )
            .count()
        )

        if active_admins <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de désactiver le dernier administrateur actif",
            )

    # Désactiver l'utilisateur
    user.is_active = False
    user.updated_by = current_user.id

    db.commit()
    db.refresh(user)

    return user


# ============================================================================
# CRUD PHOTOS
# ============================================================================


def get_photos_by_article(db: Session, article_id: int) -> List[models.Photo]:
    """
    Récupère toutes les photos d'un article.

    Args:
        db: Session de base de données
        article_id: ID de l'article

    Returns:
        Liste des photos de l'article, ordonnées par date de création
    """
    return (
        db.query(models.Photo)
        .filter(models.Photo.article_id == article_id)
        .order_by(models.Photo.created_at)
        .all()
    )


def get_photo(db: Session, photo_id: int) -> Optional[models.Photo]:
    """
    Récupère une photo par son ID.

    Args:
        db: Session de base de données
        photo_id: ID de la photo

    Returns:
        La photo si trouvée, None sinon
    """
    return db.query(models.Photo).filter(models.Photo.id == photo_id).first()


def create_photo(
    db: Session,
    article_id: int,
    filename: str,
    filepath: str,
    thumbnail_path: str,
    file_size: int,
    mime_type: str,
    current_user: models.User,
) -> models.Photo:
    """
    Crée un enregistrement de photo en base de données.

    Valide que :
    - L'article existe
    - Le nombre de photos n'excède pas 5 par article

    Args:
        db: Session de base de données
        article_id: ID de l'article
        filename: Nom du fichier original
        filepath: Chemin relatif du fichier
        thumbnail_path: Chemin relatif de la miniature
        file_size: Taille du fichier en octets
        mime_type: Type MIME du fichier
        current_user: Utilisateur qui crée la photo

    Returns:
        La photo créée

    Raises:
        HTTPException: Si l'article n'existe pas ou si la limite de 5 photos est atteinte
    """
    from fastapi import HTTPException

    # Vérifier que l'article existe
    article = get_article(db, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")

    # Vérifier limite de 5 photos par article
    current_photos_count = (
        db.query(models.Photo).filter(models.Photo.article_id == article_id).count()
    )

    if current_photos_count >= 5:
        raise HTTPException(
            status_code=400,
            detail="Limite de 5 photos par article atteinte. Supprimez une photo existante avant d'en ajouter une nouvelle.",
        )

    # Créer la photo
    db_photo = models.Photo(
        article_id=article_id,
        filename=filename,
        filepath=filepath,
        thumbnail_path=thumbnail_path,
        file_size=file_size,
        mime_type=mime_type,
        created_by=current_user.id,
    )

    db.add(db_photo)
    db.commit()
    db.refresh(db_photo)

    return db_photo


def delete_photo(db: Session, photo_id: int) -> bool:
    """
    Supprime une photo de la base de données.

    Note : Les fichiers doivent être supprimés séparément via photo_service.delete_photo_files()

    Args:
        db: Session de base de données
        photo_id: ID de la photo à supprimer

    Returns:
        True si la suppression a réussi

    Raises:
        HTTPException: Si la photo n'existe pas
    """
    from fastapi import HTTPException

    db_photo = get_photo(db, photo_id)

    if not db_photo:
        raise HTTPException(status_code=404, detail="Photo introuvable")

    db.delete(db_photo)
    db.commit()

    return True


# ============================================================================
# CRUD COMMANDES
# ============================================================================


def get_commande(db: Session, commande_id: int) -> Optional[models.Commande]:
    """
    Récupère une commande par son ID avec toutes ses relations.

    Args:
        db: Session de base de données
        commande_id: ID de la commande

    Returns:
        La commande avec fournisseur et lignes, ou None si non trouvée
    """
    return (
        db.query(models.Commande)
        .options(
            joinedload(models.Commande.fournisseur),
            joinedload(models.Commande.lignes).joinedload(models.LigneCommande.article),
        )
        .filter(models.Commande.id == commande_id)
        .first()
    )


def get_commandes(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    statut: Optional[str] = None,
    fournisseur_id: Optional[int] = None,
) -> Tuple[List[models.Commande], int]:
    """
    Récupère une liste paginée de commandes avec filtres optionnels.

    Args:
        db: Session de base de données
        skip: Nombre de commandes à sauter (pagination)
        limit: Nombre maximum de commandes à retourner
        statut: Filtre par statut (BROUILLON, ENVOYEE, RECUE, ANNULEE)
        fournisseur_id: Filtre par fournisseur

    Returns:
        Tuple (liste de commandes, nombre total)
    """
    query = db.query(models.Commande).options(
        joinedload(models.Commande.fournisseur), joinedload(models.Commande.lignes)
    )

    # Filtres
    if statut:
        query = query.filter(models.Commande.statut == statut)
    if fournisseur_id:
        query = query.filter(models.Commande.fournisseur_id == fournisseur_id)

    # Compter le total
    total = query.count()

    # Appliquer pagination et tri par date de création descendante
    commandes = (
        query.order_by(models.Commande.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return commandes, total


def get_commandes_by_fournisseur(
    db: Session, fournisseur_id: int
) -> List[models.Commande]:
    """
    Récupère toutes les commandes d'un fournisseur.

    Args:
        db: Session de base de données
        fournisseur_id: ID du fournisseur

    Returns:
        Liste des commandes du fournisseur
    """
    return (
        db.query(models.Commande)
        .options(joinedload(models.Commande.lignes))
        .filter(models.Commande.fournisseur_id == fournisseur_id)
        .order_by(models.Commande.created_at.desc())
        .all()
    )


def create_commande(
    db: Session, commande: schemas.CommandeCreate, current_user: models.User
) -> models.Commande:
    """
    Crée une nouvelle commande avec ses lignes.

    Valide que :
    - Le fournisseur existe
    - Le numéro de commande est unique
    - Chaque article dans les lignes existe
    - Il y a au moins une ligne de commande

    Calcule automatiquement le montant_total.

    Args:
        db: Session de base de données
        commande: Schéma de création de commande
        current_user: Utilisateur créateur

    Returns:
        La commande créée avec ses lignes

    Raises:
        HTTPException 400: Si le numéro de commande existe déjà
        HTTPException 404: Si le fournisseur ou un article n'existe pas
        HTTPException 400: Si aucune ligne de commande
    """
    # Valider que le fournisseur existe
    fournisseur = get_fournisseur(db, commande.fournisseur_id)
    if not fournisseur:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Fournisseur {commande.fournisseur_id} non trouvé",
        )

    # Vérifier unicité du numéro de commande
    existing = (
        db.query(models.Commande)
        .filter(models.Commande.numero_commande == commande.numero_commande)
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Le numéro de commande '{commande.numero_commande}' existe déjà",
        )

    # Valider qu'il y a au moins une ligne
    if not commande.lignes or len(commande.lignes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une commande doit contenir au moins une ligne",
        )

    # Calculer le montant total
    montant_total = 0.0
    for ligne_data in commande.lignes:
        # Vérifier que l'article existe
        article = get_article(db, ligne_data.article_id)
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Article {ligne_data.article_id} non trouvé",
            )
        montant_total += ligne_data.quantite_commandee * ligne_data.prix_unitaire

    # Créer la commande (statut = BROUILLON par défaut)
    db_commande = models.Commande(
        fournisseur_id=commande.fournisseur_id,
        numero_commande=commande.numero_commande,
        statut="BROUILLON",
        date_reception_prevue=commande.date_reception_prevue,
        notes=commande.notes,
        montant_total=montant_total,
        created_by=current_user.id,
    )

    db.add(db_commande)
    db.flush()  # Pour obtenir l'ID de la commande

    # Créer les lignes de commande
    for ligne_data in commande.lignes:
        db_ligne = models.LigneCommande(
            commande_id=db_commande.id,
            article_id=ligne_data.article_id,
            quantite_commandee=ligne_data.quantite_commandee,
            quantite_recue=0,  # Pas encore reçue
            prix_unitaire=ligne_data.prix_unitaire,
        )
        db.add(db_ligne)

    db.commit()
    db.refresh(db_commande)

    return db_commande


def update_commande(
    db: Session,
    commande_id: int,
    commande_update: schemas.CommandeUpdate,
    current_user: models.User,
) -> models.Commande:
    """
    Met à jour une commande existante.

    Validations :
    - La commande existe
    - Si changement de statut, valider le workflow
    - Si statut = ENVOYEE ou RECUE, interdire modification des lignes
    - Si modification des lignes, recalculer montant_total

    Args:
        db: Session de base de données
        commande_id: ID de la commande à modifier
        commande_update: Nouvelles données
        current_user: Utilisateur qui modifie

    Returns:
        La commande mise à jour

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si modification interdite (statut RECUE ou ANNULEE)
    """
    db_commande = get_commande(db, commande_id)
    if not db_commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande {commande_id} non trouvée",
        )

    # Interdire modification si commande RECUE ou ANNULEE
    if db_commande.statut in ["RECUE", "ANNULEE"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de modifier une commande {db_commande.statut}",
        )

    # Mettre à jour les champs simples
    if commande_update.numero_commande is not None:
        # Vérifier unicité du nouveau numéro
        existing = (
            db.query(models.Commande)
            .filter(models.Commande.numero_commande == commande_update.numero_commande)
            .filter(models.Commande.id != commande_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Le numéro de commande '{commande_update.numero_commande}' existe déjà",
            )
        db_commande.numero_commande = commande_update.numero_commande

    if commande_update.fournisseur_id is not None:
        # Vérifier que le fournisseur existe
        fournisseur = get_fournisseur(db, commande_update.fournisseur_id)
        if not fournisseur:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Fournisseur {commande_update.fournisseur_id} non trouvé",
            )
        db_commande.fournisseur_id = commande_update.fournisseur_id

    if commande_update.date_reception_prevue is not None:
        db_commande.date_reception_prevue = commande_update.date_reception_prevue

    if commande_update.notes is not None:
        db_commande.notes = commande_update.notes

    # Gestion du changement de statut
    if commande_update.statut is not None:
        update_commande_statut(db, commande_id, commande_update.statut, current_user)

    # Si modification des lignes (seulement pour BROUILLON)
    if commande_update.lignes is not None:
        if db_commande.statut != "BROUILLON":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Les lignes ne peuvent être modifiées que pour les commandes BROUILLON",
            )

        # Supprimer toutes les anciennes lignes
        db.query(models.LigneCommande).filter(
            models.LigneCommande.commande_id == commande_id
        ).delete()

        # Créer les nouvelles lignes et recalculer montant_total
        montant_total = 0.0
        for ligne_data in commande_update.lignes:
            # Vérifier que l'article existe
            article = get_article(db, ligne_data.article_id)
            if not article:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Article {ligne_data.article_id} non trouvé",
                )

            db_ligne = models.LigneCommande(
                commande_id=commande_id,
                article_id=ligne_data.article_id,
                quantite_commandee=ligne_data.quantite_commandee,
                quantite_recue=0,
                prix_unitaire=ligne_data.prix_unitaire,
            )
            db.add(db_ligne)
            montant_total += ligne_data.quantite_commandee * ligne_data.prix_unitaire

        db_commande.montant_total = montant_total

    # Audit trail
    db_commande.updated_by = current_user.id

    db.commit()
    db.refresh(db_commande)

    return db_commande


def update_commande_statut(
    db: Session, commande_id: int, nouveau_statut: str, current_user: models.User
) -> models.Commande:
    """
    Change le statut d'une commande avec validation du workflow.

    Workflow autorisé :
    - BROUILLON → ENVOYEE (définit date_commande = now())
    - ENVOYEE → RECUE (appelle recevoir_commande())
    - BROUILLON → ANNULEE
    - ENVOYEE → ANNULEE

    Workflow interdit :
    - RECUE → * (commande finalisée)
    - ANNULEE → * (commande annulée)

    Args:
        db: Session de base de données
        commande_id: ID de la commande
        nouveau_statut: Nouveau statut (BROUILLON, ENVOYEE, RECUE, ANNULEE)
        current_user: Utilisateur qui change le statut

    Returns:
        La commande avec le nouveau statut

    Raises:
        HTTPException 400: Si le changement de statut est interdit
        HTTPException 404: Si la commande n'existe pas
    """
    from datetime import datetime

    db_commande = get_commande(db, commande_id)
    if not db_commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande {commande_id} non trouvée",
        )

    statut_actuel = db_commande.statut

    # Valider les transitions de statut autorisées
    transitions_autorisees = {
        "BROUILLON": ["ENVOYEE", "ANNULEE"],
        "ENVOYEE": ["RECUE", "ANNULEE"],
        "RECUE": [],  # Statut final
        "ANNULEE": [],  # Statut final
    }

    if nouveau_statut not in transitions_autorisees.get(statut_actuel, []):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transition {statut_actuel} → {nouveau_statut} non autorisée",
        )

    # Appliquer le changement de statut
    db_commande.statut = nouveau_statut

    # Actions spécifiques selon le nouveau statut
    if nouveau_statut == "ENVOYEE":
        db_commande.date_commande = datetime.now()

    elif nouveau_statut == "RECUE":
        # Appeler la fonction de réception qui met à jour les stocks
        recevoir_commande(db, commande_id)

    # Audit trail
    db_commande.updated_by = current_user.id

    db.commit()
    db.refresh(db_commande)

    return db_commande


def delete_commande(db: Session, commande_id: int) -> bool:
    """
    Supprime une commande.

    Validation : Seulement les commandes BROUILLON peuvent être supprimées.

    Args:
        db: Session de base de données
        commande_id: ID de la commande à supprimer

    Returns:
        True si suppression réussie

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si la commande n'est pas BROUILLON
    """
    db_commande = get_commande(db, commande_id)
    if not db_commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande {commande_id} non trouvée",
        )

    if db_commande.statut != "BROUILLON":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer une commande {db_commande.statut}. Seules les commandes BROUILLON peuvent être supprimées.",
        )

    db.delete(db_commande)
    db.commit()

    return True


def recevoir_commande(db: Session, commande_id: int) -> models.Commande:
    """
    Réceptionne une commande et met à jour automatiquement les stocks.

    Pour chaque ligne de commande :
    - Met à jour quantite_recue = quantite_commandee (réception complète)
    - Incrémente article.quantite de quantite_recue
    - Crée un mouvement ENTREE avec le motif "Réception commande N°..."

    Définit date_reception_reelle = now()

    Args:
        db: Session de base de données
        commande_id: ID de la commande à réceptionner

    Returns:
        La commande réceptionnée

    Raises:
        HTTPException 404: Si la commande n'existe pas
        HTTPException 400: Si la commande n'est pas ENVOYEE
    """
    from datetime import datetime

    db_commande = get_commande(db, commande_id)
    if not db_commande:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commande {commande_id} non trouvée",
        )

    if db_commande.statut != "ENVOYEE":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Seules les commandes ENVOYEE peuvent être réceptionnées (statut actuel : {db_commande.statut})",
        )

    # Réceptionner chaque ligne et mettre à jour le stock
    for ligne in db_commande.lignes:
        # Mettre à jour quantite_recue
        ligne.quantite_recue = ligne.quantite_commandee

        # Récupérer l'article
        article = get_article(db, ligne.article_id)
        if not article:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Article {ligne.article_id} non trouvé",
            )

        # Sauvegarder quantité avant mise à jour
        quantite_avant = article.quantite

        # Mettre à jour le stock
        article.quantite += ligne.quantite_recue

        # Créer un mouvement ENTREE
        db_mouvement = models.Mouvement(
            article_id=ligne.article_id,
            type="ENTREE",
            quantite=ligne.quantite_recue,
            quantite_avant=quantite_avant,
            quantite_apres=article.quantite,
            motif=f"Réception commande N°{db_commande.numero_commande}",
        )
        db.add(db_mouvement)

    # Mettre à jour la commande
    db_commande.date_reception_reelle = datetime.now()

    db.commit()
    db.refresh(db_commande)

    return db_commande
