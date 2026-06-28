# ApplySync — Job Application Tracker

A full-stack job application tracker with a Kanban board interface. Built with React 19 + TanStack Start on the frontend and FastAPI + Supabase on the backend.

## Project Overview

ApplySync helps users track job applications through a visual Kanban workflow. Applications move through statuses: `saved → applied → interviewing → rejected → offer`. The frontend and backend are fully decoupled, communicating via a REST API.

## Architecture

```
React 19 + TanStack Start (Frontend — sync-role/)
        ↕  REST API (JSON) — port 8000
FastAPI (Backend — syncRoleBackend/)
        ↕  supabase-py
Supabase (Postgres + Auth)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 6, TanStack Router, TanStack Start, TanStack Query, Zustand, Tailwind CSS v4, Vite 8 |
| Backend | Python 3.13, FastAPI, Pydantic, supabase-py, Uvicorn |
| Database | Supabase (Postgres) |
| Testing | pytest (backend), Vitest (frontend) |

## Project Structure

```
├── .env                          # Backend Supabase credentials (gitignored)
├── .gitignore
├── Makefile                      # Dev commands
├── docs/
│   └── SDD.md                    # Software Design Document
├── supabase/
│   └── migrations/
│       └── 001_create_job_postings.sql
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
├── syncRoleBackend/              # FastAPI backend
│   ├── __init__.py
│   ├── config.py                 # pydantic-settings (env loader)
│   ├── database.py               # Supabase client singleton
│   ├── main.py                   # FastAPI app + routes
│   ├── schemas.py                # Pydantic models
│   ├── seed.py                   # Dummy data seeder
│   ├── test_main.py              # pytest suite (8 tests)
│   └── requirements.txt
└── .agents/                      # AI coding agent skills (Supabase)
```

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+ / Bun
- Supabase account (already configured)

### Backend Setup

```bash
# Install dependencies
make install

# Start the server (port 8000, hot-reload enabled)
make run

# Run tests
make test

# Seed database with dummy data (12 job postings)
make seed
```

### Frontend Setup

```bash
cd sync-role

# Install dependencies
bun install

# Start dev server (port 3000)
bun run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/jobs` | List all jobs (newest first) |
| POST | `/api/v1/jobs` | Create a job |
| PATCH | `/api/v1/jobs/{id}` | Update a job |
| DELETE | `/api/v1/jobs/{id}` | Delete a job |

## Database Schema

```sql
job_postings
├── id          UUID PRIMARY KEY
├── title       TEXT NOT NULL
├── company     TEXT NOT NULL
├── source_url  TEXT DEFAULT ''
├── status      TEXT CHECK IN ('saved','applied','interviewing','rejected','offer')
├── location    TEXT DEFAULT ''
├── salary      TEXT DEFAULT ''
└── created_at  TIMESTAMPTZ DEFAULT now()
```
