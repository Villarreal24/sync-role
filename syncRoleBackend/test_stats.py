"""Tests for stats module: GET /api/v1/stats/overview + cache layer."""

import time
from unittest.mock import MagicMock, patch

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient

from syncRoleBackend.config import settings
from syncRoleBackend.main import app

_TEST_JWT_SECRET = "test-secret-that-is-at-least-32-chars-long-for-hs256!!"
_TEST_USER_ID = "00000000-0000-0000-0000-000000000001"
_TEST_USER_EMAIL = "test@example.com"


@pytest.fixture(autouse=True)
def _clear_stats_cache():
    """Reset the in-memory cache between tests so a previous test's
    RPC mock result doesn't leak into the next one."""
    from syncRoleBackend.stats.queries import invalidate_overview_stats_cache

    invalidate_overview_stats_cache()
    yield
    invalidate_overview_stats_cache()


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


def _empty_payload() -> dict:
    """Payload as the RPC returns it (wrapped in a list by supabase-py)."""
    return {
        "totals": {
            "saved": 0,
            "applied": 0,
            "interviewing": 0,
            "rejected": 0,
            "offer": 0,
            "companies": 0,
            "this_week_added": 0,
        },
        "funnel": {
            "saved_to_applied": 0.0,
            "applied_to_interviewing": 0.0,
            "interviewing_to_offer": 0.0,
        },
        "top_technologies": [],
        "top_work_modes": [],
        "top_seniorities": [],
        "activity": [
            {"week_start": "2026-05-18", "count": 0},
            {"week_start": "2026-05-25", "count": 0},
            {"week_start": "2026-06-01", "count": 0},
            {"week_start": "2026-06-08", "count": 0},
            {"week_start": "2026-06-15", "count": 0},
            {"week_start": "2026-06-22", "count": 0},
            {"week_start": "2026-06-29", "count": 0},
            {"week_start": "2026-07-06", "count": 0},
        ],
        "generated_at": "2026-07-07T03:35:52Z",
    }


def _mock_rpc_response(payload: dict) -> MagicMock:
    """supabase-py returns .data as a list-of-one for a single-object RPC."""
    result = MagicMock()
    result.data = [payload]
    return result


class TestOverviewEndpoint:
    """Integration: GET /api/v1/stats/overview."""

    def test_returns_200_with_valid_payload(self):
        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.stats.queries.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            # mock_sb is the return value of get_supabase().
            # Then mock_sb.rpc(...).execute() navigates the chain.
            mock_sb.rpc.return_value.execute.return_value = (
                _mock_rpc_response(_empty_payload())
            )
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.get(
                "/api/v1/stats/overview", headers=_AUTH_HEADER
            )
            assert resp.status_code == 200
            data = resp.json()
            assert data["totals"]["saved"] == 0
            assert data["totals"]["applied"] == 0
            assert data["top_technologies"] == []
            assert len(data["activity"]) == 8

    def test_returns_zeroes_for_user_with_no_jobs(self):
        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.stats.queries.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_sb.rpc.return_value.execute.return_value = (
                _mock_rpc_response(_empty_payload())
            )
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.get("/api/v1/stats/overview", headers=_AUTH_HEADER)
            assert resp.status_code == 200
            data = resp.json()
            assert all(v == 0 for v in data["totals"].values())
            assert data["funnel"] == {
                "saved_to_applied": 0.0,
                "applied_to_interviewing": 0.0,
                "interviewing_to_offer": 0.0,
            }
            assert data["top_technologies"] == []

    def test_aggregates_a_realistic_payload(self):
        payload = _empty_payload()
        payload["totals"] = {
            "saved": 2,
            "applied": 15,
            "interviewing": 2,
            "rejected": 0,
            "offer": 0,
            "companies": 19,
            "this_week_added": 13,
        }
        payload["funnel"] = {
            "saved_to_applied": 89.5,
            "applied_to_interviewing": 11.8,
            "interviewing_to_offer": 0.0,
        }
        payload["top_technologies"] = [
            {"name": "React", "count": 8},
            {"name": "TypeScript", "count": 7},
        ]
        payload["top_work_modes"] = [
            {"name": "Remote", "count": 14},
        ]
        payload["activity"] = [
            {"week_start": "2026-06-22", "count": 0},
            {"week_start": "2026-06-29", "count": 17},
            {"week_start": "2026-07-06", "count": 2},
        ]

        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.stats.queries.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_sb.rpc.return_value.execute.return_value = (
                _mock_rpc_response(payload)
            )
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.get("/api/v1/stats/overview", headers=_AUTH_HEADER)
            data = resp.json()
            assert data["totals"]["applied"] == 15
            assert data["totals"]["companies"] == 19
            assert data["funnel"]["saved_to_applied"] == 89.5
            assert data["top_technologies"][0]["name"] == "React"
            assert data["top_technologies"][0]["count"] == 8
            assert data["top_work_modes"][0]["name"] == "Remote"
            assert data["activity"][-1]["count"] == 2

    def test_returns_500_on_supabase_failure_with_sanitized_detail(self):
        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.stats.queries.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            mock_sb.rpc.return_value.execute.side_effect = (
                RuntimeError("connection refused at 10.0.0.5:5432")
            )
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.get("/api/v1/stats/overview", headers=_AUTH_HEADER)
            assert resp.status_code == 500
            detail = resp.json()["detail"]
            assert "Failed to load overview stats" in detail
            # The raw error must NOT leak to the client
            assert "connection refused" not in detail
            assert "10.0.0.5" not in detail

    def test_returns_200_when_rpc_returns_no_data(self):
        """If the RPC returns no rows, Pydantic fills in defaults and
        the user still gets a 200 (a logged-in user should always
        see a payload, never 404)."""
        with (
            patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET),
            patch("syncRoleBackend.stats.queries.get_supabase") as mock_get_sb,
        ):
            mock_sb = MagicMock()
            # Empty list → _fetch_overview_stats returns {} →
            # Pydantic defaults to zeros and empty lists.
            mock_sb.rpc.return_value.execute.return_value.data = []
            mock_get_sb.return_value = mock_sb

            client = TestClient(app)
            resp = client.get("/api/v1/stats/overview", headers=_AUTH_HEADER)
            # Empty payload → Pydantic defaults → 200 with zeros
            assert resp.status_code == 200
            data = resp.json()
            assert all(v == 0 for v in data["totals"].values())

    def test_requires_authentication(self):
        """No Authorization header → 401 from auth middleware."""
        with patch.object(settings, "supabase_jwt_secret", _TEST_JWT_SECRET):
            client = TestClient(app)
            resp = client.get("/api/v1/stats/overview")
            assert resp.status_code == 401


