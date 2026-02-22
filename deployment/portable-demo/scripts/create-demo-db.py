"""
Script pour créer une base de données de démonstration v2.0.0.

Données incluses :
- 1 utilisateur admin
- 5 catégories parentes + sous-catégories
- 10 tags colorés
- 5 fournisseurs (avec email pour démonstration devis)
- Plan atelier : 3 zones → étagères → boîtes (14 emplacements)
- 30 articles (avec emplacements, références fournisseur, tags)
- ~30 mouvements de stock (historique)
- 2 commandes/demandes de devis (statuts variés)

Usage: python create-demo-db.py [chemin_db]
"""
import sys
import os
from pathlib import Path
from datetime import datetime, timedelta, date
import random

# Ajouter le backend au path
backend_dir = Path(__file__).parent.parent.parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app import models
from app.models import RoleEnum
from app.database import Base
from app.auth import get_password_hash


def create_demo_database(db_path):
    """Crée une base de données de démonstration complète v2.0.0."""

    db_file = Path(db_path)
    db_file.parent.mkdir(parents=True, exist_ok=True)

    if db_file.exists():
        db_file.unlink()

    engine = create_engine(
        f"sqlite:///{db_path}", connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        print(f"Création base de données v2.0.0 : {db_path}")

        # ─────────────────────────────────────────────────
        # 1. Utilisateurs
        # ─────────────────────────────────────────────────
        print("  [1/7] Création utilisateurs...")
        admin = models.User(
            username="admin",
            email="admin@demo.com",
            hashed_password=get_password_hash("admin"),
            is_active=True,
            role=RoleEnum.ADMIN,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

        # ─────────────────────────────────────────────────
        # 2. Catégories hiérarchiques
        # ─────────────────────────────────────────────────
        print("  [2/7] Création catégories...")
        categories_data = {
            "Matériaux": ["Bois", "Métal", "Plastique"],
            "Consommables": ["Quincaillerie", "Colles & Mastics", "Électricité", "Impression 3D"],
            "Outillage": ["Manuel", "Électrique/Pneumatique", "Mesure & Traçage"],
            "Pièces Détachées": ["Électronique", "Impression 3D", "Mécanique"],
            "Projets": ["Menuiserie", "Électronique", "Autres"],
        }

        categories_map = {}
        for parent_name, children_names in categories_data.items():
            parent = models.Categorie(
                nom=parent_name,
                description=f"Catégorie {parent_name}",
                created_by=admin.id,
            )
            db.add(parent)
            db.commit()
            db.refresh(parent)
            categories_map[parent_name] = parent
            for child_name in children_names:
                child = models.Categorie(
                    nom=child_name,
                    parent_id=parent.id,
                    description=f"Sous-catégorie {child_name}",
                    created_by=admin.id,
                )
                db.add(child)
                db.commit()
                db.refresh(child)
                categories_map[f"{parent_name}/{child_name}"] = child

        # ─────────────────────────────────────────────────
        # 3. Tags
        # ─────────────────────────────────────────────────
        print("  [3/7] Création tags...")
        tags_data = [
            ("Machine", "#e74c3c", "Articles liés aux machines"),
            ("Projet", "#2ecc71", "Articles pour projets spécifiques"),
            ("Urgent", "#e91e63", "Articles urgents à commander"),
            ("Consommable", "#3498db", "Articles consommables"),
            ("Outil", "#9b59b6", "Outils divers"),
            ("Électronique", "#00bcd4", "Composants électroniques"),
            ("Bois", "#795548", "Matériaux bois"),
            ("Visserie", "#90a4ae", "Vis, écrous, boulons"),
            ("Peinture", "#ffd700", "Peintures et finitions"),
            ("Colle", "#ff9800", "Colles et adhésifs"),
        ]
        tags_map = {}
        for nom, couleur, desc in tags_data:
            tag = models.Tag(nom=nom, couleur=couleur, description=desc, created_by=admin.id)
            db.add(tag)
            db.commit()
            db.refresh(tag)
            tags_map[nom] = tag

        # ─────────────────────────────────────────────────
        # 4. Fournisseurs
        # ─────────────────────────────────────────────────
        print("  [4/7] Création fournisseurs...")
        fournisseurs_data = [
            {
                "nom": "RS Components",
                "contact": "Service commercial",
                "email": "commercial@rs-components.fr",
                "telephone": "01 34 19 21 21",
                "site_web": "https://fr.rs-online.com",
                "adresse": "Rue Jean-Pierre Timbaud, 78186 Saint-Quentin-en-Yvelines",
                "description": "Composants électroniques, outillage, automatisme",
            },
            {
                "nom": "Würth France",
                "contact": "Agence locale",
                "email": "agence@wurth.fr",
                "telephone": "03 88 73 25 25",
                "site_web": "https://www.wurth.fr",
                "adresse": "ZI des Hauts-Bans, 67670 Willgottheim",
                "description": "Visserie, fixation, outillage professionnel",
            },
            {
                "nom": "Leroy Merlin Pro",
                "contact": "Espace Pro",
                "email": "pro@leroymerlin.fr",
                "telephone": "09 77 40 10 40",
                "site_web": "https://www.leroymerlin.fr",
                "adresse": "40 Avenue du Général de Gaulle, 93170 Bagnolet",
                "description": "Matériaux, bois, quincaillerie, peinture",
            },
            {
                "nom": "Reichelt Elektronik",
                "contact": "Service B2B",
                "email": "b2b@reichelt.com",
                "telephone": "+49 4422 955 333",
                "site_web": "https://www.reichelt.com/fr",
                "adresse": "Elektronikring 1, 26452 Sande, Allemagne",
                "description": "Composants électroniques, microcontrôleurs, capteurs",
            },
            {
                "nom": "Filimprimante3D",
                "contact": "Support technique",
                "email": "support@filimprimante3d.fr",
                "telephone": "01 88 33 07 50",
                "site_web": "https://www.filimprimante3d.fr",
                "adresse": "12 Rue de la Paix, 75002 Paris",
                "description": "Filaments et accessoires impression 3D",
            },
        ]
        fournisseurs_map = {}
        for f_data in fournisseurs_data:
            fournisseur = models.Fournisseur(**f_data, created_by=admin.id)
            db.add(fournisseur)
            db.commit()
            db.refresh(fournisseur)
            fournisseurs_map[f_data["nom"]] = fournisseur

        # ─────────────────────────────────────────────────
        # 5. Emplacements (Zone → Étagère → Boîte)
        # ─────────────────────────────────────────────────
        print("  [5/7] Création emplacements...")

        def add_emplacement(code, description, capacite_max=None, parent_id=None):
            e = models.Emplacement(
                code=code,
                description=description,
                capacite_max=capacite_max,
                parent_id=parent_id,
                created_by=admin.id,
            )
            db.add(e)
            db.commit()
            db.refresh(e)
            return e

        # Zone A — Matériaux
        zone_a = add_emplacement("ZONE-A", "Zone Matériaux — bois, métal, plastique")
        a1 = add_emplacement("A1", "Étagère Bois", capacite_max=50, parent_id=zone_a.id)
        a1_1 = add_emplacement("A1-1", "Boîte contreplaqués et planches", capacite_max=10, parent_id=a1.id)
        a1_2 = add_emplacement("A1-2", "Boîte tasseaux et profilés", capacite_max=20, parent_id=a1.id)
        a2 = add_emplacement("A2", "Étagère Métal & Plastique", capacite_max=30, parent_id=zone_a.id)

        # Zone B — Consommables & Outillage
        zone_b = add_emplacement("ZONE-B", "Zone Consommables et Outillage")
        b1 = add_emplacement("B1", "Étagère Outillage", capacite_max=40, parent_id=zone_b.id)
        b2 = add_emplacement("B2", "Étagère Consommables", capacite_max=100, parent_id=zone_b.id)
        b2_1 = add_emplacement("B2-1", "Boîte Visserie", capacite_max=50, parent_id=b2.id)
        b2_2 = add_emplacement("B2-2", "Boîte Colles et mastics", capacite_max=20, parent_id=b2.id)

        # Zone C — Électronique & Impression 3D
        zone_c = add_emplacement("ZONE-C", "Zone Électronique et Impression 3D")
        c1 = add_emplacement("C1", "Étagère Composants électroniques", capacite_max=200, parent_id=zone_c.id)
        c1_1 = add_emplacement("C1-1", "Boîte résistances et condensateurs", capacite_max=100, parent_id=c1.id)
        c2 = add_emplacement("C2", "Étagère Impression 3D", capacite_max=30, parent_id=zone_c.id)

        emplacements_map = {
            "A1-1": a1_1, "A1-2": a1_2, "A2": a2,
            "B1": b1, "B2-1": b2_1, "B2-2": b2_2,
            "C1-1": c1_1, "C2": c2,
        }

        # ─────────────────────────────────────────────────
        # 6. Articles
        # ─────────────────────────────────────────────────
        print("  [6/7] Création articles...")

        # Format : (nom, sku, qty, qty_min, prix_vente, cat_path,
        #           [tags], emplacement_code, ref_fournisseur, prix_fournisseur, delai_jours, [fournisseurs])
        articles_data = [
            # ── Matériaux > Bois ────────────────────────────────────────
            ("Contreplaqué 3mm 120x60", "MAT-CP-003", 5, 2, 3.50,
             "Matériaux/Bois", ["Bois", "Projet"], "A1-1",
             "CP3-120X60", 2.80, 5, ["Leroy Merlin Pro"]),
            ("Planche pin massif 200x20cm", "MAT-PP-200", 12, 5, 8.90,
             "Matériaux/Bois", ["Bois"], "A1-1",
             "PIN-200-20", 6.50, 5, ["Leroy Merlin Pro"]),
            ("Tasseau sapin 40x40mm x2m", "MAT-TA-040", 25, 10, 2.50,
             "Matériaux/Bois", ["Bois"], "A1-2",
             "TAS-4040-2M", 1.90, 5, ["Leroy Merlin Pro"]),

            # ── Matériaux > Métal ───────────────────────────────────────
            ("Tube aluminium carré 20x20mm x1m", "MAT-AL-020", 8, 3, 12.50,
             "Matériaux/Métal", ["Machine"], "A2",
             "ALU-20X20-1M", 9.80, 7, ["RS Components"]),
            ("Tôle acier galvanisé 2mm 50x50cm", "MAT-AC-002", 3, 1, 25.00,
             "Matériaux/Métal", ["Projet"], "A2",
             "ACIER-2MM-50", 18.50, 10, ["RS Components"]),

            # ── Consommables > Quincaillerie ────────────────────────────
            ("Vis bois Torx 4x40mm boîte 100", "CON-VB-440", 15, 5, 4.90,
             "Consommables/Quincaillerie", ["Visserie", "Consommable"], "B2-1",
             "WB-04040-T100", 3.20, 3, ["Würth France"]),
            ("Vis métal Torx 6x50mm boîte 50", "CON-VM-650", 8, 3, 6.50,
             "Consommables/Quincaillerie", ["Visserie"], "B2-1",
             "WB-06050-T50", 4.80, 3, ["Würth France"]),
            ("Écrous inox M8 boîte 100", "CON-EC-M08", 20, 10, 3.20,
             "Consommables/Quincaillerie", ["Visserie"], "B2-1",
             "ECR-M8-IN100", 2.10, 3, ["Würth France"]),
            ("Chevilles nylon 6mm boîte 50", "CON-CH-NYL", 12, 5, 2.80,
             "Consommables/Quincaillerie", ["Visserie", "Consommable"], "B2-1",
             "WB-CHV6-50", 1.80, 3, ["Würth France"]),

            # ── Consommables > Colles & Mastics ─────────────────────────
            ("Colle bois D3 express 250ml", "CON-CB-EXP", 4, 2, 5.50,
             "Consommables/Colles & Mastics", ["Colle", "Consommable"], "B2-2",
             "PRITT-CB-D3", 3.90, 5, ["Leroy Merlin Pro"]),
            ("Mastic silicone neutre transparent", "CON-MS-TRA", 6, 2, 7.20,
             "Consommables/Colles & Mastics", ["Colle"], "B2-2",
             "SIL-NEU-TRA", 5.10, 5, ["Leroy Merlin Pro"]),
            ("Super glue gel 3g", "CON-SG-GEL", 2, 3, 3.90,
             "Consommables/Colles & Mastics", ["Colle", "Urgent"], "B2-2",
             "SG-GEL-3G", 2.50, 2, ["Leroy Merlin Pro"]),

            # ── Consommables > Électricité ───────────────────────────────
            ("Câble HO7V-U 1.5mm² rouge 10m", "CON-CA-150", 5, 2, 12.00,
             "Consommables/Électricité", ["Électronique"], "B1",
             "CAB-HO7-R15", 8.50, 5, ["RS Components", "Leroy Merlin Pro"]),
            ("Domino 3 entrées boîte 10", "CON-DO-003", 15, 5, 2.50,
             "Consommables/Électricité", ["Électronique", "Consommable"], "B1",
             "DOM-3E-X10", 1.60, 5, ["Leroy Merlin Pro"]),

            # ── Consommables > Impression 3D ────────────────────────────
            ("Filament PLA Blanc 1.75mm 1kg", "CON-FI-PLA-BL", 2, 1, 19.90,
             "Consommables/Impression 3D", ["Projet", "Urgent"], "C2",
             "PLA-BL-175-1K", 15.90, 4, ["Filimprimante3D"]),
            ("Filament PETG Noir 1.75mm 1kg", "CON-FI-PET-NO", 3, 1, 24.90,
             "Consommables/Impression 3D", ["Projet"], "C2",
             "PETG-NO-175-1K", 19.90, 4, ["Filimprimante3D"]),
            ("Filament TPU Flexible 1.75mm 250g", "CON-FI-TPU", 1, 1, 16.90,
             "Consommables/Impression 3D", ["Projet", "Urgent"], "C2",
             "TPU-FL-175-250", 13.50, 7, ["Filimprimante3D"]),

            # ── Outillage > Manuel ───────────────────────────────────────
            ("Marteau menuisier 500g manche bois", "OUT-MA-500", 3, 1, 12.50,
             "Outillage/Manuel", ["Outil"], "B1",
             "WURTH-MA500", 8.90, 7, ["Würth France"]),
            ("Tournevis cruciforme PH2 150mm", "OUT-TO-PH2", 5, 2, 6.90,
             "Outillage/Manuel", ["Outil"], "B1",
             "WURTH-PH2-150", 4.50, 7, ["Würth France"]),

            # ── Outillage > Électrique ───────────────────────────────────
            ("Disque abrasif grain 80 125mm lot 10", "OUT-DP-G80", 8, 3, 12.00,
             "Outillage/Électrique/Pneumatique", ["Outil", "Consommable"], "B1",
             "LM-DISC-80-125", 7.50, 5, ["Leroy Merlin Pro"]),
            ("Foret bois hélicoïdal 8mm HSS", "OUT-FB-008", 6, 2, 4.50,
             "Outillage/Électrique/Pneumatique", ["Outil"], "B1",
             "WURTH-FB-8HSS", 2.90, 7, ["Würth France"]),

            # ── Pièces Détachées > Électronique ─────────────────────────
            ("Résistance 1/4W 220Ω lot 100", "PD-RE-220", 50, 20, 1.50,
             "Pièces Détachées/Électronique", ["Électronique", "Consommable"], "C1-1",
             "RS-220R-100", 0.80, 5, ["RS Components", "Reichelt Elektronik"]),
            ("LED rouge 5mm lot 50", "PD-LED-R5", 30, 15, 2.80,
             "Pièces Détachées/Électronique", ["Électronique"], "C1-1",
             "REICH-LED-R5-50", 1.50, 5, ["Reichelt Elektronik"]),
            ("Arduino Nano compatible USB-C", "PD-ARD-NANO", 4, 2, 8.50,
             "Pièces Détachées/Électronique", ["Électronique", "Projet"], "C1-1",
             "REICH-ARD-NANO", 4.90, 10, ["Reichelt Elektronik"]),
            ("Condensateur électrolytique 100µF 25V lot 10", "PD-CO-100", 25, 10, 1.20,
             "Pièces Détachées/Électronique", ["Électronique"], "C1-1",
             "RS-CAP-100U-25V", 0.65, 5, ["RS Components"]),
            ("Module relais 5V 1 canal", "PD-REL-5V", 5, 2, 4.90,
             "Pièces Détachées/Électronique", ["Électronique", "Machine"], "C1-1",
             "REICH-REL-5V1C", 2.80, 10, ["Reichelt Elektronik"]),

            # ── Pièces Détachées > Impression 3D ────────────────────────
            ("Buse laiton 0.4mm MK8", "PD-BU-04", 5, 2, 3.50,
             "Pièces Détachées/Impression 3D", ["Machine"], "C2",
             "FI3D-NOZZLE-04", 1.90, 5, ["Filimprimante3D"]),
            ("Courroie GT2 6mm 1m", "PD-CO-GT2", 3, 1, 6.80,
             "Pièces Détachées/Impression 3D", ["Machine", "Urgent"], "C2",
             "FI3D-GT2-6-1M", 4.20, 7, ["Filimprimante3D"]),
            ("Extrudeur BMG clone tout métal", "PD-EXT-BMG", 2, 1, 24.90,
             "Pièces Détachées/Impression 3D", ["Machine", "Urgent"], "C2",
             "FI3D-BMG-METAL", 18.50, 10, ["Filimprimante3D"]),

            # ── Projets > Menuiserie ─────────────────────────────────────
            ("Charnière laiton 40mm lot 2", "PRO-CH-L40", 10, 5, 4.20,
             "Projets/Menuiserie", ["Projet"], "B2-1",
             "WURTH-CH-L40-2", 2.80, 7, ["Würth France"]),
            ("Vernis bois incolore brillant 500ml", "PRO-VE-INC", 2, 1, 14.90,
             "Projets/Menuiserie", ["Peinture"], "B2-2",
             "LM-VER-INC-500", 10.50, 5, ["Leroy Merlin Pro"]),
        ]

        articles_list = []
        for (nom, sku, qty, qty_min, prix, cat_path, tag_names,
             emp_code, ref_fourn, prix_fourn, delai, fourn_names) in articles_data:
            categorie = categories_map.get(cat_path)
            if not categorie:
                continue
            emplacement = emplacements_map.get(emp_code)

            article = models.Article(
                nom=nom,
                sku=sku,
                quantite=qty,
                quantite_min=qty_min,
                prix_unitaire=prix,
                categorie_id=categorie.id,
                emplacement_id=emplacement.id if emplacement else None,
                description=f"Article de démonstration : {nom}",
                ref_fournisseur=ref_fourn,
                prix_fournisseur=prix_fourn,
                delai_livraison=delai,
                created_by=admin.id,
            )
            for tag_name in tag_names:
                tag = tags_map.get(tag_name)
                if tag:
                    article.tags.append(tag)
            for fourn_name in fourn_names:
                fourn = fournisseurs_map.get(fourn_name)
                if fourn:
                    article.fournisseurs.append(fourn)

            db.add(article)
            db.commit()
            db.refresh(article)
            articles_list.append(article)

        # ─────────────────────────────────────────────────
        # 7. Mouvements de stock (historique)
        # ─────────────────────────────────────────────────
        print("  [7/7] Création mouvements et commandes...")

        motifs_entree = [
            "Réception commande fournisseur",
            "Retour stock",
            "Inventaire initial",
            "Achat direct",
            "Correction stock positif",
        ]
        motifs_sortie = [
            "Utilisation projet",
            "Consommation atelier",
            "Prêt temporaire",
            "Perte / casse",
            "Utilisation machine CNC",
        ]

        random.seed(42)
        for _ in range(30):
            article = random.choice(articles_list)
            mouv_type = random.choice(["ENTREE", "SORTIE"])

            if mouv_type == "ENTREE":
                quantite = random.randint(5, 20)
                motif = random.choice(motifs_entree)
            else:
                if article.quantite < 1:
                    continue
                quantite = random.randint(1, min(5, article.quantite))
                motif = random.choice(motifs_sortie)

            if mouv_type == "SORTIE" and article.quantite < quantite:
                continue

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
                created_by=admin.id,  # FK integer (pas string)
            )
            days_ago = random.randint(0, 60)
            mouvement.created_at = datetime.utcnow() - timedelta(days=days_ago)
            db.add(mouvement)
            db.commit()

        # ─────────────────────────────────────────────────
        # Commandes / Demandes de devis (2 exemples)
        # ─────────────────────────────────────────────────

        # DEV-2026-001 — RS Components — ENVOYEE
        cmd1 = models.Commande(
            fournisseur_id=fournisseurs_map["RS Components"].id,
            numero_commande="DEV-2026-001",
            statut="ENVOYEE",
            date_commande=datetime.utcnow() - timedelta(days=5),
            montant_total=0,
            notes="Demande de devis pour réapprovisionnement électronique",
            created_by=admin.id,
        )
        db.add(cmd1)
        db.commit()
        db.refresh(cmd1)

        # Lignes cmd1
        articles_cmd1 = [
            (articles_list[21], 10, 0.80),  # Résistance 220Ω
            (articles_list[23], 5, 0.65),   # Condensateur 100µF
        ]
        total1 = 0.0
        for art, qte, prix_u in articles_cmd1:
            ligne = models.LigneCommande(
                commande_id=cmd1.id,
                article_id=art.id,
                quantite_commandee=qte,
                quantite_recue=0,
                prix_unitaire=prix_u,
                created_by=admin.id,
            )
            db.add(ligne)
            total1 += qte * prix_u
        cmd1.montant_total = total1
        db.commit()

        # DEV-2026-002 — Würth France — BROUILLON
        cmd2 = models.Commande(
            fournisseur_id=fournisseurs_map["Würth France"].id,
            numero_commande="DEV-2026-002",
            statut="BROUILLON",
            montant_total=0,
            notes="Devis vis et fixations pour projet atelier",
            created_by=admin.id,
        )
        db.add(cmd2)
        db.commit()
        db.refresh(cmd2)

        articles_cmd2 = [
            (articles_list[5], 200, 3.20),   # Vis bois Torx 4x40mm
            (articles_list[6], 100, 4.80),   # Vis métal Torx 6x50mm
        ]
        total2 = 0.0
        for art, qte, prix_u in articles_cmd2:
            ligne = models.LigneCommande(
                commande_id=cmd2.id,
                article_id=art.id,
                quantite_commandee=qte,
                quantite_recue=0,
                prix_unitaire=prix_u,
                created_by=admin.id,
            )
            db.add(ligne)
            total2 += qte * prix_u
        cmd2.montant_total = total2
        db.commit()

        # ─────────────────────────────────────────────────
        # Résumé
        # ─────────────────────────────────────────────────
        print(f"\n[OK] Base de données v2.0.0 créée : {db_path}")
        print(f"   - 1 utilisateur  : admin / admin")
        print(f"   - {len(categories_map)} catégories (hiérarchiques)")
        print(f"   - {len(tags_map)} tags colorés")
        print(f"   - {len(fournisseurs_map)} fournisseurs (avec email)")
        print(f"   - 14 emplacements (3 zones -> etageres -> boites)")
        print(f"   - {len(articles_list)} articles (avec emplacements + refs fournisseur)")
        print(f"   - ~30 mouvements de stock")
        print(f"   - 2 demandes de devis (1 brouillon, 1 envoyée)")

    except Exception as e:
        print(f"\n[ERREUR] lors de la création de la base : {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        db_path = sys.argv[1]
    else:
        db_path = Path(__file__).parent.parent / "build" / "database" / "inventaire.db"

    create_demo_database(db_path)
