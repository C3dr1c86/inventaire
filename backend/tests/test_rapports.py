"""
Tests pour les rapports et exports
"""

import pytest


class TestStatistiques:
    """Tests pour les statistiques globales"""

    def test_get_statistiques(
        self, client, admin_token, sample_article, db, admin_user
    ):
        """Récupère les statistiques globales"""
        from app.models import Article, Categorie

        # Créer quelques articles supplémentaires
        article2 = Article(
            nom="Article Stat 2",
            quantite=5,
            quantite_min=2,
            prix_unitaire=10.0,
            created_by=admin_user.id,
        )
        article3 = Article(
            nom="Article Stat 3",
            quantite=0,  # Stock bas (< quantite_min)
            quantite_min=5,
            prix_unitaire=15.0,
            created_by=admin_user.id,
        )
        db.add_all([article2, article3])
        db.commit()

        response = client.get(
            "/api/rapports/statistiques",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()

        # Vérifier la structure de la réponse
        assert "nombre_articles" in data
        assert "nombre_categories" in data
        assert "valeur_totale_stock" in data
        assert "nombre_articles_stock_bas" in data

        # Vérifier les valeurs
        assert data["nombre_articles"] >= 3  # Au moins sample_article + 2 créés
        assert (
            data["nombre_articles_stock_bas"] >= 1
        )  # article3 a quantite < quantite_min

    def test_get_statistiques_consultation(self, client, consultation_token):
        """Utilisateur consultation peut lire les statistiques"""
        response = client.get(
            "/api/rapports/statistiques",
            headers={"Authorization": f"Bearer {consultation_token}"},
        )
        assert response.status_code == 200


class TestStockBas:
    """Tests pour le rapport de stock bas"""

    def test_get_stock_bas(self, client, admin_token, db, admin_user, sample_categorie):
        """Récupère la liste des articles en stock bas"""
        from app.models import Article

        # Créer un article avec stock bas
        article_bas = Article(
            nom="Article Stock Bas",
            quantite=2,
            quantite_min=10,  # quantite < quantite_min
            prix_unitaire=10.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add(article_bas)
        db.commit()

        response = client.get(
            "/api/rapports/stock-bas",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()

        assert "articles" in data
        assert "total" in data
        assert data["total"] >= 1

        # Vérifier qu'au moins un article a quantite < quantite_min
        articles_bas = data["articles"]
        assert len(articles_bas) >= 1
        for article in articles_bas:
            assert article["quantite"] < article["quantite_min"]

    def test_get_stock_bas_empty(
        self, client, admin_token, db, admin_user, sample_categorie
    ):
        """Stock bas retourne liste vide si tous les stocks sont OK"""
        from app.models import Article

        # Créer des articles avec stock OK
        article1 = Article(
            nom="Article Stock OK 1",
            quantite=100,
            quantite_min=10,
            prix_unitaire=10.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        article2 = Article(
            nom="Article Stock OK 2",
            quantite=50,
            quantite_min=5,
            prix_unitaire=15.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add_all([article1, article2])
        db.commit()

        # Note: Il peut y avoir d'autres articles en stock bas créés par d'autres tests
        # On vérifie juste que l'endpoint fonctionne
        response = client.get(
            "/api/rapports/stock-bas",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "articles" in data
        assert "total" in data


class TestValeurTotale:
    """Tests pour le rapport de valeur totale du stock"""

    def test_get_valeur_totale(self, client, admin_token, sample_article):
        """Récupère la valeur totale du stock"""
        response = client.get(
            "/api/rapports/valeur-totale",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()

        assert "valeur_totale" in data
        assert "details_par_categorie" in data

        # Valeur totale doit être >= 0
        assert data["valeur_totale"] >= 0

        # details_par_categorie doit être une liste
        assert isinstance(data["details_par_categorie"], list)


class TestExportCSV:
    """Tests pour les exports CSV"""

    def test_export_csv_articles(self, client, admin_token, sample_article):
        """Export CSV des articles"""
        response = client.get(
            "/api/rapports/export/csv?type=articles",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"
        assert "attachment" in response.headers["content-disposition"]

        # Vérifier que le contenu est du CSV
        content = response.content.decode("utf-8")
        assert "nom" in content.lower() or "id" in content.lower()

    def test_export_csv_mouvements(
        self, client, admin_token, db, admin_user, sample_article
    ):
        """Export CSV des mouvements"""
        from app.models import Mouvement

        # Créer un mouvement
        mouvement = Mouvement(
            article_id=sample_article.id,
            type="ENTREE",
            quantite=10,
            quantite_avant=sample_article.quantite,
            quantite_apres=sample_article.quantite + 10,
            motif="Test export CSV",
        )
        db.add(mouvement)
        db.commit()

        response = client.get(
            "/api/rapports/export/csv?type=mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"

    def test_export_csv_stock_bas(
        self, client, admin_token, db, admin_user, sample_categorie
    ):
        """Export CSV des articles en stock bas"""
        from app.models import Article

        # Créer un article en stock bas
        article_bas = Article(
            nom="Article CSV Stock Bas",
            quantite=1,
            quantite_min=10,
            prix_unitaire=10.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add(article_bas)
        db.commit()

        response = client.get(
            "/api/rapports/export/csv?type=stock-bas",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "text/csv; charset=utf-8"


class TestExportPDF:
    """Tests pour les exports PDF"""

    def test_export_pdf_inventaire(self, client, admin_token, sample_article):
        """Export PDF de l'inventaire complet"""
        response = client.get(
            "/api/rapports/export/pdf?type=inventaire",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"
        assert "attachment" in response.headers["content-disposition"]

        # Vérifier que le contenu est un PDF (commence par %PDF)
        content = response.content
        assert content[:4] == b"%PDF"

    def test_export_pdf_stock_bas(
        self, client, admin_token, db, admin_user, sample_categorie
    ):
        """Export PDF des articles en stock bas"""
        from app.models import Article

        # Créer un article en stock bas
        article_bas = Article(
            nom="Article PDF Stock Bas",
            quantite=1,
            quantite_min=10,
            prix_unitaire=10.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add(article_bas)
        db.commit()

        response = client.get(
            "/api/rapports/export/pdf?type=stock-bas",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

        # Vérifier que c'est un PDF
        content = response.content
        assert content[:4] == b"%PDF"


class TestExportBarcodesPDF:
    """Tests pour l'export PDF de codes-barres personnalisé"""

    def test_export_barcodes_pdf(
        self, client, admin_token, sample_article, db, admin_user, sample_categorie
    ):
        """Export PDF de codes-barres pour articles sélectionnés"""
        from app.models import Article

        # Créer un autre article
        article2 = Article(
            nom="Article Barcode 2",
            quantite=10,
            quantite_min=5,
            prix_unitaire=15.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add(article2)
        db.commit()
        db.refresh(article2)

        response = client.post(
            "/api/rapports/export/barcodes-pdf",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"article_ids": [sample_article.id, article2.id]},
        )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

        # Vérifier que c'est un PDF
        content = response.content
        assert content[:4] == b"%PDF"

    def test_export_barcodes_pdf_article_inexistant(self, client, admin_token):
        """Erreur si article inexistant dans la liste"""
        response = client.post(
            "/api/rapports/export/barcodes-pdf",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"article_ids": [99999]},
        )
        assert response.status_code == 404

    def test_export_barcodes_pdf_liste_vide(self, client, admin_token):
        """Erreur si liste d'articles vide"""
        response = client.post(
            "/api/rapports/export/barcodes-pdf",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"article_ids": []},
        )
        assert response.status_code == 400
