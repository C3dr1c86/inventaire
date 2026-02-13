"""
Script de peuplement de la base de données avec des données de test.

Usage:
    python seed_database.py

Ce script crée :
- 1 utilisateur (admin/admin)
- 5 catégories hiérarchiques
- 5 tags
- 3 fournisseurs
- 10 emplacements (zones, étagères, boîtes)
- 20 articles
- 10 mouvements
"""

import sys
import os
from datetime import datetime, timedelta
from sqlalchemy import text

# Ajouter le répertoire backend au path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, init_db
from app import models
from app.auth import get_password_hash

def clear_database(db):
    """Supprime toutes les données existantes."""
    print("🗑️  Nettoyage de la base de données...")
    db.query(models.Mouvement).delete()
    db.query(models.LigneCommande).delete()
    db.query(models.Commande).delete()
    db.query(models.Photo).delete()
    # Supprimer les associations many-to-many
    db.execute(text("DELETE FROM article_tags"))
    db.execute(text("DELETE FROM article_fournisseurs"))
    db.query(models.Article).delete()
    db.query(models.Tag).delete()
    db.query(models.Emplacement).delete()
    db.query(models.Categorie).delete()
    db.query(models.Fournisseur).delete()
    db.query(models.User).delete()
    db.commit()
    print("✅ Base de données nettoyée\n")


def seed_user(db):
    """Crée un utilisateur admin par défaut."""
    print("👤 Création de l'utilisateur admin...")
    user = models.User(
        username="admin",
        email="admin@example.com",
        hashed_password=get_password_hash("admin"),
        is_active=True,
        role=models.RoleEnum.ADMIN
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"✅ Utilisateur créé: {user.username} (rôle: {user.role}) (mot de passe: admin)\n")
    return user


def seed_categories(db, user):
    """Crée des catégories hiérarchiques."""
    print("📁 Création des catégories...")

    # Catégories racines
    materiaux = models.Categorie(nom="Matériaux", description="Matériaux de construction", created_by=user.id)
    consommables = models.Categorie(nom="Consommables", description="Produits consommables", created_by=user.id)
    outillage = models.Categorie(nom="Outillage", description="Outils et équipements", created_by=user.id)

    db.add_all([materiaux, consommables, outillage])
    db.commit()
    db.refresh(materiaux)
    db.refresh(consommables)
    db.refresh(outillage)

    # Sous-catégories
    sous_cats = [
        models.Categorie(nom="Bois", description="Bois et dérivés", parent_id=materiaux.id, created_by=user.id),
        models.Categorie(nom="Métal", description="Métaux divers", parent_id=materiaux.id, created_by=user.id),
        models.Categorie(nom="Quincaillerie", description="Vis, clous, etc.", parent_id=consommables.id, created_by=user.id),
        models.Categorie(nom="Colles & Mastics", description="Produits de collage", parent_id=consommables.id, created_by=user.id),
        models.Categorie(nom="Électroportatif", description="Outils électriques", parent_id=outillage.id, created_by=user.id),
    ]

    db.add_all(sous_cats)
    db.commit()
    print(f"✅ {len(sous_cats) + 3} catégories créées\n")

    return {
        'materiaux': materiaux,
        'consommables': consommables,
        'outillage': outillage,
        'bois': sous_cats[0],
        'metal': sous_cats[1],
        'quincaillerie': sous_cats[2],
        'colles': sous_cats[3],
        'electroportatif': sous_cats[4]
    }


def seed_tags(db, user):
    """Crée des tags."""
    print("🏷️  Création des tags...")
    tags = [
        models.Tag(nom="Prioritaire", couleur="#dc3545", description="Article prioritaire", created_by=user.id),
        models.Tag(nom="Fragile", couleur="#ffc107", description="Article fragile", created_by=user.id),
        models.Tag(nom="Nouveau", couleur="#28a745", description="Nouvel article", created_by=user.id),
        models.Tag(nom="Promotion", couleur="#007bff", description="En promotion", created_by=user.id),
        models.Tag(nom="Stock limité", couleur="#fd7e14", description="Stock faible", created_by=user.id),
    ]

    db.add_all(tags)
    db.commit()
    for tag in tags:
        db.refresh(tag)

    print(f"✅ {len(tags)} tags créés\n")
    return tags