class TestOverviewCache:
    """Unit tests for the in-memory cache layer in queries.py."""

    def test_cache_hits_within_ttl(self):
        from syncRoleBackend.stats.queries import (
            _cache,
            get_overview_stats,
            invalidate_overview_stats_cache,
        )
        with patch(
            "syncRoleBackend.stats.queries._fetch_overview_stats",
            return_value=_empty_payload(),
        ) as mock_fetch:
            invalidate_overview_stats_cache()
            get_overview_stats("user-1")
            get_overview_stats("user-1")
            get_overview_stats("user-1")
            assert mock_fetch.call_count == 1
            assert "user-1" in _cache

    def test_cache_expires_after_ttl(self):
        from syncRoleBackend.stats.queries import (
            _cache,
            get_overview_stats,
            invalidate_overview_stats_cache,
        )
        with patch(
            "syncRoleBackend.stats.queries._fetch_overview_stats",
            return_value=_empty_payload(),
        ) as mock_fetch:
            invalidate_overview_stats_cache()
            get_overview_stats("user-1")
            assert mock_fetch.call_count == 1
            # Force-expire by setting the timestamp to epoch 0
            data, _ = _cache["user-1"]
            _cache["user-1"] = (data, 0.0)
            get_overview_stats("user-1")
            assert mock_fetch.call_count == 2

    def test_invalidate_one_user_keeps_others(self):
        from syncRoleBackend.stats.queries import (
            _cache,
            get_overview_stats,
            invalidate_overview_stats_cache,
        )
        with patch(
            "syncRoleBackend.stats.queries._fetch_overview_stats",
            return_value=_empty_payload(),
        ):
            invalidate_overview_stats_cache()
            get_overview_stats("user-1")
            get_overview_stats("user-2")
            assert len(_cache) == 2
            invalidate_overview_stats_cache("user-1")
            assert "user-1" not in _cache
            assert "user-2" in _cache

    def test_invalidate_all_clears_cache(self):
        from syncRoleBackend.stats.queries import (
            _cache,
            get_overview_stats,
            invalidate_overview_stats_cache,
        )
        with patch(
            "syncRoleBackend.stats.queries._fetch_overview_stats",
            return_value=_empty_payload(),
        ):
            invalidate_overview_stats_cache()
            get_overview_stats("user-1")
            get_overview_stats("user-2")
            assert len(_cache) == 2
            invalidate_overview_stats_cache(None)
            assert len(_cache) == 0

    def test_invalidate_idempotent_on_missing_user(self):
        from syncRoleBackend.stats.queries import (
            _cache,
            get_overview_stats,
            invalidate_overview_stats_cache,
        )
        with patch(
            "syncRoleBackend.stats.queries._fetch_overview_stats",
            return_value=_empty_payload(),
        ):
            invalidate_overview_stats_cache()
            get_overview_stats("user-1")
            # Invalidating a user that was never cached must not raise
            invalidate_overview_stats_cache("user-does-not-exist")
            assert "user-1" in _cache  # user-1 was not touched
