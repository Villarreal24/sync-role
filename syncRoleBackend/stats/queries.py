import logging
import time

from syncRoleBackend.database import get_supabase

logger = logging.getLogger("sync_role.stats")

# In-memory cache: {user_id: (data, monotonic_timestamp)}.
# Single-instance app — for multi-instance deployment this needs
# to move to Redis (or equivalent) so invalidation works across nodes.
_cache: dict[str, tuple[dict, float]] = {}
CACHE_TTL_SECONDS = 30


def _fetch_overview_stats(user_id: str) -> dict:
    """Call the get_overview_stats RPC. Returns the raw JSON dict.

    Raises whatever supabase-py raises (httpx / postgrest errors).
    The router layer is responsible for translating to HTTP 500.
    """
    sb = get_supabase()
    try:
        result = sb.rpc("get_overview_stats", {"p_user_id": user_id}).execute()
    except Exception as e:
        logger.error("get_overview_stats RPC failed for user=%s: %s", user_id, e)
        raise

    if not result.data:
        logger.warning("get_overview_stats returned no data for user=%s", user_id)
        return {}

    # supabase-py wraps the RPC JSON in a list; the function returns
    # a single object, so we take the first element.
    payload = result.data[0] if isinstance(result.data, list) else result.data
    return payload


def get_overview_stats(user_id: str) -> dict:
    """Cached wrapper. Hits the DB at most once per CACHE_TTL_SECONDS
    per user. Returns the raw RPC payload (Pydantic validation
    happens in the router).
    """
    now = time.monotonic()
    cached = _cache.get(user_id)
    if cached is not None:
        data, ts = cached
        if now - ts < CACHE_TTL_SECONDS:
            logger.debug("overview stats cache hit for user=%s (age=%.1fs)",
                         user_id, now - ts)
            return data

    data = _fetch_overview_stats(user_id)
    _cache[user_id] = (data, now)
    return data


def invalidate_overview_stats_cache(user_id: str | None = None) -> None:
    """Drop the cached stats. Call from write endpoints
    (POST/PATCH/DELETE on job_postings) so the dashboard reflects
    the new state on the next read.

    - user_id=None: clear the entire cache (e.g., on global events
      like a job that crosses users — shouldn't happen in practice
      but kept for safety).
    - user_id=str: clear only that user's entry.
    """
    if user_id is None:
        _cache.clear()
    else:
        _cache.pop(user_id, None)
