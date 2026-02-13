"""
Opérations CRUD (Create, Read, Update, Delete) pour la base de données.

Ce module contient toutes les fonctions d'accès aux données pour les catégories,
articles et mouvements.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func
from sqlalchemy.exc import IntegrityError
from typing import Optional, List
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
    return db.query(models.Categorie).filter(models.Categorie.id == categorie_id).first()


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


def get_categories(db: Session, skip: int = 0, limit: int = 100) -> List[models.Categorie]:
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


def create_categorie(db: Session, categorie: schemas.CategorieCreate) -> models.Categorie:
    """
    Crée une nouvelle catégorie.

    Valide :
    - Pas de nom en double pour les catégories de même niveau (même parent)
    - Contraintes hiérarchiques (max 2 niveaux, pas de boucles)

    Args:
        db: Session de base de données
        categorie: Données de la catégorie à créer

    Returns:
        Catégorie créée

    Raises:
        HTTPException: Si une catégorie avec ce nom existe déjà pour ce parent
        HTTPException: Si les contraintes hiérarchiques ne sont pas respectées
    """
    # Validation hiérarchique
    validate_hierarchy(db, None, categorie.parent_id)

    # Vérifier unicité du nom pour le même parent
    existing = db.query(models.Categorie)\
        .filter(models.Categorie.nom == categorie.nom)\
        .filter(models.Categorie.parent_id == categorie.parent_id)\
        .first()

    if existing:
        parent_name = "racine" if categorie.parent_id is None else f"parent ID {categorie.parent_id}"
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Une catégorie '{categorie.nom}' existe déjà pour {parent_name}"
        )

    # Créer la catégorie
    db_categorie = models.Categorie(**categorie.model_dump())
    db.add(db_categorie)
    db.commit()
    db.refresh(db_categorie)
    return db_categorie


def update_categorie(
    db: Session,
    categorie_id: int,
    categorie_update: schemas.CategorieUpdate
) -> models.Categorie:
    """
    Met à jour une catégorie existante.

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie à mettre à jour
        categorie_update: Nouvelles données

    Returns:
        Catégorie mise à jour

    Raises:
        HTTPException: Si la catégorie n'existe pas
    """
    db_categorie = get_categorie(db, categorie_id)
    if not db_categorie:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {categorie_id} non trouvée"
        )

    # Si le parent_id est modifié, valider la hiérarchie
    update_data = categorie_update.model_dump(exclude_unset=True)
    if 'parent_id' in update_data and update_data['parent_id'] != db_categorie.parent_id:
        validate_hierarchy(db, categorie_id, update_data['parent_id'])

    # Mettre à jour les champs modifiés
    for field, value in update_data.items():
        setattr(db_categorie, field, value)

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
            detail=f"Catégorie {categorie_id} non trouvée"
        )

    # VALIDATION : Bloquer suppression si enfants
    if has_children(db, categorie_id):
        children_count = len(db_categorie.children)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de supprimer '{db_categorie.nom}' car elle contient {children_count} sous-catégorie(s). Supprimez d'abord les sous-catégories."
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

    categories_racines = db.query(models.Categorie)\
        .filter(models.Categorie.parent_id == None)\
        .options(joinedload(models.Categorie.children))\
        .all()

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
    return db.query(models.Categorie).filter(models.Categorie.parent_id == parent_id).all()


def has_children(db: Session, categorie_id: int) -> bool:
    """
    Vérifie si une catégorie a des sous-catégories.

    Args:
        db: Session de base de données
        categorie_id: ID de la catégorie à vérifier

    Returns:
        True si la catégorie a au moins une sous-catégorie
    """
    count = db.query(models.Categorie).filter(models.Categorie.parent_id == categorie_id).count()
    return count > 0


def validate_hierarchy(db: Session, categorie_id: Optional[int], parent_id: Optional[int]) -> None:
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
            detail=f"Catégorie parente avec ID {parent_id} introuvable"
        )

    # VALIDATION 1 : Limiter à 2 niveaux
    # Si le parent a déjà un parent, on essaie de créer un 3e niveau → INTERDIT
    if parent.parent_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Impossible de créer une sous-catégorie de '{parent.nom}' car elle est déjà une sous-catégorie. Maximum 2 niveaux autorisés."
        )

    # VALIDATION 2 : Empêcher boucles circulaires (si modification)
    # Une catégorie ne peut pas devenir parente d'elle-même
    if categorie_id is not None and parent_id == categorie_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Une catégorie ne peut pas être son propre parent"
        )


# ============================================================================
# CRUD ARTICLES
# ============================================================================

def get_article(db: Session, article_id: int) -> Optional[models.Article]:
    """
    Récupère un article par son ID avec sa catégorie et ses tags.

    Args:
        db: Session de base de données
        article_id: ID de l'article

    Returns:
        Article trouvé ou None
    """
    return db.query(models.Article)\
        .options(joinedload(models.Article.categorie))\
        .options(joinedload(models.Article.tags))\
        .filter(models.Article.id == article_id)\
        .first()


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
    stock_bas: bool = False,
    sort_by: Optional[str] = None,
    order: str = "asc"
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
        stock_bas: Si True, retourne uniquement les articles en stock bas
        sort_by: Colonne pour le tri (id, nom, sku, quantite, prix_unitaire, categorie)
        order: Ordre de tri (asc ou desc)

    Returns:
        Tuple (liste des articles, nombre total)
    """
    query = db.query(models.Article)\
        .options(joinedload(models.Article.categorie))\
        .options(joinedload(models.Article.tags))

    # Filtre de recherche
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            or_(
                models.Article.nom.ilike(search_pattern),
                models.Article.description.ilike(search_pattern),
                models.Article.sku.ilike(search_pattern)
            )
        )

    # Filtre par catégorie
    if categorie_id:
        query = query.filter(models.Article.categorie_id == categorie_id)

    # Filtre par tag
    if tag_id:
        query = query.join(models.Article.tags).filter(models.Tag.id == tag_id)

    # Filtre stock bas
    if stock_bas:
        query = query.filter(models.Article.quantite < models.Article.quantite_min)

    # Appliquer le tri
    if sort_by:
        # Mapping des colonnes autorisées pour le tri
        sort_columns = {
            'id': models.Article.id,
            'nom': models.Article.nom,
            'sku': models.Article.sku,
            'quantite': models.Article.quantite,
            'prix_unitaire': models.Article.prix_unitaire,
            'valeur': models.Article.quantite * models.Article.prix_unitaire,
            'categorie': models.Categorie.nom
        }

        if sort_by in sort_columns:
            # Joindre la table catégorie si on trie par catégorie
            if sort_by == 'categorie':
                query = query.join(models.Categorie, models.Article.categorie_id == models.Categorie.id, isouter=True)

            # Appliquer l'ordre de tri
            sort_column = sort_columns[sort_by]
            if order.lower() == 'desc':
                query = query.order_by(sort_column.desc())
            else:
                query = query.order_by(sort_column.asc())

    # Compter le total avant pagination
    total = query.count()

    # Appliquer la pagination
    articles = query.offset(skip).limit(limit).all()

    return articles, total


