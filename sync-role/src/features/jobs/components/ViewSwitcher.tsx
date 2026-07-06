import { LayoutGrid, List } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/shared/components/ui/toggle-group'
import { fontSize } from '@/shared/design-tokens'
import { cn } from '@/shared/lib/utils'

export type JobView = 'board' | 'list'

interface ViewSwitcherProps {
  value: JobView
  onChange: (value: JobView) => void
}

export function ViewSwitcher({ value, onChange }: ViewSwitcherProps) {
  return (
    <ToggleGroup
      type="single"
      size="sm"
      value={value}
      onValueChange={(v) => {
        if (v === 'board' || v === 'list') onChange(v)
      }}
      className="bg-muted border-border p-0.5"
    >
      <ToggleGroupItem
        value="board"
        aria-label="Board view"
        className={cn(
          'data-[state=on]:bg-foreground data-[state=on]:text-background text-muted-foreground hover:bg-foreground/10 hover:text-foreground px-2.5 h-7 gap-1.5',
          fontSize.caption,
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        aria-label="List view"
        className={cn(
          'data-[state=on]:bg-foreground data-[state=on]:text-background text-muted-foreground hover:bg-foreground/10 hover:text-foreground px-2.5 h-7 gap-1.5',
          fontSize.caption,
        )}
      >
        <List className="h-3.5 w-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
