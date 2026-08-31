// Central place to decide how a user is shown. Prefers the human-friendly
// full name, then the unique username, then the email as a last resort.
export function displayName(user) {
  if (!user) return ''
  return user.name || user.username || user.email || 'User'
}

// The "@handle" shown next to the display name. Returns '' when the primary
// display is already the username (so we don't render "@x" twice).
export function handle(user) {
  if (!user) return ''
  return user.name && user.username ? `@${user.username}` : ''
}
