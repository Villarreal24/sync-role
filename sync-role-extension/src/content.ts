import React from "react"
import { createRoot } from "react-dom/client"
import type { ExtensionMessage } from "./lib/types"
import { setStoredTokens } from "./lib/auth"
import OverlayPanel from "./components/OverlayPanel"

// --- Auth bridge: detect tokens from SyncRole frontend ---

function isValidJwt(token: string): boolean {
  // JWT shape: header.payload.signature (3 base64url segments)
  if (token.split(".").length !== 3) return false
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return typeof payload.exp === "number"
  } catch {
    return false
  }
}

// Register the listener BEFORE injecting the cookie reader, so we don't
// miss the postMessage from the injected script.
window.addEventListener("message", (event) => {
  // Only accept messages from the page itself (same origin)
  if (event.origin !== window.location.origin) return
  if (event.data?.type !== "SYNCROLE_AUTH") return

  const { access_token, refresh_token } = event.data
  // Validate JWT shape before storing — prevents garbage from spoofed messages
  if (access_token && refresh_token && isValidJwt(access_token)) {
    setStoredTokens(access_token, refresh_token)
    chrome.runtime.sendMessage({ type: "AUTH_LOGIN" })
  }
})

// Read cookies directly from the isolated world context (no script injection required)
function syncTokensFromCookies() {
  const matchToken = document.cookie.match(/(?:^|; )syncrole_token=([^;]*)/)
  const matchRefresh = document.cookie.match(/(?:^|; )syncrole_refresh=([^;]*)/)
  if (matchToken && matchRefresh) {
    const access_token = decodeURIComponent(matchToken[1])
    const refresh_token = decodeURIComponent(matchRefresh[1])
    if (access_token && refresh_token && isValidJwt(access_token)) {
      setStoredTokens(access_token, refresh_token)
      chrome.runtime.sendMessage({ type: "AUTH_LOGIN" })
    }
  }
}

// Run the sync on load
syncTokensFromCookies()

const container = document.createElement("div")
container.id = "syncrole-overlay-root"
document.body.appendChild(container)
const root = createRoot(container)
root.render(React.createElement(OverlayPanel))

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "GET_PAGE_CONTENT") {
      sendResponse({
        url: window.location.href,
        pageContent: document.body.innerText,
      } satisfies ExtensionMessage["payload"])
    }
  },
)
