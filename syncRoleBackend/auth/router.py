from urllib.parse import urlencode

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from starlette.responses import RedirectResponse

from syncRoleBackend.auth.dependencies import get_current_user
from syncRoleBackend.auth.schemas import (
    AuthLoginRequest,
    AuthMessageResponse,
    AuthRefreshRequest,
    AuthRegisterRequest,
    AuthResponse,
    AuthUserResponse,
)
from syncRoleBackend.config import settings
from syncRoleBackend.database import get_supabase

logger = logging.getLogger("sync_role.auth")

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _extract_google_profile(user) -> tuple[str, str]:
    """Pull display_name and avatar_url out of the Google OAuth user_metadata.

    Google places the profile picture in both 'avatar_url' and 'picture'
    (the latter is the OIDC standard). Full name lives in 'full_name' or
    'name'. Falls back to '' so the FE can show its own placeholder.
    """
    md = getattr(user, "user_metadata", None) or {}
    display_name = md.get("full_name") or md.get("name") or ""
    avatar_url = md.get("avatar_url") or md.get("picture") or ""
    return display_name, avatar_url


def _upsert_profile(sb, user_id: str, display_name: str, avatar_url: str) -> None:
    """Best-effort upsert of the profiles row.

    Uses the service-role client (no JWT in scope yet — the user JWT is
    what we just received and exchanging it here is overkill). Failures
    are logged and swallowed: profile data is non-critical to the
    auth flow itself, and the user can always PATCH /profiles/me later.
    """
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
    """Post-exchange work: persist profile fields and return the redirect
    to the FE. Pulled out of google_callback so tests can drive it
    without hitting the real Supabase auth API.
    """
    user = result.user
    display_name, avatar_url = _extract_google_profile(user)
    _upsert_profile(get_supabase(), user.id, display_name, avatar_url)

    params = {
        "access_token": result.session.access_token,
        "refresh_token": result.session.refresh_token,
        "user_id": user.id,
        "email": user.email or "",
        "display_name": display_name,
        "avatar_url": avatar_url,
    }
    return RedirectResponse(url=f"{settings.frontend_url}/auth?{urlencode(params)}")


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register(body: AuthRegisterRequest):
    """Register with email + password. Returns Bearer JWT."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_up({"email": body.email, "password": body.password})
    except Exception as e:
        raise HTTPException(status_code=409, detail=str(e) or "Email already in use")

    if result.user is None or result.session is None:
        raise HTTPException(status_code=409, detail="Email already in use")

    return AuthResponse(
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user=AuthUserResponse(id=result.user.id, email=result.user.email),
    )


@router.post("/login", response_model=AuthResponse)
async def login(body: AuthLoginRequest):
    """Login with email + password. Returns Bearer JWT."""
    sb = get_supabase()
    try:
        result = sb.auth.sign_in_with_password(
            {"email": body.email, "password": body.password}
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e) or "Invalid credentials")

    if result.user is None or result.session is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return AuthResponse(
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user=AuthUserResponse(id=result.user.id, email=result.user.email),
    )


@router.post("/logout", response_model=AuthMessageResponse)
async def logout(user_id: str = Depends(get_current_user)):
    """Logout — revoke current Supabase session."""
    sb = get_supabase()
    try:
        sb.auth.sign_out()
    except Exception:
        pass  # Best effort — token revocation may fail silently
    return AuthMessageResponse(message="Logged out")


@router.post("/refresh", response_model=AuthResponse)
async def refresh(body: AuthRefreshRequest):
    """Refresh an expired JWT using a refresh token."""
    from supabase import create_client

    sb = create_client(settings.supabase_url, settings.supabase_anon_key)
    try:
        result = sb.auth.refresh_session(body.refresh_token)
    except Exception as e:
        logger.error("refresh_session failed for token %r…: %s", body.refresh_token[:20], e)
        raise HTTPException(status_code=401, detail=str(e) or "Refresh failed")

    if result.session is None:
        raise HTTPException(status_code=401, detail="Refresh failed")

    return AuthResponse(
        access_token=result.session.access_token,
        refresh_token=result.session.refresh_token,
        user=AuthUserResponse(
            id=result.user.id, email=result.user.email
        ),
    )


@router.get("/google")
async def google_login():
    """Initiate Google OAuth flow. Returns the redirect URL.

    After Google auth, Supabase redirects to our callback endpoint
    with an authorization code. The callback exchanges it for a session.
    """
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
    """Exchange OAuth PKCE code for a session using supabase-py.

    Called by Supabase after Google OAuth completes. The same supabase
    client instance (cached globally) retains the PKCE code_verifier
    from the OAuth URL generation, enabling the code exchange.

    After the exchange, we extract display_name + avatar_url from the
    Google user_metadata and upsert the profiles row so the FE has
    them available on the very first render (no /profiles/me round
    trip required). The same fields are also passed in the redirect
    URL so the FE can populate the auth store synchronously.
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


@router.get("/session", response_model=AuthResponse)
async def exchange_session(request: Request):
    """Exchange Supabase session cookie for Bearer JWT (extension flow)."""
    sb = get_supabase()
    try:
        session = sb.auth.get_session()
    except Exception:
        raise HTTPException(status_code=401, detail="No active session")

    if session is None:
        raise HTTPException(status_code=401, detail="No active session")

    return AuthResponse(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        user=AuthUserResponse(id=session.user.id, email=session.user.email),
    )
