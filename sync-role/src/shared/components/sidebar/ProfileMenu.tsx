import { Monitor, Moon, Sun, LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useThemeStore } from '@/features/theme/theme.store'
import { useSidebarCopy } from './copy'

interface ProfileMenuProps {
  children: React.ReactNode
}

export function ProfileMenu({ children }: ProfileMenuProps) {
  const copy = useSidebarCopy()
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogOut = () => {
    // logout() already navigates to /auth (with replace: true) after
    // clearing the session. No need to navigate again here.
    void logout()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            navigate({ to: '/profile' })
          }}
        >
          <UserIcon className="h-4 w-4" />
          {copy.menu.profile}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="h-4 w-4" />
            {copy.menu.theme}
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onSelect={() => setTheme('system')}
                className={theme === 'system' ? 'bg-accent text-accent-foreground' : ''}
              >
                <Monitor className="h-4 w-4" />
                {copy.menu.system}
                {theme === 'system' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTheme('light')}
                className={theme === 'light' ? 'bg-accent text-accent-foreground' : ''}
              >
                <Sun className="h-4 w-4" />
                {copy.menu.light}
                {theme === 'light' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setTheme('dark')}
                className={theme === 'dark' ? 'bg-accent text-accent-foreground' : ''}
              >
                <Moon className="h-4 w-4" />
                {copy.menu.dark}
                {theme === 'dark' && <span className="ml-auto text-xs">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
            void handleLogOut()
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          {copy.menu.logOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
