"""
Modèles de base de données SQLAlchemy.

Ce module définit les tables de la base de données :
- Categorie : Catégories d'articles
- Article : Articles en stock
- Mouvement : Historique des mouvements de stock (entrées/sorties)
"""

from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime, CheckConstraint, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Categorie(Base):
    """
    Table des catégories d'articles.

    Supporte une hiérarchie à 2 niveaux : catégories racines et sous-catégories.
    """
    __tablename__ = "categories"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nom = Column(String(100), nullable=False, index=True)  # Retrait de unique=True pour permettre même nom sous parents différents
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, ForeignKey("categories.id", ondelete="CASCADE"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relations
    # Auto-référence pour la hiérarchie
    parent = relationship("Categorie", remote_side=[id], back_populates="children")
    children = relationship("Categorie", back_populates="parent", cascade="all, delete-orphan")
    # Note: Articles reclassés en "Sans catégorie" (categorie_id = NULL) lors suppression
    articles = relationship("Article", back_populates="categorie")

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
        return f"<Categorie(id={self.id}, nom='{self.nom}', parent_id={self.parent_id})>"


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
    quantite_min = Column(Integer, default=10, nullable=False)  # Seuil pour alerte stock bas
    prix_unitaire = Column(Float, nullable=False)
    categorie_id = Column(Integer, ForeignKey("categories.id", ondelete="SET NULL"), nullable=True)
    description = Column(Text, nullable=True)
    sku = Column(String(50), unique=True, nullable=True, index=True)  # Code article unique
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Contraintes de validation
    __table_args__ = (
        CheckConstraint('quantite >= 0', name='check_quantite_positive'),
        CheckConstraint('prix_unitaire >= 0', name='check_prix_positif'),
        CheckConstraint('quantite_min >= 0', name='check_quantite_min_positive'),
    )

    # Relations
    categorie = relationship("Categorie", back_populates="articles")
    mouvements = relationship("Mouvement", back_populates="article", cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="article_tags", back_populates="articles")
    photos = relationship("Photo", back_populates="article", cascade="all, delete-orphan", order_by="Photo.created_at")

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
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(String(20), nullable=False)  # 'ENTREE' ou 'SORTIE'
    quantite = Column(Integer, nullable=False)
    quantite_avant = Column(Integer, nullable=False)  # Quantité avant le mouvement
    quantite_apres = Column(Integer, nullable=False)  # Quantité après le mouvement
    motif = Column(Text, nullable=True)  # Raison du mouvement
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    created_by = Column(String(100), nullable=True)  # Pour future gestion des utilisateurs

    # Contraintes de validation
    __table_args__ = (
        CheckConstraint("type IN ('ENTREE', 'SORTIE')", name='check_type_mouvement'),
        CheckConstraint('quantite > 0', name='check_quantite_mouvement_positive'),
    )

    # Relations
    article = relationship("Article", back_populates="mouvements")

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
    article_id = Column(Integer, ForeignKey("articles.id", ondelete="CASCADE"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)  # Nom original du fichier
    filepath = Column(String(500), nullable=False)  # Chemin relatif depuis uploads/ (ex: articles/1/photo.jpg)
    thumbnail_path = Column(String(500), nullable=True)  # Chemin miniature (ex: articles/1/thumbnails/photo.jpg)
    file_size = Column(Integer, nullable=False)  # Taille en octets
    mime_type = Column(String(50), nullable=False)  # image/jpeg, image/png, image/webp
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relations
    article = relationship("Article", back_populates="photos")

    def __repr__(self):
        return f"<Photo(id={self.id}, article_id={self.article_id}, filename='{self.filename}')>"


# Table d'association pour la relation many-to-many entre Article et Tag
article_tags = Table(
    'article_tags',
    Base.metadata,
    Column('article_id', Integer, ForeignKey('articles.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True),
    Column('created_at', DateTime(timezone=True), server_default=func.now())
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
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relation many-to-many avec Article
    articles = relationship("Article", secondary=article_tags, back_populates="tags")

    def __repr__(self):
        return f"<Tag(id={self.id}, nom='{self.nom}')>"


class User(Base):
    """
    Table des utilisateurs pour l'authentification.

    Stocke les informations d'authentification des utilisateurs de l'application.
    Pour la version mono-utilisateur, un seul compte peut être créé.
    """
    __tablename__ = "users"

    # Colonnes
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"
