import { LayoutGrid, Briefcase } from 'lucide-react'
import { Link, useMatchRoute } from '@tanstack/react-router'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { useSidebarStore } from '@/shared/store/sidebar.store'
import { useSidebarCopy } from './copy'
import { cn } from '@/shared/lib/utils'

interface SidebarNavItemProps {
  to: '/' | '/applications'
  label: string
  icon: React.ReactNode
}

export function SidebarNavItem({ to, label, icon }: SidebarNavItemProps) {
  const collapsed = useSidebarStore((s) => s.collapsed)
  const matchRoute = useMatchRoute()
  const isActive = Boolean(matchRoute({ to, fuzzy: to !== '/' }))

  const content = (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-accent text-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
        collapsed && 'justify-center px-0',
      )}
    >
      <span className="flex h-5 w-5 items-center justify-center">{icon}</span>
      <span className={cn(collapsed && 'hidden')}>{label}</span>
    </Link>
  )

  if (!collapsed) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  )
}

export function SidebarNav() {
  const copy = useSidebarCopy()
  return (
    <nav className="flex-1 space-y-1 px-2 py-4">
      <SidebarNavItem to="/" label={copy.nav.overview} icon={<LayoutGrid className="h-4 w-4" />} />
      <SidebarNavItem
        to="/applications"
        label={copy.nav.applications}
        icon={<Briefcase className="h-4 w-4" />}
      />
    </nav>
  )
}
