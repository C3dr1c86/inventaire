"""
Modèles de base de données SQLAlchemy.

Ce module définit les tables de la base de données :
- Categorie : Catégories d'articles
- Article : Articles en stock
- Mouvement : Historique des mouvements de stock (entrées/sorties)
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    ForeignKey,
    DateTime,
    Date,
    CheckConstraint,
    Table,
    Numeric,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum


class Categorie(Base):
    """
    Table des catégories d'articles.

    Supporte une hiérarchie à 2 niveaux : catégories racines et sous-catégories.
    """

    __tablename__ = "categories"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(
        String(100), nullable=False, index=True
    )  # Retrait de unique=True pour permettre même nom sous parents différents
    description = Column(Text, nullable=True)
    parent_id = Column(
        Integer,
        ForeignKey("categories.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relations
    # Auto-référence pour la hiérarchie
    parent = relationship("Categorie", remote_side=[id], back_populates="children")
    children = relationship(
        "Categorie", back_populates="parent", cascade="all, delete-orphan"
    )
    # Note: Articles reclassés en "Sans catégorie" (categorie_id = NULL) lors suppression
    articles = relationship("Article", back_populates="categorie")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    @property
    def niveau(self) -> int:
        """Calcule le niveau de profondeur (0 = racine, 1 = sous-catégorie)."""
        if self.parent_id is None:
            return 0
        return 1  # Maximum 2 niveaux

    @property
    def nom_complet(self) -> str:
        """Retourne le nom complet avec hiérarchie (ex: 'Matériaux > Bois')."""
        if self.parent:
            return f"{self.parent.nom} > {self.nom}"
        return self.nom

    def __repr__(self):
        return (
            f"<Categorie(id={self.id}, nom='{self.nom}', parent_id={self.parent_id})>"
        )


class Article(Base):
    """
    Table des articles en stock.

    Contient toutes les informations sur un article : nom, quantité, prix, etc.
    """

    __tablename__ = "articles"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(200), nullable=False, index=True)
    quantite = Column(Integer, nullable=False, default=0)
    quantite_min = Column(
        Integer, default=10, nullable=False
    )  # Seuil pour alerte stock bas
    prix_unitaire = Column(Float, nullable=False)
    categorie_id = Column(
        Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    emplacement_id = Column(
        Integer, ForeignKey("emplacements.id", ondelete="SET NULL"), nullable=True
    )
    description = Column(Text, nullable=True)
    sku = Column(
        String(50), unique=True, nullable=True, index=True
    )  # Code article unique
    prix_fournisseur = Column(
        Float, nullable=True
    )  # Prix d'achat fournisseur principal
    ref_fournisseur = Column(
        String(50), nullable=True
    )  # Référence catalogue fournisseur
    delai_livraison = Column(Integer, nullable=True)  # Délai de livraison en jours
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Contraintes de validation
    __table_args__ = (
        CheckConstraint("quantite >= 0", name="check_quantite_positive"),
        CheckConstraint("prix_unitaire >= 0", name="check_prix_positif"),
        CheckConstraint("quantite_min >= 0", name="check_quantite_min_positive"),
        CheckConstraint(
            "prix_fournisseur >= 0 OR prix_fournisseur IS NULL",
            name="check_prix_fournisseur_positif",
        ),
        CheckConstraint(
            "delai_livraison >= 0 OR delai_livraison IS NULL",
            name="check_delai_positif",
        ),
    )

    # Relations
    categorie = relationship("Categorie", back_populates="articles")
    emplacement = relationship("Emplacement", back_populates="articles")
    mouvements = relationship(
        "Mouvement", back_populates="article", cascade="all, delete-orphan"
    )
    tags = relationship("Tag", secondary="article_tags", back_populates="articles")
    photos = relationship(
        "Photo",
        back_populates="article",
        cascade="all, delete-orphan",
        order_by="Photo.created_at",
    )
    fournisseurs = relationship(
        "Fournisseur", secondary="article_fournisseurs", back_populates="articles"
    )
    lignes_commande = relationship("LigneCommande", back_populates="article")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    @property
    def valeur_stock(self):
        """Calcule la valeur totale du stock pour cet article."""
        return self.quantite * self.prix_unitaire

    @property
    def est_stock_bas(self):
        """Vérifie si l'article est en stock bas."""
        return self.quantite < self.quantite_min

    def __repr__(self):
        return f"<Article(id={self.id}, nom='{self.nom}', quantite={self.quantite})>"


