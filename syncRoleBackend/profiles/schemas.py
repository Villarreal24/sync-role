from datetime import datetime

from pydantic import BaseModel


class ProfileResponse(BaseModel):
    id: str
    display_name: str
    avatar_url: str
    created_at: str
    updated_at: str

    @classmethod
    def from_db_row(cls, row: dict) -> "ProfileResponse":
        return cls(
            id=row["id"],
            display_name=row.get("display_name", ""),
            avatar_url=row.get("avatar_url", ""),
            created_at=(
                row["created_at"].isoformat()
                if isinstance(row["created_at"], datetime)
                else str(row["created_at"])
            ),
            updated_at=(
                row["updated_at"].isoformat()
                if isinstance(row["updated_at"], datetime)
                else str(row["updated_at"])
            ),
        )


class ProfileUpdateRequest(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None
