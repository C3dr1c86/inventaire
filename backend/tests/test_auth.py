"""
Tests pour l'authentification et la gestion des utilisateurs
"""


class TestRegister:
    """Tests pour l'endpoint /api/auth/register"""

    def test_register_first_user_success(self, client, db):
        """Premier utilisateur créé avec succès"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "firstuser",
                "email": "first@test.com",
                "password": "password123",
            },
        )
        assert response.status_code == 201  # Created
        data = response.json()
        assert data["username"] == "firstuser"
        assert data["email"] == "first@test.com"
        assert "hashed_password" not in data
        assert "password" not in data

    def test_register_duplicate_username(self, client, db, admin_user):
        """Empêche création utilisateur avec username existant"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": admin_user.username,
                "email": "new@test.com",
                "password": "password123",
            },
        )
        assert response.status_code == 400
        # Vérifier qu'il y a un message d'erreur
        assert "detail" in response.json()

    def test_register_duplicate_email(self, client, db, admin_user):
        """Empêche création utilisateur avec email existant"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": admin_user.email,
                "password": "password123",
            },
        )
        assert response.status_code == 400
        assert "email" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client):
        """Rejette email invalide"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "invalid-email",
                "password": "password123",
            },
        )
        assert response.status_code == 422  # Validation error

    def test_register_short_username(self, client):
        """Rejette username trop court (< 3 caractères)"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "ab",
                "email": "test@test.com",
                "password": "password123",
            },
        )
        assert response.status_code == 422

    def test_register_short_password(self, client):
        """Rejette password trop court (< 8 caractères)"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "testuser",
                "email": "test@test.com",
                "password": "short",
            },
        )
        assert response.status_code == 422


class TestLogin:
    """Tests pour l'endpoint /api/auth/login"""

    def test_login_success_with_username(self, client, admin_user):
        """Login réussi avec username et password valides"""
        response = client.post(
            "/api/auth/login", data={"username": "admin_test", "password": "admin123"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, admin_user):
        """Login échoue avec mauvais mot de passe"""
        response = client.post(
            "/api/auth/login",
            data={"username": "admin_test", "password": "wrongpassword"},
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client):
        """Login échoue avec utilisateur inexistant"""
        response = client.post(
            "/api/auth/login",
            data={"username": "nonexistent", "password": "password123"},
        )
        assert response.status_code == 401

    def test_login_inactive_user(self, client, db, admin_user):
        """Login échoue si utilisateur désactivé"""
        # Désactiver l'utilisateur
        admin_user.is_active = False
        db.commit()

        response = client.post(
            "/api/auth/login", data={"username": "admin_test", "password": "admin123"}
        )
        # FastAPI retourne 400 pour utilisateur inactif (pas 401)
        assert response.status_code == 400
        assert (
            "inactif" in response.json()["detail"].lower()
            or "inactive" in response.json()["detail"].lower()
        )


class TestGetCurrentUser:
    """Tests pour l'endpoint /api/auth/me"""

    def test_get_current_user_with_valid_token(self, client, admin_user, admin_token):
        """Récupère l'utilisateur connecté avec token valide"""
        response = client.get(
            "/api/auth/me", headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == admin_user.username
        assert data["email"] == admin_user.email
        assert data["role"] == "admin"
        assert data["is_active"] is True
        assert "permissions" in data

    def test_get_current_user_without_token(self, client):
        """Accès refusé sans token"""
        response = client.get("/api/auth/me")
        assert response.status_code == 401
        assert "not authenticated" in response.json()["detail"].lower()

    def test_get_current_user_with_invalid_token(self, client):
        """Accès refusé avec token invalide"""
        response = client.get(
            "/api/auth/me", headers={"Authorization": "Bearer invalid_token_xyz"}
        )
        assert response.status_code == 401

    def test_get_current_user_with_malformed_token(self, client):
        """Accès refusé avec token malformé"""
        response = client.get(
            "/api/auth/me", headers={"Authorization": "NotBearer token"}
        )
        assert response.status_code == 401


class TestProtectedRoutes:
    """Tests pour l'accès aux routes protégées"""

    def test_access_protected_route_without_token(self, client):
        """Accès refusé aux routes protégées sans token"""
        response = client.get("/api/articles")
        assert response.status_code == 401

    def test_access_protected_route_with_valid_token(self, client, admin_token):
        """Accès autorisé avec token valide"""
        response = client.get(
            "/api/articles", headers={"Authorization": f"Bearer {admin_token}"}
        )
        # 200 ou autre code (pas 401)
        assert response.status_code != 401

    def test_access_protected_route_with_expired_token(self, client):
        """Accès refusé avec token expiré (simulation)"""
        # Token expiré (payload avec exp dans le passé)
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid"

        response = client.get(
            "/api/articles", headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401


class TestPermissionsInToken:
    """Tests pour la présence des permissions dans le token JWT"""

    def test_admin_token_contains_role(self, admin_token):
        """Token admin contient le rôle"""
        from jose import jwt
        from app.auth import SECRET_KEY, ALGORITHM

        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])

        assert "role" in payload
        assert payload["role"] == "admin"

    def test_gestionnaire_token_contains_role(self, gestionnaire_token):
        """Token gestionnaire contient le rôle"""
        from jose import jwt
        from app.auth import SECRET_KEY, ALGORITHM

        payload = jwt.decode(gestionnaire_token, SECRET_KEY, algorithms=[ALGORITHM])

        assert "role" in payload
        assert payload["role"] == "gestionnaire"

    def test_token_contains_user_id(self, admin_token, admin_user):
        """Token contient l'user_id"""
        from jose import jwt
        from app.auth import SECRET_KEY, ALGORITHM

        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])

        assert "user_id" in payload
        assert payload["user_id"] == admin_user.id

    def test_token_contains_expiration(self, admin_token):
        """Token contient la date d'expiration"""
        from jose import jwt
        from app.auth import SECRET_KEY, ALGORITHM

        payload = jwt.decode(admin_token, SECRET_KEY, algorithms=[ALGORITHM])

        assert "exp" in payload
        assert isinstance(payload["exp"], int)
