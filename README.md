# ApplySync — Job Application Tracker

A full-stack job application tracker with a Kanban board interface and a browser extension for one-click job scraping. Built with React 19 + TanStack Start, FastAPI + OpenAI, and Supabase.

## Project Overview

ApplySync helps users track job applications through a visual Kanban workflow. Applications move through statuses: `saved → applied → interviewing → rejected → offer`. The **browser extension** (Chrome MV3) detects job postings on LinkedIn, Indeed, Glassdoor, and other sites, uses GPT-4o-mini to extract structured data, and saves it directly to the tracker with a single click.

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │  sync-role-extension (Chrome MV3)     │
                    │  • Detects job pages via URL patterns │
                    │  • Scrapes page text → LLM extraction │
                    │  • Saves directly to backend           │
                    └──────────┬───────────────────────────┘
                               │ POST /api/v1/scrape
                               │ POST /api/v1/jobs
                               ▼
React 19 + TanStack Start ──→ REST API (port 8000) ──→ supabase-py ──→ Supabase
(sync-role/)                   (syncRoleBackend/)                   (Postgres)
       ▲
       │ GET /api/v1/jobs
       │ PATCH /api/v1/jobs/{id}
       │ DELETE /api/v1/jobs/{id}
       └───────────────────────────────────────────────
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Browser Extension | Plasmo 0.90, React 18, TypeScript 5, Chrome MV3 |
| Frontend | React 19, TypeScript 6, TanStack Router, TanStack Start, TanStack Query, Zustand, Tailwind CSS v4, Vite 8 |
| Backend | Python 3.13, FastAPI, Pydantic, supabase-py, OpenAI, Uvicorn |
| Database | Supabase (Postgres) |
| LLM | GPT-4o-mini (data extraction from raw page text) |
| Testing | pytest + httpx (backend), Vitest (frontend), Vitest (extension) |

## Project Structure

```
├── .env                          # Backend credentials (gitignored)
├── .gitignore
├── Makefile                      # Dev commands (install, run, test)
├── docs/
│   ├── SDD.md                    # Software Design Document (backend + web)
│   └── EXTENSION-SDD.md          # Software Design Document (extension)
├── supabase/
│   └── migrations/
│       ├── 001_create_job_postings.sql
│       ├── 002_add_extension_fields.sql
│       └── 003_add_new_fields.sql
├── sync-role/                    # React 19 + TanStack Start frontend
│   ├── src/
│   │   ├── core/api/             # API client, query client
│   │   ├── features/jobs/
│   │   │   ├── api/              # Job service (HTTP calls)
│   │   │   ├── components/       # JobBoard, JobCard, KanbanColumn
│   │   │   ├── hooks/            # React Query hooks
│   │   │   ├── store/            # Zustand state
│   │   │   └── types/            # JobPosting TypeScript types
│   │   ├── routes/               # TanStack file-based router
│   │   └── styles.css
│   └── package.json
├── sync-role-extension/          # Chrome MV3 browser extension
│   ├── src/
│   │   ├── popup.tsx             # Extension popup UI
│   │   ├── background.ts         # Service worker (badge management)
│   │   ├── content.ts            # Content script (job page detection)
│   │   ├── contents/overlay.tsx  # Floating panel overlay (scrape + save)
│   │   ├── components/           # FloatingPanel, LoadingSpinner
│   │   └── lib/                  # API client, types, styles, constants, URL transforms
│   └── package.json
├── syncRoleBackend/              # FastAPI backend
│   ├── config.py                 # pydantic-settings (env loader)
│   ├── database.py               # Supabase client singleton
│   ├── main.py                   # FastAPI app + routes + LLM scraping
│   ├── schemas.py                # Pydantic models
│   └── requirements.txt
└── .agents/                      # AI coding agent skills
```

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+ / Bun / pnpm
- Supabase account (already configured)
- OpenAI API key (for LLM scraping)

### Backend Setup

```bash
# Install dependencies
make install

# Start the server (port 8000, hot-reload enabled)
make run

# Run tests
make test
```

### Frontend Setup

```bash
cd sync-role

# Install dependencies
bun install

# Start dev server (port 3000)
bun run dev
```

### Extension Setup

```bash
cd sync-role-extension

# Install dependencies
pnpm install

# Start dev server (hot-reload)
pnpm dev

# Run tests
pnpm test

# Production build
pnpm build
```

Load the `build/chrome-mv3-dev` or `build/chrome-mv3-prod` directory as an unpacked extension in Chrome.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/jobs` | List all jobs (newest first) |
| POST | `/api/v1/jobs` | Create a job |
| PATCH | `/api/v1/jobs/{id}` | Update a job |
| DELETE | `/api/v1/jobs/{id}` | Delete a job |
| POST | `/api/v1/scrape` | Extract job data from page text via GPT-4o-mini |

## Database Schema

```sql
job_postings
├── id              UUID PRIMARY KEY
├── title           TEXT NOT NULL
├── company         TEXT NOT NULL
├── source_url      TEXT DEFAULT ''
├── status          TEXT CHECK IN ('saved','applied','interviewing','rejected','offer')
├── location        TEXT DEFAULT ''
├── salary          TEXT DEFAULT ''
├── description     TEXT DEFAULT ''
├── recruiter_name  TEXT DEFAULT ''
├── published_at    TEXT DEFAULT ''
├── employment_type TEXT DEFAULT ''       -- Full-time / Part-time / Contract / Freelance / Internship
├── work_mode       TEXT DEFAULT ''       -- Remote / Hybrid / On-site
├── seniority       TEXT DEFAULT ''       -- Junior / Mid / Senior / Staff / Principal
├── technologies    TEXT[] DEFAULT '{}'   -- Array of technology tags
├── user_id         UUID DEFAULT NULL     -- For future multi-tenant auth
└── created_at      TIMESTAMPTZ DEFAULT now()
```
