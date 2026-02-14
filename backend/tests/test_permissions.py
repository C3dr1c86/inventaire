"""
Tests pour le système de permissions
"""

import pytest
from app.permissions import has_permission, DEFAULT_PERMISSIONS
from app.models import RoleEnum, User


class TestDefaultPermissions:
    """Tests pour les permissions par défaut de chaque rôle"""

    def test_admin_has_wildcard_permission(self):
        """Admin a la permission wildcard *:* (tout)"""
        assert "*:*" in DEFAULT_PERMISSIONS[RoleEnum.ADMIN]

    def test_gestionnaire_has_articles_permissions(self):
        """Gestionnaire a toutes les permissions articles (individuelles)"""
        perms = DEFAULT_PERMISSIONS[RoleEnum.GESTIONNAIRE]
        assert "articles:read" in perms
        assert "articles:create" in perms
        assert "articles:update" in perms
        assert "articles:delete" in perms

    def test_gestionnaire_has_categories_permissions(self):
        """Gestionnaire a toutes les permissions catégories (individuelles)"""
        perms = DEFAULT_PERMISSIONS[RoleEnum.GESTIONNAIRE]
        assert "categories:read" in perms
        assert "categories:create" in perms
        assert "categories:update" in perms
        assert "categories:delete" in perms

    def test_technicien_can_read_articles(self):
        """Technicien peut lire les articles"""
        perms = DEFAULT_PERMISSIONS[RoleEnum.TECHNICIEN]
        assert "articles:read" in perms

    def test_technicien_cannot_create_articles(self):
        """Technicien ne peut PAS créer des articles"""
        perms = DEFAULT_PERMISSIONS[RoleEnum.TECHNICIEN]
        assert "articles:create" not in perms
        assert "articles:*" not in perms

    def test_consultation_can_only_read(self):
        """Consultation ne peut que lire"""
        perms = DEFAULT_PERMISSIONS[RoleEnum.CONSULTATION]
        # Toutes les permissions doivent être :read
        for perm in perms:
            assert perm.endswith(
                ":read"
            ), f"Permission {perm} n'est pas en lecture seule"

    def test_consultation_cannot_modify(self):
        """Consultation ne peut rien modifier"""
        perms = DEFAULT_PERMISSIONS[RoleEnum.CONSULTATION]
        forbidden_actions = [":create", ":update", ":delete", ":*"]
        for perm in perms:
            for action in forbidden_actions:
                assert not perm.endswith(
                    action
                ), f"Permission {perm} permet des modifications"