class Mouvement(Base):
    """
    Table des mouvements de stock.

    Enregistre l'historique de tous les mouvements (entrées et sorties) pour chaque article.
    Permet de tracer qui a fait quoi et quand.
    """

    __tablename__ = "mouvements"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column(
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    type = Column(String(20), nullable=False)  # 'ENTREE' ou 'SORTIE'
    quantite = Column(Integer, nullable=False)
    quantite_avant = Column(Integer, nullable=False)  # Quantité avant le mouvement
    quantite_apres = Column(Integer, nullable=False)  # Quantité après le mouvement
    motif = Column(Text, nullable=True)  # Raison du mouvement
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )  # Migré de String → FK
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Contraintes de validation
    __table_args__ = (
        CheckConstraint("type IN ('ENTREE', 'SORTIE')", name="check_type_mouvement"),
        CheckConstraint("quantite > 0", name="check_quantite_mouvement_positive"),
    )

    # Relations
    article = relationship("Article", back_populates="mouvements")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    def __repr__(self):
        return f"<Mouvement(id={self.id}, type='{self.type}', quantite={self.quantite}, article_id={self.article_id})>"


class Photo(Base):
    """
    Table des photos des articles.

    Permet de stocker plusieurs photos par article pour identification visuelle.
    Les photos sont stockées dans uploads/articles/{article_id}/ avec miniatures générées automatiquement.
    """

    __tablename__ = "photos"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    article_id = Column(
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    filename = Column(String(255), nullable=False)  # Nom original du fichier
    filepath = Column(
        String(500), nullable=False
    )  # Chemin relatif depuis uploads/ (ex: articles/1/photo.jpg)
    thumbnail_path = Column(
        String(500), nullable=True
    )  # Chemin miniature (ex: articles/1/thumbnails/photo.jpg)
    file_size = Column(Integer, nullable=False)  # Taille en octets
    mime_type = Column(String(50), nullable=False)  # image/jpeg, image/png, image/webp
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relations
    article = relationship("Article", back_populates="photos")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)

    def __repr__(self):
        return f"<Photo(id={self.id}, article_id={self.article_id}, filename='{self.filename}')>"


