"""Tests for auth module: registration, login, JWT middleware, protected routes."""

import time
from unittest.mock import MagicMock, patch

import jwt as pyjwt
import pytest
from fastapi import FastAPI, HTTPException, Request
from fastapi.testclient import TestClient

# --- Helpers for test JWT tokens ---

_TEST_JWT_SECRET = "test-secret-that-is-at-least-32-chars-long-for-hs256!!"
_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "test@example.com"


def _make_token(exp_offset: int = 3600, **overrides) -> str:
    payload = {
        "sub": _TEST_USER_ID,
        "email": _TEST_USER_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_offset,
    }
    payload.update(overrides)
    return pyjwt.encode(payload, _TEST_JWT_SECRET, algorithm="HS256")


def _make_test_app() -> FastAPI:
    """Create a minimal test app with AuthMiddleware and test routes."""
    from syncRoleBackend.auth.middleware import AuthMiddleware

    app = FastAPI()
    app.add_middleware(AuthMiddleware)

    @app.get("/api/v1/jobs")
    async def protected_route(request: Request):
        return {"user_id": request.state.user_id, "data": []}

    @app.get("/api/v1/auth/register")
    async def public_auth_route(request: Request):
        return {"status": "register"}

    @app.get("/api/v1/scrape")
    async def scrape_route(request: Request):
        return {"status": "scrape"}

    @app.get("/api/v1/unknown")
    async def unknown_route(request: Request):
        return {"status": "unknown"}

    return app


# ===== MIDDLEWARE TESTS =====


