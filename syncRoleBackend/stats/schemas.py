from pydantic import BaseModel, Field


class OverviewTotals(BaseModel):
    saved: int = 0
    applied: int = 0
    interviewing: int = 0
    rejected: int = 0
    offer: int = 0
    companies: int = 0
    this_week_added: int = 0


class OverviewFunnel(BaseModel):
    """Percentage of jobs that advanced out of each stage.

    0.0 - 100.0. Returns 0.0 if the denominator (jobs currently or
    previously in the stage) is 0 — Pydantic-friendly edge case.
    """
    saved_to_applied: float = 0.0
    applied_to_interviewing: float = 0.0
    interviewing_to_offer: float = 0.0


class OverviewTopItem(BaseModel):
    name: str
    count: int


class OverviewActivityWeek(BaseModel):
    week_start: str  # ISO date YYYY-MM-DD
    count: int


class OverviewStatsResponse(BaseModel):
    totals: OverviewTotals = Field(default_factory=OverviewTotals)
    funnel: OverviewFunnel = Field(default_factory=OverviewFunnel)
    top_technologies: list[OverviewTopItem] = Field(default_factory=list)
    top_work_modes: list[OverviewTopItem] = Field(default_factory=list)
    top_seniorities: list[OverviewTopItem] = Field(default_factory=list)
    activity: list[OverviewActivityWeek] = Field(default_factory=list)
    generated_at: str = ""
