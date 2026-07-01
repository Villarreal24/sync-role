import jwt as pyjwt
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from syncRoleBackend.config import settings


class AuthMiddleware(BaseHTTPMiddleware):
    """Validate Bearer JWT for protected routes. Inject user_id into request.state."""

    async def dispatch(self, request: Request, call_next):
        request.state.user_id = None
        request.state.user_email = None

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
            payload = pyjwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            request.state.user_id = payload.get("sub")
            request.state.user_email = payload.get("email")
        except pyjwt.ExpiredSignatureError:
            return JSONResponse(
                status_code=401, content={"detail": "Token expired"}
            )
        except pyjwt.InvalidTokenError:
            return JSONResponse(
                status_code=401, content={"detail": "Invalid token"}
            )

        return await call_next(request)
