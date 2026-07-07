# Sync Role — Frontend

React 19 + TanStack Start frontend for the Sync Role job application tracker.

## Tech Stack

- React 19, TypeScript 6
- TanStack Router + TanStack Start + TanStack Query
- Zustand (state management)
- Tailwind CSS v4
- Vite 8
- Vitest (testing)

## Getting Started

```bash
bun install
bun run dev
```

Dev server runs on `http://localhost:3000`.

## Environment

Create a `.env` file in this directory:

```env
BACKEND_API_URL=http://localhost:8000/api/v1
```

## Project Structure

```
src/
├── core/api/              # API client + Query client setup
├── features/
│   └── jobs/
│       ├── api/           # Job service (HTTP to backend)
│       ├── components/    # JobBoard, JobCard, KanbanColumn
│       ├── hooks/         # React Query hooks for jobs
│       ├── store/         # Zustand store
│       └── types/         # TypeScript interfaces
├── routes/                # File-based routes
├── routeTree.gen.ts       # Auto-generated router tree
├── router.tsx
└── styles.css
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server |
| `bun run build` | Build for production |
| `bun run test` | Run Vitest tests |
| `bun run generate-routes` | Regenerate route tree |

## Data Source

Jobs are created via the **Sync Role browser extension** (Chrome MV3) which scrapes job postings from LinkedIn, Indeed, Greenhouse, and any other job board using GPT-4o-mini extraction, with fallback to manual entry. They can also be created manually via the API.

## Backend

The backend API runs at `http://localhost:8000/api/v1`. Start it from the project root:

```bash
make run
```
