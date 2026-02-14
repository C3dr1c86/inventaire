"""
Tests pour les opérations CRUD sur les articles
"""


class TestCreateArticle:
    """Tests pour la création d'articles"""

    def test_create_article_admin(self, client, admin_token, sample_categorie):
        """Admin peut créer un article"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Nouvel Article",
                "quantite": 50,
                "quantite_min": 10,
                "prix_unitaire": 29.99,
                "sku": "NEW-001",
                "categorie_id": sample_categorie.id,
                "description": "Description test",
            },
        )
        assert response.status_code == 201  # Created
        data = response.json()
        assert data["nom"] == "Nouvel Article"
        assert data["quantite"] == 50
        assert data["prix_unitaire"] == 29.99
        assert data["sku"] == "NEW-001"
        assert data["created_by"] == 1  # admin_user.id

    def test_create_article_gestionnaire(
        self, client, gestionnaire_token, sample_categorie
    ):
        """Gestionnaire peut créer un article"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={
                "nom": "Article Gestionnaire",
                "quantite": 100,
                "quantite_min": 20,
                "prix_unitaire": 15.50,
                "categorie_id": sample_categorie.id,
            },
        )
        assert response.status_code == 201

    def test_create_article_consultation_forbidden(
        self, client, consultation_token, sample_categorie
    ):
        """Utilisateur consultation ne peut pas créer d'article"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={
                "nom": "Test",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 10,
                "categorie_id": sample_categorie.id,
            },
        )
        assert response.status_code == 403

    def test_create_article_negative_quantite(
        self, client, admin_token, sample_categorie
    ):
        """Valide que quantité négative est refusée"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Test",
                "quantite": -5,
                "quantite_min": 5,
                "prix_unitaire": 10,
                "categorie_id": sample_categorie.id,
            },
        )
        assert response.status_code == 422  # Validation error

    def test_create_article_negative_prix(self, client, admin_token, sample_categorie):
        """Valide que prix négatif est refusé"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Test",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": -10.5,
                "categorie_id": sample_categorie.id,
            },
        )
        assert response.status_code == 422

    def test_create_article_without_categorie(self, client, admin_token):
        """Peut créer un article sans catégorie"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Article Sans Catégorie",
                "quantite": 5,
                "quantite_min": 2,
                "prix_unitaire": 7.99,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["categorie"] is None


