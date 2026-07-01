import { useState, useCallback } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { useAuth } from '../hooks/use-auth'

const API_BASE = 'http://localhost:8000/api/v1'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [oauthLoading, setOauthLoading] = useState(false)
  const { register, login } = useAuth()

  const handleGoogleOAuth = useCallback(async () => {
    setOauthLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/google`)
      if (!res.ok) throw new Error('Failed to initiate Google login')
      const data = await res.json()
      // Redirect to Google OAuth consent screen
      window.location.href = data.url
    } catch (err) {
      console.error('Google OAuth failed:', err)
      setOauthLoading(false)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-zinc-100">ApplySync</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
          {isLogin ? (
            <LoginForm
              onLogin={login}
              onToggleMode={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm
              onRegister={register}
              onToggleMode={() => setIsLogin(true)}
            />
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-zinc-900 text-zinc-500">or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={oauthLoading}
              className="mt-4 w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 font-medium rounded-md border border-zinc-700 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {oauthLoading ? 'Redirecting...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
