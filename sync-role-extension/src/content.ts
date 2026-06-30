import React from "react"
import { createRoot } from "react-dom/client"
import type { ExtensionMessage } from "./lib/types"
import OverlayPanel from "./components/OverlayPanel"

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
