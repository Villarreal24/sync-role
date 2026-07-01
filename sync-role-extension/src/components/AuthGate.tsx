import { useState, useEffect, type ReactNode } from "react"
import {
  getStoredToken,
  isTokenExpired,
  refreshStoredToken,
  exchangeCookieForToken,
} from "../lib/auth"

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
        let token = await getStoredToken()

        if (token && isTokenExpired(token)) {
          token = await refreshStoredToken()
        }

        if (!token) {
          token = await exchangeCookieForToken()
        }

        if (!cancelled) {
          const isAuthenticated = token !== null && !isTokenExpired(token)
          setAuthState(isAuthenticated ? "authenticated" : "unauthenticated")
          onAuthStateChange?.(isAuthenticated)
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
