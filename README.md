# Sync Role — Job Application Tracker

A full-stack job application tracker with a Kanban board interface, an overview dashboard, and a browser extension for one-click job scraping. Built with React 19 + TanStack Start on the frontend and FastAPI + Supabase on the backend.

The app supports **email/password and Google OAuth** authentication, a **collapsible sidebar** with profile menus, **dark/light/system theme** with anti-flash hydration, a **system/light/dark theme** with an anti-flash splash, **i18n (EN + Latin American ES)**, and an **overview dashboard** with KPIs, top technology lists, and an 8-week activity chart.

## Project Overview

Sync Role helps users track job applications through a visual workflow. Applications move through statuses: `saved → applied → interviewing → rejected → offer`. The **browser extension** (Chrome MV3) works on **any job board** (LinkedIn, Indeed, Greenhouse, etc.) — it sends the page text to GPT-4o-mini for structured data extraction and saves directly to the tracker with a single click.

Once logged in, users land on the **Overview dashboard** showing weekly activity, top requested technologies, work modes, and seniorities. They can browse and filter jobs in **Kanban or list view**, edit their **profile** (display name + avatar), and switch the UI between English and Spanish from the sidebar Settings menu.

## Architecture

```
                     ┌──────────────────────────────────────┐
                     │  sync-role-extension (Chrome MV3)     │
                     │  • Works on any HTTPS job board       │
                     │  • Scrapes page text → LLM extraction │
                     │  • Falls back to manual entry         │
                     │  • Saves directly to backend          │
                     └──────────┬───────────────────────────┘
                                │ POST /api/v1/scrape
                                │ POST /api/v1/jobs
                                ▼
                    ┌────────────────────────────────────┐
                    │        FastAPI Backend (:8000)       │
                    │                                      │
                    │  ┌────────┐  ┌──────────┐  ┌──────┐ │
                    │  │  Auth  │  │ Profiles │  │ Stats│ │
                    │  │/api/v1 │  │/api/v1   │  │/api  │ │
                    │  │ /auth  │  │/profiles │  │/stats│ │
                    │  └───┬────┘  └────┬─────┘  └──┬───┘ │
                    │      │            │            │     │
                    │      └────────────┴────────────┘     │
                    │                  │                    │
                    │         /api/v1/jobs (CRUD)          │
                    │         /api/v1/scrape (LLM)         │
                    └──────────────┬──────────────────────┘
                                   │ supabase-py
                                   ▼
         React 19 + TanStack Start ──→ Supabase (Postgres)
         (sync-role/)
                ▲
                │ GET /api/v1/jobs
                │ PATCH /api/v1/jobs/{id}
                │ DELETE /api/v1/jobs/{id}
                │ GET  /api/v1/stats/overview
                │ PATCH /api/v1/profiles/me
                │ POST /api/v1/auth/login
                │ POST /api/v1/auth/google
                └────────────────────────────────────────
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Browser Extension | Plasmo 0.90, React 18, TypeScript 5, Chrome MV3 |
| Frontend | React 19, TypeScript 6, TanStack Router, TanStack Start, TanStack Query, Zustand, Tailwind CSS v4, Vite 8, Recharts |
| Backend | Python 3.13, FastAPI, Pydantic, supabase-py, OpenAI, Uvicorn |
| Database | Supabase (Postgres) — 15 migrations |
| Auth | Supabase Auth (email/password + Google OAuth) |
| LLM | GPT-4o-mini (data extraction from raw page text) |
| i18n | Custom React Context + per-module `useCopy` hooks (EN + ES) |
| Testing | pytest + httpx (backend), Vitest (frontend + extension) |

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
│       ├── 001-003               # Job postings table + extension fields
│       ├── 004-007               # Profiles table + auth FK setup
│       ├── 008-011               # Application events table + trigger + RLS
│       └── 012-015               # Overview stats RPC + fixes + LIMIT bumps
├── sync-role/                    # React 19 + TanStack Start frontend
│   ├── src/
│   │   ├── core/
│   │   │   └── api/              # API client, query client
│   │   ├── features/
│   │   │   ├── auth/             # Login, Register, Google OAuth, Profile form
│   │   │   │   ├── api/          # Profile service (HTTP calls)
│   │   │   │   ├── components/   # AuthPage, ProfileForm, ProfileRoute
│   │   │   │   ├── hooks/        # use-auth, use-update-profile
│   │   │   │   └── store/        # auth.store (Zustand)
│   │   │   ├── jobs/             # JobBoard, KanbanColumn, JobCard, ListView
│   │   │   │   ├── api/          # Job service (HTTP calls)
│   │   │   │   ├── components/   # JobBoard, JobCard, KanbanColumn, ViewSwitcher
│   │   │   │   ├── hooks/        # React Query hooks
│   │   │   │   ├── store/        # Zustand state
│   │   │   │   └── types/        # JobPosting TypeScript types
│   │   │   ├── overview/         # Dashboard with KPIs, top lists, activity chart
│   │   │   │   ├── api/          # Stats service (HTTP calls)
│   │   │   │   ├── components/   # Overview, KpiCard, TopList, ActivityChart
│   │   │   │   ├── hooks/        # useOverviewStats (TanStack Query)
│   │   │   │   └── copy.ts       # i18n strings (EN + ES)
│   │   │   └── theme/            # Dark/light/system theme store + splash
│   │   │       ├── ThemeController.tsx
│   │   │       ├── ThemeScript.tsx
│   │   │       ├── theme.store.ts
│   │   │       └── use-theme.ts
│   │   ├── shared/
│   │   │   ├── components/
│   │   │   │   ├── sidebar/      # Sidebar, SidebarNav, ProfileMenu, SettingsMenu
│   │   │   │   └── ui/           # Button, Card, DropdownMenu, Input, Alert
│   │   │   ├── copy/             # CopyProvider, useLocale, common.ts (i18n)
│   │   │   ├── design-tokens.ts  # Semantic tokens for status/tag colors
│   │   │   └── date.ts           # Date formatting utilities
│   │   ├── routes/               # TanStack file-based router
│   │   │   ├── __root.tsx        # Root layout (providers, splash, theme)
│   │   │   ├── index.tsx         # Login / Auth page
│   │   │   └── _authenticated/   # AppShell with sidebar + overview/profile
│   │   └── styles.css
│   └── package.json
├── sync-role-extension/          # Chrome MV3 browser extension
│   ├── src/
│   │   ├── popup.tsx             # Extension popup UI
│   │   ├── background.ts         # Service worker (badge mgmt, logout listener)
│   │   ├── content.ts            # Content script (injects overlay)
│   │   ├── components/           # FloatingPanel, LoadingSpinner, OverlayPanel
│   │   └── lib/                  # API client, types, styles, constants
│   └── package.json
├── syncRoleBackend/              # FastAPI backend
│   ├── auth/                     # Auth routes, dependencies, middleware
│   │   ├── router.py             # /api/v1/auth (login, register, logout, refresh, google, session)
│   │   ├── schemas.py            # Pydantic models for auth
│   │   ├── dependencies.py       # get_current_user JWT dependency
│   │   └── middleware.py         # Token extraction middleware
│   ├── profiles/                 # Profile routes
│   │   ├── router.py             # GET/PATCH /api/v1/profiles/me
│   │   └── schemas.py            # Pydantic models for profiles
│   ├── stats/                    # Overview dashboard routes
│   │   ├── router.py             # GET /api/v1/stats/overview
│   │   ├── schemas.py            # Pydantic response models
│   │   └── queries.py            # RPC wrapper + in-memory cache (30s TTL)
│   ├── config.py                 # pydantic-settings (env loader)
│   ├── database.py               # Supabase client singleton
│   ├── encryption.py             # Data encryption utilities
│   ├── main.py                   # FastAPI app + routes
│   ├── schemas.py                # Shared Pydantic models
│   └── requirements.txt
└── .agents/                      # AI coding agent skills
```

