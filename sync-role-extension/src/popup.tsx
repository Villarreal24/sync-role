import { useState, useEffect, useCallback } from "react"
import { scrapePage, createJob } from "./lib/api"
import { styles } from "./lib/styles"
import { EMPLOYMENT_OPTIONS } from "./lib/constants"
import Skeleton from "./components/Skeleton"
import type {
  ScrapeResponse,
  PopupState,
  FormState,
  PageContent,
  ExtensionMessage,
} from "./lib/types"

const INITIAL_FORM: FormState = {
  title: "",
  company: "",
  location: "",
  salary: "",
  description: "",
  recruiterName: "",
  publishedAt: "",
  employmentType: "",
  requiredError: "",
}

function IndexPopup() {
  const [state, setState] = useState<PopupState>("no_job")
  const [data, setData] = useState<ScrapeResponse | null>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [form, setForm] = useState<FormState>(INITIAL_FORM)

  const loadData = useCallback(async () => {
    setState("loading")
    setErrorMsg("")
    setForm((prev) => ({ ...prev, requiredError: "" }))

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tab = tabs[0]
      if (!tab?.id) {
        setState("no_job")
        return
      }

      const response = await chrome.tabs.sendMessage(
        tab.id,
        { type: "GET_PAGE_CONTENT" },
      )
      const pageContent = response as PageContent | undefined

      if (!pageContent?.pageContent) {
        setState("no_job")
        return
      }

      const result = await scrapePage({
        url: pageContent.url,
        page_content: pageContent.pageContent,
      })

      setData(result)
      setForm({
        title: result.title,
        company: result.company,
        location: result.location,
        salary: result.salary,
        description: result.description,
        recruiterName: result.recruiter_name,
        publishedAt: result.published_at,
        employmentType: result.employment_type,
        requiredError: "",
      })
      setState("loaded")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setState("scrape_error")
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(loadData, 100)
    return () => clearTimeout(timer)
  }, [loadData])

  const handleSave = async () => {
    if (!form.title.trim() || !form.company.trim()) {
      setForm((prev) => ({ ...prev, requiredError: "Title and Company are required" }))
      return
    }
    setState("saving")
    setForm((prev) => ({ ...prev, requiredError: "" }))

    try {
      await createJob({
        title: form.title.trim(),
        company: form.company.trim(),
        source_url: data?.source_url ?? "",
        location: form.location.trim(),
        salary: form.salary.trim(),
        description: form.description.trim(),
        recruiter_name: form.recruiterName.trim(),
        published_at: form.publishedAt.trim(),
        employment_type: form.employmentType.trim(),
      })

      setState("save_success")

      chrome.runtime.sendMessage<ExtensionMessage>({ type: "JOB_SAVED" })

      setTimeout(() => window.close(), 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save")
      setState("save_error")
    }
  }

  if (state === "no_job") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.logo}>SyncRole</span>
          <span style={styles.badge}>Extension</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 32 }}>🔍</span>
          <p style={{ color: "#a1a1aa", fontSize: 13, textAlign: "center" }}>
            Navigate to a job posting page, then open the extension.
          </p>
        </div>
      </div>
    )
  }

  if (state === "loading") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.logo}>SyncRole</span>
          <span style={styles.badge}>Extracting data...</span>
        </div>
        <Skeleton />
      </div>
    )
  }

  if (state === "scrape_error" || state === "save_error") {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <span style={styles.logo}>SyncRole</span>
          <span style={{ ...styles.badge, color: "#fca5a5" }}>Error</span>
        </div>
        <div style={styles.errorBox}>{errorMsg}</div>
        <button
          style={{ ...styles.button, marginTop: 16, backgroundColor: "#27272a" }}
          onClick={loadData}
        >
          Retry
        </button>
      </div>
    )
  }

  if (state === "save_success") {
    return (
      <div style={styles.container}>
        <div style={styles.successContainer}>
          <div style={styles.successIcon}>✓</div>
          <div style={styles.successText}>Saved successfully</div>
          <p style={{ color: "#a1a1aa", fontSize: 12, margin: 0 }}>
            Closing extension...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.logo}>SyncRole</span>
        <span style={styles.badge}>Edit to refine</span>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Puesto<span style={styles.requiredStar}>*</span>
        </label>
        <input
          style={{
            ...styles.input,
            border: form.requiredError && !form.title.trim() ? "1px solid #ef4444" : styles.input.border,
          }}
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="Job title"
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>
          Empresa<span style={styles.requiredStar}>*</span>
        </label>
        <input
          style={{
            ...styles.input,
            border: form.requiredError && !form.company.trim() ? "1px solid #ef4444" : styles.input.border,
          }}
          value={form.company}
          onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
          placeholder="Company name"
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...styles.fieldGroup, flex: 1 }}>
          <label style={styles.label}>Ubicación</label>
          <input
            style={styles.input}
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Location"
          />
        </div>
        <div style={{ ...styles.fieldGroup, flex: 1 }}>
          <label style={styles.label}>Salario</label>
          <input
            style={styles.input}
            value={form.salary}
            onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
            placeholder="Salary range"
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ ...styles.fieldGroup, flex: 1 }}>
          <label style={styles.label}>Tipo</label>
          <select
            style={styles.select}
            value={form.employmentType}
            onChange={(e) => setForm((prev) => ({ ...prev, employmentType: e.target.value }))}
          >
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt || "Select..."}
              </option>
            ))}
          </select>
        </div>
        <div style={{ ...styles.fieldGroup, flex: 1 }}>
          <label style={styles.label}>Reclutador</label>
          <input
            style={styles.input}
            value={form.recruiterName}
            onChange={(e) => setForm((prev) => ({ ...prev, recruiterName: e.target.value }))}
            placeholder="Optional"
          />
        </div>
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Publicado</label>
        <input
          style={styles.input}
          value={form.publishedAt}
          onChange={(e) => setForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
          placeholder="e.g. hace 3 días"
        />
      </div>

      <div style={styles.fieldGroup}>
        <label style={styles.label}>Descripción</label>
        <textarea
          style={styles.textarea}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Job description"
          rows={3}
        />
      </div>

      {form.requiredError && (
        <div style={{ ...styles.errorBox, marginTop: 0, marginBottom: 8 }}>
          {form.requiredError}
        </div>
      )}

      <button
        style={{
          ...styles.button,
          ...(state === "saving" ? styles.buttonDisabled : {}),
        }}
        disabled={state === "saving"}
        onClick={handleSave}
      >
        {state === "saving" ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTop: "2px solid #fff",
                borderRadius: "50%",
                display: "inline-block",
                animation: "spin 0.6s linear infinite",
              }}
            />
            Saving...
          </>
        ) : (
          "Save Application"
        )}
      </button>
    </div>
  )
}

export default IndexPopup
