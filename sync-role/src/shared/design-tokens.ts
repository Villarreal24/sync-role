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

function hslVar(name: string): string {
  return `hsl(var(${name}))`
}

function bgVar(name: string): string {
  return `[background-color:${hslVar(name)}]`
}

function textVar(name: string): string {
  return `[color:${hslVar(name)}]`
}

export const statusTokens: Record<'saved' | 'applied' | 'interviewing' | 'rejected' | 'offer', StatusToken> = {
  saved: {
    bg: bgVar('--status-saved-bg'),
    text: textVar('--status-saved-fg'),
    label: 'Saved',
  },
  applied: {
    bg: bgVar('--status-applied-bg'),
    text: textVar('--status-applied-fg'),
    label: 'Applied',
  },
  interviewing: {
    bg: bgVar('--status-interviewing-bg'),
    text: textVar('--status-interviewing-fg'),
    label: 'Interviewing',
  },
  rejected: {
    bg: bgVar('--status-rejected-bg'),
    text: textVar('--status-rejected-fg'),
    label: 'Rejected',
  },
  offer: {
    bg: bgVar('--status-offer-bg'),
    text: textVar('--status-offer-fg'),
    label: 'Offer',
  },
}

export type TagKind = 'workMode' | 'employment' | 'seniority'
export type TagToken = { bg: string; text: string }

function normalizeTagValue(value: string): string {
  return value.replace(/-/g, '')
}

function tagVarKey(kind: TagKind, value: string): string {
  return `--tag-${kind}-${normalizeTagValue(value)}`
}

function tagTokenFor(kind: TagKind, value: string): TagToken {
  return {
    bg: bgVar(`${tagVarKey(kind, value)}-bg`),
    text: textVar(`${tagVarKey(kind, value)}-fg`),
  }
}

export const tagTokens: Record<TagKind, Record<string, TagToken>> = {
  workMode: {
    Remote: tagTokenFor('workMode', 'Remote'),
    Hybrid: tagTokenFor('workMode', 'Hybrid'),
    'On-site': tagTokenFor('workMode', 'On-site'),
  },
  employment: {
    'Full-time': tagTokenFor('employment', 'Full-time'),
    'Part-time': tagTokenFor('employment', 'Part-time'),
    Contract: tagTokenFor('employment', 'Contract'),
    Freelance: tagTokenFor('employment', 'Freelance'),
    Internship: tagTokenFor('employment', 'Internship'),
  },
  seniority: {
    Junior: tagTokenFor('seniority', 'Junior'),
    Mid: tagTokenFor('seniority', 'Mid'),
    Senior: tagTokenFor('seniority', 'Senior'),
    Staff: tagTokenFor('seniority', 'Staff'),
    Principal: tagTokenFor('seniority', 'Principal'),
  },
}

export const tagFallback: TagToken = {
  bg: bgVar('--tag-fallback-bg'),
  text: textVar('--tag-fallback-fg'),
}

export function statusToken(status: keyof typeof statusTokens): StatusToken {
  return statusTokens[status]
}

export function tagToken(kind: TagKind, value: string): TagToken {
  return tagTokens[kind][value] ?? tagFallback
}
