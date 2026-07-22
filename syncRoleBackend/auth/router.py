import base64
import json
import logging
import re
from urllib.parse import urlencode

from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.responses import RedirectResponse, Response

from syncRoleBackend.auth.dependencies import get_current_user
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

# Extract project ref from supabase_url for cookie name
_PROJECT_REF_MATCH = re.search(
    r"https://([^.]+)\.supabase\.co",
    settings.supabase_url,
)
_PROJECT_REF = _PROJECT_REF_MATCH.group(1) if _PROJECT_REF_MATCH else ""
_SESSION_COOKIE_NAME = f"sb-{_PROJECT_REF}-auth-token"


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
    import time
    expires_at = int(time.time()) + 3600  # 1 hour from now
    cookie_value = _build_session_cookie(access_token, refresh_token, user_id, user_email, expires_at)

    is_local = "localhost" in str(getattr(settings, "backend_url", ""))
    secure_flag = "; Secure" if not is_local else ""

    response.set_cookie(
        key=_SESSION_COOKIE_NAME,
        value=cookie_value,
        max_age=3600,  # 1 hour
        path="/",
        httponly=True,
        secure=not is_local,
        samesite="lax",
    )


def _clear_session_cookie(response: Response) -> None:
    """Clear the session cookie by setting max_age=0."""
    response.set_cookie(
        key=_SESSION_COOKIE_NAME,
        value="",
        max_age=0,
        path="/",
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
    """Post-exchange work: set session cookie, persist profile, redirect to FE."""
    user = result.user
    display_name, avatar_url = _extract_google_profile(user)
    _upsert_profile(get_supabase(), user.id, display_name, avatar_url)

    # Build FE redirect URL with profile info (but NO tokens)
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
async def logout(user_id: str = Depends(get_current_user)):
    """Logout — revoke Supabase session and clear cookie."""
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
