export const spacing = {
  field: 'space-y-4',
  fieldLabel: 'mb-1',
  inputPad: 'px-3 py-2',
  buttonPad: 'w-full py-2 px-4',
  helperTop: 'mt-1',
  buttonGroup: 'gap-2.5',
  cardFooter: 'px-3 pt-2.5 pb-2',
  tableCell: 'py-3 align-top',
  tableEmpty: 'py-12',
  section: 'gap-6',
} as const

export const fontSize = {
  title: 'text-xl font-semibold',
  label: 'text-sm font-medium',
  body: 'text-sm',
  error: 'text-sm',
  muted: 'text-sm',
  caption: 'text-xs',
} as const

export const radius = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const

export const color = {
  bg: 'bg-background',
  fg: 'text-foreground',
  muted: 'text-muted-foreground',
  border: 'border-border',
  card: 'bg-card text-card-foreground',
  popover: 'bg-popover text-popover-foreground',
  input: 'bg-input',
} as const

export type StatusToken = {
  bg: string
  text: string
  label: string
}

/**
 * Status and tag tokens reference CSS vars defined in styles/tokens.css.
 *
 * The class strings MUST be inlined as full string literals (not
 * composed via a helper at runtime) so that Tailwind v4's content
 * scanner sees the complete class name. If the scanner can't find
 * the literal, it never emits the utility and the badge renders
 * transparent over the card background.
 */
export const statusTokens: Record<'saved' | 'applied' | 'interviewing' | 'rejected' | 'offer', StatusToken> = {
  saved: {
    bg: '[background-color:hsl(var(--status-saved-bg))]',
    text: '[color:hsl(var(--status-saved-fg))]',
    label: 'Saved',
  },
  applied: {
    bg: '[background-color:hsl(var(--status-applied-bg))]',
    text: '[color:hsl(var(--status-applied-fg))]',
    label: 'Applied',
  },
  interviewing: {
    bg: '[background-color:hsl(var(--status-interviewing-bg))]',
    text: '[color:hsl(var(--status-interviewing-fg))]',
    label: 'Interviewing',
  },
  rejected: {
    bg: '[background-color:hsl(var(--status-rejected-bg))]',
    text: '[color:hsl(var(--status-rejected-fg))]',
    label: 'Rejected',
  },
  offer: {
    bg: '[background-color:hsl(var(--status-offer-bg))]',
    text: '[color:hsl(var(--status-offer-fg))]',
    label: 'Offer',
  },
}

export type TagKind = 'workMode' | 'employment' | 'seniority'
export type TagToken = { bg: string; text: string }

export const tagTokens: Record<TagKind, Record<string, TagToken>> = {
  workMode: {
    Remote: {
      bg: '[background-color:hsl(var(--tag-workMode-Remote-bg))]',
      text: '[color:hsl(var(--tag-workMode-Remote-fg))]',
    },
    Hybrid: {
      bg: '[background-color:hsl(var(--tag-workMode-Hybrid-bg))]',
      text: '[color:hsl(var(--tag-workMode-Hybrid-fg))]',
    },
    'On-site': {
      bg: '[background-color:hsl(var(--tag-workMode-Onsite-bg))]',
      text: '[color:hsl(var(--tag-workMode-Onsite-fg))]',
    },
  },
  employment: {
    'Full-time': {
      bg: '[background-color:hsl(var(--tag-employment-FullTime-bg))]',
      text: '[color:hsl(var(--tag-employment-FullTime-fg))]',
    },
    'Part-time': {
      bg: '[background-color:hsl(var(--tag-employment-PartTime-bg))]',
      text: '[color:hsl(var(--tag-employment-PartTime-fg))]',
    },
    Contract: {
      bg: '[background-color:hsl(var(--tag-employment-Contract-bg))]',
      text: '[color:hsl(var(--tag-employment-Contract-fg))]',
    },
    Freelance: {
      bg: '[background-color:hsl(var(--tag-employment-Freelance-bg))]',
      text: '[color:hsl(var(--tag-employment-Freelance-fg))]',
    },
    Internship: {
      bg: '[background-color:hsl(var(--tag-employment-Internship-bg))]',
      text: '[color:hsl(var(--tag-employment-Internship-fg))]',
    },
  },
  seniority: {
    Junior: {
      bg: '[background-color:hsl(var(--tag-seniority-Junior-bg))]',
      text: '[color:hsl(var(--tag-seniority-Junior-fg))]',
    },
    Mid: {
      bg: '[background-color:hsl(var(--tag-seniority-Mid-bg))]',
      text: '[color:hsl(var(--tag-seniority-Mid-fg))]',
    },
    Senior: {
      bg: '[background-color:hsl(var(--tag-seniority-Senior-bg))]',
      text: '[color:hsl(var(--tag-seniority-Senior-fg))]',
    },
    Staff: {
      bg: '[background-color:hsl(var(--tag-seniority-Staff-bg))]',
      text: '[color:hsl(var(--tag-seniority-Staff-fg))]',
    },
    Principal: {
      bg: '[background-color:hsl(var(--tag-seniority-Principal-bg))]',
      text: '[color:hsl(var(--tag-seniority-Principal-fg))]',
    },
  },
}

export const tagFallback: TagToken = {
  bg: '[background-color:hsl(var(--tag-fallback-bg))]',
  text: '[color:hsl(var(--tag-fallback-fg))]',
}

export function statusToken(status: keyof typeof statusTokens): StatusToken {
  return statusTokens[status]
}

export function tagToken(kind: TagKind, value: string): TagToken {
  return tagTokens[kind][value] ?? tagFallback
}
