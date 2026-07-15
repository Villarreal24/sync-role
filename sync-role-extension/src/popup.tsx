import { useState, useEffect, useCallback } from "react"
import { styles } from "./lib/styles"
import { btnBase, btnHover, btnOpenIcon, btnArrow } from "./lib/popup-styles"
import { AuthGate } from "./components/AuthGate"
import { SignInButton } from "./components/SignInButton"
import { updateAuthBadge } from "./lib/auth"
import { fetchProfile, type Profile } from "./lib/api"
import type { ExtensionMessage, OverlayState } from "./lib/types"

const copyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
)

const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

// ── Phone display formatter ──
// Only formats for display; the raw value is what gets copied and stored.

function formatPhoneDisplay(value: string | null): string {
  if (!value) return ""
  const cleaned = value.replace(/[^\d+]/g, "")
  if (!cleaned.startsWith("+") || cleaned.length < 8) return value
  const digits = cleaned.slice(1)

  // Heuristic: 12+ digits after + → 2-digit country code (e.g. +52 MX)
  // 11 digits after + → 1-digit country code (e.g. +1 US/CA)
  const countryLen = digits.length >= 12 ? 2 : 1
  const countryCode = digits.slice(0, countryLen)
  const rest = digits.slice(countryLen)
  const area = rest.slice(0, 3)
  const mid = rest.slice(3, 6)
  const last = rest.slice(6, 10)

  if (last) return `+${countryCode} (${area})-${mid}-${last}`
  return value
}

// ── Shared field constants ──

const PROFILE_FIELDS = [
  { label: "Phone", key: "phone" as const, isUrl: false },
  { label: "LinkedIn", key: "linkedin_url" as const, isUrl: true },
  { label: "GitHub", key: "github_url" as const, isUrl: true },
  { label: "Portfolio", key: "portfolio_url" as const, isUrl: true },
]

// ── Field row shared by skeleton and live ──

const fieldRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 0",
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 600,
  color: "#71717a",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  marginBottom: 2,
}

const fieldValueBaseStyle: React.CSSProperties = {
  fontSize: 13,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
}

const copyBtnBaseStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 28,
  height: 28,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #27272a",
  borderRadius: 6,
  background: "transparent",
  padding: 0,
  outline: "none",
  transition: "all 0.15s ease",
}

// ── Skeleton ──

function ProfileSkeleton() {
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 14,
      }}
    >
      {/* Avatar + name row */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "#27272a",
            animation: "sr-pulse 1.5s ease-in-out infinite",
          }}
        />
        <div
          style={{
            height: 13,
            width: "45%",
            background: "#27272a",
            borderRadius: 6,
            animation: "sr-pulse 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Field rows — same count and spacing as live */}
      {PROFILE_FIELDS.map((f) => (
        <div key={f.key} style={fieldRowStyle}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={fieldLabelStyle}>{f.label}</div>
            <div
              style={{
                ...fieldValueBaseStyle,
                height: 13,
                width: "70%",
                background: "#27272a",
                borderRadius: 6,
                animation: "sr-pulse 1.5s ease-in-out infinite",
              }}
            />
          </div>
          <div
            style={{
              ...copyBtnBaseStyle,
              animation: "sr-pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      ))}
    </div>
  )
}

// ── Live field ──

interface ProfileFieldProps {
  label: string
  value: string | null
  isUrl: boolean
}

function ProfileField({ label, value, isUrl }: ProfileFieldProps) {
  const [copied, setCopied] = useState(false)
  const hasValue = !!value
  // Format phone for display only; copy uses the original raw value
  const displayValue = !isUrl && value ? formatPhoneDisplay(value) : (value ?? "")

  const handleCopy = useCallback(async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard may not be available in some contexts
    }
  }, [value])

  return (
    <div style={fieldRowStyle}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={fieldLabelStyle}>{label}</div>
        {isUrl && hasValue ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              ...fieldValueBaseStyle,
              color: "#60a5fa",
              textDecoration: "none",
            }}
            title={value!}
          >
            {displayValue}
          </a>
        ) : (
          <span
            style={{
              ...fieldValueBaseStyle,
              color: hasValue ? "#e4e4e7" : "#3f3f46",
            }}
            title={value ?? ""}
          >
            {displayValue}
          </span>
        )}
      </div>
      <button
        onClick={handleCopy}
        title={copied ? "Copied!" : hasValue ? "Copy to clipboard" : "No value to copy"}
        disabled={!hasValue}
        style={{
          ...copyBtnBaseStyle,
          background: copied ? "rgba(34, 197, 94, 0.1)" : "transparent",
          color: copied ? "#22c55e" : hasValue ? "#a1a1aa" : "#27272a",
          cursor: hasValue ? "pointer" : "default",
          borderColor: hasValue ? "#27272a" : "#1f1f22",
        }}
        onMouseEnter={(e) => {
          if (hasValue && !copied) e.currentTarget.style.borderColor = "#3b82f6"
        }}
        onMouseLeave={(e) => {
          if (hasValue && !copied) e.currentTarget.style.borderColor = "#27272a"
        }}
      >
        {copied ? checkIcon : copyIcon}
      </button>
    </div>
  )
}

function ProfileSection({ profile }: { profile: Profile }) {
  return (
    <div
      style={{
        background: "#18181b",
        border: "1px solid #27272a",
        borderRadius: 10,
        padding: "10px 12px",
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "#27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#a1a1aa",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {profile.display_name?.charAt(0)?.toUpperCase() || "?"}
          </div>
        )}
        <span style={{ color: "#fafafa", fontSize: 13, fontWeight: 600 }}>
          {profile.display_name}
        </span>
      </div>

      {PROFILE_FIELDS.map((f) => (
        <ProfileField key={f.key} label={f.label} value={profile[f.key]} isUrl={f.isUrl} />
      ))}
    </div>
  )
}

function AuthenticatedPopup() {
  const [tabId, setTabId] = useState<number | null>(null)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [state, setState] = useState<"loading" | "ready" | "error">("loading")
  const [errorMsg, setErrorMsg] = useState("")
  const [hovered, setHovered] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

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

    fetchProfile().then((p) => {
      setProfile(p)
      setProfileLoading(false)
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

      {/* Profile info section */}
      {profileLoading ? <ProfileSkeleton /> : profile ? <ProfileSection profile={profile} /> : null}

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
      <style>{`@keyframes sr-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.7; } }`}</style>
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