## Getting Started

### Prerequisites

- Python 3.13+
- Node.js 20+ / Bun / pnpm
- Supabase account (already configured)
- OpenAI API key (for LLM scraping)
- Google OAuth credentials (for social login)

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

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/` | Health check | — |
| **Auth** | | | |
| POST | `/api/v1/auth/register` | Register with email + password | — |
| POST | `/api/v1/auth/login` | Login with email + password | — |
| POST | `/api/v1/auth/logout` | Revoke session | Bearer |
| POST | `/api/v1/auth/refresh` | Refresh expired JWT | — |
| GET | `/api/v1/auth/google` | Initiate Google OAuth flow | — |
| GET | `/api/v1/auth/google/callback` | OAuth PKCE code exchange (redirect) | — |
| GET | `/api/v1/auth/session` | Exchange session cookie for Bearer JWT (extension) | Cookie |
| **Profiles** | | | |
| GET | `/api/v1/profiles/me` | Get authenticated user's profile | Bearer |
| PATCH | `/api/v1/profiles/me` | Update displayName / avatarUrl | Bearer |
| **Stats** | | | |
| GET | `/api/v1/stats/overview` | Dashboard KPIs, top lists, weekly activity (cache 30s) | Bearer |
| **Jobs** | | | |
| GET | `/api/v1/jobs` | List all jobs (newest first) | Bearer |
| POST | `/api/v1/jobs` | Create a job | Bearer |
| PATCH | `/api/v1/jobs/{id}` | Update a job status / fields | Bearer |
| DELETE | `/api/v1/jobs/{id}` | Delete a job | Bearer |
| POST | `/api/v1/scrape` | Extract job data from page text via GPT-4o-mini | Bearer |

## Database Schema

### `job_postings`

```sql
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
├── employment_type TEXT DEFAULT ''
├── work_mode       TEXT DEFAULT ''
├── seniority       TEXT DEFAULT ''
├── technologies    TEXT[] DEFAULT '{}'
├── user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
└── created_at      TIMESTAMPTZ DEFAULT now()
```

### `profiles`

```sql
├── id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
├── display_name    TEXT DEFAULT ''
├── avatar_url      TEXT DEFAULT ''
└── updated_at      TIMESTAMPTZ DEFAULT now()

