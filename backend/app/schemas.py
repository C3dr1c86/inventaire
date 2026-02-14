"""
Schémas Pydantic pour la validation des données.

Ces schémas définissent la structure des données échangées avec l'API
et assurent la validation automatique des entrées/sorties.
"""

from pydantic import BaseModel, Field, validator, EmailStr
from typing import Optional, Literal, List
from datetime import datetime, date
from app.models import RoleEnum

# ============================================================================
# SCHÉMAS CATÉGORIE
# ============================================================================


class CategorieBase(BaseModel):
    """Schéma de base pour une catégorie."""

    nom: str = Field(
        ..., min_length=1, max_length=100, description="Nom de la catégorie"
    )
    description: Optional[str] = Field(None, description="Description de la catégorie")
    parent_id: Optional[int] = Field(
        None, description="ID de la catégorie parente (NULL = catégorie racine)"
    )


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
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    children: List["CategorieResponse"] = []  # Liste des sous-catégories

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
    emplacement_id: Optional[int] = Field(
        None, description="ID de l'emplacement physique"
    )
    description: Optional[str] = Field(None, description="Description de l'article")
    sku: Optional[str] = Field(
        None, max_length=50, description="Code article unique (SKU)"
    )
    prix_fournisseur: Optional[float] = Field(
        None, ge=0, description="Prix d'achat fournisseur"
    )
    ref_fournisseur: Optional[str] = Field(
        None, max_length=50, description="Référence catalogue fournisseur"
    )
    delai_livraison: Optional[int] = Field(
        None, ge=0, description="Délai de livraison en jours"
    )

    @validator("prix_unitaire")
    def validate_prix(cls, v):
        """Valide que le prix a maximum 2 décimales."""
        if round(v, 2) != v:
            raise ValueError("Le prix ne peut avoir que 2 décimales maximum")
        return v


class ArticleCreate(ArticleBase):
    """Schéma pour créer un nouvel article."""

    tag_ids: list[int] = Field(default=[], description="IDs des tags associés")
    fournisseur_ids: list[int] = Field(
        default=[], description="IDs des fournisseurs associés"
    )


class ArticleUpdate(BaseModel):
    """Schéma pour mettre à jour un article."""

    nom: Optional[str] = Field(None, min_length=1, max_length=200)
    quantite: Optional[int] = Field(None, ge=0)
    quantite_min: Optional[int] = Field(None, ge=0)
    prix_unitaire: Optional[float] = Field(None, ge=0)
    categorie_id: Optional[int] = None
    emplacement_id: Optional[int] = None
    description: Optional[str] = None
    sku: Optional[str] = Field(None, max_length=50)
    tag_ids: Optional[list[int]] = Field(None, description="IDs des tags associés")
    fournisseur_ids: Optional[list[int]] = Field(
        None, description="IDs des fournisseurs associés"
    )
    prix_fournisseur: Optional[float] = Field(None, ge=0)
    ref_fournisseur: Optional[str] = Field(None, max_length=50)
    delai_livraison: Optional[int] = Field(None, ge=0)

    @validator("prix_unitaire")
    def validate_prix(cls, v):
        """Valide que le prix a maximum 2 décimales."""
        if v is not None and round(v, 2) != v:
            raise ValueError("Le prix ne peut avoir que 2 décimales maximum")
        return v


class ArticleResponse(ArticleBase):
    """Schéma de réponse pour un article."""

    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None
    categorie: Optional[CategorieResponse] = None
    emplacement: Optional["EmplacementResponse"] = None
    tags: list["TagResponse"] = Field(
        default=[], description="Tags associés à l'article"
    )
    photos: list["PhotoResponse"] = Field(default=[], description="Photos de l'article")
    fournisseurs: list["FournisseurResponse"] = Field(
        default=[], description="Fournisseurs associés"
    )
    valeur_stock: float = Field(description="Valeur totale du stock (quantité × prix)")
    est_stock_bas: bool = Field(
        description="Indique si le stock est en dessous du seuil"
    )

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS MOUVEMENT
# ============================================================================


class MouvementBase(BaseModel):
    """Schéma de base pour un mouvement de stock."""

    article_id: int = Field(..., description="ID de l'article concerné")
    type: Literal["ENTREE", "SORTIE"] = Field(..., description="Type de mouvement")
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
    created_by: Optional[int] = None

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
    couleur: Optional[str] = Field(
        None, pattern="^#[0-9A-Fa-f]{6}$", description="Couleur hex du tag"
    )
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
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS PHOTO
# ============================================================================


class PhotoBase(BaseModel):
    """Schéma de base pour une photo."""

    article_id: int = Field(..., description="ID de l'article")
    filename: str = Field(..., max_length=255, description="Nom du fichier")
    mime_type: str = Field(
        ..., max_length=50, description="Type MIME (image/jpeg, image/png, image/webp)"
    )


class PhotoResponse(PhotoBase):
    """Schéma de réponse pour une photo."""

    id: int
    filepath: str = Field(description="Chemin relatif du fichier")
    thumbnail_path: Optional[str] = Field(None, description="Chemin de la miniature")
    file_size: int = Field(description="Taille du fichier en octets")
    created_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS EMPLACEMENT
