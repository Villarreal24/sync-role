import type { Locale } from '@/shared/copy/locale'
import { useLocale } from '@/shared/copy/locale'
import { COMMON_COPY_EN, COMMON_COPY_ES, type CommonCopy } from '@/shared/copy/common'

export interface SidebarCopy {
  header: { openSidebar: string; closeSidebar: string }
  footer: {
    settings: string
    settingsAria: string
    openProfileMenu: string
    userFallback: string
    brandFallback: string
  }
  nav: { overview: string; applications: string }
  menu: {
    profile: string
    theme: string
    system: string
    light: string
    dark: string
    logOut: string
  }
  settingsMenu: {
    english: string
    spanish: string
    aiProvider: string
  }
}

function makeSidebarCopy(common: CommonCopy): SidebarCopy {
  return {
    header: { openSidebar: 'Open sidebar', closeSidebar: 'Close sidebar' },
    footer: {
      settings: common.settings,
      settingsAria: common.settings,
      openProfileMenu: 'Open profile menu',
      userFallback: 'User',
      // "Sync Role" is the brand name — it stays as-is in every
      // language. Falling back to it is more honest than a localized
      // translation.
      brandFallback: 'Sync Role',
    },
    nav: { overview: 'Overview', applications: 'Applications' },
    menu: {
      profile: common.profile,
      theme: 'Theme',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
      logOut: 'Log out',
    },
    settingsMenu: {
      english: 'English',
      spanish: 'Español',
      aiProvider: 'AI Provider',
    },
  }
}

function makeSidebarCopyEs(common: CommonCopy): SidebarCopy {
  return {
    header: { openSidebar: 'Abrir barra lateral', closeSidebar: 'Cerrar barra lateral' },
    footer: {
      settings: common.settings,
      settingsAria: common.settings,
      openProfileMenu: 'Abrir menú de perfil',
      userFallback: 'Usuario',
      brandFallback: 'Sync Role',
    },
    nav: { overview: 'Resumen', applications: 'Postulaciones' },
    menu: {
      profile: common.profile,
      theme: 'Tema',
      system: 'Sistema',
      light: 'Claro',
      dark: 'Oscuro',
      logOut: 'Cerrar sesión',
    },
    settingsMenu: {
      english: 'English',
      spanish: 'Español',
      aiProvider: 'Proveedor de IA',
    },
  }
}

const TABLE: Record<Locale, SidebarCopy> = {
  en: makeSidebarCopy(COMMON_COPY_EN),
  es: makeSidebarCopyEs(COMMON_COPY_ES),
}

export function useSidebarCopy(): SidebarCopy {
  const { locale } = useLocale()
  return TABLE[locale]
}
