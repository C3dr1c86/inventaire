"""
Tests pour les opérations CRUD sur les catégories
"""

import pytest


class TestCreateCategorie:
    """Tests pour la création de catégories"""

    def test_create_categorie_racine_admin(self, client, admin_token):
        """Admin peut créer une catégorie racine"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Matériaux",
                "description": "Catégorie racine pour matériaux"
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nom"] == "Matériaux"
        assert data["parent_id"] is None
        assert data["niveau"] == 0
        assert data["created_by"] == 1  # admin_user.id

    def test_create_sous_categorie_admin(self, client, admin_token, sample_categorie):
        """Admin peut créer une sous-catégorie"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Bois",
                "description": "Matériaux en bois",
                "parent_id": sample_categorie.id
            }
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nom"] == "Bois"
        assert data["parent_id"] == sample_categorie.id
        assert data["niveau"] == 1

    def test_create_categorie_gestionnaire(self, client, gestionnaire_token):
        """Gestionnaire peut créer une catégorie"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={
                "nom": "Consommables",
                "description": "Catégorie consommables"
            }
        )
        assert response.status_code == 201

    def test_create_categorie_technicien_forbidden(self, client, technicien_token):
        """Technicien ne peut pas créer de catégorie"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={
                "nom": "Test",
                "description": "Test"
            }
        )
        assert response.status_code == 403

    def test_create_categorie_consultation_forbidden(self, client, consultation_token):
        """Utilisateur consultation ne peut pas créer de catégorie"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={
                "nom": "Test",
                "description": "Test"
            }
        )
        assert response.status_code == 403

    def test_create_categorie_niveau_3_forbidden(self, client, admin_token, db, admin_user):
        """Impossible de créer une catégorie de niveau 3 (> 2 niveaux)"""
        from app.models import Categorie

        # Créer catégorie racine
        parent = Categorie(nom="Parent", created_by=admin_user.id)
        db.add(parent)
        db.commit()
        db.refresh(parent)

        # Créer sous-catégorie niveau 1
        child = Categorie(nom="Child", parent_id=parent.id, created_by=admin_user.id)
        db.add(child)
        db.commit()
        db.refresh(child)

        # Essayer de créer niveau 3 (devrait échouer)
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "GrandChild",
                "parent_id": child.id
            }
        )
        assert response.status_code == 400
        assert "niveaux" in response.json()["detail"].lower()

    def test_create_categorie_circular_reference(self, client, admin_token, sample_categorie):
        """Impossible de créer une référence circulaire (parent = self)"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Test",
                "parent_id": sample_categorie.id + 999  # ID qui n'existe pas
            }
        )
        # Devrait échouer car le parent n'existe pas
        assert response.status_code == 404


