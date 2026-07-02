import { useState, useEffect } from "react"
import { styles } from "./lib/styles"
import { btnBase, btnHover, btnOpenIcon, btnArrow } from "./lib/popup-styles"
import { AuthGate } from "./components/AuthGate"
import { SignInButton } from "./components/SignInButton"
import { updateAuthBadge } from "./lib/auth"
import type { ExtensionMessage, OverlayState } from "./lib/types"

function AuthenticatedPopup() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [hovered, setHovered] = useState(false)

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

  const showOpen = !overlayVisible && state !== "error"

  return (
    <div style={{ ...styles.container, width: 300, minHeight: "auto", padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: "#3b82f6" }}>●</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#fafafa", letterSpacing: "0.3px" }}>
          SyncRole
        </span>
      </div>

      {state === "error" && (
        <div style={{ ...styles.errorBox, marginBottom: 12 } as React.CSSProperties}>
          {errorMsg}
        </div>
      )}

      <p
        style={{
          color: "#a1a1aa",
          fontSize: 12.5,
          margin: "0 0 18px",
          lineHeight: 1.5,
          fontWeight: 400,
        }}
      >
        {overlayVisible
          ? "The panel is open on this page."
          : "Open the panel to scrape and save job data."}
      </p>

      <button
        style={{
          ...btnBase,
          ...(hovered ? btnHover : {}),
          ...(showOpen && hovered ? { borderColor: "#3b82f6" } : {}),
          ...(!showOpen
            ? {
                borderColor: "#27272a",
                color: "#71717a",
                cursor: state === "loading" ? "not-allowed" : "pointer",
                opacity: state === "loading" ? 0.5 : 1,
              }
            : {}),
        } as React.CSSProperties}
        disabled={state === "loading" || !tabId}
        onClick={handleToggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {state === "loading" ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 12,
                height: 12,
                border: "2px solid rgba(255,255,255,0.15)",
                borderTopColor: "#3b82f6",
                borderRadius: "50%",
                animation: "sr-spin 0.6s linear infinite",
              }}
            />
            Loading...
          </span>
        ) : showOpen ? (
          <>
            <span style={btnOpenIcon}>✦</span>
            Open Panel
            <span style={btnArrow}>→</span>
          </>
        ) : (
          "Close Panel"
        )}
      </button>

      {showOpen && (
        <style>{`@keyframes sr-spin { to { transform: rotate(360deg); } }`}</style>
      )}
    </div>
  )
}

function IndexPopup() {
  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          background: #09090b;
        }
      `}</style>
      <AuthGate
        authenticated={<AuthenticatedPopup />}
        unauthenticated={<SignInButton />}
        onAuthStateChange={(isAuthenticated) => {
          updateAuthBadge()
        }}
      />
    </>
  )
}

export default IndexPopup
