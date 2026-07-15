export interface ProfileFormState {
  displayName: string
  avatarUrl: string
  phone: string
  linkedinUrl: string
  githubUrl: string
  portfolioUrl: string
}

export interface ExtraFieldConfig {
  key: keyof Pick<ProfileFormState, 'phone' | 'linkedinUrl' | 'githubUrl' | 'portfolioUrl'>
  label: string
  placeholder: string
  type: string
  autoComplete: string
  /** Display-only transform (e.g. phone mask) */
  format?: (raw: string) => string
  /** Sanitize on change before storing raw value (e.g. strip non-digits) */
  sanitize?: (raw: string) => string
}
