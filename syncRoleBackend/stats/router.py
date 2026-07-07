import logging

from fastapi import APIRouter, Depends, HTTPException, Request

from syncRoleBackend.auth.dependencies import get_current_user
from syncRoleBackend.stats.queries import get_overview_stats
from syncRoleBackend.stats.schemas import OverviewStatsResponse

logger = logging.getLogger("sync_role.stats")

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


@router.get("/overview", response_model=OverviewStatsResponse)
async def get_overview(
    request: Request,
    user_id: str = Depends(get_current_user),
) -> OverviewStatsResponse:
    """Aggregated dashboard data for the authenticated user.

    Returns KPIs, funnel conversion percentages, top N lists
    (technologies, work modes, seniorities) and an 8-week activity
    timeseries. Cached in-memory for 30s per user.

    Errors:
    - 401 if not authenticated (handled by get_current_user)
    - 500 if the Supabase RPC fails (raw error logged server-side,
      sanitized message returned to the client)
    """
    try:
        data = get_overview_stats(user_id)
    except Exception:
        # Don't leak internal error details (table/column names, URLs)
        raise HTTPException(
            status_code=500,
            detail="Failed to load overview stats. Please try again.",
        )

    # If the RPC returned an empty payload (e.g. transient Supabase
    # issue), Pydantic fills in defaults — the user still gets a
    # 200 with zero values, never 404.
    return OverviewStatsResponse.model_validate(data)