class TestGetArticles:
    """Tests pour la récupération de la liste d'articles"""

    def test_get_articles_list(self, client, admin_token, sample_article):
        """Récupère la liste des articles"""
        response = client.get(
            "/api/articles", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert data["total"] >= 1
        assert any(item["nom"] == "Test Article" for item in data["items"])

    def test_get_articles_with_search(self, client, admin_token, sample_article):
        """Recherche d'articles par nom"""
        response = client.get(
            "/api/articles?search=Test",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["nom"] == "Test Article" for item in data["items"])

    def test_get_articles_with_categorie_filter(
        self, client, admin_token, sample_article
    ):
        """Filtre articles par catégorie"""
        response = client.get(
            f"/api/articles?categorie_id={sample_article.categorie_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert all(
            item["categorie_id"] == sample_article.categorie_id
            for item in data["items"]
        )

    def test_get_articles_with_stock_bas_filter(
        self, client, admin_token, db, admin_user, sample_categorie
    ):
        """Filtre articles en stock bas"""
        from app.models import Article

        # Créer article avec stock < quantite_min
        article_bas = Article(
            nom="Stock Bas",
            quantite=3,
            quantite_min=10,
            prix_unitaire=10,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add(article_bas)
        db.commit()

        response = client.get(
            "/api/articles?stock_bas=true",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(item["nom"] == "Stock Bas" for item in data["items"])

    def test_get_articles_pagination(
        self, client, admin_token, db, admin_user, sample_categorie
    ):
        """Pagination des articles"""
        from app.models import Article

        # Créer plusieurs articles
        for i in range(15):
            article = Article(
                nom=f"Article {i}",
                quantite=10,
                quantite_min=5,
                prix_unitaire=10.0,
                categorie_id=sample_categorie.id,
                created_by=admin_user.id,
            )
            db.add(article)
        db.commit()

        # Première page
        response = client.get(
            "/api/articles?skip=0&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 10

        # Deuxième page
        response = client.get(
            "/api/articles?skip=10&limit=10",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 5


class TestGetArticle:
    """Tests pour la récupération d'un article spécifique"""

    def test_get_article_by_id(self, client, admin_token, sample_article):
        """Récupère un article par son ID"""
        response = client.get(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_article.id
        assert data["nom"] == sample_article.nom
        assert data["quantite"] == sample_article.quantite

    def test_get_nonexistent_article(self, client, admin_token):
        """Erreur 404 pour article inexistant"""
        response = client.get(
            "/api/articles/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestUpdateArticle:
    """Tests pour la modification d'articles"""

    def test_update_article_admin(self, client, admin_token, sample_article):
        """Admin peut modifier un article"""
        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Article Modifié", "quantite": 20},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Article Modifié"
        assert data["quantite"] == 20
        assert data["updated_by"] == 1  # admin_user.id

    def test_update_article_gestionnaire(
        self, client, gestionnaire_token, sample_article
    ):
        """Gestionnaire peut modifier un article"""
        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={"nom": "Modification Gestionnaire"},
        )
        assert response.status_code == 200

    def test_update_article_technicien_forbidden(
        self, client, technicien_token, sample_article
    ):
        """Technicien ne peut pas modifier un article"""
        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"nom": "Test"},
        )
        assert response.status_code == 403

    def test_update_article_consultation_forbidden(
        self, client, consultation_token, sample_article
    ):
        """Utilisateur consultation ne peut pas modifier"""
        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={"nom": "Test"},
        )
        assert response.status_code == 403

    def test_update_article_partial(self, client, admin_token, sample_article):
        """Mise à jour partielle d'un article"""
        original_nom = sample_article.nom

        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"quantite": 100},  # Ne modifier que la quantité
        )
        assert response.status_code == 200
        data = response.json()
        assert data["quantite"] == 100
        # Le nom ne devrait pas avoir changé
        assert data["nom"] == original_nom


class TestDeleteArticle:
    """Tests pour la suppression d'articles"""

    def test_delete_article_admin(self, client, admin_token, sample_article):
        """Admin peut supprimer un article"""
        article_id = sample_article.id

        response = client.delete(
            f"/api/articles/{article_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200

        # Vérifier que l'article n'existe plus
        response = client.get(
            f"/api/articles/{article_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404

    def test_delete_article_gestionnaire(
        self, client, gestionnaire_token, db, admin_user, sample_categorie
    ):
        """Gestionnaire peut supprimer un article"""
        from app.models import Article

        # Créer un article à supprimer
        article = Article(
            nom="À Supprimer",
            quantite=5,
            quantite_min=2,
            prix_unitaire=10,
            categorie_id=sample_categorie.id,
            created_by=admin_user.id,
        )
        db.add(article)
        db.commit()
        db.refresh(article)

        response = client.delete(
            f"/api/articles/{article.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
        )
        assert response.status_code == 200

    def test_delete_article_consultation_forbidden(
        self, client, consultation_token, sample_article
    ):
        """Utilisateur consultation ne peut pas supprimer"""
        response = client.delete(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {consultation_token}"},
        )
        assert response.status_code == 403

    def test_delete_nonexistent_article(self, client, admin_token):
        """Erreur 404 lors de la suppression d'un article inexistant"""
        response = client.delete(
            "/api/articles/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestArticlesWithTags:
    """Tests pour les articles avec tags"""

    def test_create_article_with_tags(
        self, client, admin_token, sample_categorie, db, admin_user
    ):
        """Créer un article avec tags"""
        from app.models import Tag

        # Créer des tags
        tag1 = Tag(nom="Important", couleur="#FF0000", created_by=admin_user.id)
        tag2 = Tag(nom="Urgent", couleur="#00FF00", created_by=admin_user.id)
        db.add_all([tag1, tag2])
        db.commit()

        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Article avec Tags",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 25.0,
                "categorie_id": sample_categorie.id,
                "tag_ids": [tag1.id, tag2.id],
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["tags"]) == 2

    def test_update_article_tags(
        self, client, admin_token, sample_article, db, admin_user
    ):
        """Modifier les tags d'un article"""
        from app.models import Tag

        # Créer un tag
        tag = Tag(nom="Nouveau", couleur="#0000FF", created_by=admin_user.id)
        db.add(tag)
        db.commit()

        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"tag_ids": [tag.id]},
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["tags"]) == 1
        assert data["tags"][0]["nom"] == "Nouveau"


class TestArticlesWithFournisseurs:
    """Tests pour les articles avec fournisseurs"""

    def test_create_article_with_fournisseur(
        self, client, admin_token, sample_categorie, sample_fournisseur
    ):
        """Créer un article avec fournisseur"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Article avec Fournisseur",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 20.0,
                "categorie_id": sample_categorie.id,
                "fournisseur_ids": [sample_fournisseur.id],
                "prix_fournisseur": 15.0,
                "ref_fournisseur": "REF-123",
                "delai_livraison": 7,
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["fournisseurs"]) == 1
        assert data["prix_fournisseur"] == 15.0
        assert data["ref_fournisseur"] == "REF-123"
        assert data["delai_livraison"] == 7
