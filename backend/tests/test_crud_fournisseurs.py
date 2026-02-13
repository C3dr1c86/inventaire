"""
Tests pour les fournisseurs
"""

import pytest


class TestCreateFournisseur:
    """Tests pour la création de fournisseurs"""

    def test_create_fournisseur_admin(self, client, admin_token):
        """Admin peut créer un fournisseur"""
        response = client.post(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Fournisseur Test",
                "email": "contact@fournisseur-test.fr",
                "telephone": "0123456789",
                "adresse": "123 Rue de Test, 75001 Paris"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nom"] == "Fournisseur Test"
        assert data["email"] == "contact@fournisseur-test.fr"
        assert data["telephone"] == "0123456789"
        assert data["adresse"] == "123 Rue de Test, 75001 Paris"

    def test_create_fournisseur_gestionnaire(self, client, gestionnaire_token):
        """Gestionnaire peut créer un fournisseur"""
        response = client.post(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={
                "nom": "Fournisseur Gest",
                "email": "gest@fournisseur.fr"
            }
        )
        assert response.status_code == 201

    def test_create_fournisseur_technicien(self, client, technicien_token):
        """Technicien peut créer un fournisseur (pas de permissions sur ce module)"""
        response = client.post(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={
                "nom": "Fournisseur Tech",
                "email": "tech@fournisseur.fr"
            }
        )
        assert response.status_code == 201

    def test_create_fournisseur_consultation(self, client, consultation_token):
        """Utilisateur consultation peut créer un fournisseur (pas de permissions sur ce module)"""
        response = client.post(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={
                "nom": "Fournisseur Consult",
                "email": "consult@fournisseur.fr"
            }
        )
        assert response.status_code == 201

    def test_create_fournisseur_validation_email(self, client, admin_token):
        """Validation email - doit être valide"""
        response = client.post(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Fournisseur Invalid",
                "email": "invalid-email"
            }
        )
        assert response.status_code == 422  # Pydantic validation error


