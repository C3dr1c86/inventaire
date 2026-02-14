"""
Tests pour les tags
"""

import pytest


class TestCreateTag:
    """Tests pour la création de tags"""

    def test_create_tag_admin(self, client, admin_token):
        """Admin peut créer un tag"""
        response = client.post(
            "/api/tags",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Tag Test",
                "couleur": "#FF5733",
                "description": "Tag de test",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert data["nom"] == "Tag Test"
        assert data["couleur"] == "#FF5733"
        assert data["description"] == "Tag de test"

    def test_create_tag_gestionnaire(self, client, gestionnaire_token):
        """Gestionnaire peut créer un tag"""
        response = client.post(
            "/api/tags",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={"nom": "Tag Gest", "couleur": "#3498DB"},
        )
        assert response.status_code == 201

    def test_create_tag_technicien(self, client, technicien_token):
        """Technicien peut créer un tag (pas de permissions sur ce module)"""
        response = client.post(
            "/api/tags",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"nom": "Tag Tech", "couleur": "#2ECC71"},
        )
        assert response.status_code == 201

    def test_create_tag_consultation(self, client, consultation_token):
        """Utilisateur consultation peut créer un tag (pas de permissions sur ce module)"""
        response = client.post(
            "/api/tags",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={"nom": "Tag Consult", "couleur": "#9B59B6"},
        )
        assert response.status_code == 201

    def test_create_tag_validation_couleur(self, client, admin_token):
        """Validation couleur - doit être format hexadécimal #RRGGBB"""
        # Couleur invalide (pas de #)
        response = client.post(
            "/api/tags",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Tag Invalid Color", "couleur": "FF5733"},  # Manque le #
        )
        assert response.status_code == 422  # Pydantic validation error

    def test_create_tag_nom_unique(self, client, admin_token, db, admin_user):
        """Le nom du tag doit être unique"""
        from app.models import Tag

        # Créer un tag
        tag = Tag(nom="Tag Unique", couleur="#FF5733", created_by=admin_user.id)
        db.add(tag)
        db.commit()

        # Essayer de créer un tag avec le même nom
        response = client.post(
            "/api/tags",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Tag Unique", "couleur": "#3498DB"},  # Déjà existant
        )
        assert response.status_code == 400