def create_article(db: Session, article: schemas.ArticleCreate) -> models.Article:
    """
    Crée un nouvel article.

    Args:
        db: Session de base de données
        article: Données de l'article à créer

    Returns:
        Article créé

    Raises:
        HTTPException: Si le SKU existe déjà ou la catégorie n'existe pas
    """
    # Vérifier que le SKU n'existe pas déjà (si fourni)
    if article.sku and get_article_by_sku(db, article.sku):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un article avec le SKU '{article.sku}' existe déjà"
        )

    # Vérifier que la catégorie existe (si fournie)
    if article.categorie_id and not get_categorie(db, article.categorie_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {article.categorie_id} non trouvée"
        )

    # Extraire les tag_ids avant de créer l'article
    article_data = article.model_dump()
    tag_ids = article_data.pop('tag_ids', [])

    # Créer l'article sans les tag_ids
    db_article = models.Article(**article_data)
    db.add(db_article)

    # Associer les tags si fournis
    if tag_ids:
        for tag_id in tag_ids:
            tag = get_tag(db, tag_id)
            if tag:
                db_article.tags.append(tag)

    db.commit()
    db.refresh(db_article)
    return db_article


def update_article(
    db: Session,
    article_id: int,
    article_update: schemas.ArticleUpdate
) -> models.Article:
    """
    Met à jour un article existant.

    Args:
        db: Session de base de données
        article_id: ID de l'article à mettre à jour
        article_update: Nouvelles données

    Returns:
        Article mis à jour

    Raises:
        HTTPException: Si l'article n'existe pas
    """
    db_article = get_article(db, article_id)
    if not db_article:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Article {article_id} non trouvé"
        )

    # Vérifier que le nouveau SKU n'est pas déjà pris
    if article_update.sku:
        existing = get_article_by_sku(db, article_update.sku)
        if existing and existing.id != article_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un article avec le SKU '{article_update.sku}' existe déjà"
            )

    # Vérifier que la catégorie existe (si modifiée)
    if article_update.categorie_id and not get_categorie(db, article_update.categorie_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Catégorie {article_update.categorie_id} non trouvée"
        )

    # Mettre à jour les champs modifiés
    update_data = article_update.model_dump(exclude_unset=True)

    # Extraire les tag_ids s'ils sont présents
    tag_ids = update_data.pop('tag_ids', None)

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
            detail=f"Article {article_id} non trouvé"
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
    return db.query(models.Mouvement)\
        .options(joinedload(models.Mouvement.article).joinedload(models.Article.categorie))\
        .filter(models.Mouvement.id == mouvement_id)\
        .first()


