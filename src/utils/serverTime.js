// The backend serializes audit timestamps (createdAt, etc.) as Java
// LocalDateTime — an ISO string with NO timezone designator, e.g.
// "2026-08-20T00:40:49.311". The server clock runs in UTC, but the browser's
// `new Date("2026-08-20T00:40:49.311")` interprets a timezone-less date-time as
// LOCAL time, shifting every displayed time by the viewer's UTC offset.
//
// parseServerDate() treats such naive timestamps as UTC (by appending "Z"),
// while leaving values that already carry a zone (Z or ±hh:mm) untouched.

const HAS_TZ = /[zZ]|[+-]\d{2}:?\d{2}$/

export function parseServerDate(value) {
  if (value == null) return null
  if (value instanceof Date) return value

  if (typeof value === 'string') {
    const trimmed = value.trim()
    // Date-time (has 'T') without a timezone -> assume UTC.
    const normalized = trimmed.includes('T') && !HAS_TZ.test(trimmed)
      ? `${trimmed}Z`
      : trimmed
    const d = new Date(normalized)
    return Number.isNaN(d.getTime()) ? null : d
  }

  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatServerTime(value, options = { hour: '2-digit', minute: '2-digit' }) {
  const d = parseServerDate(value)
  return d ? d.toLocaleTimeString([], options) : ''
}

export function formatServerDateTime(value, options) {
  const d = parseServerDate(value)
  if (!d) return ''
  return options
    ? d.toLocaleString(undefined, options)
    : d.toLocaleString()
}
