import asyncio
import base64
import json
import logging

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from syncRoleBackend.auth import get_session_cookie_name
from syncRoleBackend.config import settings

logger = logging.getLogger("sync_role.auth.middleware")


def _extract_access_token_from_cookie(cookie_value: str) -> str | None:
    """Parse the Supabase SSR cookie and extract the access_token.

    Cookie format: base64url(JSON.stringify([access_token, refresh_token, user, expires_at]))
    """
    try:
        padded = cookie_value + "=" * (4 - len(cookie_value) % 4) if len(cookie_value) % 4 else cookie_value
        decoded = base64.b64decode(padded).decode()
        parts = json.loads(decoded)
        if isinstance(parts, list) and len(parts) >= 1 and isinstance(parts[0], str):
            return parts[0]
        return None
    except (json.JSONDecodeError, base64.binascii.Error, UnicodeDecodeError, IndexError) as e:
        logger.warning("Failed to parse session cookie: %s", e)
        return None


_LITE_CLIENT = None
_LITE_CLIENT_LOCK = asyncio.Lock()


async def _get_auth_client():
    """Get a lightweight supabase client for auth validation (cached, thread-safe)."""
    global _LITE_CLIENT
    if _LITE_CLIENT is None:
        async with _LITE_CLIENT_LOCK:
            # Double-checked locking: another coroutine may have created it while we waited
            if _LITE_CLIENT is None:
                from supabase import create_client
                _LITE_CLIENT = create_client(settings.supabase_url, settings.supabase_anon_key)
    return _LITE_CLIENT


class AuthMiddleware(BaseHTTPMiddleware):
    """Validate session via Supabase cookie for protected routes.
    Inject user_id, user_email, access_token into request.state."""

    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.user_email = None
        request.state.token = None

        # Public paths — no auth required
        public_paths = (
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/logout",
            "/api/v1/auth/google",
            "/api/v1/auth/google/callback",
            "/api/v1/docs",
            "/api/v1/openapi.json",
            "/",
            "/docs",
            "/openapi.json",
        )
        if request.url.path in public_paths or request.url.path.startswith(
            "/api/v1/scrape"
        ):
            return await call_next(request)

        # Read access_token from Authorization header or session cookie
        auth_header = request.headers.get("Authorization", "").removeprefix("Bearer ")
        if auth_header:
            access_token = auth_header
        else:
            cookie_value = request.cookies.get(get_session_cookie_name())
            if not cookie_value:
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Missing authentication token"},
                )
            access_token = _extract_access_token_from_cookie(cookie_value)

        if not access_token:
            return JSONResponse(
                status_code=401, content={"detail": "Invalid authentication token"}
            )

        # Validate with Supabase
        try:
            client = await _get_auth_client()
            response = client.auth.get_user(access_token)
        except Exception as e:
            logger.warning("get_user failed: %s", e)
            return JSONResponse(
                status_code=401, content={"detail": "Invalid session"}
            )

        if not response or not response.user:
            return JSONResponse(
                status_code=401, content={"detail": "Invalid session"}
            )

        request.state.user_id = response.user.id
        request.state.user_email = getattr(response.user, "email", None)
        request.state.token = access_token  # raw JWT for _db_for_user / RLS

        return await call_next(request)
