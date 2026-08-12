"""Tests for auth module: cookie-based session registration, login, middleware."""

from unittest.mock import MagicMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient

_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "test@example.com"

# Project ref extracted from supabase_url for cookie name
_TEST_PROJECT_REF = "kicwqgyzxygujewlvxpv"
_TEST_COOKIE_NAME = f"sb-{_TEST_PROJECT_REF}-auth-token"


def _make_cookie_value(access_token: str = "test-at", refresh_token: str = "test-rt") -> str:
    """Construct a Supabase-style cookie value: base64url(JSON array)."""
    import base64, json
    payload = json.dumps([
        access_token,
        refresh_token,
        {"id": _TEST_USER_ID, "email": _TEST_USER_EMAIL, "aud": "authenticated", "role": "authenticated"},
        9999999999,
    ])
    return base64.b64encode(payload.encode()).decode()


def _make_test_app() -> FastAPI:
    """Create a minimal test app with cookie-based AuthMiddleware."""
    from syncRoleBackend.auth.middleware import AuthMiddleware

    app = FastAPI()
    app.add_middleware(AuthMiddleware)

    @app.get("/api/v1/jobs")
    async def protected_route(request: Request):
        return {
            "user_id": request.state.user_id,
            "user_email": request.state.user_email,
            "token": request.state.token,
            "data": [],
        }

    @app.get("/api/v1/auth/login")
    async def public_auth_route(request: Request):
        return {"status": "login"}

    @app.get("/api/v1/scrape")
    async def scrape_route(request: Request):
        return {"status": "scrape"}

    @app.get("/api/v1/unknown")
    async def unknown_route(request: Request):
        return {"status": "unknown"}

    return app


# ===== MIDDLEWARE TESTS =====


class TestAuthMiddleware:
    """RED: tests for cookie-based session validation middleware."""

    def test_valid_cookie_populates_request_state(self):
        """Valid sb-*-auth-token cookie → 200 + request.state populated."""
        app = _make_test_app()
        client = TestClient(app)
        cookie_val = _make_cookie_value(access_token="valid-at")
        client.cookies.set(_TEST_COOKIE_NAME, cookie_val)

        with patch("syncRoleBackend.auth.middleware._get_auth_client") as mock_get_client:
            mock_client = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_response = MagicMock()
            mock_response.user = mock_user
            mock_client.auth.get_user.return_value = mock_response
            mock_get_client.return_value = mock_client

            resp = client.get("/api/v1/jobs")

            assert resp.status_code == 200
            data = resp.json()
            assert data["user_id"] == _TEST_USER_ID
            assert data["user_email"] == _TEST_USER_EMAIL
            assert data["token"] == "valid-at"
            mock_client.auth.get_user.assert_called_once_with("valid-at")

    def test_missing_cookie_returns_401(self):
        """No sb-*-auth-token cookie → 401."""
        app = _make_test_app()
        client = TestClient(app)
        resp = client.get("/api/v1/unknown")

        assert resp.status_code == 401
        assert "Missing authentication token" in resp.json()["detail"]

    def test_invalid_cookie_value_returns_401(self):
        """Invalid cookie value format → 401."""
        app = _make_test_app()
        client = TestClient(app)
        client.cookies.set(_TEST_COOKIE_NAME, "garbage-cookie-value")

        resp = client.get("/api/v1/jobs")

        assert resp.status_code == 401

    def test_get_user_fails_returns_401(self):
        """Valid cookie but supabase.auth.get_user() fails → 401."""
        app = _make_test_app()
        client = TestClient(app)
        cookie_val = _make_cookie_value(access_token="expired-at")
        client.cookies.set(_TEST_COOKIE_NAME, cookie_val)

        with patch("syncRoleBackend.auth.middleware._get_auth_client") as mock_get_client:
            mock_client = MagicMock()
            mock_client.auth.get_user.side_effect = Exception("Invalid token")
            mock_get_client.return_value = mock_client

            resp = client.get("/api/v1/jobs")

            assert resp.status_code == 401

    def test_public_auth_paths_bypass_auth(self):
        """Public paths (login) do NOT require a cookie."""
        app = _make_test_app()
        client = TestClient(app)
        resp = client.get("/api/v1/auth/login")
        assert resp.status_code == 200

    def test_scrape_path_bypasses_auth(self):
        """Scrape path bypasses auth."""
        app = _make_test_app()
        client = TestClient(app)
        resp = client.get("/api/v1/scrape")
        assert resp.status_code == 200

    def test_protected_route_without_cookie_returns_401(self):
        """Protected route without cookie → 401."""
        app = _make_test_app()
        client = TestClient(app)
        resp = client.get("/api/v1/jobs")
        assert resp.status_code == 401

    def test_cookie_with_no_access_token_returns_401(self):
        """Cookie with malformed JSON (no access_token) → 401."""
        import base64, json

        app = _make_test_app()
        client = TestClient(app)
        bad_payload = base64.b64encode(json.dumps(["only-at"]).encode()).decode()
        client.cookies.set(_TEST_COOKIE_NAME, bad_payload)

        resp = client.get("/api/v1/jobs")

        assert resp.status_code == 401


