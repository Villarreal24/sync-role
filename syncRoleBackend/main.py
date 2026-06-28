from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from supabase import Client

from syncRoleBackend.database import get_supabase
from syncRoleBackend.schemas import (
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
    _new_id,
    _now_iso,
)

app = FastAPI(title="ApplySync API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _db() -> Client:
    return get_supabase()


@app.get("/")
async def root():
    return {"message": "Welcome to ApplySync API"}


@app.get("/api/v1/jobs", response_model=List[JobPostingResponse])
async def get_jobs():
    result = (
        _db()
        .table("job_postings")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return [JobPostingResponse.from_db_row(row) for row in result.data]


@app.post("/api/v1/jobs", response_model=JobPostingResponse)
async def create_job(job: JobPostingCreate):
    payload = job.model_dump_db()
    payload["id"] = _new_id()
    payload["created_at"] = _now_iso()

    result = _db().table("job_postings").insert(payload).execute()
    return JobPostingResponse.from_db_row(result.data[0])


@app.patch("/api/v1/jobs/{job_id}", response_model=JobPostingResponse)
async def update_job(job_id: str, job_update: JobPostingUpdate):
    update_data = job_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        _db()
        .table("job_postings")
        .update(update_data)
        .eq("id", job_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return JobPostingResponse.from_db_row(result.data[0])


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str):
    result = _db().table("job_postings").delete().eq("id", job_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}
