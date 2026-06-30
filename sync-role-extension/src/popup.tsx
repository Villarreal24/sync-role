import { useState, useEffect } from "react"
import { styles } from "./lib/styles"
import type { ExtensionMessage, OverlayState } from "./lib/types"

function IndexPopup() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs[0]
      if (!tab?.id) {
        setState("error")
        setErrorMsg("No active tab found")
        return
      }
      setTabId(tab.id)
      chrome.tabs
        .sendMessage<ExtensionMessage, OverlayState>(tab.id, { type: "GET_OVERLAY_STATE" })
        .then((res) => {
          setOverlayVisible(res.visible)
          setState("ready")
        })
        .catch(() => {
          setOverlayVisible(false)
          setState("ready")
        })
    })
  }, [])

  const handleToggle = () => {
    if (!tabId) return
    setState("loading")

    if (overlayVisible) {
      chrome.tabs
        .sendMessage<ExtensionMessage>(tabId, { type: "HIDE_OVERLAY" })
        .then(() => {
          setOverlayVisible(false)
          setState("ready")
        })
        .catch(() => {
          setState("error")
          setErrorMsg("Could not communicate with the page.")
        })
    } else {
      chrome.tabs
        .sendMessage<ExtensionMessage>(tabId, { type: "SHOW_OVERLAY" })
        .then(() => window.close())
        .catch(() => {
          setState("error")
          setErrorMsg("Could not open panel. Try refreshing the page.")
        })
    }
  }

  return (
    <div style={{ ...styles.container, width: 300, minHeight: "auto", padding: 20 }}>
      <div style={styles.header}>
        <span style={styles.logo}>SyncRole</span>
        <span style={styles.badge}>Extension</span>
      </div>

      {state === "error" && (
        <div style={styles.errorBox as React.CSSProperties}>{errorMsg}</div>
      )}

      <p
        style={{
          color: "#a1a1aa",
          fontSize: 13,
          margin: "12px 0 16px",
          lineHeight: 1.4,
        }}
      >
        {overlayVisible
          ? "The floating panel is currently open on this page."
          : "Open the floating panel to scrape and save job data."}
      </p>

      <button
        style={{
          ...styles.button,
          ...(state === "loading" ? styles.buttonDisabled : {}),
          backgroundColor: overlayVisible ? "#27272a" : "#3b82f6",
        } as React.CSSProperties}
        disabled={state === "loading" || !tabId}
        onClick={handleToggle}
      >
        {state === "loading"
          ? "Loading..."
          : overlayVisible
            ? "Close Panel"
            : "Open Panel"}
      </button>
    </div>
  )
}

export default IndexPopup