def seed_fournisseurs(db, user):
    """Crée des fournisseurs."""
    print("🚚 Création des fournisseurs...")
    fournisseurs = [
        models.Fournisseur(
            nom="BricoMax",
            contact="Jean Dupont",
            email="contact@bricomax.fr",
            telephone="01 23 45 67 89",
            adresse="12 rue du Commerce, 75001 Paris",
            site_web="https://www.bricomax.fr",
            created_by=user.id
        ),
        models.Fournisseur(
            nom="Outillage Pro",
            contact="Marie Martin",
            email="commandes@outillagepro.fr",
            telephone="02 34 56 78 90",
            adresse="45 avenue de l'Industrie, 69000 Lyon",
            created_by=user.id
        ),
        models.Fournisseur(
            nom="Bois & Matériaux",
            contact="Pierre Dubois",
            email="ventes@boisetmateriaux.fr",
            telephone="03 45 67 89 01",
            adresse="78 route de la Forêt, 33000 Bordeaux",
            site_web="https://www.boisetmateriaux.fr",
            created_by=user.id
        ),
    ]

    db.add_all(fournisseurs)
    db.commit()
    for f in fournisseurs:
        db.refresh(f)

    print(f"✅ {len(fournisseurs)} fournisseurs créés\n")
    return fournisseurs


def seed_emplacements(db, user):
    """Crée des emplacements hiérarchiques."""
    print("📍 Création des emplacements...")

    # Zones
    atelier = models.Emplacement(code="ATELIER-A", description="Atelier principal", capacite_max=1000, created_by=user.id)
    stockage = models.Emplacement(code="STOCK-B", description="Zone de stockage", capacite_max=2000, created_by=user.id)

    db.add_all([atelier, stockage])
    db.commit()
    db.refresh(atelier)
    db.refresh(stockage)

    # Étagères
    etagere_a1 = models.Emplacement(code="ETAGERE-A1", description="Étagère haute", capacite_max=200, parent_id=atelier.id, created_by=user.id)
    etagere_a2 = models.Emplacement(code="ETAGERE-A2", description="Étagère basse", capacite_max=300, parent_id=atelier.id, created_by=user.id)
    etagere_b1 = models.Emplacement(code="ETAGERE-B1", description="Étagère stock", capacite_max=500, parent_id=stockage.id, created_by=user.id)

    db.add_all([etagere_a1, etagere_a2, etagere_b1])
    db.commit()
    db.refresh(etagere_a1)
    db.refresh(etagere_a2)
    db.refresh(etagere_b1)

    # Boîtes
    boites = [
        models.Emplacement(code="BOITE-1", description="Petite visserie", capacite_max=50, parent_id=etagere_a1.id, created_by=user.id),
        models.Emplacement(code="BOITE-2", description="Clous et agrafes", capacite_max=50, parent_id=etagere_a1.id, created_by=user.id),
        models.Emplacement(code="BOITE-3", description="Consommables divers", capacite_max=100, parent_id=etagere_a2.id, created_by=user.id),
        models.Emplacement(code="BOITE-4", description="Outils électriques", capacite_max=20, parent_id=etagere_b1.id, created_by=user.id),
        models.Emplacement(code="BOITE-5", description="Matériaux en stock", capacite_max=200, parent_id=etagere_b1.id, created_by=user.id),
    ]

    db.add_all(boites)
    db.commit()

    print(f"✅ {2 + 3 + len(boites)} emplacements créés\n")

    return {
        'atelier': atelier,
        'stockage': stockage,
        'etagere_a1': etagere_a1,
        'etagere_a2': etagere_a2,
        'etagere_b1': etagere_b1,
        'boites': boites
    }


