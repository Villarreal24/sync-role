import type { ExtensionMessage } from "./lib/types"

chrome.runtime.onMessage.addListener((message: ExtensionMessage) => {
  if (message.type === "PAGE_HAS_JOB") {
    chrome.action.setBadgeText({ text: "!" })
    chrome.action.setBadgeBackgroundColor({ color: "#3b82f6" })
  }

  if (message.type === "JOB_SAVED") {
    chrome.action.setBadgeText({ text: "" })
  }
})
