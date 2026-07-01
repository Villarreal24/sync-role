# Plan: Fallback scraping para sitios no whitelisted

## Cambios a realizar

### 1. `src/lib/types.ts` — Agregar helper extractCompanyFromDomain

**Dónde**: Después de `export interface ExtensionMessage` y antes de `export const JOB_SITE_PATTERNS`

**Código a agregar**:
```typescript
export function extractCompanyFromDomain(url: string): string | null {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean)[0]
    if (segment) {
      return segment.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    }
    return null
  } catch {
    return null
  }
}
```

### 2. `src/content.ts` — Badge siempre visible

**Reemplazar todo el archivo** con:
```typescript
import type { ExtensionMessage } from "./lib/types"

function getPageContent(): string {
  return document.body.innerText
}

chrome.runtime.sendMessage<ExtensionMessage>({ type: "PAGE_HAS_JOB" })

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "GET_PAGE_CONTENT") {
      sendResponse({
        url: window.location.href,
        pageContent: getPageContent(),
      } satisfies ExtensionMessage["payload"])
    }
  },
)
```

### 3. `src/lib/styles.ts` — Agregar warningBox style

**Dónde**: Después de `errorBox` (linea 139), agregar:
```typescript
  warningBox: {
    padding: "10px 14px",
    backgroundColor: "#1c1917",
    border: "1px solid #78350f",
    borderRadius: 8,
    color: "#fbbf24",
    fontSize: 12,
    marginTop: 8,
    marginBottom: 12,
  },
```

### 4. `src/contents/overlay.tsx` — Fallback lógica

**Cambio 1 — Imports** (lineas 1-8):
```typescript
import { useState, useEffect, useCallback, useRef } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { scrapePage, createJob } from "../lib/api"
import { styles } from "../lib/styles"
import { WORK_MODE_OPTIONS, EMPLOYMENT_TYPE_OPTIONS, SENIORITY_OPTIONS } from "../lib/constants"
import { transformJobUrl } from "../lib/url-transform"
import { JOB_SITE_PATTERNS, extractCompanyFromDomain } from "../lib/types"
import type { FormState, PanelState, ExtensionMessage, OverlayState } from "../lib/types"
import FloatingPanel from "../components/FloatingPanel"
```

**Cambio 2 — Agregar fallbackWarning state** (despues de `errorMsg`, linea 37):
```typescript
const [fallbackWarning, setFallbackWarning] = useState(false)
```

Y en `resetFormState`, agregar `setFallbackWarning(false)`.

**Cambio 3 — Modificar loadData** (lineas 45-77, reemplazar):
```typescript
const loadData = useCallback(async () => {
    setState("loading")
    setErrorMsg("")
    setFallbackWarning(false)
    setForm(INITIAL_FORM)

    const sourceUrl = window.location.href
    const isKnownSite = JOB_SITE_PATTERNS.some((p) => p.test(sourceUrl))

    try {
      const jobUrl = transformJobUrl(sourceUrl)
      const result = await scrapePage({
        url: jobUrl,
        page_content: document.body.innerText,
      })
      setForm({
        title: result.title,
        company: result.company,
        sourceUrl: result.source_url,
        location: result.location,
        salary: result.salary,
        description: result.description,
        recruiterName: result.recruiter_name,
        publishedAt: result.published_at,
        employmentType: result.employment_type,
        workMode: result.work_mode,
        seniority: result.seniority,
        technologies: (result.technologies || []).join(", "),
        requiredError: "",
      })
      setState("loaded")
    } catch (err) {
      if (isKnownSite) {
        setErrorMsg(err instanceof Error ? err.message : "Unknown error")
        setState("scrape_error")
      } else {
        const companyFromUrl = extractCompanyFromDomain(sourceUrl)
        setForm({
          ...INITIAL_FORM,
          sourceUrl,
          company: companyFromUrl || "",
        })
        setFallbackWarning(true)
        setState("loaded")
      }
    }
  }, [])
```

**Cambio 4 — Warning banner en renderBody** (despues del `Save successful` bloque, antes del return final del form):

Justo antes del `return` final (linea 175), agregar warning condicional:
```typescript
    if (fallbackWarning) {
      return (
        <>
          <div style={styles.warningBox as React.CSSProperties}>
            Could not auto-extract job data — fill fields manually
          </div>
          {renderFormFields()}
        </>
      )
    }

    return renderFormFields()
```

Para esto, extraer los campos del formulario a una función `renderFormFields()`.

O más simple: en lugar de extraer, solo agregar el warning banner condicional dentro del return existente:

```typescript
    return (
      <>
        {fallbackWarning && (
          <div style={styles.warningBox as React.CSSProperties}>
            Could not auto-extract job data — fill fields manually
          </div>
        )}
        <div style={styles.fieldGroup as React.CSSProperties}>
          {/* ... existing form fields ... */}
```

Así solo se agrega el warning banner arriba del form cuando `fallbackWarning` es true.

## Flujo resultante

```
Usuario abre popup → "Open Panel"
  → overlay recibe SHOW_OVERLAY
  → loadData() se ejecuta:

  1. Detecta si URL está en JOB_SITE_PATTERNS (whitelist)
  2. Intenta scrape (POST /api/v1/scrape)

  [SI es whitelisted + scrape OK] → form lleno con datos
  [SI es whitelisted + scrape FAIL] → error + retry (comportamiento actual)
  [NO whitelisted + scrape OK] → form lleno con datos (incluye sitios nuevos)
  [NO whitelisted + scrape FAIL] → form vacío + URL prellenada + warning banner
```

## Verificación

```bash
cd sync-role-extension && npx tsc --noEmit
pnpm test
```
