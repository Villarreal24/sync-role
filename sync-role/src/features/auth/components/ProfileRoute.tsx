import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useProfile } from '@/features/auth/api/profiles'
import { useAuthCopy } from '@/features/auth/copy'
import { useMounted } from '@/shared/hooks/use-mounted'
import { UserAvatar } from '@/shared/components/sidebar/UserAvatar'
import { ProfileForm } from './ProfileForm'

export function ProfileRoute() {
  const mounted = useMounted()
  const copy = useAuthCopy()
  const { user } = useAuth()
  const { data: profile } = useProfile()

  const email = user?.email ?? ''
  const displayName = profile?.displayName ?? ''

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{copy.profile.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{copy.profile.subtitle}</p>
      </header>

      <Card className="mb-6 flex items-center gap-4 p-4">
        {mounted ? (
          <UserAvatar size="md" />
        ) : (
          <Skeleton className="h-10 w-10 rounded-full" />
        )}
        <div className="min-w-0 flex-1">
          <p
            data-testid="profile-display-name"
            className="truncate text-sm font-medium"
          >
            {displayName || email || '—'}
          </p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
      </Card>

      <ProfileForm />
    </div>
  )
}
