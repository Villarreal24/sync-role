from fastapi import HTTPException, Request


def get_current_user(request: Request) -> str:
    """Extract user_id from request.state (set by AuthMiddleware)."""
    user_id = getattr(request.state, "user_id", None)
    if user_id is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user_id


def get_optional_user(request: Request) -> str | None:
    """Get user_id if authenticated, None otherwise."""
    return getattr(request.state, "user_id", None)
