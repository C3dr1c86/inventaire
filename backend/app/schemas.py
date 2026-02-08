"""
Schémas Pydantic pour la validation des données.

Ces schémas définissent la structure des données échangées avec l'API
et assurent la validation automatique des entrées/sorties.
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, Literal, List
from datetime import datetime
from decimal import Decimal


# ============================================================================
# SCHÉMAS CATÉGORIE
# ============================================================================

class CategorieBase(BaseModel):
    """Schéma de base pour une catégorie."""
    nom: str = Field(..., min_length=1, max_length=100, description="Nom de la catégorie")
    description: Optional[str] = Field(None, description="Description de la catégorie")
    parent_id: Optional[int] = Field(None, description="ID de la catégorie parente (NULL = catégorie racine)")


class CategorieCreate(CategorieBase):
    """Schéma pour créer une nouvelle catégorie."""
    pass


class CategorieUpdate(BaseModel):
    """Schéma pour mettre à jour une catégorie."""
    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None


class CategorieResponse(CategorieBase):
    """Schéma de réponse pour une catégorie."""
    id: int
    niveau: int
    nom_complet: str
    created_at: datetime
    updated_at: datetime
    children: List['CategorieResponse'] = []  # Liste des sous-catégories

    class Config:
        from_attributes = True  # Permet de créer depuis un modèle SQLAlchemy


# Nécessaire pour la récursion (référence forward)
CategorieResponse.model_rebuild()


# ============================================================================
# SCHÉMAS ARTICLE
# ============================================================================

class ArticleBase(BaseModel):
    """Schéma de base pour un article."""
    nom: str = Field(..., min_length=1, max_length=200, description="Nom de l'article")
    quantite: int = Field(default=0, ge=0, description="Quantité en stock")
    quantite_min: int = Field(default=10, ge=0, description="Seuil minimum de stock")
    prix_unitaire: float = Field(..., ge=0, description="Prix unitaire de l'article")
    categorie_id: Optional[int] = Field(None, description="ID de la catégorie")
    description: Optional[str] = Field(None, description="Description de l'article")
    sku: Optional[str] = Field(None, max_length=50, description="Code article unique (SKU)")

    @validator('prix_unitaire')
    def validate_prix(cls, v):
        """Valide que le prix a maximum 2 décimales."""
        if round(v, 2) != v:
            raise ValueError('Le prix ne peut avoir que 2 décimales maximum')
        return v


class ArticleCreate(ArticleBase):
    """Schéma pour créer un nouvel article."""
    tag_ids: list[int] = Field(default=[], description="IDs des tags associés")


class ArticleUpdate(BaseModel):
    """Schéma pour mettre à jour un article."""
    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    quantite: Optional[int] = Field(None, ge=0)
    quantite_min: Optional[int] = Field(None, ge=0)
    prix_unitaire: Optional[float] = Field(None, ge=0)
    categorie_id: Optional[int] = None
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=50)
    tag_ids: Optional[list[int]] = Field(None, description="IDs des tags associés")

    @validator('prix_unitaire')
    def validate_prix(cls, v):
        """Valide que le prix a maximum 2 décimales."""
        if v is not None and round(v, 2) != v:
            raise ValueError('Le prix ne peut avoir que 2 décimales maximum')
        return v


class ArticleResponse(ArticleBase):
    """Schéma de réponse pour un article."""
    id: int
    created_at: datetime
    updated_at: datetime
    categorie: Optional[CategorieResponse] = None
    tags: list["TagResponse"] = Field(default=[], description="Tags associés à l'article")
    valeur_stock: float = Field(description="Valeur totale du stock (quantité × prix)")
    est_stock_bas: bool = Field(description="Indique si le stock est en dessous du seuil")

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS MOUVEMENT
# ============================================================================

class MouvementBase(BaseModel):
    """Schéma de base pour un mouvement de stock."""
    article_id: int = Field(..., description="ID de l'article concerné")
    type: Literal['ENTREE', 'SORTIE'] = Field(..., description="Type de mouvement")
    quantite: int = Field(..., gt=0, description="Quantité du mouvement")
    motif: Optional[str] = Field(None, description="Raison du mouvement")


class MouvementCreate(MouvementBase):
    """Schéma pour créer un nouveau mouvement."""
    pass


class MouvementResponse(MouvementBase):
    """Schéma de réponse pour un mouvement."""
    id: int
    quantite_avant: int = Field(description="Quantité avant le mouvement")
    quantite_apres: int = Field(description="Quantité après le mouvement")
    created_at: datetime
    created_by: Optional[str] = None

    class Config:
        from_attributes = True


class MouvementWithArticle(MouvementResponse):
    """Schéma de réponse pour un mouvement avec les détails de l'article."""
    article: Optional[ArticleResponse] = None

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS TAG
# ============================================================================

