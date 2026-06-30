import type { CSSProperties } from "react"

export const btnBase: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "10px 20px",
  border: "1px solid #27272a",
  borderRadius: 20,
  background: "transparent",
  color: "#e4e4e7",
  fontSize: 13,
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s ease",
  letterSpacing: "0.2px",
  outline: "none",
}

export const btnHover: CSSProperties = {
  borderColor: "#3b82f6",
  background: "rgba(59, 130, 246, 0.08)",
  color: "#fafafa",
}

export const btnOpenIcon: CSSProperties = {
  fontSize: 15,
  lineHeight: 1,
  opacity: 0.7,
  transition: "transform 0.2s ease",
}

export const btnArrow: CSSProperties = {
  fontSize: 14,
  lineHeight: 1,
  opacity: 0.5,
  transition: "transform 0.2s ease",
  marginLeft: 2,
}