class TestGetFournisseurs:
    """Tests pour la récupération des fournisseurs"""

    def test_get_fournisseurs_list(self, client, admin_token, sample_fournisseur):
        """Récupère la liste des fournisseurs"""
        response = client.get(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Liste simple, pas de pagination
        assert isinstance(data, list)
        assert len(data) >= 1
        # Vérifier que sample_fournisseur est dans la liste
        fournisseur_ids = [f["id"] for f in data]
        assert sample_fournisseur.id in fournisseur_ids

    def test_get_fournisseur_by_id(self, client, admin_token, sample_fournisseur):
        """Récupère un fournisseur par son ID"""
        response = client.get(
            f"/api/fournisseurs/{sample_fournisseur.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_fournisseur.id
        assert data["nom"] == sample_fournisseur.nom
        assert data["email"] == sample_fournisseur.email

    def test_get_nonexistent_fournisseur(self, client, admin_token):
        """Erreur 404 pour fournisseur inexistant"""
        response = client.get(
            "/api/fournisseurs/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_get_fournisseurs_consultation(self, client, consultation_token, sample_fournisseur):
        """Utilisateur consultation peut lire les fournisseurs"""
        response = client.get(
            "/api/fournisseurs",
            headers={"Authorization": f"Bearer {consultation_token}"}
        )
        assert response.status_code == 200


class TestUpdateFournisseur:
    """Tests pour la modification de fournisseurs"""

    def test_update_fournisseur_admin(self, client, admin_token, sample_fournisseur):
        """Admin peut modifier un fournisseur"""
        response = client.put(
            f"/api/fournisseurs/{sample_fournisseur.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Fournisseur Modifié",
                "telephone": "9876543210"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Fournisseur Modifié"
        assert data["telephone"] == "9876543210"

    def test_update_fournisseur_gestionnaire(self, client, gestionnaire_token, sample_fournisseur):
        """Gestionnaire peut modifier un fournisseur"""
        response = client.put(
            f"/api/fournisseurs/{sample_fournisseur.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={"nom": "Fournisseur Gest Modif"}
        )
        assert response.status_code == 200

    def test_update_fournisseur_technicien(self, client, technicien_token, sample_fournisseur):
        """Technicien peut modifier un fournisseur (pas de permissions sur ce module)"""
        response = client.put(
            f"/api/fournisseurs/{sample_fournisseur.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"nom": "Fournisseur Tech Modif"}
        )
        assert response.status_code == 200

    def test_update_nonexistent_fournisseur(self, client, admin_token):
        """Erreur 404 pour modification fournisseur inexistant"""
        response = client.put(
            "/api/fournisseurs/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Inexistant"}
        )
        assert response.status_code == 404


class TestDeleteFournisseur:
    """Tests pour la suppression de fournisseurs"""

    def test_delete_fournisseur_admin(self, client, admin_token, db, admin_user):
        """Admin peut supprimer un fournisseur"""
        from app.models import Fournisseur

        # Créer un fournisseur à supprimer
        fournisseur = Fournisseur(
            nom="Fournisseur à Supprimer",
            email="delete@test.com",
            created_by=admin_user.id
        )
        db.add(fournisseur)
        db.commit()
        db.refresh(fournisseur)

        response = client.delete(
            f"/api/fournisseurs/{fournisseur.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

        # Vérifier que le fournisseur est supprimé
        response = client.get(
            f"/api/fournisseurs/{fournisseur.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_delete_fournisseur_gestionnaire(self, client, gestionnaire_token, db, admin_user):
        """Gestionnaire peut supprimer un fournisseur"""
        from app.models import Fournisseur

        fournisseur = Fournisseur(
            nom="Fournisseur Gest Delete",
            email="gest-delete@test.com",
            created_by=admin_user.id
        )
        db.add(fournisseur)
        db.commit()
        db.refresh(fournisseur)

        response = client.delete(
            f"/api/fournisseurs/{fournisseur.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"}
        )
        assert response.status_code == 200

    def test_delete_fournisseur_technicien(self, client, technicien_token, db, admin_user):
        """Technicien peut supprimer un fournisseur (pas de permissions sur ce module)"""
        from app.models import Fournisseur

        fournisseur = Fournisseur(
            nom="Fournisseur Tech Delete",
            email="tech-delete@test.com",
            created_by=admin_user.id
        )
        db.add(fournisseur)
        db.commit()
        db.refresh(fournisseur)

        response = client.delete(
            f"/api/fournisseurs/{fournisseur.id}",
            headers={"Authorization": f"Bearer {technicien_token}"}
        )
        assert response.status_code == 200

    def test_delete_nonexistent_fournisseur(self, client, admin_token):
        """Erreur 404 pour suppression fournisseur inexistant"""
        response = client.delete(
            "/api/fournisseurs/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestFournisseurArticleAssociation:
    """Tests pour l'association fournisseurs-articles"""

    def test_associer_fournisseur_article_admin(self, client, admin_token, sample_fournisseur, sample_article):
        """Admin peut associer un fournisseur à un article"""
        response = client.post(
            f"/api/fournisseurs/{sample_fournisseur.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Retourne l'article complet
        assert data["id"] == sample_article.id
        assert "fournisseurs" in data

    def test_associer_fournisseur_article_gestionnaire(self, client, gestionnaire_token, sample_fournisseur, sample_article):
        """Gestionnaire peut associer un fournisseur à un article"""
        response = client.post(
            f"/api/fournisseurs/{sample_fournisseur.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"}
        )
        assert response.status_code == 200

    def test_retirer_fournisseur_article_admin(self, client, admin_token, sample_fournisseur, sample_article, db):
        """Admin peut retirer un fournisseur d'un article"""
        # D'abord associer via ORM
        sample_article.fournisseurs.append(sample_fournisseur)
        db.commit()

        # Puis retirer
        response = client.delete(
            f"/api/fournisseurs/{sample_fournisseur.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Retourne l'article complet
        assert data["id"] == sample_article.id

    def test_retirer_fournisseur_article_technicien(self, client, technicien_token, sample_fournisseur, sample_article, db):
        """Technicien peut retirer un fournisseur d'un article (pas de permissions sur ce module)"""
        # D'abord associer via ORM
        sample_article.fournisseurs.append(sample_fournisseur)
        db.commit()

        response = client.delete(
            f"/api/fournisseurs/{sample_fournisseur.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {technicien_token}"}
        )
        assert response.status_code == 200

    def test_liste_articles_fournisseur(self, client, admin_token, sample_fournisseur, sample_article, db):
        """Récupère la liste des articles d'un fournisseur"""
        # Associer l'article au fournisseur via ORM
        sample_article.fournisseurs.append(sample_fournisseur)
        db.commit()

        response = client.get(
            f"/api/fournisseurs/{sample_fournisseur.id}/articles",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        # Vérifier que sample_article est dans la liste
        article_ids = [a["id"] for a in data]
        assert sample_article.id in article_ids

    def test_associer_fournisseur_inexistant(self, client, admin_token, sample_article):
        """Erreur 404 pour association avec fournisseur inexistant"""
        response = client.post(
            f"/api/fournisseurs/99999/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_associer_article_inexistant(self, client, admin_token, sample_fournisseur):
        """Erreur 404 pour association avec article inexistant"""
        response = client.post(
            f"/api/fournisseurs/{sample_fournisseur.id}/articles/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
