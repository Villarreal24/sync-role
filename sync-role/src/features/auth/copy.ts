import type { Locale } from '@/shared/copy/locale'
import { useLocale } from '@/shared/copy/locale'
import { COMMON_COPY_EN, COMMON_COPY_ES, type CommonCopy } from '@/shared/copy/common'

export interface AuthCopy {
  common: {
    email: string
    password: string
    signIn: string
  }
  login: {
    title: string
    emailPlaceholder: string
    passwordPlaceholder: string
    pendingLabel: string
    noAccount: string
    registerCta: string
  }
  register: {
    title: string
    emailPlaceholder: string
    passwordPlaceholder: string
    confirmPassword: string
    confirmPlaceholder: string
    pendingLabel: string
    haveAccount: string
    signInCta: string
  }
  authPage: {
    welcomeBack: string
    createYourAccount: string
    orContinueWith: string
  }
  google: {
    redirecting: string
    signInWith: string
  }
  profile: {
    title: string
    subtitle: string
    sectionTitle: string
    sectionDescription: string
    displayNameLabel: string
    displayNamePlaceholder: string
    avatarUrlLabel: string
    avatarUrlPlaceholder: string
    avatarUrlHint: string
    avatarAlt: string
    save: string
    saving: string
    saved: string
  }
}

function makeAuthCopy(common: CommonCopy): AuthCopy {
  return {
    common: {
      email: common.email,
      password: common.password,
      signIn: common.signIn,
    },
    login: {
      title: common.signIn,
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: 'Enter your password',
      pendingLabel: 'Signing in…',
      noAccount: common.youHaveNoAccount,
      registerCta: common.register,
    },
    register: {
      title: common.createAccount,
      emailPlaceholder: 'you@example.com',
      passwordPlaceholder: 'At least 8 characters',
      confirmPassword: 'Confirm Password',
      confirmPlaceholder: 'Repeat your password',
      pendingLabel: 'Creating account…',
      haveAccount: common.alreadyHaveAccount,
      signInCta: common.signIn,
    },
    authPage: {
      welcomeBack: 'Welcome back',
      createYourAccount: 'Create your account',
      orContinueWith: 'or continue with',
    },
    google: {
      redirecting: 'Redirecting…',
      signInWith: 'Sign in with Google',
    },
    profile: {
      title: 'Profile',
      subtitle: 'Update how you appear in the app.',
      sectionTitle: 'Profile picture',
      sectionDescription:
        'Paste an image URL below. The avatar is shown in the sidebar and next to your name.',
      displayNameLabel: 'Display name',
      displayNamePlaceholder: 'Your name',
      avatarUrlLabel: 'Avatar URL',
      avatarUrlPlaceholder: 'https://example.com/avatar.png',
      avatarUrlHint: 'Leave empty to show your initials instead.',
      avatarAlt: 'Avatar preview',
      save: 'Save changes',
      saving: 'Saving…',
      saved: 'Profile updated',
    },
  }
}

function makeAuthCopyEs(common: CommonCopy): AuthCopy {
  return {
    common: {
      email: common.email,
      password: common.password,
      signIn: common.signIn,
    },
    login: {
      title: common.signIn,
      emailPlaceholder: 'tu@ejemplo.com',
      passwordPlaceholder: 'Ingresa tu contraseña',
      pendingLabel: 'Iniciando sesión…',
      noAccount: common.youHaveNoAccount,
      registerCta: common.register,
    },
    register: {
      title: common.createAccount,
      emailPlaceholder: 'tu@ejemplo.com',
      passwordPlaceholder: 'Mínimo 8 caracteres',
      confirmPassword: 'Confirmar contraseña',
      confirmPlaceholder: 'Repite tu contraseña',
      pendingLabel: 'Creando cuenta…',
      haveAccount: common.alreadyHaveAccount,
      signInCta: common.signIn,
    },
    authPage: {
      welcomeBack: 'Bienvenido de vuelta',
      createYourAccount: 'Crea tu cuenta',
      orContinueWith: 'o continúa con',
    },
    google: {
      redirecting: 'Redirigiendo…',
      signInWith: 'Iniciar sesión con Google',
    },
    profile: {
      title: 'Perfil',
      subtitle: 'Actualiza cómo apareces en la app.',
      sectionTitle: 'Foto de perfil',
      sectionDescription:
        'Pega una URL de imagen abajo. El avatar se muestra en la barra lateral y junto a tu nombre.',
      displayNameLabel: 'Nombre para mostrar',
      displayNamePlaceholder: 'Tu nombre',
      avatarUrlLabel: 'URL del avatar',
      avatarUrlPlaceholder: 'https://ejemplo.com/avatar.png',
      avatarUrlHint: 'Déjalo vacío para mostrar tus iniciales.',
      avatarAlt: 'Vista previa del avatar',
      save: 'Guardar cambios',
      saving: 'Guardando…',
      saved: 'Perfil actualizado',
    },
  }
}

const TABLE: Record<Locale, AuthCopy> = {
  en: makeAuthCopy(COMMON_COPY_EN),
  es: makeAuthCopyEs(COMMON_COPY_ES),
}

export function useAuthCopy(): AuthCopy {
  const { locale } = useLocale()
  return TABLE[locale]
}
