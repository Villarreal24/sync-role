/**
 * Format a phone number for display only.
 *
 * Transforms raw phone numbers into a human-friendly format:
 *   "+52 6622961332" → "+52 (662)-296-1332"
 *   "+1 5551234567"  → "+1 (555)-123-4567"
 *
 * The raw value is what gets stored and copied — this is strictly
 * a display-layer concern.
 */
export function formatPhoneDisplay(value: string | null): string {
  if (!value) return ''
  const cleaned = value.replace(/[^\d+]/g, '')
  if (!cleaned.startsWith('+') || cleaned.length < 8) return value
  const digits = cleaned.slice(1)

  // Heuristic: 12+ digits after + → 2-digit country code (e.g. +52 MX)
  // 11 digits after + → 1-digit country code (e.g. +1 US/CA)
  const countryLen = digits.length >= 12 ? 2 : 1
  const countryCode = digits.slice(0, countryLen)
  const rest = digits.slice(countryLen)
  const area = rest.slice(0, 3)
  const mid = rest.slice(3, 6)
  const last = rest.slice(6, 10)

  if (last) return `+${countryCode} (${area})-${mid}-${last}`
  return value
}