class TagBase(BaseModel):
    """Schéma de base pour un tag."""
    nom: str = Field(..., min_length=1, max_length=50, description="Nom du tag")
    couleur: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$", description="Couleur hex du tag")
    description: Optional[str] = Field(None, description="Description du tag")


class TagCreate(TagBase):
    """Schéma pour créer un nouveau tag."""
    pass


class TagUpdate(BaseModel):
    """Schéma pour mettre à jour un tag."""
    nom: Optional[str] = Field(None, min_length=1, max_length=50)
    couleur: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    description: Optional[str] = None


class TagResponse(TagBase):
    """Schéma de réponse pour un tag."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS POUR LES LISTES PAGINÉES
# ============================================================================

class PaginatedArticles(BaseModel):
    """Schéma pour une liste paginée d'articles."""
    items: list[ArticleResponse]
    total: int = Field(description="Nombre total d'articles")
    skip: int = Field(description="Nombre d'éléments sautés")
    limit: int = Field(description="Nombre d'éléments par page")


class PaginatedMouvements(BaseModel):
    """Schéma pour une liste paginée de mouvements."""
    items: list[MouvementWithArticle]
    total: int = Field(description="Nombre total de mouvements")
    skip: int = Field(description="Nombre d'éléments sautés")
    limit: int = Field(description="Nombre d'éléments par page")


# ============================================================================
# SCHÉMAS POUR LES RAPPORTS
# ============================================================================

class StatistiquesResponse(BaseModel):
    """Schéma pour les statistiques globales."""
    nombre_articles: int = Field(description="Nombre total d'articles")
    nombre_categories: int = Field(description="Nombre total de catégories")
    valeur_totale_stock: float = Field(description="Valeur totale du stock")
    nombre_articles_stock_bas: int = Field(description="Nombre d'articles en stock bas")


class RapportStockBas(BaseModel):
    """Schéma pour le rapport de stock bas."""
    articles: list[ArticleResponse]
    total: int = Field(description="Nombre d'articles en stock bas")


class RapportValeurTotale(BaseModel):
    """Schéma pour le rapport de valeur totale."""
    valeur_totale: float = Field(description="Valeur totale du stock")
    nombre_articles: int = Field(description="Nombre d'articles comptabilisés")
    details_par_categorie: list[dict] = Field(description="Détails par catégorie")


# ============================================================================
# SCHÉMAS POUR LES MESSAGES
# ============================================================================

class MessageResponse(BaseModel):
    """Schéma pour les messages de réponse simples."""
    message: str
    success: bool = True


class ErrorResponse(BaseModel):
    """Schéma pour les messages d'erreur."""
    detail: str
    error_code: Optional[str] = None


# ============================================================================
# SCHÉMAS UTILISATEUR ET AUTHENTIFICATION
# ============================================================================

class UserBase(BaseModel):
    """Schéma de base pour un utilisateur."""
    username: str = Field(..., min_length=3, max_length=50, description="Nom d'utilisateur")
    email: EmailStr = Field(..., description="Adresse email")


class UserCreate(UserBase):
    """Schéma pour créer un nouvel utilisateur."""
    password: str = Field(..., min_length=8, max_length=100, description="Mot de passe (8 caractères minimum)")


class UserResponse(UserBase):
    """Schéma de réponse pour un utilisateur."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schéma pour le token JWT."""
    access_token: str = Field(..., description="Token JWT d'accès")
    token_type: str = Field(default="bearer", description="Type de token")


class TokenData(BaseModel):
    """Schéma pour les données extraites du token."""
    username: Optional[str] = None