def seed_articles(db, user, categories, tags, fournisseurs, emplacements):
    """Crée des articles de test."""
    print("📦 Création des articles...")

    articles = [
        models.Article(
            nom="Planche de chêne 200x50cm",
            quantite=15,
            quantite_min=5,
            prix_unitaire=45.50,
            categorie_id=categories['bois'].id,
            emplacement_id=emplacements['boites'][4].id,
            description="Planche de chêne massif",
            sku="BOIS-CHE-200",
            prix_fournisseur=35.00,
            ref_fournisseur="CHE200",
            delai_livraison=7,
            created_by=user.id
        ),
        models.Article(
            nom="Vis acier inox 4x40mm (boîte de 100)",
            quantite=50,
            quantite_min=20,
            prix_unitaire=8.90,
            categorie_id=categories['quincaillerie'].id,
            emplacement_id=emplacements['boites'][0].id,
            description="Vis à bois inox",
            sku="VIS-INOX-4X40",
            prix_fournisseur=6.50,
            ref_fournisseur="VIS440",
            delai_livraison=2,
            created_by=user.id
        ),
        models.Article(
            nom="Perceuse sans fil 18V",
            quantite=3,
            quantite_min=2,
            prix_unitaire=129.99,
            categorie_id=categories['electroportatif'].id,
            emplacement_id=emplacements['boites'][3].id,
            description="Perceuse-visseuse 18V avec 2 batteries",
            sku="OUT-PER-18V",
            prix_fournisseur=95.00,
            ref_fournisseur="PER18V2",
            delai_livraison=5,
            created_by=user.id
        ),
        models.Article(
            nom="Colle à bois D3 1L",
            quantite=8,
            quantite_min=3,
            prix_unitaire=12.50,
            categorie_id=categories['colles'].id,
            emplacement_id=emplacements['boites'][2].id,
            description="Colle vinylique D3 résistante à l'eau",
            sku="COL-BOIS-1L",
            prix_fournisseur=8.90,
            ref_fournisseur="COLD3-1L",
            delai_livraison=3,
            created_by=user.id
        ),
        models.Article(
            nom="Tube acier 40mm x 2m",
            quantite=12,
            quantite_min=5,
            prix_unitaire=18.75,
            categorie_id=categories['metal'].id,
            emplacement_id=emplacements['stockage'].id,
            description="Tube acier rond 40mm",
            sku="MET-TUB-40",
            prix_fournisseur=14.00,
            delai_livraison=10,
            created_by=user.id
        ),
        models.Article(
            nom="Clous 60mm (1kg)",
            quantite=25,
            quantite_min=10,
            prix_unitaire=6.20,
            categorie_id=categories['quincaillerie'].id,
            emplacement_id=emplacements['boites'][1].id,
            description="Clous acier 60mm",
            sku="QUI-CLO-60",
            prix_fournisseur=4.50,
            delai_livraison=2,
            created_by=user.id
        ),
        models.Article(
            nom="Ponceuse orbitale",
            quantite=2,
            quantite_min=1,
            prix_unitaire=89.90,
            categorie_id=categories['electroportatif'].id,
            emplacement_id=emplacements['boites'][3].id,
            description="Ponceuse orbitale 250W",
            sku="OUT-PON-250",
            prix_fournisseur=65.00,
            delai_livraison=5,
            created_by=user.id
        ),
        models.Article(
            nom="Mastic silicone transparent",
            quantite=30,
            quantite_min=15,
            prix_unitaire=5.90,
            categorie_id=categories['colles'].id,
            emplacement_id=emplacements['boites'][2].id,
            description="Cartouche de mastic silicone 310ml",
            sku="MAS-SIL-TR",
            prix_fournisseur=4.20,
            delai_livraison=3,
            created_by=user.id
        ),
        models.Article(
            nom="Contreplaqué 15mm 250x125cm",
            quantite=6,
            quantite_min=3,
            prix_unitaire=28.50,
            categorie_id=categories['bois'].id,
            emplacement_id=emplacements['boites'][4].id,
            description="Panneau contreplaqué peuplier",
            sku="BOIS-CPL-15",
            prix_fournisseur=22.00,
            delai_livraison=7,
            created_by=user.id
        ),
        models.Article(
            nom="Boulons M8x50mm (boîte de 50)",
            quantite=18,
            quantite_min=8,
            prix_unitaire=11.40,
            categorie_id=categories['quincaillerie'].id,
            emplacement_id=emplacements['boites'][0].id,
            description="Boulons acier zingué avec écrous",
            sku="QUI-BOU-M8",
            prix_fournisseur=8.50,
            delai_livraison=2,
            created_by=user.id
        ),
    ]

    db.add_all(articles)
    db.commit()

    # Ajouter des tags à certains articles
    articles[0].tags.append(tags[2])  # Planche chêne -> Nouveau
    articles[2].tags.append(tags[0])  # Perceuse -> Prioritaire
    articles[2].tags.append(tags[3])  # Perceuse -> Promotion
    articles[6].tags.append(tags[4])  # Ponceuse -> Stock limité
    articles[3].tags.append(tags[1])  # Colle -> Fragile

    # Associer des fournisseurs
    articles[0].fournisseurs.append(fournisseurs[2])  # Bois -> Bois & Matériaux
    articles[1].fournisseurs.append(fournisseurs[0])  # Vis -> BricoMax
    articles[2].fournisseurs.append(fournisseurs[1])  # Perceuse -> Outillage Pro
    articles[3].fournisseurs.append(fournisseurs[0])  # Colle -> BricoMax

    db.commit()

    for article in articles:
        db.refresh(article)

    print(f"✅ {len(articles)} articles créés\n")
    return articles


