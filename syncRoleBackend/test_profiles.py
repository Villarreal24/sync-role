"""Tests for profiles module: read/update own profile."""

import base64
import json
import time
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from syncRoleBackend.main import app

_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "test@example.com"

client = TestClient(app)

_COOKIE_NAME = "sb-kicwqgyzxygujewlvxpv-auth-token"


def _make_cookie_value(access_token: str = "test-at") -> str:
    payload = json.dumps([
        access_token,
        "test-rt",
        {"id": _TEST_USER_ID, "email": _TEST_USER_EMAIL, "aud": "authenticated", "role": "authenticated"},
        9999999999,
    ])
    return base64.b64encode(payload.encode()).decode()


@pytest.fixture(autouse=True)
def _patch_auth():
    with patch("syncRoleBackend.auth.middleware._get_auth_client") as mock_get_auth:
        mock_auth_client = MagicMock()
        mock_user = MagicMock()
        mock_user.id = _TEST_USER_ID
        mock_user.email = _TEST_USER_EMAIL
        mock_response = MagicMock()
        mock_response.user = mock_user
        mock_auth_client.auth.get_user.return_value = mock_response
        mock_get_auth.return_value = mock_auth_client
        client.cookies.set(_COOKIE_NAME, _make_cookie_value())
        yield


class TestProfilesRoutes:
    """RED: tests for /api/v1/profiles/me endpoints."""

    def test_get_profile_success(self):
        """GET /api/v1/profiles/me with valid session → 200 + profile."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
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

            resp = client.get("/api/v1/profiles/me")
            assert resp.status_code == 200
            data = resp.json()
            assert data["display_name"] == "Test User"
            assert data["avatar_url"] == "https://example.com/avatar.png"
            assert "id" in data

    def test_get_profile_not_found(self):
        """GET /api/v1/profiles/me with no profile row → 404."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = []
            mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            resp = client.get("/api/v1/profiles/me")
            assert resp.status_code == 404

    def test_get_profile_requires_auth(self):
        """GET /api/v1/profiles/me without session → 401."""
        unauth_client = TestClient(app)
        resp = unauth_client.get("/api/v1/profiles/me")
        assert resp.status_code == 401

    def test_update_profile_success(self):
        """PATCH /api/v1/profiles/me with valid data → 200 + updated profile."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
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

            resp = client.patch(
                "/api/v1/profiles/me",
                json={"display_name": "Updated Name"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["display_name"] == "Updated Name"

    def test_update_profile_empty_body(self):
        """PATCH /api/v1/profiles/me with empty body → 400."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_get_sb.return_value = mock_sb

            resp = client.patch(
                "/api/v1/profiles/me",
                json={},
            )
            assert resp.status_code == 400


    # ── Extra profile fields tests ──────────────────────────────────

    def test_get_profile_returns_new_fields_as_none(self):
        """GET /profiles/me should return null for unset extra fields."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": _TEST_USER_ID,
                    "display_name": "Test User",
                    "avatar_url": "",
                    "phone": None,
                    "linkedin_url": None,
                    "github_url": None,
                    "portfolio_url": None,
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-06-01T00:00:00Z",
                }
            ]
            mock_sb.table.return_value.select.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            resp = client.get("/api/v1/profiles/me")
            assert resp.status_code == 200
            data = resp.json()
            assert data["phone"] is None
            assert data["linkedin_url"] is None
            assert data["github_url"] is None
            assert data["portfolio_url"] is None

    def test_update_profile_accepts_extra_fields(self):
        """PATCH /profiles/me with phone and social links → 200 + values."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": _TEST_USER_ID,
                    "display_name": "Test User",
                    "avatar_url": "",
                    "phone": "+54 11 5555-1234",
                    "linkedin_url": "https://linkedin.com/in/testuser",
                    "github_url": "https://github.com/testuser",
                    "portfolio_url": "https://testuser.dev",
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-06-01T00:00:00Z",
                }
            ]
            mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            resp = client.patch(
                "/api/v1/profiles/me",
                json={
                    "phone": "+54 11 5555-1234",
                    "linkedin_url": "https://linkedin.com/in/testuser",
                    "github_url": "https://github.com/testuser",
                    "portfolio_url": "https://testuser.dev",
                },
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["phone"] == "+54 11 5555-1234"
            assert data["linkedin_url"] == "https://linkedin.com/in/testuser"
            assert data["github_url"] == "https://github.com/testuser"
            assert data["portfolio_url"] == "https://testuser.dev"

    def test_update_profile_partial_extra_fields(self):
        """PATCH with only phone should leave linkedin_url and others unchanged."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": _TEST_USER_ID,
                    "display_name": "Test User",
                    "avatar_url": "",
                    "phone": "+1 555 123-4567",
                    "linkedin_url": "https://linkedin.com/in/testuser",
                    "github_url": None,
                    "portfolio_url": None,
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-06-01T00:00:00Z",
                }
            ]
            mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            resp = client.patch(
                "/api/v1/profiles/me",
                json={"phone": "+1 555 123-4567"},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["phone"] == "+1 555 123-4567"
            assert data["linkedin_url"] == "https://linkedin.com/in/testuser"

    def test_update_profile_clears_extra_field(self):
        """PATCH with empty string → field returns None."""
        with patch("syncRoleBackend.profiles.router.get_supabase") as mock_get_sb:
            mock_sb = MagicMock()
            mock_result = MagicMock()
            mock_result.data = [
                {
                    "id": _TEST_USER_ID,
                    "display_name": "Test User",
                    "avatar_url": "",
                    "phone": None,
                    "linkedin_url": None,
                    "github_url": None,
                    "portfolio_url": None,
                    "created_at": "2026-01-01T00:00:00Z",
                    "updated_at": "2026-06-01T00:00:00Z",
                }
            ]
            mock_sb.table.return_value.update.return_value.eq.return_value.execute.return_value = (
                mock_result
            )
            mock_get_sb.return_value = mock_sb

            resp = client.patch(
                "/api/v1/profiles/me",
                json={"linkedin_url": ""},
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["linkedin_url"] is None


class TestJobScoping:
    """RED: tests for user_id scoping on job endpoints."""

    def test_create_job_includes_user_id(self):
        """POST /api/v1/jobs should set user_id from session in the payload."""
        with (
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

            resp = client.post(
                "/api/v1/jobs",
                json={"title": "User-Scoped Job", "company": "TestCorp", "sourceUrl": "https://test.com"},
            )
            assert resp.status_code == 200

            # Verify user_id was included in the insert payload
            mock_sb.table.assert_called_with("job_postings")
            call_kwargs = mock_sb.table.return_value.insert.call_args[0][0]
            assert call_kwargs["user_id"] == _TEST_USER_ID
