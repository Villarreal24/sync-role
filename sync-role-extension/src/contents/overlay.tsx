import { useState, useEffect, useCallback, useRef } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { scrapePage, createJob } from "../lib/api"
import { styles } from "../lib/styles"
import { EMPLOYMENT_OPTIONS } from "../lib/constants"
import { transformJobUrl } from "../lib/url-transform"
import FloatingPanel from "../components/FloatingPanel"
import type { FormState, ExtensionMessage, OverlayState } from "../lib/types"

export const config: PlasmoCSConfig = {
  matches: ["https://*/*"],
}

type PanelState =
  | "idle"
  | "loading"
  | "loaded"
  | "scrape_error"
  | "saving"
  | "save_success"
  | "save_error"

const INITIAL_FORM: FormState = {
  title: "",
  company: "",
  sourceUrl: "",
  location: "",
  salary: "",
  description: "",
  recruiterName: "",
  publishedAt: "",
  employmentType: "",
  requiredError: "",
}

function Overlay() {
  const [visible, setVisible] = useState(false)
  const visibleRef = useRef(visible)
  visibleRef.current = visible
  const [minimized, setMinimized] = useState(false)
  const [state, setState] = useState<PanelState>("idle")
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errorMsg, setErrorMsg] = useState("")

  const loadData = useCallback(async () => {
    setState("loading")
    setErrorMsg("")
    setForm((prev) => ({ ...prev, requiredError: "" }))

    try {
      const jobUrl = transformJobUrl(window.location.href)
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
        requiredError: "",
      })
      setState("loaded")
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error")
      setState("scrape_error")
    }
  }, [])

  useEffect(() => {
    const handler = (
      msg: ExtensionMessage,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: OverlayState) => void,
    ) => {
      if (msg.type === "SHOW_OVERLAY") {
        setState("loading")
        setVisible(true)
        setMinimized(false)
        loadData()
      }
      if (msg.type === "HIDE_OVERLAY") {
        setVisible(false)
      }
      if (msg.type === "GET_OVERLAY_STATE") {
        sendResponse({ visible: visibleRef.current })
        return true
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
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
        source_url: form.sourceUrl.trim(),
        location: form.location.trim(),
        salary: form.salary.trim(),
        description: form.description.trim(),
        recruiter_name: form.recruiterName.trim(),
        published_at: form.publishedAt.trim(),
        employment_type: form.employmentType.trim(),
      })
      setState("save_success")
      chrome.runtime.sendMessage<ExtensionMessage>({ type: "OVERLAY_SAVED" })
      setTimeout(() => setVisible(false), 1500)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to save")
      setState("save_error")
    }
  }

  const renderBody = () => {
    if (state === "loading") {
      return null
    }

    if (state === "scrape_error" || state === "save_error") {
      return (
        <>
          <div style={styles.errorBox as React.CSSProperties}>{errorMsg}</div>
          <button
            style={{ ...styles.button, marginTop: 16, backgroundColor: "#27272a" } as React.CSSProperties}
            onClick={loadData}
          >
            Retry
          </button>
        </>
      )
    }

    if (state === "save_success") {
      return (
        <div style={styles.successContainer as React.CSSProperties}>
          <div style={styles.successIcon as React.CSSProperties}>✓</div>
          <div style={styles.successText as React.CSSProperties}>Saved successfully</div>
          <p style={{ color: "#a1a1aa", fontSize: 12, margin: 0 }}>
            Closing panel...
          </p>
        </div>
      )
    }

    return (
      <>
        <div style={styles.fieldGroup as React.CSSProperties}>
          <label style={styles.label as React.CSSProperties}>
            Puesto<span style={styles.requiredStar as React.CSSProperties}>*</span>
          </label>
          <input
            style={{
              ...styles.input,
              border: form.requiredError && !form.title.trim() ? "1px solid #ef4444" : (styles.input as React.CSSProperties).border,
            } as React.CSSProperties}
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Job title"
          />
        </div>

        <div style={styles.fieldGroup as React.CSSProperties}>
          <label style={styles.label as React.CSSProperties}>
            Empresa<span style={styles.requiredStar as React.CSSProperties}>*</span>
          </label>
          <input
            style={{
              ...styles.input,
              border: form.requiredError && !form.company.trim() ? "1px solid #ef4444" : (styles.input as React.CSSProperties).border,
            } as React.CSSProperties}
            value={form.company}
            onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
            placeholder="Company name"
          />
        </div>

        <div style={styles.fieldGroup as React.CSSProperties}>
          <label style={styles.label as React.CSSProperties}>URL</label>
          <input
            style={styles.input as React.CSSProperties}
            value={form.sourceUrl}
            onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
            placeholder="https://linkedin.com/jobs/view/..."
          />
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ ...styles.fieldGroup, flex: 1 } as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Ubicación</label>
            <input
              style={styles.input as React.CSSProperties}
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Location"
            />
          </div>
          <div style={{ ...styles.fieldGroup, flex: 1 } as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Salario</label>
            <input
              style={styles.input as React.CSSProperties}
              value={form.salary}
              onChange={(e) => setForm((prev) => ({ ...prev, salary: e.target.value }))}
              placeholder="Salary range"
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ ...styles.fieldGroup, flex: 1 } as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Tipo</label>
            <select
              style={styles.select as React.CSSProperties}
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
          <div style={{ ...styles.fieldGroup, flex: 1 } as React.CSSProperties}>
            <label style={styles.label as React.CSSProperties}>Reclutador</label>
            <input
              style={styles.input as React.CSSProperties}
              value={form.recruiterName}
              onChange={(e) => setForm((prev) => ({ ...prev, recruiterName: e.target.value }))}
              placeholder="Optional"
            />
          </div>
        </div>

        <div style={styles.fieldGroup as React.CSSProperties}>
          <label style={styles.label as React.CSSProperties}>Publicado</label>
          <input
            style={styles.input as React.CSSProperties}
            value={form.publishedAt}
            onChange={(e) => setForm((prev) => ({ ...prev, publishedAt: e.target.value }))}
            placeholder="e.g. hace 3 días"
          />
        </div>

        {/*
        <div style={styles.fieldGroup as React.CSSProperties}>
          <label style={styles.label as React.CSSProperties}>Descripción</label>
          <textarea
            style={styles.textarea as React.CSSProperties}
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Job description"
            rows={3}
          />
        </div>
        */}

        {form.requiredError && (
          <div style={{ ...styles.errorBox, marginTop: 0, marginBottom: 8 } as React.CSSProperties}>
            {form.requiredError}
          </div>
        )}

        <button
          style={{
            ...styles.button,
            ...(state === "saving" ? styles.buttonDisabled : {}),
          } as React.CSSProperties}
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
      </>
    )
  }

  return (
    <FloatingPanel
      hidden={!visible}
      minimized={minimized}
      loading={state === "loading"}
      loadingMessage="Scraping and getting position data"
      onMinimize={() => setMinimized(!minimized)}
      onClose={() => setVisible(false)}
    >
      {renderBody()}
    </FloatingPanel>
  )
}

export default Overlay
