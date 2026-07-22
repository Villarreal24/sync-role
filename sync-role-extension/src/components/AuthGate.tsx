import { useState, useEffect, type ReactNode } from "react"
import { hasSession } from "../lib/auth"

type AuthState = "loading" | "authenticated" | "unauthenticated"

interface AuthGateProps {
  authenticated: ReactNode
  unauthenticated: ReactNode
  onAuthStateChange?: (isAuthenticated: boolean) => void
}

export function AuthGate({
  authenticated,
  unauthenticated,
  onAuthStateChange,
}: AuthGateProps) {
  const [authState, setAuthState] = useState<AuthState>("loading")

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        const loggedIn = await hasSession()

        if (!cancelled) {
          setAuthState(loggedIn ? "authenticated" : "unauthenticated")
          onAuthStateChange?.(loggedIn)
        }
      } catch {
        if (!cancelled) {
          setAuthState("unauthenticated")
          onAuthStateChange?.(false)
        }
      }
    }

    checkAuth()

    return () => {
      cancelled = true
    }
  }, [])

  if (authState === "loading") {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          color: "#a1a1aa",
          fontSize: 13,
        }}
      >
        Checking authentication...
      </div>
    )
  }

  return authState === "authenticated" ? <>{authenticated}</> : <>{unauthenticated}</>
}
