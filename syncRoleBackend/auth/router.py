import asyncio
import base64
import json
import logging
import time
from urllib.parse import urlencode

from fastapi import APIRouter, HTTPException, Request
from starlette.responses import RedirectResponse, Response
from syncRoleBackend.auth import get_session_cookie_name
from syncRoleBackend.auth.schemas import (
    AuthLoginRequest,
    AuthMessageResponse,
    AuthRegisterRequest,
    AuthResponse,
    AuthUserResponse,
)
from syncRoleBackend.config import settings
from syncRoleBackend.database import get_supabase

logger = logging.getLogger("sync_role.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _build_session_cookie(access_token: str, refresh_token: str, user_id: str, user_email: str, expires_at: int) -> str:
    """Build a Supabase SSR-compatible session cookie value.

    Format: base64url(JSON.stringify([access_token, refresh_token, user, expires_at]))
    This matches what @supabase/ssr expects to read on the client.
    """
    user_data = {
        "id": user_id,
        "email": user_email,
        "aud": "authenticated",
        "role": "authenticated",
    }
    cookie_parts = [access_token, refresh_token, user_data, expires_at]
    payload = json.dumps(cookie_parts, separators=(",", ":"))
    return base64.b64encode(payload.encode()).decode()


def _set_session_cookie(response: Response, access_token: str, refresh_token: str, user_id: str, user_email: str) -> None:
    """Set the Supabase SSR session cookie on the response.

    Uses httpOnly, Secure, SameSite=Lax for production.
    In dev (localhost), Secure is omitted.
    """
    expires_at = int(time.time()) + 3600  # 1 hour from now
    cookie_value = _build_session_cookie(access_token, refresh_token, user_id, user_email, expires_at)

    is_local = "localhost" in str(getattr(settings, "backend_url", ""))
    secure_flag = "; Secure" if not is_local else ""

    response.set_cookie(
        key=get_session_cookie_name(),
        value=cookie_value,
        max_age=3600,  # 1 hour
        path="/",
        httponly=True,
        secure=not is_local,
        samesite="lax",
    )


def _clear_session_cookie(response: Response) -> None:
    """Clear the session cookie by setting max_age=0."""
    is_local = "localhost" in str(getattr(settings, "backend_url", ""))
    response.set_cookie(
        key=get_session_cookie_name(),
        value="",
        max_age=0,
        path="/",
        secure=not is_local,
        httponly=True,
        samesite="lax",
    )


def _extract_google_profile(user) -> tuple[str, str]:
    """Pull display_name and avatar_url out of the Google OAuth user_metadata."""
    md = getattr(user, "user_metadata", None) or {}
    display_name = md.get("full_name") or md.get("name") or ""
    avatar_url = md.get("avatar_url") or md.get("picture") or ""
    return display_name, avatar_url


def _upsert_profile(sb, user_id: str, display_name: str, avatar_url: str) -> None:
    """Best-effort upsert of the profiles row."""
    try:
        sb.table("profiles").upsert(
            {
                "id": user_id,
                "display_name": display_name,
                "avatar_url": avatar_url,
            },
            on_conflict="id",
        ).execute()
    except Exception as e:
        logger.warning("profile upsert failed for %s: %s", user_id, e)


def _build_google_redirect(result) -> RedirectResponse:
    """Post-exchange work: set session cookie, persist profile, redirect to FE.

    The httpOnly session cookie carries auth; the FE reads it via getSession().
    URL params carry only profile info to pre-fill the FE without exposing tokens.
    """
    user = result.user
    display_name, avatar_url = _extract_google_profile(user)
    _upsert_profile(get_supabase(), user.id, display_name, avatar_url)

    # Build FE redirect URL with profile info only — tokens travel via httpOnly cookie
    params = {
        "user_id": user.id,
        "email": user.email or "",
        "display_name": display_name,
        "avatar_url": avatar_url,
    }
    redirect_url = f"{settings.frontend_url}/auth?{urlencode(params)}"

    response = RedirectResponse(url=redirect_url, status_code=302)
    _set_session_cookie(
        response,
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user_id=user.id,
        user_email=user.email or "",
    )
    return response


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: AuthRegisterRequest):
    """Register with email + password. Sets httpOnly session cookie."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_up({"email": body.email, "password": body.password})
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e) or "Email already in use")

    if result.user is None or result.session is None:
        raise HTTPException(status_code=409, detail="Email already in use")

    response = Response(
        status_code=201,
        content=AuthResponse(
            user=AuthUserResponse(id=result.user.id, email=result.user.email),
            message="Registration successful",
        ).model_dump_json(),
        media_type="application/json",
    )
    _set_session_cookie(
        response,
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user_id=result.user.id,
        user_email=result.user.email,
    )
    return response


@router.post("/login", response_model=AuthResponse)
async def login(body: AuthLoginRequest):
    """Login with email + password. Sets httpOnly session cookie."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e) or "Invalid credentials")

    if result.user is None or result.session is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    response = Response(
        status_code=200,
        content=AuthResponse(
            user=AuthUserResponse(id=result.user.id, email=result.user.email),
            message="Login successful",
        ).model_dump_json(),
        media_type="application/json",
    )
    _set_session_cookie(
        response,
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user_id=result.user.id,
        user_email=result.user.email,
    )
    return response


