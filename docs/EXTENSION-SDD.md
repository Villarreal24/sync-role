# Software Design Document: SyncRole — Browser Extension

## 1. Project Overview

**Sync Role** is a browser extension that scrapes job posting data from any job board page (LinkedIn, Indeed, Glassdoor, etc.) using an LLM (GPT-4o-mini), and saves it to the Sync Role job tracker via the FastAPI backend.

### Architecture

```
Job Page (LinkedIn, Indeed, etc.)
        ↕  content.ts — extracts page innerText
Popup UI (React 18, dark mode)
        ↕  fetch POST /api/v1/scrape
FastAPI Backend (syncRoleBackend/)
        ↕  openai Python SDK
OpenAI GPT-4o-mini (extracts structured JSON from page text)
        ↕  fetch POST /api/v1/jobs → Supabase
FastAPI Backend
        ↕  supabase-py
Supabase (Postgres — job_postings)
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | Plasmo 0.90.5, React 18, TypeScript 5, MV3 |
| Backend | FastAPI, Python 3.13 |
| LLM | OpenAI GPT-4o-mini |
| Database | Supabase (Postgres) |
| Frontend | React 19 + TanStack Start (sync-role/) |

## 2. Database Schema

### Table: `job_postings`

Updated with extension-specific fields (migration `002_add_extension_fields.sql`):

| Column | Type | Constraints |
|--------|------|------------|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `title` | `text` | NOT NULL |
| `company` | `text` | NOT NULL |
| `source_url` | `text` | NOT NULL DEFAULT '' |
| `status` | `text` | NOT NULL DEFAULT 'saved', CHECK IN (`saved`, `applied`, `interviewing`, `rejected`, `offer`) |
| `location` | `text` | NOT NULL DEFAULT '' |
| `salary` | `text` | NOT NULL DEFAULT '' |
| `description` | `text` | NOT NULL DEFAULT '' |
| `recruiter_name` | `text` | NOT NULL DEFAULT '' |
| `published_at` | `text` | NOT NULL DEFAULT '' |
| `employment_type` | `text` | NOT NULL DEFAULT '' |
| `created_at` | `timestamptz` | DEFAULT `now()` |

**Indexes:**
- Index on `status` for Kanban board queries
- Index on `created_at DESC` for sort order

## 3. Extension Architecture

### Directory Structure

```
sync-role-extension/
├── popup.tsx                   # Popup UI — dark mode, formulario editable
├── background.ts               # Service Worker — badge + mensajería
├── content.ts                  # Content Script — extrae innerText, detecta URLs
├── src/
│   ├── lib/
│   │   ├── api.ts              # Cliente HTTP → FastAPI (scrape + create)
│   │   └── types.ts            # Interfaces compartidas
└── package.json
```

### Component Roles

| File | Role |
|------|------|
| `content.ts` | Se inyecta en cada página. Detecta si es página de empleo por URL patterns. Al recibir mensaje `GET_PAGE_CONTENT`, extrae `document.body.innerText` y lo envía al popup. |
| `background.ts` | Recibe mensaje `PAGE_HAS_JOB` desde content script → activa badge `"!"` en el icono. Recibe mensaje `JOB_SAVED` → limpia badge. |
| `popup.tsx` | Se abre cuando usuario hace clic en el icono. Solicita pageContent al content script, envía a `POST /api/v1/scrape`, muestra datos extraídos en formulario dark mode, permite editar y guardar. |
| `src/lib/api.ts` | Funciones `scrapePage(url, pageContent)` y `createJob(data)` que llaman al backend. |
| `src/lib/types.ts` | Interfaces `ScrapedData`, `ScrapeRequest`, `ScrapeResponse`, `JobPostingPayload`. |

## 4. Data Extraction Strategy (LLM-only)

En lugar de usar selectores DOM frágiles por sitio, la extensión envía el texto completo de la página al backend, que a su vez llama a GPT-4o-mini para extraer los datos estructurados.

### System Prompt (backend)

```
Eres un extractor de datos de ofertas de empleo. Del siguiente texto de página web,
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
- employment_type: tipo de empleo ("Presencial", "Híbrido", "Remoto", "Full-time", "Part-time", "Contract", o string vacío)

