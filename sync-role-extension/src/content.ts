import { JOB_SITE_PATTERNS } from "./lib/types"
import type { ExtensionMessage } from "./lib/types"

function isJobPage(): boolean {
  return JOB_SITE_PATTERNS.some((pattern) => pattern.test(window.location.href))
}

function getPageContent(): string {
  return document.body.innerText
}

if (isJobPage()) {
  chrome.runtime.sendMessage<ExtensionMessage>({ type: "PAGE_HAS_JOB" })
}

chrome.runtime.onMessage.addListener(
  (message: ExtensionMessage, _sender, sendResponse) => {
    if (message.type === "GET_PAGE_CONTENT") {
      sendResponse({
        url: window.location.href,
        pageContent: getPageContent(),
      } satisfies ExtensionMessage["payload"])
    }
  },
)
