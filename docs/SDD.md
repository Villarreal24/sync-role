# Software Design Document: ApplySync — Supabase + FastAPI Backend

## 1. Project Overview

**ApplySync** is a job application tracker with a Kanban board interface. Users track applications through statuses: `saved → applied → interviewing → rejected → offer`.

### Architecture

```
React 19 + TanStack Start (Frontend)
        ↕  REST API (JSON)
FastAPI (Backend)
        ↕  supabase-py
Supabase (Postgres + Auth)
```

## 2. Database Schema

### Table: `job_postings`

| Column       | Type         | Constraints                        |
|-------------|-------------|-----------------------------------|
| `id`        | `uuid`      | PK, default `gen_random_uuid()`    |
| `title`     | `text`      | NOT NULL                          |
| `company`   | `text`      | NOT NULL                          |
| `source_url`| `text`      | NOT NULL DEFAULT ''               |
| `status`    | `text`      | NOT NULL DEFAULT 'saved', CHECK IN (`saved`,`applied`,`interviewing`,`rejected`,`offer`) |
| `location`  | `text`      | NOT NULL DEFAULT ''               |
| `salary`    | `text`      | NOT NULL DEFAULT ''               |
| `created_at`| `timestamptz`| DEFAULT `now()`                   |

**Indexes:**
- Index on `status` for Kanban board queries
- Index on `created_at DESC` for sort order

## 3. Backend Architecture

### Directory Structure

```
syncRoleBackend/
├── main.py          # FastAPI app, CORS, route handlers
├── config.py        # pydantic-settings (SUPABASE_URL, keys)
├── database.py      # Supabase client singleton
├── schemas.py       # Pydantic request/response models
├── seed.py          # Insert 10+ dummy job postings
└── test_main.py     # pytest + httpx tests
```

### Config (`.env`)

```
SUPABASE_URL=https://kicwqgyzxygujewlvxpv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|----------|
| Config loader | `pydantic-settings` | Type-safe, auto-loads from `.env` |
| DB auth | Service role key | Backend-only admin access, no RLS overhead |
| Client library | `supabase-py` | Official Python SDK |
| Testing | `pytest` + `httpx` | Async test client for FastAPI |

## 4. API Endpoints (unchanged from v1)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/jobs` | List all jobs (ordered by created_at DESC) |
| POST | `/api/v1/jobs` | Create a job |
| PATCH | `/api/v1/jobs/{job_id}` | Update a job |
| DELETE | `/api/v1/jobs/{job_id}` | Delete a job |

## 5. Testing Strategy

- **Unit**: Pydantic model validation
- **Integration**: httpx TestClient against FastAPI + mocked Supabase
- **Seed**: Dedicated script (`seed.py`) using service role for direct DB insert