class TestAuthMiddleware:
    """RED: tests for JWT validation middleware."""

    def test_valid_token_passes_through(self):
        """Valid JWT → 200 + request.state.user_id set correctly."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            token = _make_token()
            resp = client.get(
                "/api/v1/jobs", headers={"Authorization": f"Bearer {token}"}
            )
            assert resp.status_code == 200
            assert resp.json()["user_id"] == _TEST_USER_ID

    def test_missing_auth_header_returns_401(self):
        """No Authorization header → 401."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            resp = client.get("/api/v1/unknown")
            assert resp.status_code == 401
            assert "Missing authentication token" in resp.json()["detail"]

    def test_expired_token_returns_401(self):
        """Expired JWT → 401 with 'Token expired'."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            token = _make_token(exp_offset=-3600)
            resp = client.get(
                "/api/v1/jobs", headers={"Authorization": f"Bearer {token}"}
            )
            assert resp.status_code == 401
            assert "Token expired" in resp.json()["detail"]

    def test_malformed_token_returns_401(self):
        """Garbage token → 401 with 'Invalid token'."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            resp = client.get(
                "/api/v1/jobs",
                headers={"Authorization": "Bearer this-is-not-a-valid-jwt"},
            )
            assert resp.status_code == 401
            assert "Invalid token" in resp.json()["detail"]

    def test_bearer_prefix_missing_returns_401(self):
        """Authorization header without Bearer prefix → 401."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            resp = client.get(
                "/api/v1/jobs", headers={"Authorization": "no-bearer-token"}
            )
            assert resp.status_code == 401

    def test_public_auth_paths_bypass_auth(self):
        """Public paths (register, login) do NOT require a token."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            resp = client.get("/api/v1/auth/register")
            assert resp.status_code == 200

    def test_scrape_path_bypasses_auth(self):
        """Scrape path bypasses auth."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            resp = client.get("/api/v1/scrape")
            assert resp.status_code == 200

    def test_protected_route_without_token_returns_401(self):
        """Protected route without auth header → 401."""
        from syncRoleBackend.config import settings

        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            app = _make_test_app()
            client = TestClient(app)
            resp = client.get("/api/v1/jobs")
            assert resp.status_code == 401


# ===== AUTH ROUTE TESTS =====


class TestAuthRoutes:
    """Tests for auth router endpoints with mocked supabase."""

    def test_register_success(self):
        """POST /api/v1/auth/register → 201 + tokens."""
        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_session = MagicMock()
            mock_session.access_token = _make_token()
            mock_session.refresh_token = "test-refresh-token"
            mock_result = MagicMock()
            mock_result.user = mock_user
            mock_result.session = mock_session
            mock_sb.auth.sign_up.return_value = mock_result
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/register",
                json={"email": "new@example.com", "password": "password123"},
            )
            assert resp.status_code == 201
            data = resp.json()
            assert "access_token" in data
            assert data["user"]["id"] == _TEST_USER_ID
            assert data["user"]["email"] == _TEST_USER_EMAIL

    def test_register_duplicate_email(self):
        """POST /api/v1/auth/register with existing email → 409."""
        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_sb.auth.sign_up.side_effect = Exception("Email already in use")
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/register",
                json={"email": "existing@example.com", "password": "password123"},
            )
            assert resp.status_code == 409

    def test_login_success(self):
        """POST /api/v1/auth/login with valid credentials → 200 + tokens."""
        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_session = MagicMock()
            mock_session.access_token = _make_token()
            mock_session.refresh_token = "test-refresh-token"
            mock_result = MagicMock()
            mock_result.user = mock_user
            mock_result.session = mock_session
            mock_sb.auth.sign_in_with_password.return_value = mock_result
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": _TEST_USER_EMAIL, "password": "correct-password"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "access_token" in data

    def test_login_invalid_credentials(self):
        """POST /api/v1/auth/login with wrong password → 401."""
        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_sb.auth.sign_in_with_password.side_effect = Exception(
                "Invalid login credentials"
            )
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": _TEST_USER_EMAIL, "password": "wrong-password"},
            )
            assert resp.status_code == 401

    def test_logout_success(self):
        """POST /api/v1/auth/logout with valid token → 200."""
        with (
            patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb,
            patch(
                "syncRoleBackend.config.settings.supabase_jwt_secret",
                _TEST_JWT_SECRET,
            ),
        ):
            mock_sb = MagicMock()
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            token = _make_token()
            resp = client.post(
                "/api/v1/auth/logout",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert resp.status_code == 200
            assert resp.json()["message"] == "Logged out"

    def test_logout_without_token_returns_401(self):
        """POST /api/v1/auth/logout without token → 401 (caught by middleware)."""
        from syncRoleBackend.main import app

        client = TestClient(app)
        resp = client.post("/api/v1/auth/logout")
        assert resp.status_code == 401
        # Middleware catches unauthenticated requests before Depends
        assert "Missing authentication token" in resp.json()["detail"]

    def test_refresh_success(self):
        """POST /api/v1/auth/refresh with valid refresh token → 200."""
        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_session = MagicMock()
            mock_session.access_token = _make_token(exp_offset=3600)
            mock_session.refresh_token = "new-refresh-token"
            mock_result = MagicMock()
            mock_result.session = mock_session
            mock_result.user = mock_user
            mock_sb.auth.refresh_session.return_value = mock_result
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/refresh",
                json={"refresh_token": "valid-refresh-token"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert "access_token" in data
            assert data["refresh_token"] == "new-refresh-token"


# ===== DUAL CLIENT TESTS =====


class TestDualClient:
    """Tests for dual supabase client pattern."""

    def test_get_supabase_returns_anon_client_by_default(self):
        """get_supabase() returns anon client with SUPABASE_ANON_KEY."""
        from syncRoleBackend.database import get_supabase, _clients
        from syncRoleBackend.config import settings

        _clients.clear()

        with (
            patch.object(settings, "supabase_anon_key", "test-anon-key"),
            patch("syncRoleBackend.database.create_client") as mock_create,
        ):
            mock_create.return_value = MagicMock()
            get_supabase()
            mock_create.assert_called_once()
            _url, key = mock_create.call_args[0]
            assert key == "test-anon-key"

    def test_get_supabase_service_role(self):
        """get_supabase('service_role') returns service_role client."""
        from syncRoleBackend.database import get_supabase, _clients
        from syncRoleBackend.config import settings

        _clients.clear()

        with (
            patch.object(settings, "supabase_service_role_key", "test-sr-key"),
            patch("syncRoleBackend.database.create_client") as mock_create,
        ):
            mock_create.return_value = MagicMock()
            get_supabase("service_role")
            mock_create.assert_called_once()
            _url, key = mock_create.call_args[0]
            assert key == "test-sr-key"

    def test_get_supabase_with_user_jwt(self):
        """get_supabase(user_jwt) creates anon client + sets JWT auth header for RLS."""
        from syncRoleBackend.database import get_supabase, _clients
        from syncRoleBackend.config import settings

        _clients.clear()

        user_jwt = _make_token()
        with patch("syncRoleBackend.database.create_client") as mock_create:
            mock_client = MagicMock()
            mock_create.return_value = mock_client
            get_supabase(user_jwt)
            # Should create client with ANON key, not the user JWT
            mock_create.assert_called_once()
            _url, key = mock_create.call_args[0]
            assert key == settings.supabase_anon_key
            # Should set the user JWT on the postgrest auth header
            mock_client.postgrest.auth.assert_called_once_with(user_jwt)

    def test_get_supabase_caches_clients(self):
        """Same cache_key returns cached client."""
        from syncRoleBackend.database import get_supabase, _clients

        _clients.clear()

        with patch("syncRoleBackend.database.create_client") as mock_create:
            mock_create.return_value = MagicMock()
            c1 = get_supabase("service_role")
            c2 = get_supabase("service_role")
            mock_create.assert_called_once()  # Only called once
            assert c1 is c2  # Same cached instance
