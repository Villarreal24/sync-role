export interface FormattedDate {
  display: string
  full: string | null
  isExact: boolean
}

const EMPTY: FormattedDate = { display: '—', full: null, isExact: false }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function formatPublishDate(value: string | undefined | null): FormattedDate {
  if (!value) return EMPTY

  let date: Date | null = null

  if (ISO_DATE_RE.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    date = new Date(year, month - 1, day)
  } else {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
      date = parsed
    }
  }

  if (!date) {
    return { display: value, full: null, isExact: false }
  }

  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const display = `${day}/${month}/${year}`

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthName = date.toLocaleDateString('en-US', { month: 'long' })
  const full = `${weekday} ${day} ${monthName} ${year}`

  return { display, full, isExact: true }
}