# ============================================================================


class EmplacementBase(BaseModel):
    """Schéma de base pour un emplacement physique."""

    code: str = Field(
        ..., min_length=1, max_length=50, description="Code unique de l'emplacement"
    )
    description: Optional[str] = Field(None, description="Description de l'emplacement")
    capacite_max: Optional[int] = Field(
        None, ge=1, description="Capacité maximale (NULL = illimité)"
    )
    parent_id: Optional[int] = Field(None, description="ID de l'emplacement parent")


class EmplacementCreate(EmplacementBase):
    """Schéma pour créer un emplacement."""

    pass


class EmplacementUpdate(BaseModel):
    """Schéma pour mettre à jour un emplacement."""

    code: Optional[str] = Field(
        None, min_length=1, max_length=50, description="Code unique de l'emplacement"
    )
    description: Optional[str] = Field(None, description="Description de l'emplacement")
    capacite_max: Optional[int] = Field(
        None, ge=1, description="Capacité maximale (NULL = illimité)"
    )
    parent_id: Optional[int] = Field(None, description="ID de l'emplacement parent")


class EmplacementResponse(EmplacementBase):
    """Schéma de réponse pour un emplacement (avec propriétés calculées)."""

    id: int
    niveau: int = Field(description="Niveau hiérarchique (0=Zone, 1=Étagère, 2=Boîte)")
    code_complet: str = Field(description="Code hiérarchique complet")
    quantite_utilisee: int = Field(
        description="Quantité d'articles dans cet emplacement"
    )
    pourcentage_remplissage: float = Field(
        description="Pourcentage de remplissage (0-100)"
    )
    children: list["EmplacementResponse"] = Field(
        default=[], description="Sous-emplacements"
    )
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS FOURNISSEUR
# ============================================================================


class FournisseurBase(BaseModel):
    """Schéma de base pour un fournisseur."""

    nom: str = Field(
        ..., min_length=1, max_length=100, description="Nom du fournisseur"
    )
    contact: Optional[str] = Field(None, max_length=100, description="Nom du contact")
    email: Optional[EmailStr] = Field(None, description="Adresse email")
    telephone: Optional[str] = Field(
        None, max_length=20, description="Numéro de téléphone"
    )
    adresse: Optional[str] = Field(None, max_length=500, description="Adresse physique")
    site_web: Optional[str] = Field(None, max_length=255, description="URL du site web")
    description: Optional[str] = Field(None, description="Description du fournisseur")

    @validator("site_web")
    def validate_url(cls, v):
        """Valide que l'URL est bien formée."""
        if v and v.strip():
            import re

            url_pattern = re.compile(
                r"^https?://"  # http:// ou https://
                r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"  # domaine
                r"localhost|"  # localhost
                r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"  # ou IP
                r"(?::\d+)?"  # port optionnel
                r"(?:/?|[/?]\S+)$",
                re.IGNORECASE,
            )
            if not url_pattern.match(v):
                raise ValueError("URL invalide (format: http://exemple.com)")
        return v


class FournisseurCreate(FournisseurBase):
    """Schéma pour créer un nouveau fournisseur."""

    pass


class FournisseurUpdate(BaseModel):
    """Schéma pour mettre à jour un fournisseur."""

    nom: Optional[str] = Field(None, min_length=1, max_length=100)
    contact: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(None, max_length=20)
    adresse: Optional[str] = Field(None, max_length=500)
    site_web: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None

    @validator("site_web")
    def validate_url(cls, v):
        """Valide que l'URL est bien formée."""
        if v and v.strip():
            import re

            url_pattern = re.compile(
                r"^https?://"
                r"(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|"
                r"localhost|"
                r"\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})"
                r"(?::\d+)?"
                r"(?:/?|[/?]\S+)$",
                re.IGNORECASE,
            )
            if not url_pattern.match(v):
                raise ValueError("URL invalide (format: http://exemple.com)")
        return v


class FournisseurResponse(FournisseurBase):
    """Schéma de réponse pour un fournisseur."""

    id: int
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

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

    username: str = Field(
        ..., min_length=3, max_length=50, description="Nom d'utilisateur"
    )
    email: EmailStr = Field(..., description="Adresse email")


class UserCreate(UserBase):
    """Schéma pour créer un nouvel utilisateur."""

    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Mot de passe (8 caractères minimum)",
    )


class UserResponse(UserBase):
    """Schéma de réponse pour un utilisateur."""

    id: int
    is_active: bool
    role: RoleEnum = Field(..., description="Rôle de l'utilisateur")
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


class UserMeResponse(UserResponse):
    """Schéma de réponse pour l'endpoint /me avec permissions calculées."""

    permissions: List[str] = Field(
        default=[], description="Liste des permissions (format resource:action)"
    )


class UserCreateAdmin(UserBase):
    """Schéma pour créer un utilisateur avec rôle (admin only)."""

    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Mot de passe (8 caractères minimum)",
    )
    role: RoleEnum = Field(
        default=RoleEnum.CONSULTATION, description="Rôle de l'utilisateur"
    )


