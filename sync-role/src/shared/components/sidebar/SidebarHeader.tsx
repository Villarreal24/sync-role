import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/components/ui/tooltip'
import { Button } from '@/shared/components/ui/button'
import { SyncRoleLogo } from '@/shared/components/brand/SyncRoleLogo'
import { useSidebarStore } from '@/shared/store/sidebar.store'
import { cn } from '@/shared/lib/utils'

export function SidebarHeader() {
  const collapsed = useSidebarStore((s) => s.collapsed)
  const toggle = useSidebarStore((s) => s.toggle)

  return (
    <div
      className={cn(
        'flex h-16 items-center border-b border-border px-3',
        collapsed ? 'justify-center' : 'justify-between gap-2',
      )}
    >
      <div className={cn('flex items-center gap-2', collapsed && 'hidden')}>
        <SyncRoleLogo size="md" withBackground ariaLabel="Sync Role" />
        <span className="text-base font-semibold tracking-tight">Sync Role</span>
      </div>

      <div className={cn(collapsed && 'block', !collapsed && 'hidden')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label="Open sidebar"
              className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <PanelLeftOpen className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Open sidebar</TooltipContent>
        </Tooltip>
      </div>

      <div className={cn(!collapsed && 'block', collapsed && 'hidden')}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Close sidebar"
              className="text-muted-foreground"
            >
              <PanelLeftClose className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Close sidebar</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
