"""
Configuration et fixtures globales pour les tests pytest
"""

import os
import pytest

# Hook pytest pour configurer l'environnement AVANT toute importation
def pytest_configure(config):
    """Configure l'environnement de test avant l'exécution des tests"""
    os.environ["TESTING"] = "1"


# Maintenant on peut importer l'application
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, get_db, engine, SessionLocal
from app.models import User, RoleEnum, Categorie, Article, Fournisseur
from app.auth import create_access_token, get_password_hash
from faker import Faker

fake = Faker('fr_FR')


@pytest.fixture(scope="function")
def db():
    """
    Créer une nouvelle database pour chaque test.
    Utilise l'engine de database.py qui est automatiquement en mémoire en mode TESTING.
    """
    # Créer les tables
    Base.metadata.create_all(bind=engine)

    # Créer une session
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        # Nettoyer les tables après le test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """
    Client de test FastAPI.
    Surcharge get_db pour utiliser la database de test.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def admin_user(db):
    """Utilisateur admin de test"""
    user = User(
        username="admin_test",
        email="admin@test.com",
        hashed_password=get_password_hash("admin123"),
        role=RoleEnum.ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_token(admin_user):
    """Token JWT pour admin"""
    return create_access_token(
        data={"sub": admin_user.username},
        user=admin_user
    )


@pytest.fixture
def gestionnaire_user(db):
    """Utilisateur gestionnaire de test"""
    user = User(
        username="gestionnaire_test",
        email="gestionnaire@test.com",
        hashed_password=get_password_hash("gest123"),
        role=RoleEnum.GESTIONNAIRE,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def gestionnaire_token(gestionnaire_user):
    """Token JWT pour gestionnaire"""
    return create_access_token(
        data={"sub": gestionnaire_user.username},
        user=gestionnaire_user
    )


@pytest.fixture
def technicien_user(db):
    """Utilisateur technicien de test"""
    user = User(
        username="technicien_test",
        email="technicien@test.com",
        hashed_password=get_password_hash("tech123"),
        role=RoleEnum.TECHNICIEN,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def technicien_token(technicien_user):
    """Token JWT pour technicien"""
    return create_access_token(
        data={"sub": technicien_user.username},
        user=technicien_user
    )


@pytest.fixture
def consultation_user(db):
    """Utilisateur consultation de test"""
    user = User(
        username="consultation_test",
        email="consultation@test.com",
        hashed_password=get_password_hash("consult123"),
        role=RoleEnum.CONSULTATION,
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def consultation_token(consultation_user):
    """Token JWT pour consultation"""
    return create_access_token(
        data={"sub": consultation_user.username},
        user=consultation_user
    )


@pytest.fixture
def sample_categorie(db, admin_user):
    """Catégorie de test"""
    categorie = Categorie(
        nom="Test Catégorie",
        description="Description test",
        created_by=admin_user.id
    )
    db.add(categorie)
    db.commit()
    db.refresh(categorie)
    return categorie


@pytest.fixture
def sample_article(db, admin_user, sample_categorie):
    """Article de test"""
    article = Article(
        nom="Test Article",
        quantite=10,
        quantite_min=5,
        prix_unitaire=19.99,
        sku="TEST-001",
        categorie_id=sample_categorie.id,
        created_by=admin_user.id
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@pytest.fixture
def sample_fournisseur(db, admin_user):
    """Fournisseur de test"""
    fournisseur = Fournisseur(
        nom="Test Fournisseur",
        email="fournisseur@test.com",
        telephone="0123456789",
        created_by=admin_user.id
    )
    db.add(fournisseur)
    db.commit()
    db.refresh(fournisseur)
    return fournisseur


@pytest.fixture
def sample_categorie_with_children(db, admin_user):
    """Catégorie parente avec sous-catégories"""
    parent = Categorie(
        nom="Catégorie Parente",
        description="Parent test",
        created_by=admin_user.id
    )
    db.add(parent)
    db.commit()
    db.refresh(parent)

    child1 = Categorie(
        nom="Sous-catégorie 1",
        parent_id=parent.id,
        created_by=admin_user.id
    )
    child2 = Categorie(
        nom="Sous-catégorie 2",
        parent_id=parent.id,
        created_by=admin_user.id
    )
    db.add_all([child1, child2])
    db.commit()

    db.refresh(parent)
    return parent
