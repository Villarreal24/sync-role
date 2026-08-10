import { useState, useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { getSupabaseBrowserClient } from '@/core/supabase/client'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { GoogleOAuthButton } from './GoogleOAuthButton'
import { useAuth } from '../hooks/use-auth'
import { useAuthCopy } from '../copy'
import { Card } from '@/shared/components/ui/card'
import { Separator } from '@/shared/components/ui/separator'
import { fontSize } from '@/shared/design-tokens'
import { cn } from '@/shared/lib/utils'

export function AuthPage() {
  const copy = useAuthCopy()
  const [isLogin, setIsLogin] = useState(true)
  const { register, login } = useAuth()
  const navigate = useNavigate()
  const search = useSearch({ from: '__root__' }) as Record<string, string>

  // Handle Google OAuth callback: hydrate @supabase/ssr client with tokens
  useEffect(() => {
    const { access_token, refresh_token } = search
    if (access_token && refresh_token) {
      const client = getSupabaseBrowserClient()
      client.auth.setSession({ access_token, refresh_token }).then(({ data: { session } }) => {
        if (session) {
          navigate({ to: '/' })
        }
      })
    } else if (search.user_id && search.email) {
      // Fallback: navigate to / and let getSession determine state
      navigate({ to: '/' })
    }
  }, [search, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Sync Role</h1>
          <p className={cn('mt-1 text-muted-foreground', fontSize.body)}>
            {isLogin ? copy.authPage.welcomeBack : copy.authPage.createYourAccount}
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
