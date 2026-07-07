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
 *
 * Uses the idiomatic Tailwind v4 arbitrary-value syntax: `bg-[<color>]`
 * and `text-[<color>]` (the `bg-` / `text-` prefix maps to
 * background-color and color respectively). Equivalent to the
 * explicit `[background-color:…]` / `[color:…]` syntax but shorter
 * and consistent with the rest of the codebase.
 */
export const statusTokens: Record<'saved' | 'applied' | 'interviewing' | 'rejected' | 'offer', StatusToken> = {
  saved: {
    bg: 'bg-[hsl(var(--status-saved-bg))]',
    text: 'text-[hsl(var(--status-saved-fg))]',
    label: 'Saved',
  },
  applied: {
    bg: 'bg-[hsl(var(--status-applied-bg))]',
    text: 'text-[hsl(var(--status-applied-fg))]',
    label: 'Applied',
  },
  interviewing: {
    bg: 'bg-[hsl(var(--status-interviewing-bg))]',
    text: 'text-[hsl(var(--status-interviewing-fg))]',
    label: 'Interviewing',
  },
  rejected: {
    bg: 'bg-[hsl(var(--status-rejected-bg))]',
    text: 'text-[hsl(var(--status-rejected-fg))]',
    label: 'Rejected',
  },
  offer: {
    bg: 'bg-[hsl(var(--status-offer-bg))]',
    text: 'text-[hsl(var(--status-offer-fg))]',
    label: 'Offer',
  },
}

export type TagKind = 'workMode' | 'employment' | 'seniority'
export type TagToken = { bg: string; text: string }

export const tagTokens: Record<TagKind, Record<string, TagToken>> = {
  workMode: {
    Remote: {
      bg: 'bg-[hsl(var(--tag-workMode-Remote-bg))]',
      text: 'text-[hsl(var(--tag-workMode-Remote-fg))]',
    },
    Hybrid: {
      bg: 'bg-[hsl(var(--tag-workMode-Hybrid-bg))]',
      text: 'text-[hsl(var(--tag-workMode-Hybrid-fg))]',
    },
    'On-site': {
      bg: 'bg-[hsl(var(--tag-workMode-Onsite-bg))]',
      text: 'text-[hsl(var(--tag-workMode-Onsite-fg))]',
    },
  },
  employment: {
    'Full-time': {
      bg: 'bg-[hsl(var(--tag-employment-FullTime-bg))]',
      text: 'text-[hsl(var(--tag-employment-FullTime-fg))]',
    },
    'Part-time': {
      bg: 'bg-[hsl(var(--tag-employment-PartTime-bg))]',
      text: 'text-[hsl(var(--tag-employment-PartTime-fg))]',
    },
    Contract: {
      bg: 'bg-[hsl(var(--tag-employment-Contract-bg))]',
      text: 'text-[hsl(var(--tag-employment-Contract-fg))]',
    },
    Freelance: {
      bg: 'bg-[hsl(var(--tag-employment-Freelance-bg))]',
      text: 'text-[hsl(var(--tag-employment-Freelance-fg))]',
    },
    Internship: {
      bg: 'bg-[hsl(var(--tag-employment-Internship-bg))]',
      text: 'text-[hsl(var(--tag-employment-Internship-fg))]',
    },
  },
  seniority: {
    Junior: {
      bg: 'bg-[hsl(var(--tag-seniority-Junior-bg))]',
      text: 'text-[hsl(var(--tag-seniority-Junior-fg))]',
    },
    Mid: {
      bg: 'bg-[hsl(var(--tag-seniority-Mid-bg))]',
      text: 'text-[hsl(var(--tag-seniority-Mid-fg))]',
    },
    Senior: {
      bg: 'bg-[hsl(var(--tag-seniority-Senior-bg))]',
      text: 'text-[hsl(var(--tag-seniority-Senior-fg))]',
    },
    Staff: {
      bg: 'bg-[hsl(var(--tag-seniority-Staff-bg))]',
      text: 'text-[hsl(var(--tag-seniority-Staff-fg))]',
    },
    Principal: {
      bg: 'bg-[hsl(var(--tag-seniority-Principal-bg))]',
      text: 'text-[hsl(var(--tag-seniority-Principal-fg))]',
    },
  },
}

export const tagFallback: TagToken = {
  bg: 'bg-[hsl(var(--tag-fallback-bg))]',
  text: 'text-[hsl(var(--tag-fallback-fg))]',
}

export function statusToken(status: keyof typeof statusTokens): StatusToken {
  return statusTokens[status]
}

export function tagToken(kind: TagKind, value: string): TagToken {
  return tagTokens[kind][value] ?? tagFallback
}
