from typing import List

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
from supabase import Client

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


SCRAPE_SYSTEM_PROMPT = """\
Eres un extractor de datos de ofertas de empleo. Del siguiente texto de página web, \
extrae la información relevante de la oferta de trabajo.

Devuelve SOLO un objeto JSON válido con estos campos (todos strings):
- title: título del puesto
- company: nombre de la empresa
- source_url: URL de la oferta
- location: ubicación (ciudad, país, o "Remote")
- salary: rango salarial
- description: descripción completa del puesto
- recruiter_name: nombre del reclutador (si aparece, si no string vacío)
- published_at: fecha de publicación ("hace X días" o fecha concreta)
- employment_type: tipo de empleo ("Presencial", "Híbrido", "Remoto", \
"Full-time", "Part-time", "Contract", o string vacío)

Si un campo no se encuentra en el texto, devuelve string vacío.
NO incluyas markdown ni texto adicional — solo el JSON.
"""


@app.post("/api/v1/scrape", response_model=ScrapeResponse)
async def scrape_job(req: ScrapeRequest):
    client = _get_openai()
    if not client:
        raise HTTPException(
            status_code=501,
            detail="OpenAI not configured. Set OPENAI_API_KEY in .env",
        )
    try:
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": SCRAPE_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"URL: {req.url}\n\n---\n\n{req.page_content}",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
            max_tokens=1000,
        )
    except Exception as e:
        raise HTTPException(
            status_code=502, detail=f"LLM call failed: {str(e)}"
        )

    raw = resp.choices[0].message.content
    if not raw:
        raise HTTPException(status_code=502, detail="LLM returned empty response")

    import json

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502, detail=f"LLM returned invalid JSON: {raw[:200]}"
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
    )


@app.delete("/api/v1/jobs/{job_id}")
async def delete_job(job_id: str):
    result = _db().table("job_postings").delete().eq("id", job_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Job deleted successfully"}
