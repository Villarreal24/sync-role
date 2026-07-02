"""Tests for profiles module: read/update own profile."""

import time
from unittest.mock import MagicMock, patch

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

_TEST_JWT_SECRET = "test-secret-that-is-at-least-32-chars-long-for-hs256!!"
_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "test@example.com"


def _make_token(exp_offset: int = 3600) -> str:
    payload = {
        "sub": _TEST_USER_ID,
        "email": _TEST_USER_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_offset,
    }
    return pyjwt.encode(payload, _TEST_JWT_SECRET, algorithm="HS256")


_AUTH_HEADER = {"Authorization": f"Bearer {_make_token()}"}


class TestProfilesRoutes:
    """RED: tests for /api/v1/profiles/me endpoints."""

    def test_get_profile_success(self):
        """GET /api/v1/profiles/me with valid token → 200 + profile."""
        from syncRoleBackend.config import settings

        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": _TEST_USER_ID,
                    "display_name": "Test User",
                    "avatar_url": "https://example.com/avatar.png",
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-06-01T00:00:00Z",
                }
            ]
            mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.get("/api/v1/profiles/me", headers=_AUTH_HEADER)
            assert resp.status_code == 200
            data = resp.json()
            assert data["display_name"] == "Test User"
            assert data["avatar_url"] == "https://example.com/avatar.png"
            assert "id" in data

    def test_get_profile_not_found(self):
        """GET /api/v1/profiles/me with no profile row → 404."""
        from syncRoleBackend.config import settings

        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = []
            mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.get("/api/v1/profiles/me", headers=_AUTH_HEADER)
            assert resp.status_code == 404

    def test_get_profile_requires_auth(self):
        """GET /api/v1/profiles/me without token → 401."""
        from syncRoleBackend.main import app

        client = TestClient(app)
        resp = client.get("/api/v1/profiles/me")
        assert resp.status_code == 401

    def test_update_profile_success(self):
        """PATCH /api/v1/profiles/me with valid data → 200 + updated profile."""
        from syncRoleBackend.config import settings

        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": _TEST_USER_ID,
                    "display_name": "Updated Name",
                    "avatar_url": "",
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-06-01T00:00:00Z",
                }
            ]
            mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.patch(
                "/api/v1/profiles/me",
                json={"display_name": "Updated Name"},
                headers=_AUTH_HEADER,
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["display_name"] == "Updated Name"

    def test_update_profile_empty_body(self):
        """PATCH /api/v1/profiles/me with empty body → 400."""
        from syncRoleBackend.config import settings

        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.patch(
                "/api/v1/profiles/me",
                json={},
                headers=_AUTH_HEADER,
            )
            assert resp.status_code == 400


class TestJobScoping:
    """RED: tests for user_id scoping on job endpoints."""

    def test_create_job_includes_user_id(self):
        """POST /api/v1/jobs should set user_id from JWT in the payload."""
        from syncRoleBackend.config import settings

        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.main.get_supabase") as mock_get_sb,
            patch("syncRoleBackend.main._new_id", return_value="test-uuid"),
            patch("syncRoleBackend.main._now_iso", return_value="2026-01-01T00:00:00Z"),
        ):
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": "test-uuid",
                    "title": "User-Scoped Job",
                    "company": "TestCorp",
                    "source_url": "https://test.com",
                    "status": "saved",
                    "user_id": _TEST_USER_ID,
                    "created_at": "2026-01-01T00:00:00Z",
                    "location": "",
                    "salary": "",
                    "description": "",
                    "recruiter_name": "",
                    "published_at": "",
                    "employment_type": "",
                    "work_mode": "",
                    "seniority": "",
                    "technologies": [],
                }
            ]
            mock_sb.table.return_value.insert.return_value.execute.return_value = mock_result
            mock_get_sb.return_value = mock_sb

            from syncRoleBackend.main import app

            client = TestClient(app)
            resp = client.post(
                "/api/v1/jobs",
                json={"title": "User-Scoped Job", "company": "TestCorp", "sourceUrl": "https://test.com"},
                headers=_AUTH_HEADER,
            )
            assert resp.status_code == 200

            # Verify user_id was included in the insert payload
            mock_sb.table.assert_called_with("job_postings")
            call_kwargs = mock_sb.table.return_value.insert.call_args[0][0]
            assert call_kwargs["user_id"] == _TEST_USER_ID