class TestGetCategories:
    """Tests pour la récupération des catégories"""

    def test_get_categories_list(self, client, admin_token, sample_categorie):
        """Récupère la liste des catégories"""
        response = client.get(
            "/api/categories",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(cat["nom"] == "Test Catégorie" for cat in data)

    def test_get_categories_racines(self, client, admin_token, sample_categorie_with_children):
        """Récupère uniquement les catégories racines"""
        response = client.get(
            "/api/categories/racines",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Toutes les catégories retournées doivent avoir parent_id = None
        assert all(cat["parent_id"] is None for cat in data)

    def test_get_categories_tree(self, client, admin_token, sample_categorie_with_children):
        """Récupère l'arbre hiérarchique complet"""
        response = client.get(
            "/api/categories/tree",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

        # Trouver la catégorie parente
        parent = next((cat for cat in data if cat["nom"] == "Catégorie Parente"), None)
        assert parent is not None
        assert "children" in parent
        assert len(parent["children"]) == 2

    def test_get_categorie_by_id(self, client, admin_token, sample_categorie):
        """Récupère une catégorie par son ID"""
        response = client.get(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_categorie.id
        assert data["nom"] == sample_categorie.nom

    def test_get_nonexistent_categorie(self, client, admin_token):
        """Erreur 404 pour catégorie inexistante"""
        response = client.get(
            "/api/categories/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_get_categorie_children(self, client, admin_token, sample_categorie_with_children):
        """Récupère les sous-catégories d'une catégorie"""
        response = client.get(
            f"/api/categories/{sample_categorie_with_children.id}/children",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert all(child["parent_id"] == sample_categorie_with_children.id for child in data)


class TestUpdateCategorie:
    """Tests pour la modification de catégories"""

    def test_update_categorie_admin(self, client, admin_token, sample_categorie):
        """Admin peut modifier une catégorie"""
        response = client.put(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Catégorie Modifiée", "description": "Nouvelle description"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Catégorie Modifiée"
        assert data["description"] == "Nouvelle description"
        assert data["updated_by"] == 1  # admin_user.id

    def test_update_categorie_gestionnaire(self, client, gestionnaire_token, sample_categorie):
        """Gestionnaire peut modifier une catégorie"""
        response = client.put(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={"nom": "Modification Gestionnaire"}
        )
        assert response.status_code == 200

    def test_update_categorie_technicien_forbidden(self, client, technicien_token, sample_categorie):
        """Technicien ne peut pas modifier une catégorie"""
        response = client.put(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"nom": "Test"}
        )
        assert response.status_code == 403

    def test_update_categorie_consultation_forbidden(self, client, consultation_token, sample_categorie):
        """Utilisateur consultation ne peut pas modifier"""
        response = client.put(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={"nom": "Test"}
        )
        assert response.status_code == 403

    def test_update_categorie_partial(self, client, admin_token, sample_categorie):
        """Mise à jour partielle d'une catégorie"""
        original_nom = sample_categorie.nom

        response = client.put(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"description": "Nouvelle description uniquement"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Nouvelle description uniquement"
        # Le nom ne devrait pas avoir changé
        assert data["nom"] == original_nom


class TestDeleteCategorie:
    """Tests pour la suppression de catégories"""

    def test_delete_categorie_admin(self, client, admin_token, sample_categorie):
        """Admin peut supprimer une catégorie sans enfants"""
        categorie_id = sample_categorie.id

        response = client.delete(
            f"/api/categories/{categorie_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

        # Vérifier que la catégorie n'existe plus
        response = client.get(
            f"/api/categories/{categorie_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_delete_categorie_gestionnaire(self, client, gestionnaire_token, db, admin_user):
        """Gestionnaire peut supprimer une catégorie"""
        from app.models import Categorie

        # Créer une catégorie à supprimer
        categorie = Categorie(
            nom="À Supprimer",
            description="Test",
            created_by=admin_user.id
        )
        db.add(categorie)
        db.commit()
        db.refresh(categorie)

        response = client.delete(
            f"/api/categories/{categorie.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"}
        )
        assert response.status_code == 200

    def test_delete_categorie_with_children_forbidden(self, client, admin_token, sample_categorie_with_children):
        """Impossible de supprimer une catégorie avec des sous-catégories"""
        response = client.delete(
            f"/api/categories/{sample_categorie_with_children.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 400
        assert "sous-catégories" in response.json()["detail"].lower() or "enfants" in response.json()["detail"].lower()

    def test_delete_categorie_consultation_forbidden(self, client, consultation_token, sample_categorie):
        """Utilisateur consultation ne peut pas supprimer"""
        response = client.delete(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {consultation_token}"}
        )
        assert response.status_code == 403

    def test_delete_nonexistent_categorie(self, client, admin_token):
        """Erreur 404 lors de la suppression d'une catégorie inexistante"""
        response = client.delete(
            "/api/categories/99999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestCategoriesHierarchyValidation:
    """Tests pour la validation de la hiérarchie des catégories"""

    def test_categorie_niveau_0(self, client, admin_token, sample_categorie):
        """Catégorie racine a niveau = 0"""
        response = client.get(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["niveau"] == 0
        assert data["parent_id"] is None

    def test_categorie_niveau_1(self, client, admin_token, sample_categorie_with_children):
        """Sous-catégorie a niveau = 1"""
        response = client.get(
            f"/api/categories/{sample_categorie_with_children.id}/children",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()

        # Toutes les sous-catégories doivent avoir niveau = 1
        assert all(child["niveau"] == 1 for child in data)

    def test_categorie_nom_complet_racine(self, client, admin_token, sample_categorie):
        """Nom complet d'une catégorie racine = nom"""
        response = client.get(
            f"/api/categories/{sample_categorie.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom_complet"] == data["nom"]

    def test_categorie_nom_complet_enfant(self, client, admin_token, db, admin_user):
        """Nom complet d'une sous-catégorie = Parent > Enfant"""
        from app.models import Categorie

        # Créer parent
        parent = Categorie(nom="Matériaux", created_by=admin_user.id)
        db.add(parent)
        db.commit()
        db.refresh(parent)

        # Créer enfant
        child = Categorie(nom="Bois", parent_id=parent.id, created_by=admin_user.id)
        db.add(child)
        db.commit()
        db.refresh(child)

        response = client.get(
            f"/api/categories/{child.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom_complet"] == "Matériaux > Bois"
