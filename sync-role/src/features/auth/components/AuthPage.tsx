import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { GoogleOAuthButton } from './GoogleOAuthButton'
import { useAuth } from '../hooks/use-auth'
import { useAuthStore } from '../store/auth.store'

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const { register, login } = useAuth()
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    if (accessToken) {
      const refreshToken = params.get('refresh_token') ?? ''
      const userId = params.get('user_id') ?? ''
      const email = params.get('email') ?? ''
      setAuth(accessToken, refreshToken, { id: userId, email })
      window.history.replaceState({}, '', '/auth')
      navigate({ to: '/' })
    }
  }, [setAuth, navigate])

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

            <GoogleOAuthButton />
          </div>
        </div>
      </div>
    </div>
  )
}
