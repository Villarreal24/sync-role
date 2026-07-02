import { updateAuthBadge } from "./lib/auth"
import type { ExtensionMessage } from "./lib/types"

// Update badge when extension is installed or browser starts
chrome.runtime.onInstalled.addListener(() => {
  updateAuthBadge()
})

chrome.runtime.onStartup.addListener(() => {
  updateAuthBadge()
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
