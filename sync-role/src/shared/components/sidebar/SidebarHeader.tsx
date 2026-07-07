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
      {collapsed ? (
        // Collapsed: show the brand logo by default. On hover, swap to
        // the "open sidebar" chevron. The whole area is a single
        // button so clicking anywhere (logo or chevron) expands.
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={toggle}
              aria-label="Open sidebar"
              data-testid="sidebar-collapse-toggle"
              className="group flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
            >
              <SyncRoleLogo
                size="sm"
                withBackground
                className="group-hover:hidden"
                ariaLabel="Sync Role"
              />
              <PanelLeftOpen className="hidden h-5 w-5 text-muted-foreground group-hover:block group-hover:text-foreground" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Open sidebar</TooltipContent>
        </Tooltip>
      ) : (
        // Expanded: brand on the left, close button on the right.
        <>
          <div className="flex items-center gap-2">
            <SyncRoleLogo size="md" withBackground ariaLabel="Sync Role" />
            <span className="text-base font-semibold tracking-tight">Sync Role</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggle}
                aria-label="Close sidebar"
                data-testid="sidebar-collapse-toggle"
                className="text-muted-foreground"
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Close sidebar</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  )
}
