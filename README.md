# Sync Role — Job Application Tracker

A full-stack job application tracker with a Kanban board interface and a browser extension for one-click job scraping. Built with React 19 + TanStack Start, FastAPI + OpenAI, and Supabase.

## Project Overview

Sync Role helps users track job applications through a visual Kanban workflow. Applications move through statuses: `saved → applied → interviewing → rejected → offer`. The **browser extension** (Chrome MV3) works on **any job board** (LinkedIn, Indeed, Greenhouse, etc.) — it sends the page text to GPT-4o-mini for structured data extraction and saves directly to the tracker with a single click. If scraping fails on an unrecognized site, the form falls back to manual entry with fields pre-filled from the page URL.

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │  sync-role-extension (Chrome MV3)     │
                    │  • Works on any HTTPS job board       │
                    │  • Scrapes page text → LLM extraction │
                    │  • Falls back to manual entry         │
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
├── Makefile                      # Dev commands (install, run, dev, test)
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
│   │   ├── content.ts            # Content script (injects overlay)
│   │   ├── components/           # FloatingPanel, LoadingSpinner, OverlayPanel
│   │   └── lib/                  # API client, types, styles, popup-styles, constants, URL transforms
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

### All-in-One (recommended)

```bash
# Starts backend (:8000) + frontend (:3000) + extension dev server
# Ctrl+C stops all three services
make dev
```

### Individual Services

**Backend:**
```bash
make install   # Install Python dependencies
make run       # Start server on port 8000 (hot-reload)
make test      # Run pytest
```

**Frontend:**
```bash
cd sync-role
bun install    # Install JS dependencies
bun run dev    # Start dev server on port 3000
```

**Extension:**
```bash
cd sync-role-extension
pnpm install   # Install JS dependencies
pnpm dev       # Start dev server (hot-reload)
pnpm test      # Run Vitest
pnpm build     # Production build
```

Load the `build/chrome-mv3-prod` directory as an unpacked extension in Chrome (`chrome://extensions` → Load unpacked).

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
