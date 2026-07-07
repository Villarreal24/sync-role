"""Tests for main API endpoints — updated with auth tokens for protected routes."""

import time
from unittest.mock import patch

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

from syncRoleBackend.config import settings
from syncRoleBackend.main import app

# Test JWT secret — must match what the middleware uses
_TEST_JWT_SECRET = "test-secret-that-is-at-least-32-chars-long-for-hs256!!"
_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "test@example.com"

client = TestClient(app)


def _make_token(exp_offset: int = 3600) -> str:
    """Create a test JWT with the test secret."""
    payload = {
        "sub": _TEST_USER_ID,
        "email": _TEST_USER_EMAIL,
        "aud": "authenticated",
        "role": "authenticated",
        "iat": int(time.time()),
        "exp": int(time.time()) + exp_offset,
    }
    return pyjwt.encode(payload, _TEST_JWT_SECRET, algorithm="HS256")


# Patch JWT secret globally for all tests
pytest_plugins = []
_token = _make_token()
_AUTH_HEADER = {"Authorization": f"Bearer {_token}"}


@pytest.fixture(autouse=True)
def _patch_settings():
    with (
        patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
        patch("syncRoleBackend.main.get_supabase") as mock_get_sb,
    ):
        mock_sb = _mock_supabase()
        mock_get_sb.return_value = mock_sb
        yield


def _mock_supabase():
    """Return a mock supabase client that captures inserts for test assertions."""
    from unittest.mock import MagicMock

    _inserted_rows: list[dict] = []

    def _insert(payload):
        _inserted_rows.append(payload)
        result = MagicMock()
        result.data = [payload]
        return MagicMock(execute=lambda: result)

    def _select(*args, **kwargs):
        result = MagicMock()
        result.data = _inserted_rows
        return MagicMock(
            order=lambda *a, **kw: MagicMock(
                execute=lambda: MagicMock(data=_inserted_rows)
            ),
            execute=lambda: MagicMock(data=_inserted_rows),
        )

    def _update(updates):
        if _inserted_rows:
            for row in _inserted_rows:
                row.update(updates)
            result = MagicMock()
            result.data = [_inserted_rows[-1]]
            return MagicMock(eq=lambda fid, fv: MagicMock(execute=lambda: result))
        result = MagicMock()
        result.data = []
        return MagicMock(eq=lambda fid, fv: MagicMock(execute=lambda: result))

    def _delete():
        if _inserted_rows:
            result = MagicMock()
            result.data = [_inserted_rows.pop()]
            return MagicMock(eq=lambda fid, fv: MagicMock(execute=lambda: result))
        result = MagicMock()
        result.data = []
        return MagicMock(eq=lambda fid, fv: MagicMock(execute=lambda: result))

    mock_sb = MagicMock()
    mock_sb.table.return_value = MagicMock(
        insert=_insert,
        select=_select,
        update=_update,
        delete=_delete,
        order=lambda *a, **kw: MagicMock(execute=lambda: MagicMock(data=_inserted_rows)),
        eq=lambda fid, fv: MagicMock(
            execute=lambda: MagicMock(data=[r for r in _inserted_rows if r.get("id") == fv])
            if fid == "id"
            else MagicMock(data=[])
        ),
    )
    return mock_sb


def test_health_check():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Welcome to Sync Role API"}


def test_get_jobs_returns_list():
    resp = client.get("/api/v1/jobs", headers=_AUTH_HEADER)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_create_job():
    payload = {
        "title": "Test Engineer",
        "company": "TestCorp",
        "sourceUrl": "https://test.com/job",
        "status": "applied",
        "location": "Remote",
        "salary": "$100k",
        "description": "A great job",
        "recruiterName": "Jane",
        "publishedAt": "hace 2 días",
        "employmentType": "Full-time",
        "workMode": "Remote",
        "seniority": "Senior",
        "technologies": ["Python", "FastAPI"],
    }
    resp = client.post("/api/v1/jobs", json=payload, headers=_AUTH_HEADER)
    assert resp.status_code == 200
    data = resp.json()
    assert data["title"] == "Test Engineer"
    assert data["company"] == "TestCorp"
    assert data["status"] == "applied"
    assert data["description"] == "A great job"
    assert data["recruiterName"] == "Jane"
    assert data["publishedAt"] == "hace 2 días"
    assert data["employmentType"] == "Full-time"
    assert data["workMode"] == "Remote"
    assert data["seniority"] == "Senior"
    assert data["technologies"] == ["Python", "FastAPI"]
    assert "id" in data
    assert "createdAt" in data


def test_create_job_defaults():
    payload = {
        "title": "Minimal Job",
        "company": "MinCorp",
        "sourceUrl": "https://min.com",
    }
    resp = client.post("/api/v1/jobs", json=payload, headers=_AUTH_HEADER)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "saved"
    assert data["description"] == ""
    assert data["recruiterName"] == ""
    assert data["publishedAt"] == ""
    assert data["employmentType"] == ""
    assert data["workMode"] == ""
    assert data["seniority"] == ""
    assert data["technologies"] == []