class TestHasPermissionFunction:
    """Tests pour la fonction has_permission()"""

    def test_admin_has_all_permissions(self, db):
        """Admin a toutes les permissions grâce au wildcard"""
        admin = User(
            username="admin_test",
            email="admin@test.com",
            hashed_password="hash",
            role=RoleEnum.ADMIN,
        )
        db.add(admin)
        db.commit()

        # Admin peut tout faire
        assert has_permission(admin, "articles", "create")
        assert has_permission(admin, "articles", "read")
        assert has_permission(admin, "articles", "update")
        assert has_permission(admin, "articles", "delete")
        assert has_permission(admin, "users", "create")
        assert has_permission(admin, "anything", "any_action")

    def test_gestionnaire_has_articles_wildcard(self, db):
        """Gestionnaire a articles:* donc toutes les actions articles"""
        gestionnaire = User(
            username="gest",
            email="gest@test.com",
            hashed_password="hash",
            role=RoleEnum.GESTIONNAIRE,
        )
        db.add(gestionnaire)
        db.commit()

        assert has_permission(gestionnaire, "articles", "create")
        assert has_permission(gestionnaire, "articles", "read")
        assert has_permission(gestionnaire, "articles", "update")
        assert has_permission(gestionnaire, "articles", "delete")

    def test_gestionnaire_cannot_manage_users(self, db):
        """Gestionnaire ne peut PAS gérer les utilisateurs"""
        gestionnaire = User(
            username="gest",
            email="gest@test.com",
            hashed_password="hash",
            role=RoleEnum.GESTIONNAIRE,
        )
        db.add(gestionnaire)
        db.commit()

        assert not has_permission(gestionnaire, "users", "create")
        assert not has_permission(gestionnaire, "users", "read")
        assert not has_permission(gestionnaire, "users", "update")
        assert not has_permission(gestionnaire, "users", "delete")

    def test_technicien_can_read_but_not_write(self, db):
        """Technicien peut lire mais pas écrire"""
        technicien = User(
            username="tech",
            email="tech@test.com",
            hashed_password="hash",
            role=RoleEnum.TECHNICIEN,
        )
        db.add(technicien)
        db.commit()

        # Peut lire
        assert has_permission(technicien, "articles", "read")
        assert has_permission(technicien, "categories", "read")

        # Ne peut pas écrire
        assert not has_permission(technicien, "articles", "create")
        assert not has_permission(technicien, "articles", "update")
        assert not has_permission(technicien, "articles", "delete")

    def test_technicien_can_create_mouvements(self, db):
        """Technicien peut créer des mouvements de stock"""
        technicien = User(
            username="tech",
            email="tech@test.com",
            hashed_password="hash",
            role=RoleEnum.TECHNICIEN,
        )
        db.add(technicien)
        db.commit()

        assert has_permission(technicien, "mouvements", "create")
        assert has_permission(technicien, "mouvements", "read")

    def test_consultation_cannot_create_anything(self, db):
        """Consultation ne peut rien créer"""
        consultation = User(
            username="consult",
            email="consult@test.com",
            hashed_password="hash",
            role=RoleEnum.CONSULTATION,
        )
        db.add(consultation)
        db.commit()

        assert not has_permission(consultation, "articles", "create")
        assert not has_permission(consultation, "categories", "create")
        assert not has_permission(consultation, "mouvements", "create")
        assert not has_permission(consultation, "tags", "create")

    def test_consultation_can_only_read(self, db):
        """Consultation peut seulement lire"""
        consultation = User(
            username="consult",
            email="consult@test.com",
            hashed_password="hash",
            role=RoleEnum.CONSULTATION,
        )
        db.add(consultation)
        db.commit()

        assert has_permission(consultation, "articles", "read")
        assert has_permission(consultation, "categories", "read")
        assert has_permission(consultation, "mouvements", "read")
        assert has_permission(consultation, "rapports", "read")


class TestCustomPermissions:
    """Tests pour les permissions custom (overrides)"""

    def test_custom_permission_overrides_default(self, db):
        """Une permission custom override les permissions par défaut"""
        # Technicien avec permission custom pour créer des articles
        technicien = User(
            username="tech",
            email="tech@test.com",
            hashed_password="hash",
            role=RoleEnum.TECHNICIEN,
            permissions=["articles:create"],  # Override custom
        )
        db.add(technicien)
        db.commit()

        # Avec custom permission, peut créer des articles
        assert has_permission(technicien, "articles", "create")

        # Mais les autres permissions par défaut fonctionnent toujours
        assert has_permission(technicien, "articles", "read")

    def test_custom_wildcard_permission(self, db):
        """Permission custom avec wildcard fonctionne"""
        # Consultation avec permission custom articles:* (toutes les actions articles)
        consultation = User(
            username="consult",
            email="consult@test.com",
            hashed_password="hash",
            role=RoleEnum.CONSULTATION,
            permissions=["articles:*"],
        )
        db.add(consultation)
        db.commit()

        # Peut tout faire sur les articles grâce au wildcard custom
        assert has_permission(consultation, "articles", "create")
        assert has_permission(consultation, "articles", "update")
        assert has_permission(consultation, "articles", "delete")

        # Mais pas sur les autres ressources
        assert not has_permission(consultation, "categories", "create")

    def test_custom_super_admin_permission(self, db):
        """Permission custom *:* donne accès complet"""
        # Gestionnaire avec permission custom *:* (super admin)
        gestionnaire = User(
            username="gest",
            email="gest@test.com",
            hashed_password="hash",
            role=RoleEnum.GESTIONNAIRE,
            permissions=["*:*"],
        )
        db.add(gestionnaire)
        db.commit()

        # Peut tout faire, même gérer les users
        assert has_permission(gestionnaire, "users", "create")
        assert has_permission(gestionnaire, "users", "delete")
        assert has_permission(gestionnaire, "anything", "any_action")

    def test_multiple_custom_permissions(self, db):
        """Plusieurs permissions custom fonctionnent ensemble"""
        technicien = User(
            username="tech",
            email="tech@test.com",
            hashed_password="hash",
            role=RoleEnum.TECHNICIEN,
            permissions=["articles:create", "articles:update", "categories:create"],
        )
        db.add(technicien)
        db.commit()

        # Toutes les permissions custom fonctionnent
        assert has_permission(technicien, "articles", "create")
        assert has_permission(technicien, "articles", "update")
        assert has_permission(technicien, "categories", "create")

        # Mais pas les autres
        assert not has_permission(technicien, "articles", "delete")
        assert not has_permission(technicien, "categories", "update")