# ===== AUTH ROUTE TESTS =====


class TestAuthRoutes:
    """Tests for auth router endpoints with mocked supabase."""

    def test_register_success_sets_cookies(self):
        """POST /api/v1/auth/register → 201 + Set-Cookie header."""
        from syncRoleBackend.main import app

        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_session = MagicMock()
            mock_session.access_token = "reg-at"
            mock_session.refresh_token = "reg-rt"
            mock_result = MagicMock()
            mock_result.user = mock_user
            mock_result.session = mock_session
            mock_sb.auth.sign_up.return_value = mock_result
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/register",
                json={"email": "new@example.com", "password": "password123"},
            )

        assert resp.status_code == 201
        data = resp.json()
        assert "access_token" not in data
        assert "refresh_token" not in data
        assert data["user"]["id"] == _TEST_USER_ID
        assert data["user"]["email"] == _TEST_USER_EMAIL

        # Check Set-Cookie header exists with sb-*-auth-token
        set_cookie = resp.headers.get("set-cookie", "")
        assert _TEST_COOKIE_NAME in set_cookie
        assert "HttpOnly" in set_cookie

    def test_register_duplicate_email(self):
        """POST /api/v1/auth/register with existing email → 409."""
        from syncRoleBackend.main import app

        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_sb.auth.sign_up.side_effect = Exception("Email already in use")
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/register",
                json={"email": "existing@example.com", "password": "password123"},
            )
            assert resp.status_code == 409

    def test_login_success_sets_cookies(self):
        """POST /api/v1/auth/login → 200 + Set-Cookie, no tokens in body."""
        from syncRoleBackend.main import app

        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_session = MagicMock()
            mock_session.access_token = "login-at"
            mock_session.refresh_token = "login-rt"
            mock_result = MagicMock()
            mock_result.user = mock_user
            mock_result.session = mock_session
            mock_sb.auth.sign_in_with_password.return_value = mock_result
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": _TEST_USER_EMAIL, "password": "correct-password"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" not in data
        assert "refresh_token" not in data
        assert data["user"]["id"] == _TEST_USER_ID

        set_cookie = resp.headers.get("set-cookie", "")
        assert _TEST_COOKIE_NAME in set_cookie

    def test_login_invalid_credentials(self):
        """POST /api/v1/auth/login with wrong password → 401."""
        from syncRoleBackend.main import app

        with patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_sb.auth.sign_in_with_password.side_effect = Exception(
                "Invalid login credentials"
            )
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.post(
                "/api/v1/auth/login",
                json={"email": _TEST_USER_EMAIL, "password": "wrong-password"},
            )
            assert resp.status_code == 401

    def test_logout_clears_cookies(self):
        """POST /api/v1/auth/logout → 200 + expired Set-Cookie."""
        from syncRoleBackend.main import app

        with (
            patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb,
            patch("syncRoleBackend.auth.middleware._get_auth_client") as mock_get_client,
        ):
            mock_client = MagicMock()
            mock_user = MagicMock()
            mock_user.id = _TEST_USER_ID
            mock_user.email = _TEST_USER_EMAIL
            mock_response = MagicMock()
            mock_response.user = mock_user
            mock_client.auth.get_user.return_value = mock_response
            mock_get_client.return_value = mock_client

            mock_sb = MagicMock()
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            cookie_val = _make_cookie_value(access_token="logout-at")
            client.cookies.set(_TEST_COOKIE_NAME, cookie_val)

            resp = client.post("/api/v1/auth/logout")

        assert resp.status_code == 200
        assert resp.json()["message"] == "Logged out"

        # Check Set-Cookie expires the cookie
        set_cookie = resp.headers.get("set-cookie", "")
        assert _TEST_COOKIE_NAME in set_cookie
        assert "HttpOnly" in set_cookie

    def test_logout_without_cookie_returns_200(self):
        """POST /api/v1/auth/logout without cookie → 200 (public endpoint clears cookie)."""
        from syncRoleBackend.main import app
        from syncRoleBackend.auth import get_session_cookie_name

        client = TestClient(app)
        resp = client.post("/api/v1/auth/logout")
        assert resp.status_code == 200
        # Should still clear the cookie even without a valid session
        set_cookie = resp.headers.get("set-cookie", "")
        assert get_session_cookie_name() in set_cookie
        assert "Max-Age=0" in set_cookie


