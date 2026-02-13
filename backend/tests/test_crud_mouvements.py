"""
Tests pour les mouvements de stock
"""

import pytest


class TestCreateMouvement:
    """Tests pour la création de mouvements"""

    def test_create_mouvement_entree_admin(self, client, admin_token, sample_article):
        """Admin peut créer un mouvement ENTREE"""
        quantite_avant = sample_article.quantite

        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 20,
                "motif": "Réception commande"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "ENTREE"
        assert data["quantite"] == 20
        assert data["quantite_avant"] == quantite_avant
        assert data["quantite_apres"] == quantite_avant + 20
        assert data["motif"] == "Réception commande"

    def test_create_mouvement_sortie_admin(self, client, admin_token, sample_article):
        """Admin peut créer un mouvement SORTIE"""
        quantite_avant = sample_article.quantite

        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "SORTIE",
                "quantite": 5,
                "motif": "Utilisation projet X"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "SORTIE"
        assert data["quantite"] == 5
        assert data["quantite_avant"] == quantite_avant
        assert data["quantite_apres"] == quantite_avant - 5

    def test_create_mouvement_entree_gestionnaire(self, client, gestionnaire_token, sample_article):
        """Gestionnaire peut créer un mouvement ENTREE"""
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 15,
                "motif": "Test"
            }
        )
        assert response.status_code == 201

    def test_create_mouvement_technicien(self, client, technicien_token, sample_article):
        """Technicien peut créer un mouvement"""
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={
                "article_id": sample_article.id,
                "type": "SORTIE",
                "quantite": 3,
                "motif": "Utilisation atelier"
            }
        )
        # Technicien a mouvements:create dans ses permissions
        assert response.status_code == 201

    def test_create_mouvement_consultation_forbidden(self, client, consultation_token, sample_article):
        """Utilisateur consultation ne peut pas créer de mouvement"""
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 10,
                "motif": "Test"
            }
        )
        assert response.status_code == 403

    def test_create_mouvement_sortie_stock_insuffisant(self, client, admin_token, db, admin_user, sample_categorie):
        """Impossible de créer une SORTIE si stock insuffisant"""
        from app.models import Article

        # Créer article avec peu de stock
        article = Article(
            nom="Stock Limité",
            quantite=5,
            quantite_min=2,
            prix_unitaire=10.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id
        )
        db.add(article)
        db.commit()
        db.refresh(article)

        # Essayer de sortir plus que disponible
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": article.id,
                "type": "SORTIE",
                "quantite": 10,  # > 5 disponibles
                "motif": "Test"
            }
        )
        assert response.status_code == 400
        assert "insuffisant" in response.json()["detail"].lower()

    def test_create_mouvement_quantite_negative(self, client, admin_token, sample_article):
        """Impossible de créer un mouvement avec quantité négative"""
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": -5,
                "motif": "Test"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_create_mouvement_quantite_zero(self, client, admin_token, sample_article):
        """Impossible de créer un mouvement avec quantité 0"""
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 0,
                "motif": "Test"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_create_mouvement_article_inexistant(self, client, admin_token):
        """Erreur si article inexistant"""
        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": 99999,
                "type": "ENTREE",
                "quantite": 10,
                "motif": "Test"
            }
        )
        assert response.status_code == 404