@router.post("/logout", response_model=AuthMessageResponse)
async def logout():
    """Logout — revoke Supabase session and clear cookie.

    Publicly accessible: clears the httpOnly session cookie regardless of
    whether the session is still valid. The Supabase sign-out is best-effort
    (expired/invalid tokens are silently ignored).
    """
    sb = get_supabase()
    try:
        sb.auth.sign_out()
    except Exception:
        pass  # Best effort

    response = Response(
        status_code=200,
        content=AuthMessageResponse(message="Logged out").model_dump_json(),
        media_type="application/json",
    )
    _clear_session_cookie(response)
    return response


@router.get("/session")
async def get_session(request: Request):
    """Get current session from the httpOnly cookie.

    Reads the sb-{ref}-auth-token httpOnly cookie, extracts the access_token,
    validates it with Supabase, and returns user + session info.
    This is the frontend's way to check auth without reading httpOnly cookies via JS.

    Security: returns the raw access_token to JavaScript. The Origin header is
    validated to restrict token delivery to the frontend and extension origins.
    Any XSS on an approved origin can still exfiltrate the token — this endpoint
    exists because the extension cannot read httpOnly cookies directly.
    """
    # Validate origin to restrict token delivery to trusted callers.
    # Extension ID is optional (not set in local dev); the check degrades
    # gracefully to frontend-only when extension_id is absent.
    origin = request.headers.get("origin", "")
    extension_id = getattr(settings, "extension_id", "")
    allowed_origins = {settings.frontend_url.rstrip("/")}
    if extension_id:
        allowed_origins.add(f"chrome-extension://{extension_id}")
    if origin and allowed_origins and origin not in allowed_origins:
        return {"user": None, "session": None}

    cookie_value = request.cookies.get(get_session_cookie_name())
    if not cookie_value:
        return {"user": None, "session": None}

    # Parse cookie: base64(JSON.stringify([access_token, refresh_token, user_data, expires_at]))
    try:
        padded = cookie_value + "=" * (4 - len(cookie_value) % 4) if len(cookie_value) % 4 else cookie_value
        decoded = base64.b64decode(padded).decode()
        parts = json.loads(decoded)
        if not isinstance(parts, list) or len(parts) < 1 or not isinstance(parts[0], str):
            return {"user": None, "session": None}
        access_token = parts[0]
    except (json.JSONDecodeError, Exception):
        return {"user": None, "session": None}

    # Validate with Supabase using the cached anon-key client for connection reuse.
    # get_user() is called with the extracted access_token — validation is always
    # fresh against Supabase Auth regardless of client caching.
    try:
        client = get_supabase()
        response = await asyncio.to_thread(client.auth.get_user, access_token)
        if not response or not response.user:
            return {"user": None, "session": None}
    except Exception:
        return {"user": None, "session": None}

    user = response.user
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "user_metadata": getattr(user, "user_metadata", None) or {},
            "app_metadata": getattr(user, "app_metadata", None) or {},
        },
        "session": {
            "access_token": access_token,
        },
    }


@router.get("/google")
async def google_login():
    """Initiate Google OAuth flow. Returns the redirect URL."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_in_with_oauth(
            {
                "provider": "google",
                "options": {
                    "redirect_to": f"{settings.backend_url}/api/v1/auth/google/callback"
                },
            }
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e) or "OAuth initiation failed")
    return {"url": result.url}


@router.get("/google/callback")
async def google_callback(code: str):
    """Exchange OAuth PKCE code for a session.

    Sets httpOnly session cookie on the redirect response.
    """
    sb = get_supabase()
    try:
        result = sb.auth.exchange_code_for_session({
            "auth_code": code,
            "redirect_to": f"{settings.backend_url}/api/v1/auth/google/callback",
        })
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Token exchange failed: {e}",
        )

    if not result or not result.session:
        raise HTTPException(status_code=502, detail="Token exchange returned no session")

    return _build_google_redirect(result)
