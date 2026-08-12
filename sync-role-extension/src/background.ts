import { extractAccessToken, updateAuthBadge } from "./lib/auth"
import type { ExtensionMessage } from "./lib/types"

// Update badge when extension is installed or browser starts
chrome.runtime.onInstalled.addListener(() => {
  updateAuthBadge()
})

chrome.runtime.onStartup.addListener(() => {
  updateAuthBadge()
})

// Reactively track session cookie changes from the FE app.
// Extracts the access token in the background and stores only the plain JWT
// so popup reads it without needing base64 decode.
chrome.cookies.onChanged.addListener(async (changeInfo) => {
  const { cookie, removed } = changeInfo
  if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
    if (removed) {
      await chrome.storage.local.remove("sb-session-token")
    } else {
      const token = extractAccessToken(cookie.value)
      if (token) {
        await chrome.storage.local.set({ "sb-session-token": token })
      }
    }
    await updateAuthBadge()
  }
})

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === "PAGE_HAS_JOB") {
    chrome.action.setBadgeText({ text: "!" })
    chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" })
  }

  if (message.type === "JOB_SAVED" || message.type === "OVERLAY_SAVED") {
    chrome.action.setBadgeText({ text: "" })
  }

  if (message.type === "AUTH_CHECK" || message.type === "AUTH_LOGIN") {
    updateAuthBadge()
  }
})
