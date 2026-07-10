import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CircleAlert } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { GoogleOAuthButton } from './GoogleOAuthButton'
import { useAuth } from '../hooks/use-auth'
import { useAuthCopy } from '../copy'
import { useAuthStore } from '../store/auth.store'
import { Alert, AlertTitle, AlertDescription } from '@/shared/components/ui/alert'
import { Card } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { fontSize } from '@/shared/design-tokens'
import { cn } from '@/shared/lib/utils'

export function AuthPage() {
  const copy = useAuthCopy()
  const [isLogin, setIsLogin] = useState(true)
  const { register, login } = useAuth()
  const setAuth = useAuthStore((s) => s.setAuth)
  const sessionExpiredReason = useAuthStore((s) => s.sessionExpiredReason)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)
  const navigate = useNavigate()

  useEffect(() => {
    if (sessionExpiredReason) {
      clearSessionExpired()
    }
  }, [sessionExpiredReason, clearSessionExpired])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('access_token')
    if (accessToken) {
      const refreshToken = params.get('refresh_token') ?? ''
      const userId = params.get('user_id') ?? ''
      const email = params.get('email') ?? ''
      const displayName = params.get('display_name') ?? ''
      const avatarUrl = params.get('avatar_url') ?? ''
      setAuth(accessToken, refreshToken, {
        id: userId,
        email,
        displayName,
        avatarUrl,
      })
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
            {isLogin ? copy.authPage.welcomeBack : copy.authPage.createYourAccount}
          </p>
        </div>

        {sessionExpiredReason && (
          <Alert variant="destructive" className="mb-6">
            <CircleAlert className="h-5 w-5" />
            <AlertTitle>{copy.sessionExpired.title}</AlertTitle>
            <AlertDescription>{copy.sessionExpired.description}</AlertDescription>
          </Alert>
        )}

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
                <span className="px-2 bg-card text-muted-foreground">{copy.authPage.orContinueWith}</span>
              </div>
            </div>

            <GoogleOAuthButton />
          </div>
        </Card>
      </div>
    </div>
  )
}
