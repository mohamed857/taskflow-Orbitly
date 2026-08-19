export const ROLES = ['USER', 'TEAM_LEAD', 'MANAGER', 'ADMIN']

// Mirrors UserService.updateUserRole on the backend exactly:
//   - no one can change their own role
//   - no one can change the role of someone who holds the SAME role as them
//   - no one can change an ADMIN's role, period — not even another Admin
//   - ADMIN can otherwise touch anyone, and can grant any role including Admin
//   - MANAGER can touch a USER or a TEAM_LEAD, but can never grant Admin
//   - TEAM_LEAD can only touch a plain USER, and only up to Team Lead
//   - USER can never change anyone's role
export function canChangeRole(actingUser, targetUser) {
  if (!actingUser || !targetUser) return false
  if (actingUser.id === targetUser.id) return false
  if (actingUser.role === targetUser.role) return false
  if (targetUser.role === 'ADMIN') return false

  if (actingUser.role === 'ADMIN') return true
  if (actingUser.role === 'MANAGER') return targetUser.role === 'USER' || targetUser.role === 'TEAM_LEAD'
  if (actingUser.role === 'TEAM_LEAD') return targetUser.role === 'USER'
  return false
}

// Roles the acting user may move a target into, once canChangeRole is true.
export function allowedTargetRoles(actingUser) {
  if (actingUser?.role === 'ADMIN') return ['USER', 'TEAM_LEAD', 'MANAGER', 'ADMIN']
  // Managers can touch Users and Team Leads, but can never grant Admin.
  if (actingUser?.role === 'MANAGER') return ['USER', 'TEAM_LEAD', 'MANAGER']
  // Team Leads can only promote a User as high as Team Lead.
  if (actingUser?.role === 'TEAM_LEAD') return ['USER', 'TEAM_LEAD']
  return []
}

export function roleLabel(role) {
  const labels = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    TEAM_LEAD: 'Team Lead',
    USER: 'User'
  }
  return labels[role] ?? 'User'
}

// One-line explanation of what the acting user is allowed to do, for
// display on the Team page.
export function roleScopeHint(actingUser) {
  if (actingUser?.role === 'ADMIN') return 'You can change any role. Once someone becomes Admin, no one — including you — can change it back.'
  if (actingUser?.role === 'MANAGER') return 'You can promote or demote Users and Team Leads, up to Manager, within your workspace.'
  if (actingUser?.role === 'TEAM_LEAD') return 'You can promote or demote Users, up to Team Lead, within your workspace.'
  return 'Role changes are managed by your workspace\u2019s Admin, Manager, or Team Lead.'
}