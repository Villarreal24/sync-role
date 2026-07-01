const FRONTEND_URL = process.env.PLASMO_PUBLIC_FRONTEND_URL || "http://localhost:3000"

export function SignInButton() {
  const handleSignIn = () => {
    chrome.tabs.create({ url: `${FRONTEND_URL}/auth?redirect=extension` })
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "10px 0",
      }}
    >
      <p
        style={{
          color: "#a1a1aa",
          fontSize: 12.5,
          margin: 0,
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        Sign in to use SyncRole
      </p>
      <button
        onClick={handleSignIn}
        style={{
          padding: "10px 24px",
          backgroundColor: "#3b82f6",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background-color 0.15s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3b82f6")}
      >
        Sign In
      </button>
    </div>
  )
}