class TestRequirePermissionEndpoints:
    """Tests pour vérifier que require_permission() protège bien les endpoints"""

    def test_create_article_requires_permission(self, client, technicien_token):
        """POST /api/articles nécessite permission articles:create"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={
                "nom": "Test",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 10.0,
            },
        )
        # Technicien n'a pas articles:create → 403 Forbidden
        assert response.status_code == 403

    def test_update_article_requires_permission(
        self, client, technicien_token, sample_article
    ):
        """PUT /api/articles/{id} nécessite permission articles:update"""
        response = client.put(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"nom": "Modifié"},
        )
        # Technicien n'a pas articles:update → 403 Forbidden
        assert response.status_code == 403

    def test_delete_article_requires_permission(
        self, client, consultation_token, sample_article
    ):
        """DELETE /api/articles/{id} nécessite permission articles:delete"""
        response = client.delete(
            f"/api/articles/{sample_article.id}",
            headers={"Authorization": f"Bearer {consultation_token}"},
        )
        # Consultation n'a pas articles:delete → 403 Forbidden
        assert response.status_code == 403

    def test_create_categorie_requires_permission(self, client, technicien_token):
        """POST /api/categories nécessite permission categories:create"""
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {technicien_token}"},
            json={"nom": "Test", "description": "Test"},
        )
        # Technicien n'a pas categories:create → 403 Forbidden
        assert response.status_code == 403

    def test_admin_bypasses_all_permission_checks(self, client, admin_token):
        """Admin peut accéder à tous les endpoints protégés"""
        # Peut créer un article
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "nom": "Test Admin",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 10.0,
            },
        )
        assert response.status_code == 201  # Success

        # Peut créer une catégorie
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"nom": "Test Catégorie"},
        )
        assert response.status_code == 201  # Success

    def test_gestionnaire_can_access_allowed_endpoints(
        self, client, gestionnaire_token
    ):
        """Gestionnaire peut accéder aux endpoints autorisés"""
        # Peut créer un article (a articles:*)
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={
                "nom": "Test Gestionnaire",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 10.0,
            },
        )
        assert response.status_code == 201  # Success

        # Peut créer une catégorie (a categories:*)
        response = client.post(
            "/api/categories",
            headers={"Authorization": f"Bearer {gestionnaire_token}"},
            json={"nom": "Test Catégorie Gest"},
        )
        assert response.status_code == 201  # Success


class TestPermissionErrorMessages:
    """Tests pour vérifier les messages d'erreur des permissions"""

    def test_forbidden_returns_403_with_message(self, client, consultation_token):
        """Une permission refusée retourne 403 avec un message clair"""
        response = client.post(
            "/api/articles",
            headers={"Authorization": f"Bearer {consultation_token}"},
            json={
                "nom": "Test",
                "quantite": 10,
                "quantite_min": 5,
                "prix_unitaire": 10.0,
            },
        )
        assert response.status_code == 403
        data = response.json()
        assert "detail" in data
        # Le message devrait mentionner la permission manquante
        assert (
            "permission" in data["detail"].lower()
            or "refusée" in data["detail"].lower()
        )
