from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


VALID_STATUSES = frozenset({"saved", "applied", "interviewing", "rejected", "offer"})


class JobPostingCreate(BaseModel):
    model_config = {"populate_by_name": True}

    title: str
    company: str
    source_url: str = Field("", alias="sourceUrl")
    status: str = "saved"
    location: str = ""
    salary: str = ""
    description: str = ""
    recruiter_name: str = Field("", alias="recruiterName")
    published_at: str = Field("", alias="publishedAt")
    employment_type: str = Field("", alias="employmentType")
    work_mode: str = Field("", alias="workMode")
    seniority: str = ""
    technologies: list[str] = Field(default_factory=list)
    user_id: str | None = None

    def model_dump_db(self) -> dict:
        raw = self.model_dump()
        if raw["status"] not in VALID_STATUSES:
            raw["status"] = "saved"
        return raw


class JobPostingUpdate(BaseModel):
    model_config = {"populate_by_name": True}

    title: Optional[str] = None
    company: Optional[str] = None
    source_url: Optional[str] = Field(None, alias="sourceUrl")
    status: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    recruiter_name: Optional[str] = Field(None, alias="recruiterName")
    published_at: Optional[str] = Field(None, alias="publishedAt")
    employment_type: Optional[str] = Field(None, alias="employmentType")
    work_mode: Optional[str] = Field(None, alias="workMode")
    seniority: Optional[str] = None
    technologies: Optional[list[str]] = None
    ownership_note: Optional[list[dict]] = Field(None, alias="ownershipNote")


class JobPostingResponse(BaseModel):
    id: str
    title: str
    company: str
    sourceUrl: str
    status: str
    createdAt: str
    userId: str | None = Field(None, alias="userId")
    location: str
    salary: str
    description: str
    recruiterName: str
    publishedAt: str
    employmentType: str
    workMode: str
    seniority: str
    technologies: list[str]
    ownershipNote: list[dict] = Field(default_factory=list, alias="ownershipNote")

    @classmethod
    def from_db_row(cls, row: dict) -> "JobPostingResponse":
        return cls(
            id=row["id"],
            title=row["title"],
            company=row["company"],
            sourceUrl=row.get("source_url", ""),
            status=row["status"],
            createdAt=(
                row["created_at"].isoformat()
                if isinstance(row["created_at"], datetime)
                else str(row["created_at"])
            ),
            userId=row.get("user_id"),
            location=row.get("location", ""),
            salary=row.get("salary", ""),
            description=row.get("description", ""),
            recruiterName=row.get("recruiter_name", ""),
            publishedAt=row.get("published_at", ""),
            employmentType=row.get("employment_type", ""),
            workMode=row.get("work_mode", ""),
            seniority=row.get("seniority", ""),
            technologies=row.get("technologies") or [],
            ownershipNote=row.get("ownership_note") or [],
        )


class ScrapeRequest(BaseModel):
    url: str
    page_content: str


class ScrapeResponse(BaseModel):
    title: str
    company: str
    source_url: str
    location: str
    salary: str
    description: str
    recruiter_name: str
    published_at: str
    employment_type: str
    work_mode: str
    seniority: str
    technologies: list[str] = Field(default_factory=list)


def _new_id() -> str:
    return str(uuid4())


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
