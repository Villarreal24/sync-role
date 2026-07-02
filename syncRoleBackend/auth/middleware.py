import jwt as pyjwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from syncRoleBackend.config import settings

# Lazy-loaded JWKS client for verifying ES256 tokens (Supabase default)
_jwks_client: pyjwt.PyJWKClient | None = None


def _get_jwks_client() -> pyjwt.PyJWKClient:
    global _jwks_client
    if _jwks_client is None:
        _jwks_client = pyjwt.PyJWKClient(
            f"{settings.supabase_url}/auth/v1/.well-known/jwks.json",
            cache_keys=True,
        )
    return _jwks_client


def _get_jwt_signing_key(token: str) -> str:
    """Get the correct signing key for the JWT.

    Supports both HS256 (via SUPABASE_JWT_SECRET) and ES256 (via JWKS).
    Supabase new projects default to ES256; older ones use HS256.
    """
    # First try JWKS (ES256) — Supabase default for new projects
    try:
        jwks_client = _get_jwks_client()
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        return signing_key.key
    except Exception:
        pass

    # Fall back to HS256 with JWT secret
    if settings.supabase_jwt_secret:
        return settings.supabase_jwt_secret

    raise ValueError("No signing key available — check SUPABASE_JWT_SECRET or JWKS endpoint")


class AuthMiddleware(BaseHTTPMiddleware):
    """Validate Bearer JWT for protected routes. Inject user_id into request.state."""

    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.user_email = None
        request.state.token = None

        # Public paths — no auth required
        public_paths = (
            "/api/v1/auth/register",
            "/api/v1/auth/login",
            "/api/v1/auth/refresh",
            "/api/v1/auth/google",
            "/api/v1/auth/google/callback",
            "/api/v1/auth/session",
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

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(
                status_code=401, content={"detail": "Missing authentication token"}
            )

        token = auth_header.removeprefix("Bearer ")
        try:
            signing_key = _get_jwt_signing_key(token)
            payload = pyjwt.decode(
                token,
                signing_key,
                algorithms=["ES256", "HS256"],
                audience="authenticated",
            )
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
            request.state.token = token  # raw JWT for DB client / RLS
        except pyjwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401, content={"detail": "Token expired"}
            )
        except pyjwt.InvalidTokenError:
            return JSONResponse(
                status_code=401, content={"detail": "Invalid token"}
            )

        return await call_next(request)