class RoleUpdate(BaseModel):
    """Schéma pour changer le rôle d'un utilisateur."""

    role: RoleEnum = Field(..., description="Nouveau rôle")


class PermissionsUpdate(BaseModel):
    """Schéma pour modifier les permissions custom d'un utilisateur."""

    permissions: Optional[List[str]] = Field(
        default=None,
        description="Liste de permissions au format resource:action (None = reset aux permissions par défaut du rôle)",
    )


class Token(BaseModel):
    """Schéma pour le token JWT."""

    access_token: str = Field(..., description="Token JWT d'accès")
    token_type: str = Field(default="bearer", description="Type de token")


class TokenData(BaseModel):
    """Schéma pour les données extraites du token JWT enrichi."""

    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None


# ============================================================================
# SCHÉMAS LIGNE COMMANDE
# ============================================================================


class LigneCommandeBase(BaseModel):
    """Schéma de base pour une ligne de commande."""

    article_id: int = Field(..., description="ID de l'article commandé")
    quantite_commandee: int = Field(..., gt=0, description="Quantité commandée")
    prix_unitaire: float = Field(
        ..., ge=0, description="Prix unitaire au moment de la commande"
    )


class LigneCommandeCreate(LigneCommandeBase):
    """Schéma pour créer une ligne de commande."""

    pass


class LigneCommandeUpdate(BaseModel):
    """Schéma pour mettre à jour une ligne de commande."""

    quantite_commandee: Optional[int] = Field(
        None, gt=0, description="Quantité commandée"
    )
    quantite_recue: Optional[int] = Field(
        None, ge=0, description="Quantité réellement reçue"
    )
    prix_unitaire: Optional[float] = Field(None, ge=0, description="Prix unitaire")


class LigneCommandeResponse(LigneCommandeBase):
    """Schéma de réponse pour une ligne de commande."""

    id: int
    commande_id: int
    quantite_recue: int = Field(description="Quantité réellement reçue")
    montant_ligne: float = Field(
        description="Montant total de la ligne (quantite × prix)"
    )
    article: ArticleResponse = Field(description="Article commandé")
    created_at: datetime
    created_by: Optional[int] = None

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS COMMANDE
# ============================================================================


class CommandeBase(BaseModel):
    """Schéma de base pour une commande fournisseur."""

    fournisseur_id: int = Field(..., description="ID du fournisseur")
    numero_commande: str = Field(
        ..., min_length=1, max_length=50, description="Numéro unique de commande"
    )
    date_reception_prevue: Optional[date] = Field(
        None, description="Date de réception prévue"
    )
    notes: Optional[str] = Field(None, description="Notes sur la commande")


class CommandeCreate(CommandeBase):
    """Schéma pour créer une nouvelle commande."""

    lignes: list[LigneCommandeCreate] = Field(
        ..., min_length=1, description="Lignes de la commande (minimum 1)"
    )


class CommandeUpdate(BaseModel):
    """Schéma pour mettre à jour une commande."""

    fournisseur_id: Optional[int] = None
    numero_commande: Optional[str] = Field(None, min_length=1, max_length=50)
    statut: Optional[str] = Field(None, pattern="^(BROUILLON|ENVOYEE|RECUE|ANNULEE)$")
    date_reception_prevue: Optional[date] = None
    notes: Optional[str] = None
    lignes: Optional[list[LigneCommandeCreate]] = Field(
        None, description="Lignes de la commande (si modification)"
    )


class CommandeResponse(CommandeBase):
    """Schéma de réponse pour une commande."""

    id: int
    statut: str = Field(description="Statut (BROUILLON, ENVOYEE, RECUE, ANNULEE)")
    date_commande: Optional[datetime] = Field(
        None, description="Date d'envoi de la commande"
    )
    date_reception_reelle: Optional[datetime] = Field(
        None, description="Date de réception effective"
    )
    montant_total: float = Field(description="Montant total de la commande")
    fournisseur: FournisseurResponse = Field(description="Fournisseur de la commande")
    lignes: list[LigneCommandeResponse] = Field(
        default=[], description="Lignes de la commande"
    )
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = Field(None, description="ID de l'utilisateur créateur")
    updated_by: Optional[int] = Field(
        None, description="ID de l'utilisateur modificateur"
    )

    class Config:
        from_attributes = True


# ============================================================================
# SCHÉMAS POUR LES LISTES PAGINÉES (COMMANDES)
# ============================================================================


class PaginatedCommandes(BaseModel):
    """Schéma pour une liste paginée de commandes."""

    items: list[CommandeResponse]
    total: int = Field(description="Nombre total de commandes")
    skip: int = Field(description="Nombre d'éléments sautés")
    limit: int = Field(description="Nombre d'éléments par page")


# Rebuild ArticleResponse pour gérer la référence forward à FournisseurResponse
ArticleResponse.model_rebuild()

# Rebuild EmplacementResponse pour gérer la récursivité (children)
EmplacementResponse.model_rebuild()

# Rebuild CommandeResponse pour gérer les références à LigneCommandeResponse et FournisseurResponse
CommandeResponse.model_rebuild()