def seed_mouvements(db, user, articles):
    """Crée des mouvements de stock."""
    print("📊 Création des mouvements...")

    mouvements = []

    # Quelques mouvements d'entrée et de sortie
    for i, article in enumerate(articles[:5]):
        # Mouvement d'entrée
        mouvement_entree = models.Mouvement(
            article_id=article.id,
            type="ENTREE",
            quantite=10,
            quantite_avant=article.quantite - 10,
            quantite_apres=article.quantite,
            motif=f"Réception commande fournisseur",
            created_at=datetime.now() - timedelta(days=10-i),
            created_by=user.id
        )
        mouvements.append(mouvement_entree)

        # Mouvement de sortie
        mouvement_sortie = models.Mouvement(
            article_id=article.id,
            type="SORTIE",
            quantite=3,
            quantite_avant=article.quantite,
            quantite_apres=article.quantite,  # La quantité n'a pas changé dans l'article
            motif=f"Utilisation atelier",
            created_at=datetime.now() - timedelta(days=5-i),
            created_by=user.id
        )
        mouvements.append(mouvement_sortie)

    db.add_all(mouvements)
    db.commit()

    print(f"✅ {len(mouvements)} mouvements créés\n")
    return mouvements


def main():
    """Fonction principale."""
    print("\n" + "="*60)
    print("🌱 PEUPLEMENT DE LA BASE DE DONNÉES")
    print("="*60 + "\n")

    # Initialiser la base de données
    init_db()

    # Créer une session
    db = SessionLocal()

    try:
        # Nettoyer la base
        clear_database(db)

        # Créer les données de test
        user = seed_user(db)
        categories = seed_categories(db, user)
        tags = seed_tags(db, user)
        fournisseurs = seed_fournisseurs(db, user)
        emplacements = seed_emplacements(db, user)
        articles = seed_articles(db, user, categories, tags, fournisseurs, emplacements)
        mouvements = seed_mouvements(db, user, articles)

        print("\n" + "="*60)
        print("✅ PEUPLEMENT TERMINÉ AVEC SUCCÈS !")
        print("="*60)
        print("\n📊 Résumé :")
        print(f"  - 1 utilisateur (admin/admin)")
        print(f"  - {len(categories)} catégories")
        print(f"  - {len(tags)} tags")
        print(f"  - {len(fournisseurs)} fournisseurs")
        print(f"  - 10 emplacements (zones, étagères, boîtes)")
        print(f"  - {len(articles)} articles")
        print(f"  - {len(mouvements)} mouvements")
        print("\n🔑 Connexion : admin / admin")
        print("🌐 Frontend : http://localhost:5173")
        print("📚 Swagger : http://localhost:8000/docs")
        print("\n")

    except Exception as e:
        print(f"\n❌ Erreur lors du peuplement : {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
