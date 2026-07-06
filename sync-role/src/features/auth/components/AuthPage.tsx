import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { GoogleOAuthButton } from './GoogleOAuthButton'
import { useAuth } from '../hooks/use-auth'
import { useAuthStore } from '../store/auth.store'
import { Card } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { fontSize } from '@/shared/design-tokens'
import { cn } from '@/shared/lib/utils'

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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Sync Role</h1>
          <p className={cn('mt-1 text-muted-foreground', fontSize.body)}>
            {isLogin ? 'Welcome back' : 'Create your account'}
          </p>
        </div>

        <Card className="p-6 gap-0">
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
              <Separator />
              <div className={cn('relative -mt-3 flex justify-center', fontSize.body)}>
                <span className="px-2 bg-card text-muted-foreground">or continue with</span>
              </div>
            </div>

            <GoogleOAuthButton />
          </div>
        </Card>
      </div>
    </div>
  )
}
