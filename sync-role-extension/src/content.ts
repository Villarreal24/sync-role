import React from "react"
import { createRoot } from "react-dom/client"
import type { ExtensionMessage } from "./lib/types"
import { clearStoredToken, setStoredTokens } from "./lib/auth"
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

  if (event.data?.type === "SYNCROLE_AUTH") {
    const { access_token, refresh_token } = event.data
    // Validate JWT shape before storing — prevents garbage from spoofed messages
    if (access_token && refresh_token && isValidJwt(access_token)) {
      setStoredTokens(access_token, refresh_token)
      chrome.runtime.sendMessage({ type: "AUTH_LOGIN" })
    }
    return
  }

  // The FE dispatches SYNCROLE_LOGOUT from auth.store.clearAuth()
  // (window.postMessage in the same origin). Drop the cached
  // tokens so the extension doesn't try to use a session that
  // no longer exists server-side.
  if (event.data?.type === "SYNCROLE_LOGOUT") {
    void clearStoredToken()
    chrome.runtime.sendMessage({ type: "AUTH_LOGOUT" })
    return
  }
})

// Read cookies directly from the isolated world context (no script injection required).
// If cookies are absent on load, also clear any previously cached
// tokens — otherwise the extension would keep using a session
// that the user has already logged out of in a prior tab.
async function syncTokensFromCookies() {
  const matchToken = document.cookie.match(/(?:^|; )syncrole_token=([^;]*)/)
  const matchRefresh = document.cookie.match(/(?:^|; )syncrole_refresh=([^;]*)/)
  if (matchToken && matchRefresh) {
    const access_token = decodeURIComponent(matchToken[1])
    const refresh_token = decodeURIComponent(matchRefresh[1])
    if (access_token && refresh_token && isValidJwt(access_token)) {
      await setStoredTokens(access_token, refresh_token)
      chrome.runtime.sendMessage({ type: "AUTH_LOGIN" })
    }
  } else {
    // No cookies — make sure the extension's storage is in sync
    await clearStoredToken()
  }
}

// Run the sync on load
void syncTokensFromCookies()

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
