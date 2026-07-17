import type { Locale } from '@/shared/copy/locale'

export interface FormattedDate {
  display: string
  full: string | null
  isExact: boolean
}

const EMPTY: FormattedDate = { display: '—', full: null, isExact: false }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const WEEKDAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const MONTHS_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

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

function formatTime(date: Date): string {
  let hours = date.getHours()
  const minutes = date.getMinutes()
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  if (hours === 0) hours = 12
  const minStr = String(minutes).padStart(2, '0')
  return `${hours}:${minStr}${ampm}`
}

export function formatListDate(
  iso: string,
  locale: Locale,
): { datePart: string; timePart: string } {
  const date = new Date(iso)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()

  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12
  if (hours === 0) hours = 12
  const time = `${hours}:${minutes} ${ampm}`

  const datePart = locale === 'es' ? `${day}/${month}/${year}` : `${month}/${day}/${year}`
  return { datePart, timePart: time }
}

export function formatCreatedAt(iso: string, locale: Locale): string {
  const date = new Date(iso)
  const weekdays = locale === 'es' ? WEEKDAYS_ES : WEEKDAYS_EN
  const months = locale === 'es' ? MONTHS_ES : MONTHS_EN

  const wd = weekdays[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()
  const time = formatTime(date)

  if (locale === 'es') {
    return `${wd} ${day} de ${month} a las ${time} de ${year}`
  }
  return `${wd}, ${month} ${day} at ${time} ${year}`
}

export interface RelativeTimeUnits {
  prefix: string
  minutesSingular: string
  minutesPlural: string
  hoursSingular: string
  hoursPlural: string
  daysSingular: string
  daysPlural: string
  weeksSingular: string
  weeksPlural: string
  monthsSingular: string
  monthsPlural: string
}

const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

function parseDate(value: string): Date | null {
  if (ISO_DATE_RE.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  const parsed = new Date(value)
  return isNaN(parsed.getTime()) ? null : parsed
}

type UnitKey = keyof Omit<RelativeTimeUnits, 'prefix'>

const TIME_INTERVALS: { limit: number; divisor: number; singular: UnitKey; plural: UnitKey }[] = [
  { limit: HOUR, divisor: MINUTE, singular: 'minutesSingular', plural: 'minutesPlural' },
  { limit: DAY, divisor: HOUR, singular: 'hoursSingular', plural: 'hoursPlural' },
  { limit: 31 * DAY, divisor: DAY, singular: 'daysSingular', plural: 'daysPlural' },
  { limit: 9 * WEEK, divisor: WEEK, singular: 'weeksSingular', plural: 'weeksPlural' },
  { limit: Infinity, divisor: 30 * DAY, singular: 'monthsSingular', plural: 'monthsPlural' },
]

export function formatRelativeTime(
  value: string | undefined | null,
  locale: Locale,
  units: RelativeTimeUnits,
  now: Date = new Date(),
): string | null {
  if (!value) return null

  const date = parseDate(value)
  if (!date) return null

  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  const format = (n: number, singular: string, plural: string) => {
    const word = n === 1 ? singular : plural
    return locale === 'es' ? `${units.prefix} ${n} ${word}` : `${n} ${word} ${units.prefix}`
  }

  if (diff <= 0) return format(0, units.minutesSingular, units.minutesPlural)

  const interval = TIME_INTERVALS.find((i) => diff < i.limit)!
  const amount = Math.max(1, Math.floor(diff / interval.divisor))

  return format(amount, units[interval.singular], units[interval.plural])
}
