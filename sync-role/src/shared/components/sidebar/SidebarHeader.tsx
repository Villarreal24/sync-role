import { useState } from 'react'
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
        <CollapsedHeader onToggle={toggle} />
      ) : (
        <ExpandedHeader onToggle={toggle} />
      )}
    </div>
  )
}

function CollapsedHeader({ onToggle }: { onToggle: () => void }) {
  // Conditional render instead of CSS group-hover swap: the SyncRoleLogo
  // wraps the SVG in a background container, so a CSS hide on the inner
  // SVG still leaves the white box visible. With state we can swap the
  // whole node (background and all) in a single render.
  const [isHovered, setIsHovered] = useState(false)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onToggle}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onFocus={() => setIsHovered(true)}
          onBlur={() => setIsHovered(false)}
          aria-label="Open sidebar"
          data-testid="sidebar-collapse-toggle"
          className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent"
        >
          {isHovered ? (
            <PanelLeftOpen className="h-5 w-5 text-muted-foreground" />
          ) : (
            <SyncRoleLogo size="sm" withBackground ariaLabel="Sync Role" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right">Open sidebar</TooltipContent>
    </Tooltip>
  )
}

function ExpandedHeader({ onToggle }: { onToggle: () => void }) {
  return (
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
            onClick={onToggle}
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
  )
}