class TestGetTags:
    """Tests pour la récupération des tags"""

    def test_get_tags_list(self, client, admin_token, db, admin_user):
        """Récupère la liste des tags"""
        from app.models import Tag

        # Créer quelques tags
        tag1 = Tag(nom="Tag 1", couleur="#FF5733", created_by=admin_user.id)
        tag2 = Tag(nom="Tag 2", couleur="#3498DB", created_by=admin_user.id)
        db.add_all([tag1, tag2])
        db.commit()

        response = client.get(
            "/api/tags", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        # Liste simple, pas de pagination
        assert isinstance(data, list)
        assert len(data) >= 2
        # Vérifier que les tags créés sont dans la liste
        tag_noms = [t["nom"] for t in data]
        assert "Tag 1" in tag_noms
        assert "Tag 2" in tag_noms

    def test_get_tag_by_id(self, client, admin_token, db, admin_user):
        """Récupère un tag par son ID"""
        from app.models import Tag

        tag = Tag(nom="Tag ID Test", couleur="#2ECC71", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.get(
            f"/api/tags/{tag.id}", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == tag.id
        assert data["nom"] == "Tag ID Test"
        assert data["couleur"] == "#2ECC71"

    def test_get_nonexistent_tag(self, client, admin_token):
        """Erreur 404 pour tag inexistant"""
        response = client.get(
            "/api/tags/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_get_tags_consultation(self, client, consultation_token, db, admin_user):
        """Utilisateur consultation peut lire les tags"""
        from app.models import Tag

        tag = Tag(nom="Tag Consult Read", couleur="#9B59B6", created_by=admin_user.id)
        db.add(tag)
        db.commit()

        response = client.get(
            "/api/tags", headers={"Authorization": f"Bearer {consultation_token}"}
        )
        assert response.status_code == 200


class TestUpdateTag:
    """Tests pour la modification de tags"""

    def test_update_tag_admin(self, client, admin_token, db, admin_user):
        """Admin peut modifier un tag"""
        from app.models import Tag

        tag = Tag(nom="Tag Original", couleur="#FF5733", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.put(
            f"/api/tags/{tag.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Tag Modifié", "couleur": "#3498DB"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["nom"] == "Tag Modifié"
        assert data["couleur"] == "#3498DB"

    def test_update_tag_gestionnaire(self, client, gestionnaire_token, db, admin_user):
        """Gestionnaire peut modifier un tag"""
        from app.models import Tag

        tag = Tag(nom="Tag Gest Update", couleur="#2ECC71", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.put(
            f"/api/tags/{tag.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={"nom": "Tag Gest Modif"},
        )
        assert response.status_code == 200

    def test_update_tag_technicien(self, client, technicien_token, db, admin_user):
        """Technicien peut modifier un tag (pas de permissions sur ce module)"""
        from app.models import Tag

        tag = Tag(nom="Tag Tech Update", couleur="#9B59B6", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.put(
            f"/api/tags/{tag.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"description": "Modifié par technicien"},
        )
        assert response.status_code == 200

    def test_update_nonexistent_tag(self, client, admin_token):
        """Erreur 404 pour modification tag inexistant"""
        response = client.put(
            "/api/tags/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Inexistant"},
        )
        assert response.status_code == 404


class TestDeleteTag:
    """Tests pour la suppression de tags"""

    def test_delete_tag_admin(self, client, admin_token, db, admin_user):
        """Admin peut supprimer un tag"""
        from app.models import Tag

        tag = Tag(nom="Tag à Supprimer", couleur="#FF5733", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.delete(
            f"/api/tags/{tag.id}", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200

        # Vérifier que le tag est supprimé
        response = client.get(
            f"/api/tags/{tag.id}", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404

    def test_delete_tag_gestionnaire(self, client, gestionnaire_token, db, admin_user):
        """Gestionnaire peut supprimer un tag"""
        from app.models import Tag

        tag = Tag(nom="Tag Gest Delete", couleur="#3498DB", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.delete(
            f"/api/tags/{tag.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
        )
        assert response.status_code == 200

    def test_delete_tag_technicien(self, client, technicien_token, db, admin_user):
        """Technicien peut supprimer un tag (pas de permissions sur ce module)"""
        from app.models import Tag

        tag = Tag(nom="Tag Tech Delete", couleur="#2ECC71", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.delete(
            f"/api/tags/{tag.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
        )
        assert response.status_code == 200

    def test_delete_nonexistent_tag(self, client, admin_token):
        """Erreur 404 pour suppression tag inexistant"""
        response = client.delete(
            "/api/tags/99999", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404


class TestTagArticleAssociation:
    """Tests pour l'association tags-articles"""

    def test_associer_tag_article_admin(
        self, client, admin_token, sample_article, db, admin_user
    ):
        """Admin peut associer un tag à un article"""
        from app.models import Tag

        tag = Tag(nom="Tag Association", couleur="#FF5733", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.post(
            f"/api/tags/{tag.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        # Retourne l'article complet
        assert data["id"] == sample_article.id
        assert "tags" in data
        # Vérifier que le tag est associé
        tag_ids = [t["id"] for t in data["tags"]]
        assert tag.id in tag_ids

    def test_associer_tag_article_gestionnaire(
        self, client, gestionnaire_token, sample_article, db, admin_user
    ):
        """Gestionnaire peut associer un tag à un article"""
        from app.models import Tag

        tag = Tag(nom="Tag Gest Assoc", couleur="#3498DB", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.post(
            f"/api/tags/{tag.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
        )
        assert response.status_code == 200

    def test_retirer_tag_article_admin(
        self, client, admin_token, sample_article, db, admin_user
    ):
        """Admin peut retirer un tag d'un article"""
        from app.models import Tag

        tag = Tag(nom="Tag Retrait", couleur="#2ECC71", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        # D'abord associer via ORM
        sample_article.tags.append(tag)
        db.commit()

        # Puis retirer
        response = client.delete(
            f"/api/tags/{tag.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        # Retourne l'article complet
        assert data["id"] == sample_article.id

    def test_retirer_tag_article_technicien(
        self, client, technicien_token, sample_article, db, admin_user
    ):
        """Technicien peut retirer un tag d'un article (pas de permissions sur ce module)"""
        from app.models import Tag

        tag = Tag(nom="Tag Tech Retrait", couleur="#9B59B6", created_by=admin_user.id)
        db.add(tag)
        db.commit()
        db.refresh(tag)

        # D'abord associer via ORM
        sample_article.tags.append(tag)
        db.commit()

        response = client.delete(
            f"/api/tags/{tag.id}/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
        )
        assert response.status_code == 200

    def test_associer_tag_inexistant(self, client, admin_token, sample_article):
        """Erreur 404 pour association avec tag inexistant"""
        response = client.post(
            f"/api/tags/99999/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404

    def test_associer_article_inexistant(self, client, admin_token, db, admin_user):
        """Erreur 404 pour association avec article inexistant"""
        from app.models import Tag

        tag = Tag(
            nom="Tag Article Inexistant", couleur="#FF5733", created_by=admin_user.id
        )
        db.add(tag)
        db.commit()
        db.refresh(tag)

        response = client.post(
            f"/api/tags/{tag.id}/articles/99999",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 404