class TestGoogleOAuthCallback:
    """Tests for /api/v1/auth/google/callback — now sets cookies on redirect."""

    def _make_user(self, user_metadata: dict, user_id: str = "u-google-1",
                   email: str = "luis@gmail.com"):
        user = MagicMock()
        user.id = user_id
        user.email = email
        user.user_metadata = user_metadata
        return user

    def _make_session(self, access_token: str = "google-at",
                      refresh_token: str = "google-rt"):
        session = MagicMock()
        session.access_token = access_token
        session.refresh_token = refresh_token
        return session

    def _make_exchange_result(self, user, session):
        result = MagicMock()
        result.user = user
        result.session = session
        return result

    def test_google_callback_sets_cookies_instead_of_url_params(self):
        """Google callback sets cookies on redirect, no tokens in URL."""
        from syncRoleBackend.auth.router import _build_google_redirect

        user = self._make_user({
            "full_name": "Luis Villarreal",
            "avatar_url": "https://lh3.googleusercontent.com/luis.png",
        })
        session = self._make_session()
        result = self._make_exchange_result(user, session)

        with patch("syncRoleBackend.auth.router.settings") as mock_settings, \
             patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_get_sb.return_value = MagicMock()
            mock_settings.frontend_url = "https://app.example.com"
            mock_settings.supabase_url = "https://kicwqgyzxygujewlvxpv.supabase.co"

            redirect = _build_google_redirect(result)

        # Should be a 302 redirect
        assert redirect.status_code == 302
        location = redirect.headers.get("location", "")
        # No tokens in URL
        assert "access_token" not in location
        assert "refresh_token" not in location
        # Should redirect to FE
        assert location.startswith("https://app.example.com/auth")

        # Check Set-Cookie on redirect response
        set_cookie = redirect.headers.get("set-cookie", "")
        assert _TEST_COOKIE_NAME in set_cookie
        assert "HttpOnly" in set_cookie

    def test_google_callback_upserts_profile(self):
        """Still upserts profiles row on callback."""
        from syncRoleBackend.auth.router import _build_google_redirect

        user = self._make_user({
            "full_name": "Luis V",
            "avatar_url": "https://x/luis.png",
        }, user_id="user-xyz")
        session = self._make_session()
        result = self._make_exchange_result(user, session)

        with patch("syncRoleBackend.auth.router.settings") as mock_settings, \
             patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_get_sb.return_value = mock_sb
            mock_settings.frontend_url = "https://app.example.com"
            mock_settings.supabase_url = "https://kicwqgyzxygujewlvxpv.supabase.co"

            _build_google_redirect(result)

        mock_sb.table.assert_called_once_with("profiles")
        upsert_call = mock_sb.table.return_value.upsert.call_args
        assert upsert_call.args[0] == {
            "id": "user-xyz",
            "display_name": "Luis V",
            "avatar_url": "https://x/luis.png",
        }

    def test_google_callback_empty_metadata(self):
        """Empty user_metadata yields empty profile fields."""
        from syncRoleBackend.auth.router import _build_google_redirect

        user = self._make_user({})
        session = self._make_session()
        result = self._make_exchange_result(user, session)

        with patch("syncRoleBackend.auth.router.settings") as mock_settings, \
             patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_get_sb.return_value = MagicMock()
            mock_settings.frontend_url = "https://app.example.com"
            mock_settings.supabase_url = "https://kicwqgyzxygujewlvxpv.supabase.co"

            redirect = _build_google_redirect(result)

        assert redirect.status_code == 302
        location = redirect.headers.get("location", "")
        assert location.startswith("https://app.example.com/auth")
        assert "access_token" not in location

    def test_profile_upsert_failure_does_not_break_redirect(self):
        """If profile upsert fails, redirect still happens."""
        from syncRoleBackend.auth.router import _build_google_redirect

        user = self._make_user({"full_name": "Luis", "avatar_url": "https://x"})
        session = self._make_session()
        result = self._make_exchange_result(user, session)

        with patch("syncRoleBackend.auth.router.settings") as mock_settings, \
             patch("syncRoleBackend.auth.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_sb.table.return_value.upsert.side_effect = RuntimeError("db down")
            mock_get_sb.return_value = mock_sb
            mock_settings.frontend_url = "https://app.example.com"
            mock_settings.supabase_url = "https://kicwqgyzxygujewlvxpv.supabase.co"

            redirect = _build_google_redirect(result)

        assert redirect.status_code == 302
        set_cookie = redirect.headers.get("set-cookie", "")
        assert _TEST_COOKIE_NAME in set_cookie


# ===== DUAL CLIENT TESTS =====


class TestDualClient:
    """Tests for dual supabase client pattern (unchanged)."""

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
        """get_supabase(user_jwt) creates anon client + sets JWT auth header."""
        from syncRoleBackend.database import get_supabase, _clients
        from syncRoleBackend.config import settings

        _clients.clear()

        user_jwt = "test-user-jwt"
        with patch("syncRoleBackend.database.create_client") as mock_create:
            mock_client = MagicMock()
            mock_create.return_value = mock_client
            get_supabase(user_jwt)
            mock_create.assert_called_once()
            _url, key = mock_create.call_args[0]
            assert key == settings.supabase_anon_key
            mock_client.postgrest.auth.assert_called_once_with(user_jwt)

    def test_get_supabase_caches_clients(self):
        """Same cache_key returns cached client."""
        from syncRoleBackend.database import get_supabase, _clients

        _clients.clear()

        with patch("syncRoleBackend.database.create_client") as mock_create:
            mock_create.return_value = MagicMock()
            c1 = get_supabase("service_role")
            c2 = get_supabase("service_role")
            mock_create.assert_called_once()
            assert c1 is c2