def get_mouvements(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    article_id: Optional[int] = None,
    type_mouvement: Optional[str] = None
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
    query = db.query(models.Mouvement)\
        .options(joinedload(models.Mouvement.article).joinedload(models.Article.categorie))\
        .order_by(models.Mouvement.created_at.desc())

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


def create_mouvement(db: Session, mouvement: schemas.MouvementCreate) -> models.Mouvement:
    """
    Crée un nouveau mouvement et met à jour le stock de l'article.

    Cette fonction est TRANSACTIONNELLE : soit tout réussit, soit tout échoue.

    Args:
        db: Session de base de données
        mouvement: Données du mouvement à créer

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
            detail=f"Article {mouvement.article_id} non trouvé"
        )

    # Calculer la nouvelle quantité
    quantite_avant = article.quantite

    if mouvement.type == 'ENTREE':
        quantite_apres = quantite_avant + mouvement.quantite
    else:  # SORTIE
        if quantite_avant < mouvement.quantite:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Stock insuffisant. Stock actuel: {quantite_avant}, "
                       f"quantité demandée: {mouvement.quantite}"
            )
        quantite_apres = quantite_avant - mouvement.quantite

    # Créer le mouvement
    db_mouvement = models.Mouvement(
        article_id=mouvement.article_id,
        type=mouvement.type,
        quantite=mouvement.quantite,
        quantite_avant=quantite_avant,
        quantite_apres=quantite_apres,
        motif=mouvement.motif
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
            detail="Données invalides pour le mouvement"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Erreur inattendue lors de la création du mouvement: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erreur serveur lors de la création du mouvement"
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
    return db.query(models.Article)\
        .options(joinedload(models.Article.categorie))\
        .options(joinedload(models.Article.tags))\
        .filter(models.Article.quantite < models.Article.quantite_min)\
        .all()


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
        func.count(models.Article.id).label('nombre_articles'),
        func.sum(models.Article.quantite * models.Article.prix_unitaire).label('valeur_totale')
    ).first()

    nombre_articles = totaux[0] if totaux else 0
    valeur_totale = float(totaux[1]) if totaux and totaux[1] else 0.0

    # Détails par catégorie - Une seule requête avec JOIN et GROUP BY
    # Utilise COALESCE pour gérer les articles sans catégorie
    resultats = db.query(
        func.coalesce(models.Categorie.nom, 'Sans catégorie').label('categorie'),
        func.count(models.Article.id).label('nombre_articles'),
        func.sum(models.Article.quantite * models.Article.prix_unitaire).label('valeur')
    )\
    .outerjoin(models.Categorie, models.Article.categorie_id == models.Categorie.id)\
    .group_by(models.Categorie.nom)\
    .all()

    details_par_categorie = [
        {
            "categorie": resultat.categorie,
            "nombre_articles": resultat.nombre_articles,
            "valeur": float(resultat.valeur) if resultat.valeur else 0.0
        }
        for resultat in resultats
    ]

    return {
        "valeur_totale": valeur_totale,
        "nombre_articles": nombre_articles,
        "details_par_categorie": details_par_categorie
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
    nombre_stock_bas = db.query(models.Article)\
        .filter(models.Article.quantite < models.Article.quantite_min)\
        .count()

    return {
        "nombre_articles": nombre_articles,
        "nombre_categories": nombre_categories,
        "valeur_totale_stock": valeur_info["valeur_totale"],
        "nombre_articles_stock_bas": nombre_stock_bas
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


def create_tag(db: Session, tag: schemas.TagCreate) -> models.Tag:
    """
    Crée un nouveau tag.

    Args:
        db: Session de base de données
        tag: Données du tag

    Returns:
        Tag créé

    Raises:
        HTTPException: Si un tag avec ce nom existe déjà
    """
    if get_tag_by_nom(db, tag.nom):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Un tag avec le nom '{tag.nom}' existe déjà"
        )

    db_tag = models.Tag(**tag.model_dump())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag


def update_tag(db: Session, tag_id: int, tag_update: schemas.TagUpdate) -> models.Tag:
    """
    Met à jour un tag.

    Args:
        db: Session de base de données
        tag_id: ID du tag
        tag_update: Nouvelles données

    Returns:
        Tag mis à jour

    Raises:
        HTTPException: Si le tag n'existe pas
    """
    db_tag = get_tag(db, tag_id)
    if not db_tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} non trouvé"
        )

    # Vérifier unicité du nom si modifié
    if tag_update.nom:
        existing = get_tag_by_nom(db, tag_update.nom)
        if existing and existing.id != tag_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Un tag avec le nom '{tag_update.nom}' existe déjà"
            )

    update_data = tag_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tag, field, value)

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
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} non trouvé"
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
            detail=f"Article {article_id} non trouvé"
        )

    tag = get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} non trouvé"
        )

    # Vérifier si le tag n'est pas déjà associé
    if tag not in article.tags:
        article.tags.append(tag)
        db.commit()
        db.refresh(article)

    return article


def remove_tag_from_article(db: Session, article_id: int, tag_id: int) -> models.Article:
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
            detail=f"Article {article_id} non trouvé"
        )

    tag = get_tag(db, tag_id)
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tag {tag_id} non trouvé"
        )

    if tag in article.tags:
        article.tags.remove(tag)
        db.commit()
        db.refresh(article)

    return article


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


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    """
    Crée un nouvel utilisateur avec un mot de passe haché.

    Args:
        db: Session de base de données
        user: Schéma de création d'utilisateur

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
            detail="Ce nom d'utilisateur existe déjà"
        )

    # Vérifier unicité de l'email
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cet email existe déjà"
        )

    # Hasher le mot de passe
    hashed_password = get_password_hash(user.password)

    # Créer l'utilisateur
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        is_active=True
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
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