Si un campo no se encuentra en el texto, devuelve string vacío.
NO incluyas markdown ni texto adicional — solo el JSON.
```

### Flow

```
content.ts detecta página → badge "!"
Usuario abre popup
  → popup pide pageContent a content.ts
  → popup envía POST /api/v1/scrape { url, page_content }
  → backend llama GPT-4o-mini con system prompt + page_content
  → GPT devuelve JSON estructurado
  → backend valida y responde con los datos
  → popup muestra datos en formulario editable
  → usuario edita si es necesario
  → usuario hace clic "Guardar postulación"
  → popup envía POST /api/v1/jobs con los datos
  → backend inserta en Supabase
  → popup muestra "✅ Guardado exitosamente"
```

## 5. Backend Endpoints

### Existing (updated)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Health check |
| GET | `/api/v1/jobs` | List all jobs (ordered by created_at DESC) |
| POST | `/api/v1/jobs` | Create a job (now includes new fields) |
| PATCH | `/api/v1/jobs/{job_id}` | Update a job |
| DELETE | `/api/v1/jobs/{job_id}` | Delete a job |

### New

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/scrape` | Recibe `{ url, page_content }`, llama GPT-4o-mini, devuelve `ScrapeResponse` |

### Scrape Endpoint Contract

**Request:**
```json
{
  "url": "https://linkedin.com/jobs/view/123",
  "page_content": "Senior Frontend Engineer at Vercel... (full page text)"
}
```

**Response:**
```json
{
  "title": "Senior Frontend Engineer",
  "company": "Vercel",
  "source_url": "https://linkedin.com/jobs/view/123",
  "location": "Remote (US)",
  "salary": "$180,000 - $220,000",
  "description": "We are looking for...",
  "recruiter_name": "",
  "published_at": "hace 3 días",
  "employment_type": "Remoto"
}
```

## 6. Extension Flows

### Auto-detection Flow

```
Página cargada
  → content.ts se inyecta
  → Detecta URL pattern de empleo con regex
  → Si coincide → envía { type: "PAGE_HAS_JOB" } al background
  → background: chrome.action.setBadgeText("!")
```

### Save Flow

```
Usuario hace clic en icono
  → popup.tsx se monta
  → Envía { type: "GET_PAGE_CONTENT" } al content script de la tab activa
  → content responde con { url, pageContent }
  → popup muestra skeleton loader
  → popup llama api.scrapePage(url, pageContent)
  → [Loading...] GPT-4o-mini procesa
  → popup recibe datos estructurados
  → Oculta skeleton, muestra formulario precargado
  → Usuario edita campos si es necesario
  → Usuario hace clic "Guardar postulación"
  → popup valida campos requeridos (title, company)
  → popup llama api.createJob(data)
  → popup muestra "✅ Guardado" + confeti/check
  → popup envía { type: "JOB_SAVED" } al background
  → background limpia badge
  → Popup se cierra automáticamente tras 1.5s
```

## 7. Popup UI Design (Dark Mode)

```
┌───────────────────────────────┐
│  ⚡ SyncRole                  │  ← 400×520px, fondo zinc-950
│  ───────────────────────      │
│                               │
│  ┌─ Puesto * ──────────────┐ │
│  │ Senior Frontend Eng     │ │  ← input, zinc-900
│  └─────────────────────────┘ │
│  ┌─ Empresa * ────────────┐ │
│  │ Vercel                  │ │
│  └─────────────────────────┘ │
│  ┌─ Ubicación ────────────┐ │
│  │ Remote (US)             │ │
│  └─────────────────────────┘ │
│  ┌─ Salario ──────────────┐ │
│  │ $180k - $220k           │ │
│  └─────────────────────────┘ │
│  ┌─ Tipo ─────────────────┐ │
│  │ Remoto          ▼       │ │  ← select
│  └─────────────────────────┘ │
│  ┌─ Reclutador ───────────┐ │
│  │ (vacio)                 │ │
│  └─────────────────────────┘ │
│  ┌─ Publicado ────────────┐ │
│  │ hace 3 días             │ │
│  └─────────────────────────┘ │
│  ┌─ Descripción ───────────┐ │
│  │ We're looking for a...  │ │  ← textarea, 3 líneas
│  └──────────────────────────┘ │
│                               │
│  [   ⚡ Guardar Postulación   ] │  ← botón blue-500 full width
│                               │
└───────────────────────────────┘
```

