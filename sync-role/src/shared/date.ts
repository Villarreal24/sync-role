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
