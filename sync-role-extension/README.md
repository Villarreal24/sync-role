# ApplySync — Browser Extension

A Chrome MV3 extension that detects job postings on supported sites, extracts structured data via GPT-4o-mini, and saves them to the ApplySync job tracker with one click.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Plasmo 0.90 |
| UI | React 18, CSS-in-JS (dark theme) |
| Language | TypeScript 5 |
| Manifest | MV3 |

## Supported Job Sites

Auto-detected via URL patterns: LinkedIn, Indeed, Glassdoor, Remote.co, Arc.dev, OccMundial, Upwork.

## How It Works

1. **Detection** — `content.ts` runs on every page, matches the URL against known job site patterns, and notifies the background script
2. **Badge** — `background.ts` sets a `"!"` badge on the extension icon when a job page is detected
3. **Popup** — Clicking the icon opens `popup.tsx` with a toggle button to show the floating overlay
4. **Scraping** — The overlay (`contents/overlay.tsx`) sends `POST /api/v1/scrape` with the raw page text; the backend uses GPT-4o-mini to extract title, company, location, salary, employment type, recruiter, and more
5. **Save** — User reviews and edits the data in a dark-themed floating panel, then clicks "Save Application" — the overlay calls `POST /api/v1/jobs` and auto-closes on success

## Project Structure

```
src/
├── popup.tsx                # Extension popup (toggle overlay on/off)
├── background.ts            # Service worker (badge management)
├── content.ts               # Content script (job page detection)
├── contents/
│   └── overlay.tsx          # Floating panel (scrape, form, save)
├── components/
│   ├── FloatingPanel.tsx     # Draggable/minimizable panel wrapper
│   └── LoadingSpinner.tsx    # Animated loading state
└── lib/
    ├── api.ts               # HTTP client (scrapePage, createJob)
    ├── types.ts             # Shared TypeScript types
    ├── styles.ts            # CSS-in-JS styles (dark theme)
    ├── constants.ts         # Backend URL, employment options
    └── url-transform.ts     # URL canonicalization (Indeed, LinkedIn)
```

## Getting Started

```bash
pnpm install
pnpm dev        # Hot-reload development build
pnpm build      # Production build
```

Load `build/chrome-mv3-dev` or `build/chrome-mv3-prod` as an unpacked extension in Chrome.

## Environment

Set `PLASMO_PUBLIC_BACKEND_URL` to override the backend URL (default: `http://localhost:8000/api/v1`).
