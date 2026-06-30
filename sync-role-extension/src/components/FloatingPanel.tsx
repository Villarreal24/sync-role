import { useState, useRef, useEffect, type ReactNode } from "react"
import LoadingSpinner from "./LoadingSpinner"

interface Props {
  hidden: boolean
  minimized: boolean
  loading: boolean
  loadingMessage: string
  onMinimize: () => void
  onClose: () => void
  children: ReactNode
}

function FloatingPanel({ hidden, minimized, loading, loadingMessage, onMinimize, onClose, children }: Props) {
  const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 80 })
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const minimizeRef = useRef<HTMLButtonElement>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)

  useEffect(() => {
    const btn = closeRef.current
    if (!btn) return
    const handler = () => onClose()
    btn.addEventListener("click", handler)
    return () => btn.removeEventListener("click", handler)
  }, [onClose])

  useEffect(() => {
    const btn = minimizeRef.current
    if (!btn) return
    const handler = () => onMinimize()
    btn.addEventListener("click", handler)
    return () => btn.removeEventListener("click", handler)
  }, [onMinimize])

  useEffect(() => {
    const close = closeRef.current
    const minimize = minimizeRef.current
    const stop = (e: MouseEvent) => e.stopPropagation()
    close?.addEventListener("mousedown", stop)
    minimize?.addEventListener("mousedown", stop)
    return () => {
      close?.removeEventListener("mousedown", stop)
      minimize?.removeEventListener("mousedown", stop)
    }
  }, [])

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).tagName === "BUTTON") return

      isDraggingRef.current = true
      header.style.cursor = "grabbing"
      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"

      dragOffset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      }

      const onMouseMove = (ev: MouseEvent) => {
        setPosition({
          x: ev.clientX - dragOffset.current.x,
          y: ev.clientY - dragOffset.current.y,
        })
      }

      const onMouseUp = () => {
        isDraggingRef.current = false
        header.style.cursor = "grab"
        document.body.style.userSelect = ""
        document.body.style.cursor = ""
        document.removeEventListener("mousemove", onMouseMove)
        document.removeEventListener("mouseup", onMouseUp)
      }

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)
    }

    header.addEventListener("mousedown", onMouseDown)
    return () => header.removeEventListener("mousedown", onMouseDown)
  }, [position])

  return (
    <>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div
        ref={panelRef}
        style={{
          display: hidden ? "none" : undefined,
          position: "fixed",
          top: position.y,
          left: position.x,
          zIndex: 999999,
          width: 380,
          backgroundColor: "#18181b",
          borderRadius: 12,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          border: "1px solid #27272a",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          fontSize: 13,
          color: "#e4e4e7",
        }}
      >
      <div
        ref={headerRef}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          cursor: "grab",
          borderBottom: "1px solid #27272a",
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          backgroundColor: "#1f1f23",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 13, color: "#e4e4e7" }}>
          SyncRole
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            ref={minimizeRef}
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            {minimized ? "+" : "−"}
          </button>
          <button
            ref={closeRef}
            type="button"
            style={{
              background: "none",
              border: "none",
              color: "#a1a1aa",
              cursor: "pointer",
              fontSize: 14,
              lineHeight: 1,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            ✕
          </button>
        </div>
      </div>
      {!minimized && (
        <div style={{ padding: 14, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
          {loading ? <LoadingSpinner message={loadingMessage} /> : children}
        </div>
      )}
    </div>
    </>
  )
}

export default FloatingPanel
