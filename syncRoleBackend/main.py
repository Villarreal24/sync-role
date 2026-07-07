import json as _json
import logging
import time as _time
from datetime import date as _date
from typing import List

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI, RateLimitError
from supabase import Client

from syncRoleBackend.auth.middleware import AuthMiddleware
from syncRoleBackend.auth.router import router as auth_router
from syncRoleBackend.config import settings
from syncRoleBackend.profiles.router import router as profiles_router
from syncRoleBackend.stats.queries import invalidate_overview_stats_cache
from syncRoleBackend.stats.router import router as stats_router
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

logger = logging.getLogger("sync_role")

app = FastAPI(title="Sync Role API", version="1.0.0")

_llm_client: OpenAI | None = None

logger.info(
    "Starting Sync Role API | provider=%s gemini=%s openai=%s groq=%s",
    settings.llm_provider,
    settings.gemini_model,
    settings.openai_model,
    settings.groq_model,
)
logger.info(
    "URLs | backend=%s frontend=%s supabase=%s",
    settings.backend_url,
    settings.frontend_url,
    settings.supabase_url,
)


def _get_llm_client() -> OpenAI:
    global _llm_client
    if _llm_client is not None:
        return _llm_client

    if settings.llm_provider == "gemini":
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured in .env")
        _llm_client = OpenAI(
            api_key=settings.gemini_api_key,
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
        )
    elif settings.llm_provider == "openai":
        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured in .env")
        _llm_client = OpenAI(api_key=settings.openai_api_key)
    elif settings.llm_provider == "groq":
        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured in .env")
        _llm_client = OpenAI(
            api_key=settings.groq_api_key,
            base_url="https://api.groq.com/openai/v1",
        )
    else:
        raise ValueError(f"Unknown LLM provider: {settings.llm_provider}")

    return _llm_client


# Auth middleware first (before CORS so 401 responses include CORS headers)
app.add_middleware(AuthMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount auth routes
app.include_router(auth_router)

# Mount profiles routes
app.include_router(profiles_router)

# Mount stats routes
app.include_router(stats_router)


def _db_for_user(token: str | None) -> Client:
    """Get a supabase client scoped to the user's JWT for RLS enforcement.

    Pass the raw JWT token so supabase-py uses it as the apikey,
    enabling RLS auth.uid() to resolve to the authenticated user.
    """
    if token:
        return get_supabase(token)
    return get_supabase()  # anon client (RLS will block for non-auth'd queries)


@app.get("/")
async def root():
    return {"message": "Welcome to Sync Role API"}


@app.get("/api/v1/jobs", response_model=List[JobPostingResponse])
async def get_jobs(request: Request):
    result = (
        _db_for_user(request.state.token)
        .table("job_postings")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return [JobPostingResponse.from_db_row(row) for row in result.data]


@app.post("/api/v1/jobs", response_model=JobPostingResponse)
async def create_job(job: JobPostingCreate, request: Request):
    payload = job.model_dump_db()
    payload["id"] = _new_id()
    payload["user_id"] = request.state.user_id
    payload["created_at"] = _now_iso()

    result = _db_for_user(request.state.token).table("job_postings").insert(payload).execute()
    # The application_events trigger writes the initial event automatically.
    invalidate_overview_stats_cache(request.state.user_id)
    return JobPostingResponse.from_db_row(result.data[0])


@app.patch("/api/v1/jobs/{job_id}", response_model=JobPostingResponse)
async def update_job(job_id: str, job_update: JobPostingUpdate, request: Request):
    update_data = job_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        _db_for_user(request.state.token)
        .table("job_postings")
        .update(update_data)
        .eq("id", job_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    # If status changed, the trigger wrote an event; clear cache.
    invalidate_overview_stats_cache(request.state.user_id)
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


_RETRY_TOKEN_LIMITS = [4000, 6000, 10000]
_RETRY_BACKOFF = [1, 3, 6]
_MAX_PAGE_CONTENT_CHARS = 12000


def _call_llm(client: OpenAI, req: ScrapeRequest, max_tokens: int) -> str:
    model = {
        "gemini": settings.gemini_model,
        "openai": settings.openai_model,
        "groq": settings.groq_model,
    }.get(settings.llm_provider, settings.openai_model)
    resp = client.chat.completions.create(
        model=model,
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
async def scrape_job(req: ScrapeRequest, request: Request):
    logger.info(
        "scrape request url=%r len=%d origin=%r provider=%s",
        req.url[:80],
        len(req.page_content),
        request.headers.get("origin", "none"),
        settings.llm_provider,
    )

    if len(req.page_content) > _MAX_PAGE_CONTENT_CHARS:
        truncated = req.page_content[:_MAX_PAGE_CONTENT_CHARS]
        logger.info("truncating page_content %d -> %d chars",
                    len(req.page_content), _MAX_PAGE_CONTENT_CHARS)
        req = req.model_copy(update={"page_content": truncated})

    try:
        client = _get_llm_client()
    except ValueError as e:
        logger.error("LLM config error: %s", e)
        raise HTTPException(
            status_code=501,
            detail=str(e),
        )

    last_error = None
    for max_tokens in _RETRY_TOKEN_LIMITS:
        for attempt, backoff in enumerate(_RETRY_BACKOFF):
            try:
                raw = _call_llm(client, req, max_tokens)
                data = _extract_data(raw)
            except _json.JSONDecodeError:
                logger.warning("JSON decode error with max_tokens=%d, retrying", max_tokens)
                last_error = _RETRY_EXHAUSTED_MSG
                break
            except RateLimitError as e:
                logger.warning(
                    "rate limited (attempt %d), retrying in %ss",
                    attempt + 1, backoff,
                )
                last_error = f"LLM rate limited: {e.response.headers.get('x-ratelimit-remaining', 'N/A')}"
                if attempt < len(_RETRY_BACKOFF) - 1:
                    _time.sleep(backoff)
                    continue
                break
            except Exception as e:
                logger.error("LLM call failed: %s", e)
                raise HTTPException(
                    status_code=502, detail=f"LLM call failed: {str(e)}"
                )
            else:
                logger.info("scrape success title=%r company=%r",
                            data.get("title", ""), data.get("company", ""))
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

    logger.error("scrape exhausted all retries: %s", last_error)
    raise HTTPException(status_code=502, detail=last_error or _RETRY_EXHAUSTED_MSG)


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str, request: Request):
    result = _db_for_user(request.state.token).table("job_postings").delete().eq("id", job_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    # ON DELETE CASCADE removes the related application_events rows.
    invalidate_overview_stats_cache(request.state.user_id)
    return {"message": "Job deleted successfully"}
