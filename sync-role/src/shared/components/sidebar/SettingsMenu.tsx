import { Check, KeyRound } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'
import { Settings } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { useLocale, type Locale } from '@/shared/copy/locale'
import { useSidebarCopy } from './copy'

interface SettingsMenuProps {
  collapsed: boolean
}

/**
 * Settings dropdown attached to the sidebar footer.
 *
 * Today: language switcher (English / Español) + a disabled
 * "AI Provider" placeholder for the future feature that lets the
 * user pick which LLM scrapes their job postings.
 *
 * Why AI Provider and not "API Keys": the BE already names this
 * setting `llm_provider` (config.py), so the FE label matches the
 * domain vocabulary. The user-facing description is "Proveedor de
 * IA" in ES.
 */
export function SettingsMenu({ collapsed }: SettingsMenuProps) {
  const copy = useSidebarCopy()
  const { locale, setLocale } = useLocale()

  const switchTo = (l: Locale) => () => setLocale(l)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            'w-full justify-start gap-3 text-muted-foreground',
            collapsed && 'justify-center px-0',
          )}
          aria-label={copy.footer.settingsAria}
          data-testid="sidebar-settings-trigger"
        >
          <Settings className="h-4 w-4" />
          <span className={cn(collapsed && 'hidden')}>{copy.footer.settings}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {copy.footer.settings}
        </DropdownMenuLabel>

        <DropdownMenuItem onSelect={switchTo('en')}>
          <span className="flex-1">{copy.settingsMenu.english}</span>
          {locale === 'en' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem onSelect={switchTo('es')}>
          <span className="flex-1">{copy.settingsMenu.spanish}</span>
          {locale === 'es' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem disabled>
          <KeyRound className="h-4 w-4" />
          <span className="flex-1">{copy.settingsMenu.aiProvider}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
