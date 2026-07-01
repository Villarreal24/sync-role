import json as _json
from datetime import date as _date
from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from supabase import Client

from syncRoleBackend.auth.middleware import AuthMiddleware
from syncRoleBackend.auth.router import router as auth_router
from syncRoleBackend.config import settings
from syncRoleBackend.database import get_supabase
from syncRoleBackend.schemas import (
    JobPostingCreate,
    JobPostingResponse,
    JobPostingUpdate,
    ScrapeRequest,
    ScrapeResponse,
    _new_id,
    _now_iso,
)

app = FastAPI(title="ApplySync API", version="1.0.0")

_openai: OpenAI | None = None


def _get_openai() -> OpenAI:
    global _openai
    if _openai is None and settings.openai_api_key:
        _openai = OpenAI(api_key=settings.openai_api_key)
    return _openai


# Auth middleware first (before CORS so 401 responses include CORS headers)
app.add_middleware(AuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount auth routes
app.include_router(auth_router)


def _db() -> Client:
    return get_supabase()


def _db_for_user(user_id: str | None) -> Client:
    """Get a supabase client scoped to the user's JWT for RLS enforcement."""
    if user_id:
        return get_supabase(user_id)  # Use user JWT to enforce RLS
    return get_supabase()  # Fall back to anon client


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


SCRAPE_SYSTEM_PROMPT = """\
You are an expert HR data extraction and normalization system. \
Your objective is to analyze text extracted from a job posting webpage and structure the key information, \
completely ignoring noise such as navigation menus, cookie banners, or irrelevant links.

EXTRACTION RULES:
1. Precision: Extract only data that explicitly appears or can be inferred with high confidence from the provided text.
2. Description Formatting: The "description" field MUST NOT be a single wall of text. You must clean and structure it:
   - Use double newlines (\\n\\n) to separate paragraphs or distinct sections (e.g., "About the Company", "Requirements", "Benefits").
   - Use a newline followed by a hyphen (\\n-) to create bullet points for lists (e.g., daily responsibilities, qualifications).
3. Empty Values: If a specific data point is missing or cannot be inferred, you MUST return empty string "" (do not use null).
4. Output Restriction: Return ONLY a valid JSON object. DO NOT include markdown formatting (like ```json), conversational greetings, or any additional explanations.

REQUIRED JSON STRUCTURE:
{
  "title": "Official job title",
  "company": "Hiring company name",
  "source_url": "URL of the job posting (if provided in the text, otherwise empty string)",
  "location": "Location (City, State, Country, or empty string)",
  "work_mode": "Strictly choose one: 'Remote', 'Hybrid', 'On-site', or empty string",
  "employment_type": "Strictly choose one: 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship', or empty string",
  "salary": "Salary range or compensation (e.g., '$80k - $100k USD' or empty string)",
  "technologies": ["Array of strings containing the main technologies, programming languages, or software tools detected"],
  "seniority": "Inferred experience level. Strictly choose from: 'Junior', 'Mid', 'Senior', 'Staff', 'Principal', or empty string",
  "description": "Structured and clean text with proper newlines (\\n) detailing the complete job posting.",
  "recruiter_name": "Name of the recruiter or direct contact (if available, otherwise empty string)",
   "published_at": "Publication date. Prefer YYYY-MM-DD format (e.g., '2026-06-29'). If a relative date is found (e.g., 'Ayer', '3 days ago', 'hace 2 semanas'), convert it using today's date. If you are uncertain about the conversion, return the relative date string as-is (e.g., 'Ayer', '3 days ago'). If no date reference is found at all, return empty string."
}
"""


_RETRY_TOKEN_LIMITS = [2000, 3000, 4000]


def _call_llm(client: OpenAI, req: ScrapeRequest, max_tokens: int) -> str:
    resp = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SCRAPE_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"URL: {req.url}\nToday's date: {_date.today().isoformat()}\n\n---\n\n{req.page_content}",
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=max_tokens,
    )
    raw = resp.choices[0].message.content
    if not raw:
        raise ValueError("LLM returned empty response")
    return raw


def _extract_data(raw: str) -> dict:
    return _json.loads(raw)


_RETRY_EXHAUSTED_MSG = (
    "The job posting could not be fully processed. "
    "The page content is too large or complex for the extraction system. "
    "Please verify the job posting URL and try again with a shorter page."
)


@app.post("/api/v1/scrape", response_model=ScrapeResponse)
async def scrape_job(req: ScrapeRequest):
    client = _get_openai()
    if not client:
        raise HTTPException(
            status_code=501,
            detail="OpenAI not configured. Set OPENAI_API_KEY in .env",
        )

    last_error = None
    for max_tokens in _RETRY_TOKEN_LIMITS:
        try:
            raw = _call_llm(client, req, max_tokens)
            data = _extract_data(raw)
        except _json.JSONDecodeError:
            last_error = _RETRY_EXHAUSTED_MSG
            continue
        except Exception as e:
            raise HTTPException(
                status_code=502, detail=f"LLM call failed: {str(e)}"
            )

        return ScrapeResponse(
            title=data.get("title", ""),
            company=data.get("company", ""),
            source_url=req.url,
            location=data.get("location", ""),
            salary=data.get("salary", ""),
            description=data.get("description", ""),
            recruiter_name=data.get("recruiter_name", ""),
            published_at=data.get("published_at", ""),
            employment_type=data.get("employment_type", ""),
            work_mode=data.get("work_mode", ""),
            seniority=data.get("seniority", ""),
            technologies=data.get("technologies", []),
        )

    raise HTTPException(status_code=502, detail=last_error or _RETRY_EXHAUSTED_MSG)


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str):
    result = _db().table("job_postings").delete().eq("id", job_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}
