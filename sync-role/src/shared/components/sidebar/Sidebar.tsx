import { SidebarHeader } from './SidebarHeader'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter } from './SidebarFooter'
import { useSidebarStore } from '@/shared/store/sidebar.store'
import { cn } from '@/shared/lib/utils'

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed)

  return (
    <aside
      className={cn(
        'sticky top-0 flex h-screen flex-col border-r border-border bg-card transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-60',
      )}
      aria-label="Primary"
    >
      <SidebarHeader />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  )
}