Triggers: auto-inserts row on user signup (handle_new_user).
```

### `application_events`

```sql
├── id              UUID PRIMARY KEY
├── job_id          UUID REFERENCES job_postings(id) ON DELETE CASCADE
├── user_id         UUID NOT NULL (denormalized for fast per-user queries)
├── from_status     TEXT (NULL on first insert)
├── to_status       TEXT NOT NULL
└── created_at      TIMESTAMPTZ DEFAULT now()

Indexes: job_id, user_id, (user_id, created_at DESC).
Triggers: log_application_event — AFTER INSERT or UPDATE OF status on job_postings.
RLS: users can SELECT only their own events.
```

### Migrations

| # | File | Description |
|---|------|-------------|
| 001 | `create_job_postings.sql` | Base table |
| 002 | `add_extension_fields.sql` | Fields for scraped jobs |
| 003 | `add_new_fields.sql` | Additional job metadata |
| 004 | `profiles.sql` | Profiles table + auto-create trigger |
| 005 | `job_postings_fk.sql` | FK from job_postings to profiles |
| 006 | `fix_permissions.sql` | Permissions cleanup |
| 007 | `job_postings_fk_not_null.sql` | Make user_id NOT NULL |
| 008 | `application_events_table.sql` | Events table |
| 009 | `application_events_trigger.sql` | Auto-log status changes |
| 010 | `backfill_application_events.sql` | Backfill existing jobs |
| 011 | `application_events_rls.sql` | RLS on events table |
| 012 | `get_overview_stats_rpc.sql` | Stats RPC (draft) |
| 014 | `get_overview_stats_fix_json_agg.sql` | Fix json_agg in stats RPC |
| 015 | `top_technologies_limit_8.sql` | Bump top techs LIMIT to 8 |

## Frontend Features

### Auth
- Email/password registration and login
- Google OAuth with automatic profile creation
- Persistent sessions via Zustand store + JWT refresh
- Extension logout synchronization via `SYNCROLE_LOGOUT` custom event

### Theme
- System/light/dark mode with anti-flash splash script
- Persisted preference in `localStorage`
- Semantic CSS tokens for status badges and tags

### Dashboard
- 4 KPI cards with weekly deltas and conversion rates
- Top technologies horizontal bar chart
- 8-week application activity chart (Recharts)
- Work mode and seniority breakdowns (shown only when data exists)
- 30s BE cache, skeleton loading, error state with retry

### Sidebar
- Collapsible navigation with brand logo
- Profile menu (avatar, display name, profile link, logout)
- Settings menu with language switcher (EN / ES)
- Active route highlighting

### i18n
- Custom React Context (`CopyProvider`) — no external library
- Per-module `useXxxCopy()` hooks with typed constants
- Locales: English and Latin American Spanish
- Persisted in `localStorage` key `sync-role:locale`

### Profile
- Editable display name and avatar URL
- Live avatar preview with image error fallback
- Optimistic store update on save
