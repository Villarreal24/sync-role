import type { Locale } from './locale'
import { useLocale } from './locale'

/**
 * Common copy shared across multiple modules. Module-specific
 * copy files compose the values they need from here (e.g. the
 * Overview's "error.retry" key sources from COMMON_COPY.retry) so
 * that translating the common string to Spanish propagates to every
 * caller without re-touching every module.
 */
export interface CommonCopy {
  retry: string
  save: string
  cancel: string
  loading: string
  or: string
  search: string
  open: string
  close: string
  settings: string
  profile: string
  email: string
  password: string
  youHaveNoAccount: string
  alreadyHaveAccount: string
  signIn: string
  signUp: string
  createAccount: string
  register: string
  empty: { noData: string }
  error: { default: string }
}

const EN: CommonCopy = {
  retry: 'Retry',
  save: 'Save',
  cancel: 'Cancel',
  loading: 'Loading…',
  or: 'or',
  search: 'Search',
  open: 'Open',
  close: 'Close',
  settings: 'Settings',
  profile: 'Profile',
  email: 'Email',
  password: 'Password',
  youHaveNoAccount: "Don't have an account?",
  alreadyHaveAccount: 'Already have an account?',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  createAccount: 'Create Account',
  register: 'Register',
  empty: { noData: 'No data yet.' },
  error: { default: 'Please try again in a moment.' },
}

const ES: CommonCopy = {
  retry: 'Reintentar',
  save: 'Guardar',
  cancel: 'Cancelar',
  loading: 'Cargando…',
  or: 'o',
  search: 'Buscar',
  open: 'Abrir',
  close: 'Cerrar',
  settings: 'Configuración',
  profile: 'Perfil',
  email: 'Correo',
  password: 'Contraseña',
  youHaveNoAccount: '¿No tienes una cuenta?',
  alreadyHaveAccount: '¿Ya tienes una cuenta?',
  signIn: 'Iniciar sesión',
  signUp: 'Registrarse',
  createAccount: 'Crear cuenta',
  register: 'Registrarse',
  empty: { noData: 'Sin datos aún.' },
  error: { default: 'Inténtalo de nuevo en un momento.' },
}

export const COMMON_COPY_EN = EN
export const COMMON_COPY_ES = ES

const TABLE: Record<Locale, CommonCopy> = { en: EN, es: ES }

export function useCommonCopy(): CommonCopy {
  const { locale } = useLocale()
  return TABLE[locale]
}
