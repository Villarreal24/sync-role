# ApplySync — Browser Extension

A Chrome MV3 extension that extracts job data from **any** HTTPS job board via GPT-4o-mini and saves it to the ApplySync job tracker with one click. Works on LinkedIn, Indeed, Greenhouse, and any other site — if automatic scraping fails, the form falls back to manual entry.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Plasmo 0.90 |
| UI | React 18, CSS-in-JS (dark theme) |
| Language | TypeScript 5 |
| Manifest | MV3 |

## How It Works

1. **Injection** — `content.ts` runs on every page and mounts the overlay React component directly into the page (bypasses Plasmo CS UI for reliable injection on all sites)
2. **Badge** — `background.ts` sets a `"!"` badge on the extension icon when the content script loads (always available)
3. **Popup** — Clicking the icon opens `popup.tsx` with a minimal toggle button to show the floating overlay
4. **Scraping** — The overlay (`components/OverlayPanel.tsx`) sends `POST /api/v1/scrape` with the raw page text; the backend uses GPT-4o-mini to extract title, company, location, salary, employment type, recruiter, and more
5. **Fallback** — If the page is not in the whitelist (LinkedIn, Indeed, etc.) and scraping fails, the form opens with the page URL pre-filled and a warning banner — user fills fields manually
6. **Save** — User reviews and edits data in a dark-themed floating panel, then clicks "Save Application" — the overlay calls `POST /api/v1/jobs` and auto-closes on success

## Project Structure

```
src/
├── popup.tsx                # Extension popup (toggle overlay on/off)
├── background.ts            # Service worker (badge management)
├── content.ts               # Content script (injects overlay via createRoot)
├── components/
│   ├── FloatingPanel.tsx     # Draggable/minimizable panel wrapper
│   ├── LoadingSpinner.tsx    # Animated loading state
│   └── OverlayPanel.tsx      # Floating panel (scrape, form, save, fallback)
└── lib/
    ├── api.ts               # HTTP client (scrapePage, createJob)
    ├── types.ts             # Shared TypeScript types + extractCompanyFromDomain
    ├── styles.ts            # CSS-in-JS styles (dark theme)
    ├── popup-styles.ts      # Popup-specific button styles
    ├── constants.ts         # Backend URL, employment options
    └── url-transform.ts     # URL canonicalization (Indeed, LinkedIn)
```

## Getting Started

```bash
pnpm install
pnpm dev        # Hot-reload development build
pnpm build      # Production build
```

Load `build/chrome-mv3-prod` as an unpacked extension in Chrome.

## Environment

Set `PLASMO_PUBLIC_BACKEND_URL` to override the backend URL (default: `http://localhost:8000/api/v1`).