### Color Palette

| Element | Color |
|---------|-------|
| Popup background | `#09090b` (zinc-950) |
| Card / input background | `#18181b` (zinc-900) |
| Input border | `#27272a` (zinc-800) |
| Input border focus | `#3b82f6` (blue-500) |
| Text primary | `#fafafa` (zinc-50) |
| Text secondary | `#a1a1aa` (zinc-400) |
| Text muted / placeholder | `#52525b` (zinc-600) |
| Accent button | `#3b82f6` (blue-500) |
| Accent hover | `#2563eb` (blue-600) |
| Success | `#22c55e` (green-500) |
| Error | `#ef4444` (red-500) |
| Required asterisk | `#ef4444` |

### States

| State | UI |
|-------|-----|
| **Loading** (LLM procesando) | Skeleton animado con 3-4 placeholders grises pulsing |
| **Loaded** | Formulario con datos rellenos, campos editables |
| **Error (scrape)** | Mensaje "No se pudieron extraer los datos" + botón "Reintentar" |
| **Saving** | Botón con spinner y texto "Guardando..." deshabilitado |
| **Success** | Check verde + "✅ Guardado exitosamente" | 
| **Error (save)** | Mensaje rojo "Error al guardar" + botón reintentar |
| **Campos requeridos vacíos** | Borde rojo en `title` o `company` + mensaje "Campo requerido" |

## 8. Frontend Changes (sync-role/)

### Types (`src/features/jobs/types/index.ts`)

```typescript
export interface JobPosting {
  id: string
  title: string
  company: string
  sourceUrl: string
  status: JobStatus
  createdAt: string
  location: string
  salary: string
  description: string
  recruiterName: string
  publishedAt: string
  employmentType: string
}
```

### JobCard (`src/features/jobs/components/JobCard.tsx`)

- Mostrar `employmentType` como badge secundario (ej. "Remoto" en verde azulado)
- Mostrar `recruiterName` si tiene valor
- Mostrar `publishedAt` en texto pequeño
- Botón toggle para expandir `description` si tiene contenido

## 9. Implementation Order

| # | Layer | Task |
|---|-------|------|
| 1 | DB | Migration `002_add_extension_fields.sql` |
| 2 | Backend | Update `schemas.py` with new fields |
| 3 | Backend | Add `openai_api_key` to `config.py` + `openai` to `requirements.txt` |
| 4 | Backend | Add `POST /api/v1/scrape` endpoint to `main.py` |
| 5 | Backend | Update `test_main.py` |
| 6 | Frontend | Update `types/index.ts` + `job.service.ts` |
| 7 | Frontend | Update `JobCard.tsx` to display new fields |
| 8 | Extension | `src/lib/types.ts` + `src/lib/api.ts` |
| 9 | Extension | `content.ts` |
| 10 | Extension | `background.ts` |
| 11 | Extension | `popup.tsx` |
| 12 | Integration | Test full flow: extension → scrape → jobs → Supabase |

## 10. Job Site Detection (URL Patterns)

```typescript
const JOB_SITE_PATTERNS = [
  /linkedin\.com\/jobs\//i,
  /indeed\.com\/(view\/)?job/i,
  /glassdoor\.com\/Job\//i,
  /glassdoor\.com\/job-listing\//i,
  /remote\.co\/remote-jobs\//i,
  /arc\.dev\/jobs\//i,
  /occmundial\.com\/empleo\//i,
  /upwork\.com\/job\//i,
]
```

## 11. Key Decisions

| Decision | Choice | Rationale |
|----------|--------|----------|
| Data extraction | LLM-only (GPT-4o-mini) | Resiliente a cambios de sitio, un algoritmo universal |
| LLM proxy | Backend endpoint | API key segura en servidor, no expuesta en bundle |
| Badge | Auto-detección por URL | UX mínima — usuario sabe que se detectó un empleo |
| Config | pydantic-settings + .env | Type-safe, consistente con backend existente |
| UI Framework | Inline styles (React) | Sin dependencias extra, popup pequeño |
