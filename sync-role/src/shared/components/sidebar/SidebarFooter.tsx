import { MoreVertical } from 'lucide-react'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { useMounted } from '@/shared/hooks/use-mounted'
import { UserAvatar } from './UserAvatar'
import { ProfileMenu } from './ProfileMenu'
import { SettingsMenu } from './SettingsMenu'
import { useSidebarStore } from '@/shared/store/sidebar.store'
import { useSidebarCopy } from './copy'
import { cn } from '@/shared/lib/utils'

export function SidebarFooter() {
  // SSR safety: until mounted, ignore the auth store (server has no
  // user because getCookie() returns null outside the browser) so the
  // server and first client render produce the same DOM.
  const copy = useSidebarCopy()
  const mounted = useMounted()
  const user = useAuthStore((s) => s.user)
  const collapsed = useSidebarStore((s) => s.collapsed)
  const email = mounted ? (user?.email ?? '') : ''
  const displayName = mounted ? (user?.displayName ?? '') : ''

  return (
    <div className="border-t border-border p-2">
      <div className={cn('space-y-1', collapsed && 'space-y-2')}>
        <SettingsMenu collapsed={collapsed} />

        <ProfileMenu>
          <button
            type="button"
            className={cn(
              'flex w-full cursor-pointer items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-accent',
              collapsed && 'justify-center',
            )}
            aria-label={copy.footer.openProfileMenu}
          >
            <UserAvatar size="sm" />
            <div className={cn('min-w-0 flex-1', collapsed && 'hidden')}>
              <div className="truncate text-sm font-medium">
                {displayName || email || copy.footer.userFallback}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {displayName ? email : copy.footer.brandFallback}
              </div>
            </div>
            <MoreVertical
              className={cn('h-4 w-4 text-muted-foreground', collapsed && 'hidden')}
            />
          </button>
        </ProfileMenu>
      </div>
    </div>
  )
}