def test_update_job():
    create_resp = client.post(
        "/api/v1/jobs",
        json={
            "title": "Update Me",
            "company": "UpdCorp",
            "sourceUrl": "https://upd.com",
        },
        headers=_AUTH_HEADER,
    )
    job_id = create_resp.json()["id"]

    update_resp = client.patch(
        f"/api/v1/jobs/{job_id}",
        json={"status": "interviewing"},
        headers=_AUTH_HEADER,
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "interviewing"


def test_update_job_partial_new_fields():
    create_resp = client.post(
        "/api/v1/jobs",
        json={
            "title": "Partial Update",
            "company": "PartCorp",
            "sourceUrl": "https://part.com",
        },
        headers=_AUTH_HEADER,
    )
    job_id = create_resp.json()["id"]

    update_resp = client.patch(
        f"/api/v1/jobs/{job_id}",
        json={"seniority": "Senior", "workMode": "Remote"},
        headers=_AUTH_HEADER,
    )
    assert update_resp.status_code == 200
    data = update_resp.json()
    assert data["seniority"] == "Senior"
    assert data["workMode"] == "Remote"
    assert data["employmentType"] == ""


def test_delete_job():
    create_resp = client.post(
        "/api/v1/jobs",
        json={
            "title": "Delete Me",
            "company": "DelCorp",
            "sourceUrl": "https://del.com",
        },
        headers=_AUTH_HEADER,
    )
    job_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/v1/jobs/{job_id}", headers=_AUTH_HEADER)
    assert delete_resp.status_code == 200
    assert delete_resp.json()["message"] == "Job deleted successfully"


def test_delete_nonexistent_job():
    resp = client.delete(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000000",
        headers=_AUTH_HEADER,
    )
    assert resp.status_code == 404


def test_update_nonexistent_job():
    resp = client.patch(
        "/api/v1/jobs/00000000-0000-0000-0000-000000000000",
        json={"status": "offer"},
        headers=_AUTH_HEADER,
    )
    assert resp.status_code == 404


def test_jobs_without_auth_returns_401():
    """Verify auth middleware blocks unauthenticated requests to /api/v1/jobs."""
    resp = client.get("/api/v1/jobs")
    assert resp.status_code == 401


def test_scrape_success_gemini():
    """Verify scrape endpoint uses Gemini provider successfully when mocked."""
    mock_json = (
        '{"title": "Gemini Engineer", "company": "Google", "source_url": "", '
        '"location": "Remote", "work_mode": "Remote", "employment_type": "Full-time", '
        '"salary": "$120k", "technologies": ["Python"], "seniority": "Senior", '
        '"description": "Great job", "recruiter_name": "", "published_at": ""}'
    )
    with (
        patch.object(settings, "llm_provider", "gemini"),
        patch.object(settings, "gemini_api_key", "test-gemini-key"),
        patch("syncRoleBackend.main._call_llm", return_value=mock_json) as mock_call,
    ):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Gemini Engineer"
        assert data["company"] == "Google"
        mock_call.assert_called_once()


def test_scrape_success_openai():
    """Verify scrape endpoint uses OpenAI provider successfully when mocked."""
    mock_json = (
        '{"title": "OpenAI Engineer", "company": "Microsoft", "source_url": "", '
        '"location": "Remote", "work_mode": "Remote", "employment_type": "Full-time", '
        '"salary": "$150k", "technologies": ["Python"], "seniority": "Senior", '
        '"description": "Awesome job", "recruiter_name": "", "published_at": ""}'
    )
    with (
        patch.object(settings, "llm_provider", "openai"),
        patch.object(settings, "openai_api_key", "test-openai-key"),
        patch("syncRoleBackend.main._call_llm", return_value=mock_json) as mock_call,
    ):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "OpenAI Engineer"
        assert data["company"] == "Microsoft"
        mock_call.assert_called_once()


def test_scrape_success_groq():
    """Verify scrape endpoint uses Groq provider successfully when mocked."""
    mock_json = (
        '{"title": "Groq Engineer", "company": "Groq Inc", "source_url": "", '
        '"location": "Remote", "work_mode": "Remote", "employment_type": "Full-time", '
        '"salary": "$100k", "technologies": ["Python"], "seniority": "Senior", '
        '"description": "Fast job", "recruiter_name": "", "published_at": ""}'
    )
    with (
        patch.object(settings, "llm_provider", "groq"),
        patch.object(settings, "groq_api_key", "test-groq-key"),
        patch("syncRoleBackend.main._call_llm", return_value=mock_json) as mock_call,
    ):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Groq Engineer"
        assert data["company"] == "Groq Inc"
        mock_call.assert_called_once()


def test_scrape_groq_missing_key():
    """Without GROQ_API_KEY set and provider=groq, scrape should return 501."""
    with (
        patch.object(settings, "llm_provider", "groq"),
        patch.object(settings, "groq_api_key", ""),
        patch("syncRoleBackend.main._llm_client", None),
    ):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
        assert resp.status_code == 501
        assert "GROQ_API_KEY is not configured" in resp.json()["detail"]


def test_scrape_gemini_missing_key():
    """Without GEMINI_API_KEY set and provider=gemini, scrape should return 501."""
    with (
        patch.object(settings, "llm_provider", "gemini"),
        patch.object(settings, "gemini_api_key", ""),
        patch("syncRoleBackend.main._llm_client", None),
    ):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
        assert resp.status_code == 501
        assert "GEMINI_API_KEY is not configured" in resp.json()["detail"]


def test_scrape_openai_missing_key():
    """Without OPENAI_API_KEY set and provider=openai, scrape should return 501."""
    with (
        patch.object(settings, "llm_provider", "openai"),
        patch.object(settings, "openai_api_key", ""),
        patch("syncRoleBackend.main._llm_client", None),
    ):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
        assert resp.status_code == 501
        assert "OPENAI_API_KEY is not configured" in resp.json()["detail"]


def test_scrape_missing_key():
    """Without the active provider's API key set, scrape should return 501."""
    if settings.openai_api_key:
        pytest.skip("OPENAI_API_KEY is set — scrape would succeed, not return 501")
    with patch("syncRoleBackend.main._llm_client", None):
        resp = client.post(
            "/api/v1/scrape",
            json={
                "url": "https://example.com/job",
                "page_content": "Some job page content",
            },
        )
    assert resp.status_code == 501
    assert "not configured" in resp.json()["detail"]
