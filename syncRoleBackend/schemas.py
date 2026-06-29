from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel


VALID_STATUSES = frozenset({"saved", "applied", "interviewing", "rejected", "offer"})


class JobPostingCreate(BaseModel):
    title: str
    company: str
    source_url: str = ""
    status: str = "saved"
    location: str = ""
    salary: str = ""
    description: str = ""
    recruiter_name: str = ""
    published_at: str = ""
    employment_type: str = ""

    def model_dump_db(self) -> dict:
        raw = self.model_dump()
        if raw["status"] not in VALID_STATUSES:
            raw["status"] = "saved"
        return raw


class JobPostingUpdate(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    source_url: Optional[str] = None
    status: Optional[str] = None
    location: Optional[str] = None
    salary: Optional[str] = None
    description: Optional[str] = None
    recruiter_name: Optional[str] = None
    published_at: Optional[str] = None
    employment_type: Optional[str] = None


class JobPostingResponse(BaseModel):
    id: str
    title: str
    company: str
    sourceUrl: str
    status: str
    createdAt: str
    location: str
    salary: str
    description: str
    recruiterName: str
    publishedAt: str
    employmentType: str

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
            location=row.get("location", ""),
            salary=row.get("salary", ""),
            description=row.get("description", ""),
            recruiterName=row.get("recruiter_name", ""),
            publishedAt=row.get("published_at", ""),
            employmentType=row.get("employment_type", ""),
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


def _new_id() -> str:
    return str(uuid4())


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
