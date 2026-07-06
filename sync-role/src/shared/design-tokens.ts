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

export const statusTokens: Record<'saved' | 'applied' | 'interviewing' | 'rejected' | 'offer', StatusToken> = {
  saved: {
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-700 dark:text-zinc-300',
    label: 'Saved',
  },
  applied: {
    bg: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-700 dark:text-blue-200',
    label: 'Applied',
  },
  interviewing: {
    bg: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-700 dark:text-amber-200',
    label: 'Interviewing',
  },
  rejected: {
    bg: 'bg-red-100 dark:bg-red-900',
    text: 'text-red-700 dark:text-red-200',
    label: 'Rejected',
  },
  offer: {
    bg: 'bg-emerald-100 dark:bg-emerald-900',
    text: 'text-emerald-700 dark:text-emerald-200',
    label: 'Offer',
  },
}

export type TagKind = 'workMode' | 'employment' | 'seniority'
export type TagToken = { bg: string; text: string }

export const tagTokens: Record<TagKind, Record<string, TagToken>> = {
  workMode: {
    Remote: { bg: 'bg-cyan-100 dark:bg-cyan-900', text: 'text-cyan-700 dark:text-cyan-200' },
    Hybrid: { bg: 'bg-violet-100 dark:bg-violet-900', text: 'text-violet-700 dark:text-violet-200' },
    'On-site': { bg: 'bg-orange-100 dark:bg-orange-900', text: 'text-orange-700 dark:text-orange-200' },
  },
  employment: {
    'Full-time': { bg: 'bg-emerald-100 dark:bg-emerald-900', text: 'text-emerald-700 dark:text-emerald-200' },
    'Part-time': { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-700 dark:text-yellow-200' },
    Contract: { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-700 dark:text-red-200' },
    Freelance: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-200' },
    Internship: { bg: 'bg-pink-100 dark:bg-pink-900', text: 'text-pink-700 dark:text-pink-200' },
  },
  seniority: {
    Junior: { bg: 'bg-green-100 dark:bg-green-900', text: 'text-green-700 dark:text-green-200' },
    Mid: { bg: 'bg-blue-100 dark:bg-blue-900', text: 'text-blue-700 dark:text-blue-200' },
    Senior: { bg: 'bg-amber-100 dark:bg-amber-900', text: 'text-amber-700 dark:text-amber-200' },
    Staff: { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-700 dark:text-purple-200' },
    Principal: { bg: 'bg-rose-100 dark:bg-rose-900', text: 'text-rose-700 dark:text-rose-200' },
  },
}

export const tagFallback: TagToken = {
  bg: 'bg-zinc-100 dark:bg-zinc-800',
  text: 'text-zinc-600 dark:text-zinc-300',
}

export function statusToken(status: keyof typeof statusTokens): StatusToken {
  return statusTokens[status]
}

export function tagToken(kind: TagKind, value: string): TagToken {
  return tagTokens[kind][value] ?? tagFallback
}