class TestGetMouvements:
    """Tests pour la récupération des mouvements"""

    def test_get_mouvements_list(self, client, admin_token, sample_article, db):
        """Récupère la liste des mouvements"""
        from app.models import Mouvement

        # Créer quelques mouvements
        mvt1 = Mouvement(
            article_id=sample_article.id,
            type="ENTREE",
            quantite=10,
            quantite_avant=sample_article.quantite,
            quantite_apres=sample_article.quantite + 10,
            motif="Test 1"
        )
        mvt2 = Mouvement(
            article_id=sample_article.id,
            type="SORTIE",
            quantite=5,
            quantite_avant=sample_article.quantite + 10,
            quantite_apres=sample_article.quantite + 5,
            motif="Test 2"
        )
        db.add_all([mvt1, mvt2])
        db.commit()

        response = client.get(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 2

    def test_get_mouvements_by_article(self, client, admin_token, sample_article, db, admin_user, sample_categorie):
        """Filtre mouvements par article"""
        from app.models import Article, Mouvement

        # Créer un autre article
        article2 = Article(
            nom="Autre Article",
            quantite=10,
            quantite_min=5,
            prix_unitaire=10.0,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id
        )
        db.add(article2)
        db.commit()
        db.refresh(article2)

        # Créer mouvement pour sample_article
        mvt1 = Mouvement(
            article_id=sample_article.id,
            type="ENTREE",
            quantite=10,
            quantite_avant=sample_article.quantite,
            quantite_apres=sample_article.quantite + 10,
            motif="Test article 1"
        )
        db.add(mvt1)
        db.commit()

        # Filtrer par article
        response = client.get(
            f"/api/mouvements?article_id={sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        # Tous les mouvements doivent être pour cet article
        assert all(item["article_id"] == sample_article.id for item in data["items"])

    def test_get_mouvements_by_type(self, client, admin_token, sample_article, db):
        """Filtre mouvements par type (ENTREE/SORTIE)"""
        from app.models import Mouvement

        # Créer ENTREE
        mvt_entree = Mouvement(
            article_id=sample_article.id,
            type="ENTREE",
            quantite=10,
            quantite_avant=sample_article.quantite,
            quantite_apres=sample_article.quantite + 10,
            motif="Test ENTREE"
        )
        db.add(mvt_entree)
        db.commit()

        # Filtrer ENTREE
        response = client.get(
            "/api/mouvements?type=ENTREE",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Tous les mouvements doivent être de type ENTREE
        assert all(item["type"] == "ENTREE" for item in data["items"])

    def test_get_mouvement_by_id(self, client, admin_token, sample_article, db):
        """Récupère un mouvement par son ID"""
        from app.models import Mouvement

        mvt = Mouvement(
            article_id=sample_article.id,
            type="ENTREE",
            quantite=15,
            quantite_avant=sample_article.quantite,
            quantite_apres=sample_article.quantite + 15,
            motif="Test GET by ID"
        )
        db.add(mvt)
        db.commit()
        db.refresh(mvt)

        response = client.get(
            f"/api/mouvements/{mvt.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == mvt.id
        assert data["type"] == "ENTREE"
        assert data["quantite"] == 15

    def test_get_nonexistent_mouvement(self, client, admin_token):
        """Erreur 404 pour mouvement inexistant"""
        response = client.get(
            "/api/mouvements/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_get_mouvements_pagination(self, client, admin_token, sample_article, db):
        """Pagination des mouvements"""
        from app.models import Mouvement

        # Créer 15 mouvements
        for i in range(15):
            mvt = Mouvement(
                article_id=sample_article.id,
                type="ENTREE" if i % 2 == 0 else "SORTIE",
                quantite=1,
                quantite_avant=sample_article.quantite,
                quantite_apres=sample_article.quantite + 1,
                motif=f"Mouvement {i}"
            )
            db.add(mvt)
        db.commit()

        # Première page
        response = client.get(
            "/api/mouvements?skip=0&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10

        # Deuxième page
        response = client.get(
            "/api/mouvements?skip=10&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 5


class TestMouvementsStockUpdate:
    """Tests pour vérifier la mise à jour du stock"""

    def test_entree_increments_stock(self, client, admin_token, sample_article, db):
        """ENTREE augmente le stock de l'article"""
        quantite_initiale = sample_article.quantite

        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 25,
                "motif": "Test incrémentation"
            }
        )
        assert response.status_code == 201

        # Vérifier que le stock a augmenté
        db.refresh(sample_article)
        assert sample_article.quantite == quantite_initiale + 25

    def test_sortie_decrements_stock(self, client, admin_token, sample_article, db):
        """SORTIE diminue le stock de l'article"""
        quantite_initiale = sample_article.quantite

        response = client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "SORTIE",
                "quantite": 3,
                "motif": "Test décrémentation"
            }
        )
        assert response.status_code == 201

        # Vérifier que le stock a diminué
        db.refresh(sample_article)
        assert sample_article.quantite == quantite_initiale - 3

    def test_multiple_mouvements_correct_stock(self, client, admin_token, sample_article, db):
        """Plusieurs mouvements successifs maintiennent le stock correct"""
        quantite_initiale = sample_article.quantite

        # ENTREE +20
        client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 20,
                "motif": "Test 1"
            }
        )

        # SORTIE -5
        client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "SORTIE",
                "quantite": 5,
                "motif": "Test 2"
            }
        )

        # ENTREE +10
        client.post(
            "/api/mouvements",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "article_id": sample_article.id,
                "type": "ENTREE",
                "quantite": 10,
                "motif": "Test 3"
            }
        )

        # Vérifier stock final = initial + 20 - 5 + 10 = initial + 25
        db.refresh(sample_article)
        assert sample_article.quantite == quantite_initiale + 25


class TestMouvementsWithArticleDetails:
    """Tests pour les mouvements avec détails de l'article"""

    def test_mouvement_includes_article_details(self, client, admin_token, sample_article, db):
        """Le mouvement retourné inclut les détails de l'article"""
        from app.models import Mouvement

        mvt = Mouvement(
            article_id=sample_article.id,
            type="ENTREE",
            quantite=10,
            quantite_avant=sample_article.quantite,
            quantite_apres=sample_article.quantite + 10,
            motif="Test avec article"
        )
        db.add(mvt)
        db.commit()
        db.refresh(mvt)

        response = client.get(
            f"/api/mouvements/{mvt.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()

        # Vérifier que les détails de l'article sont présents
        assert "article" in data
        assert data["article"]["nom"] == sample_article.nom
        assert data["article"]["id"] == sample_article.id