# Table d'association pour la relation many-to-many entre Article et Fournisseur
article_fournisseurs = Table(
    "article_fournisseurs",
    Base.metadata,
    Column(
        "article_id",
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "fournisseur_id",
        Integer,
        ForeignKey("fournisseurs.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)


class Fournisseur(Base):
    """
    Table des fournisseurs.

    Gère les informations des fournisseurs et leurs liens avec les articles.
    Un article peut avoir plusieurs fournisseurs, et un fournisseur peut fournir plusieurs articles.
    """

    __tablename__ = "fournisseurs"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(100), unique=True, nullable=False, index=True)
    contact = Column(String(100), nullable=True)  # Nom du contact principal
    email = Column(String(100), nullable=True)
    telephone = Column(String(20), nullable=True)
    adresse = Column(String(500), nullable=True)
    site_web = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relation many-to-many avec Article
    articles = relationship(
        "Article", secondary=article_fournisseurs, back_populates="fournisseurs"
    )
    commandes = relationship("Commande", back_populates="fournisseur")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    def __repr__(self):
        return f"<Fournisseur(id={self.id}, nom='{self.nom}')>"


# Table d'association pour la relation many-to-many entre Article et Tag
article_tags = Table(
    "article_tags",
    Base.metadata,
    Column(
        "article_id",
        Integer,
        ForeignKey("articles.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("created_at", DateTime(timezone=True), server_default=func.now()),
)


class Tag(Base):
    """
    Table des tags pour étiqueter les articles.

    Les tags permettent d'organiser les articles selon plusieurs dimensions
    (machine, univers, usage, etc.) en complément des catégories.
    Un article peut avoir plusieurs tags, et un tag peut être associé à plusieurs articles.
    """

    __tablename__ = "tags"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(50), unique=True, nullable=False, index=True)
    couleur = Column(String(7), nullable=True)  # Code couleur hex (#FF5733)
    description = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relation many-to-many avec Article
    articles = relationship("Article", secondary=article_tags, back_populates="tags")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    def __repr__(self):
        return f"<Tag(id={self.id}, nom='{self.nom}')>"


class RoleEnum(str, enum.Enum):
    """
    Énumération des rôles utilisateurs.

    - ADMIN : Accès complet (gestion utilisateurs, configuration)
    - GESTIONNAIRE : Gestion complète articles/stock (sauf utilisateurs)
    - TECHNICIEN : Consultation + création mouvements SORTIE uniquement
    - CONSULTATION : Lecture seule sur tout
    """

    ADMIN = "admin"
    GESTIONNAIRE = "gestionnaire"
    TECHNICIEN = "technicien"
    CONSULTATION = "consultation"


class User(Base):
    """
    Table des utilisateurs pour l'authentification.

    Stocke les informations d'authentification des utilisateurs de l'application.
    Support multi-utilisateurs avec système de rôles et permissions.
    """

    __tablename__ = "users"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(
        Enum(RoleEnum), nullable=False, default=RoleEnum.CONSULTATION, index=True
    )
    permissions = Column(JSON, nullable=True)  # Permissions custom (overrides du rôle)
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relations
    commandes = relationship(
        "Commande", foreign_keys="Commande.created_by", back_populates="user"
    )

    # Relations audit trail (self-referential)
    creator = relationship(
        "User", remote_side=[id], foreign_keys=[created_by], viewonly=True
    )
    updater = relationship(
        "User", remote_side=[id], foreign_keys=[updated_by], viewonly=True
    )

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class Emplacement(Base):
    """
    Table des emplacements physiques dans l'atelier.

    Structure hiérarchique à 3 niveaux : Zone → Étagère → Boîte
    Permet de localiser les articles dans l'atelier et de gérer les capacités de stockage.
    """

    __tablename__ = "emplacements"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    capacite_max = Column(Integer, nullable=True)  # NULL = capacité illimitée
    parent_id = Column(
        Integer, ForeignKey("emplacements.id", ondelete="CASCADE"), nullable=True
    )
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Contraintes de validation
    __table_args__ = (
        CheckConstraint(
            "capacite_max > 0 OR capacite_max IS NULL", name="check_capacite_positive"
        ),
    )

    # Relations auto-référence
    parent = relationship("Emplacement", remote_side=[id], back_populates="children")
    children = relationship(
        "Emplacement", back_populates="parent", cascade="all, delete-orphan"
    )
    articles = relationship("Article", back_populates="emplacement")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    @property
    def niveau(self) -> int:
        """
        Retourne le niveau hiérarchique de l'emplacement.
        0 = Zone (racine), 1 = Étagère, 2 = Boîte
        """
        if self.parent_id is None:
            return 0  # Zone (racine)
        elif self.parent.parent_id is None:
            return 1  # Étagère
        else:
            return 2  # Boîte

    @property
    def code_complet(self) -> str:
        """
        Retourne le code hiérarchique complet.
        Ex: "ZONE-A > ETAGERE-1 > BOITE-3"
        """
        if self.parent:
            return f"{self.parent.code_complet} > {self.code}"
        return self.code

    @property
    def quantite_utilisee(self) -> int:
        """
        Retourne la somme des quantités d'articles stockés dans cet emplacement.
        """
        return sum(article.quantite for article in self.articles)

    @property
    def pourcentage_remplissage(self) -> float:
        """
        Retourne le pourcentage de remplissage (0-100).
        Retourne 0 si capacite_max est NULL (illimité).
        """
        if self.capacite_max is None or self.capacite_max == 0:
            return 0.0
        return min((self.quantite_utilisee / self.capacite_max) * 100, 100.0)

    def __repr__(self):
        return f"<Emplacement(id={self.id}, code='{self.code}', niveau={self.niveau})>"


# ============================================================================
# MODÈLES COMMANDES
# ============================================================================


class Commande(Base):
    """
    Modèle pour une commande fournisseur.

    Une commande peut être dans 4 états :
    - BROUILLON : Commande en cours de préparation (non envoyée)
    - ENVOYEE : Commande envoyée au fournisseur (en attente de réception)
    - RECUE : Commande réceptionnée (stock mis à jour automatiquement)
    - ANNULEE : Commande annulée

    Workflow :
    BROUILLON → ENVOYEE → RECUE
              ↘ ANNULEE ↙
    """

    __tablename__ = "commandes"

    id = Column(Integer, primary_key=True, index=True)
    fournisseur_id = Column(
        Integer,
        ForeignKey("fournisseurs.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    numero_commande = Column(String(50), unique=True, nullable=False, index=True)
    statut = Column(
        String(20),
        CheckConstraint(
            "statut IN ('BROUILLON', 'ENVOYEE', 'RECUE', 'ANNULEE')",
            name="check_statut_commande",
        ),
        nullable=False,
        default="BROUILLON",
        index=True,
    )
    date_commande = Column(DateTime(timezone=True), nullable=True)  # NULL si BROUILLON
    date_reception_prevue = Column(Date, nullable=True)
    date_reception_reelle = Column(
        DateTime(timezone=True), nullable=True
    )  # NULL si pas encore reçue
    montant_total = Column(
        Numeric(10, 2),
        CheckConstraint("montant_total >= 0", name="check_montant_positif"),
        nullable=False,
        default=0,
    )
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    updated_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relations
    fournisseur = relationship("Fournisseur", back_populates="commandes")
    lignes = relationship(
        "LigneCommande", back_populates="commande", cascade="all, delete-orphan"
    )
    user = relationship("User", foreign_keys=[created_by], back_populates="commandes")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)
    updater = relationship("User", foreign_keys=[updated_by], viewonly=True)

    def __repr__(self):
        return f"<Commande(id={self.id}, numero='{self.numero_commande}', statut='{self.statut}')>"


class LigneCommande(Base):
    """
    Modèle pour une ligne de commande.

    Chaque ligne représente un article commandé avec :
    - quantite_commandee : Quantité initialement commandée
    - quantite_recue : Quantité réellement reçue (peut être différente)
    - prix_unitaire : Prix unitaire au moment de la commande
    """

    __tablename__ = "lignes_commande"

    id = Column(Integer, primary_key=True, index=True)
    commande_id = Column(
        Integer,
        ForeignKey("commandes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    article_id = Column(
        Integer,
        ForeignKey("articles.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    quantite_commandee = Column(
        Integer,
        CheckConstraint("quantite_commandee > 0", name="check_qte_commandee_positive"),
        nullable=False,
    )
    quantite_recue = Column(
        Integer,
        CheckConstraint("quantite_recue >= 0", name="check_qte_recue_positive"),
        nullable=False,
        default=0,
    )
    prix_unitaire = Column(
        Numeric(10, 2),
        CheckConstraint("prix_unitaire >= 0", name="check_prix_ligne_positif"),
        nullable=False,
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )

    # Relations
    commande = relationship("Commande", back_populates="lignes")
    article = relationship("Article", back_populates="lignes_commande")

    # Relations audit trail
    creator = relationship("User", foreign_keys=[created_by], viewonly=True)

    @property
    def montant_ligne(self) -> float:
        """Calcule le montant total de la ligne (quantité commandée × prix unitaire)."""
        return float(self.quantite_commandee * self.prix_unitaire)

    def __repr__(self):
        return f"<LigneCommande(id={self.id}, article_id={self.article_id}, qte={self.quantite_commandee})>"
