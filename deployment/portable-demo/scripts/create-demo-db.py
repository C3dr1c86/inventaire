"""
Script pour créer une base de données de démonstration avec données d'exemple.

Usage: python create-demo-db.py [chemin_db]
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta
import random

# Ajouter le backend au path
backend_dir = Path(__file__).parent.parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import models
from app.database import Base
from app.auth import get_password_hash


def create_demo_database(db_path):
    """Crée une base de données de démonstration."""

    # Créer le dossier si nécessaire
    db_file = Path(db_path)
    db_file.parent.mkdir(parents=True, exist_ok=True)

    # Supprimer DB existante
    if db_file.exists():
        db_file.unlink()

    # Créer engine et session
    engine = create_engine(f"sqlite:///{db_path}", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print(f"Création base de données : {db_path}")

        # 1. Créer utilisateur admin
        print("  [1/5] Création utilisateur admin...")
        admin = models.User(
            username="admin",
            email="admin@demo.com",
            hashed_password=get_password_hash("admin"),
            is_active=True
        )
        db.add(admin)
        db.commit()

        # 2. Créer catégories hiérarchiques
        print("  [2/5] Création catégories...")

        categories_data = {
            "Matériaux": ["Bois", "Métal", "Plastique", "Autres"],
            "Consommables": ["Quincaillerie", "Colles & Mastics", "Électricité", "Plomberie", "Impression 3D"],
            "Outillage": ["Manuel", "Électrique/Pneumatique", "Mesure & Traçage", "Spécialisé"],
            "Pièces Détachées": ["Impression 3D", "Électronique", "Plomberie", "Mécanique"],
            "Projets": ["Menuiserie", "Électricité", "Plomberie", "Électronique", "Impression 3D", "Autres"]
        }

        categories_map = {}

        for parent_name, children_names in categories_data.items():
            # Créer catégorie parente
            parent = models.Categorie(nom=parent_name, description=f"Catégorie {parent_name}")
            db.add(parent)
            db.commit()
            db.refresh(parent)
            categories_map[parent_name] = parent

            # Créer sous-catégories
            for child_name in children_names:
                child = models.Categorie(
                    nom=child_name,
                    parent_id=parent.id,
                    description=f"Sous-catégorie {child_name}"
                )
                db.add(child)
                db.commit()
                db.refresh(child)
                categories_map[f"{parent_name}/{child_name}"] = child

        # 3. Créer tags
        print("  [3/5] Création tags...")

        tags_data = [
            ("Machine", "#FF5733", "Articles liés aux machines"),
            ("Projet", "#33FF57", "Articles pour projets spécifiques"),
            ("Urgent", "#FF3333", "Articles urgents à commander"),
            ("Consommable", "#3357FF", "Articles consommables"),
            ("Outil", "#FF33F5", "Outils divers"),
            ("Électronique", "#33FFF5", "Composants électroniques"),
            ("Bois", "#8B4513", "Matériaux bois"),
            ("Visserie", "#A9A9A9", "Vis, écrous, boulons"),
            ("Peinture", "#FFD700", "Peintures et finitions"),
            ("Colle", "#FFA500", "Colles et adhésifs")
        ]

        tags_map = {}
        for nom, couleur, desc in tags_data:
            tag = models.Tag(nom=nom, couleur=couleur, description=desc)
            db.add(tag)
            db.commit()
            db.refresh(tag)
            tags_map[nom] = tag

        # 4. Créer articles d'exemple
        print("  [4/5] Création articles...")

        articles_data = [
            # Matériaux > Bois
            ("Contreplaqué 3mm", "MAT-CP-003", 5, 2, 3.50, "Matériaux/Bois", ["Bois", "Projet"]),
            ("Planche pin 200x20cm", "MAT-PP-200", 12, 5, 8.90, "Matériaux/Bois", ["Bois"]),
            ("Tasseau 40x40mm", "MAT-TA-040", 25, 10, 2.50, "Matériaux/Bois", ["Bois"]),

            # Matériaux > Métal
            ("Tube alu carré 20x20", "MAT-AL-020", 8, 3, 12.50, "Matériaux/Métal", ["Machine"]),
            ("Tôle acier 2mm", "MAT-AC-002", 3, 1, 25.00, "Matériaux/Métal", ["Projet"]),

            # Consommables > Quincaillerie
            ("Vis bois 4x40mm (x100)", "CON-VB-440", 15, 5, 4.90, "Consommables/Quincaillerie", ["Visserie", "Consommable"]),
            ("Vis métal 6x50mm (x50)", "CON-VM-650", 8, 3, 6.50, "Consommables/Quincaillerie", ["Visserie"]),
            ("Écrous M8 (x100)", "CON-EC-M08", 20, 10, 3.20, "Consommables/Quincaillerie", ["Visserie"]),
            ("Chevilles nylon (x50)", "CON-CH-NYL", 12, 5, 2.80, "Consommables/Quincaillerie", ["Visserie"]),

            # Consommables > Colles & Mastics
            ("Colle bois Express", "CON-CB-EXP", 4, 2, 5.50, "Consommables/Colles & Mastics", ["Colle", "Consommable"]),
            ("Mastic silicone transparent", "CON-MS-TRA", 6, 2, 7.20, "Consommables/Colles & Mastics", ["Colle"]),
            ("Super glue gel", "CON-SG-GEL", 10, 5, 3.90, "Consommables/Colles & Mastics", ["Colle", "Urgent"]),

            # Consommables > Électricité
            ("Câble 1.5mm² (rouleau 10m)", "CON-CA-150", 5, 2, 12.00, "Consommables/Électricité", ["Électronique"]),
            ("Domino 3 entrées (x10)", "CON-DO-003", 15, 5, 2.50, "Consommables/Électricité", ["Électronique"]),
            ("Interrupteur va-et-vient", "CON-IN-VAV", 8, 3, 4.80, "Consommables/Électricité", ["Électronique"]),

            # Consommables > Impression 3D
            ("Filament PLA Blanc 1kg", "CON-FI-PLA-BL", 2, 1, 19.90, "Consommables/Impression 3D", ["Projet", "Urgent"]),
            ("Filament PETG Noir 1kg", "CON-FI-PET-NO", 3, 1, 24.90, "Consommables/Impression 3D", ["Projet"]),
            ("Laque fixation plateau", "CON-LA-FIX", 1, 1, 8.50, "Consommables/Impression 3D", ["Urgent"]),

            # Outillage > Manuel
            ("Marteau 500g", "OUT-MA-500", 3, 1, 12.50, "Outillage/Manuel", ["Outil"]),
            ("Tournevis cruciforme PH2", "OUT-TO-PH2", 5, 2, 6.90, "Outillage/Manuel", ["Outil"]),
            ("Pince multiprise 250mm", "OUT-PI-250", 2, 1, 15.00, "Outillage/Manuel", ["Outil"]),

            # Outillage > Électrique
            ("Disque ponçage grain 80 (x10)", "OUT-DP-G80", 8, 3, 12.00, "Outillage/Électrique/Pneumatique", ["Outil", "Consommable"]),
            ("Foret bois 8mm", "OUT-FB-008", 6, 2, 4.50, "Outillage/Électrique/Pneumatique", ["Outil"]),

            # Pièces Détachées > Électronique
            ("Résistance 220Ω (x100)", "PD-RE-220", 50, 20, 1.50, "Pièces Détachées/Électronique", ["Électronique", "Consommable"]),
            ("LED rouge 5mm (x50)", "PD-LED-R5", 30, 15, 2.80, "Pièces Détachées/Électronique", ["Électronique"]),
            ("Arduino Nano compatible", "PD-ARD-NANO", 4, 2, 8.50, "Pièces Détachées/Électronique", ["Électronique", "Projet"]),
            ("Condensateur 100µF (x10)", "PD-CO-100", 25, 10, 1.20, "Pièces Détachées/Électronique", ["Électronique"]),

            # Pièces Détachées > Impression 3D
            ("Buse 0.4mm MK8", "PD-BU-04", 5, 2, 3.50, "Pièces Détachées/Impression 3D", ["Machine"]),
            ("Courroie GT2 (1m)", "PD-CO-GT2", 3, 1, 6.80, "Pièces Détachées/Impression 3D", ["Machine", "Urgent"]),

            # Projets > Menuiserie
            ("Charnière laiton 40mm (x2)", "PRO-CH-L40", 10, 5, 4.20, "Projets/Menuiserie", ["Projet"]),
            ("Vernis bois incolore 500ml", "PRO-VE-INC", 2, 1, 14.90, "Projets/Menuiserie", ["Peinture"]),
        ]

        articles_map = []
        for nom, sku, qty, qty_min, prix, cat_path, tag_names in articles_data:
            categorie = categories_map.get(cat_path)
            if not categorie:
                continue

            article = models.Article(
                nom=nom,
                sku=sku,
                quantite=qty,
                quantite_min=qty_min,
                prix_unitaire=prix,
                categorie_id=categorie.id,
                description=f"Article de démonstration : {nom}"
            )

            # Ajouter tags
            for tag_name in tag_names:
                tag = tags_map.get(tag_name)
                if tag:
                    article.tags.append(tag)

            db.add(article)
            db.commit()
            db.refresh(article)
            articles_map.append(article)

        # 5. Créer mouvements de stock
        print("  [5/5] Création mouvements de stock...")

        # Créer quelques mouvements aléatoires
        mouvement_types = ["ENTREE", "SORTIE"]
        motifs_entree = [
            "Réception commande",
            "Retour stock",
            "Inventaire initial",
            "Achat fournisseur",
            "Correction stock"
        ]
        motifs_sortie = [
            "Utilisation projet",
            "Consommation atelier",
            "Prêt",
            "Casse/perte",
            "Utilisation machine"
        ]

        for _ in range(30):
            article = random.choice(articles_map)
            mouv_type = random.choice(mouvement_types)

            if mouv_type == "ENTREE":
                quantite = random.randint(5, 20)
                motif = random.choice(motifs_entree)
            else:
                quantite = random.randint(1, min(5, article.quantite))
                motif = random.choice(motifs_sortie)

            if mouv_type == "SORTIE" and article.quantite < quantite:
                continue  # Éviter stock négatif

            quantite_avant = article.quantite

            if mouv_type == "ENTREE":
                article.quantite += quantite
            else:
                article.quantite -= quantite

            quantite_apres = article.quantite

            mouvement = models.Mouvement(
                article_id=article.id,
                type=mouv_type,
                quantite=quantite,
                quantite_avant=quantite_avant,
                quantite_apres=quantite_apres,
                motif=motif,
                created_by="admin"
            )

            # Date aléatoire dans les 30 derniers jours
            days_ago = random.randint(0, 30)
            mouvement.created_at = datetime.utcnow() - timedelta(days=days_ago)

            db.add(mouvement)
            db.commit()

        print(f"\n✅ Base de données créée avec succès : {db_path}")
        print(f"   - 1 utilisateur (admin/admin)")
        print(f"   - {len(categories_map)} catégories")
        print(f"   - {len(tags_map)} tags")
        print(f"   - {len(articles_map)} articles")
        print(f"   - 30 mouvements de stock")

    except Exception as e:
        print(f"\n❌ Erreur lors de la création de la base : {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    else:
        # Par défaut, créer dans le dossier portable
        db_path = Path(__file__).parent.parent / "build" / "database" / "inventaire.db"

    create_demo_database(db_path)
