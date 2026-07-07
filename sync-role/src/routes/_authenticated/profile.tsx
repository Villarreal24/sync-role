import { createFileRoute } from '@tanstack/react-router'
import { ProfileForm } from '@/features/auth/components/ProfileForm'
import { Card } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMounted } from '@/shared/hooks/use-mounted'
import { UserAvatar } from '@/shared/components/sidebar/UserAvatar'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfileRoute,
})

export function ProfileRoute() {
  const mounted = useMounted()
  const email = useAuthStore((s) => s.user?.email ?? '')
  const displayName = useMounted()
    ? useAuthStore.getState().user?.displayName ?? ''
    : ''

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update how you appear in the app.
        </p>
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
