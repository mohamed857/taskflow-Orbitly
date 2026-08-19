/**
 * Normalizes an `<input type="datetime-local">` value into a full
 * LocalDateTime-compatible string the backend can deserialize
 * (yyyy-MM-ddTHH:mm:ss). Returns null for an empty value, and
 * throws for anything incomplete — e.g. date-only strings or
 * invalid formats that silently fail Spring Boot's LocalDateTime deserializer.
 */
export function toApiDateTime(localValue) {
  if (!localValue || typeof localValue !== 'string') return null
  const trimmed = localValue.trim()
  if (!trimmed) return null

  const [datePart, timePart] = trimmed.split('T')

  // Validate complete presence of both ISO date and time components
  if (!datePart || !timePart) {
    throw new Error('Pick both a date and a time for the due date, or leave it blank.')
  }

  // Ensure date matches YYYY-MM-DD pattern
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.')
  }

  // Strip optional timezone offsets or milliseconds if pasted/emitted by browser
  const cleanTime = timePart.split('.')[0].replace(/(Z|[+-]\d{2}:\d{2})$/, '')
  const segments = cleanTime.split(':')

  if (segments.length < 2 || segments.some((s) => s === '')) {
    throw new Error('Pick both a date and a time for the due date, or leave it blank.')
  }

  // Normalize HH:mm to HH:mm:ss for java.time.LocalDateTime
  while (segments.length < 3) {
    segments.push('00')
  }

  return `${datePart}T${segments.slice(0, 3).join(':')}`
}