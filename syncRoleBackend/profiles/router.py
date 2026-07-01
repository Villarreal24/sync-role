from fastapi import APIRouter, Depends, HTTPException, Request

from syncRoleBackend.auth.dependencies import get_current_user
from syncRoleBackend.database import get_supabase
from syncRoleBackend.profiles.schemas import ProfileResponse, ProfileUpdateRequest

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse)
async def get_profile(request: Request, user_id: str = Depends(get_current_user)):
    """Get the authenticated user's profile."""
    sb = get_supabase(request.state.token)
    result = sb.table("profiles").select("*").eq("id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.from_db_row(result.data[0])


@router.patch("/me", response_model=ProfileResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    request: Request,
    user_id: str = Depends(get_current_user),
):
    """Update the authenticated user's profile."""
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    sb = get_supabase(request.state.token)
    result = (
        sb.table("profiles")
        .update(update_data)
        .eq("id", user_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ProfileResponse.from_db_row(result.data[0])
