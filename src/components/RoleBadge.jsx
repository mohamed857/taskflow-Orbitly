import React from 'react'

const STYLES = {
  ADMIN: { color: '#A78BFA', label: 'Admin' },
  MANAGER: { color: '#38BDF8', label: 'Manager' },
  TEAM_LEAD: { color: '#34D399', label: 'Team Lead' },
  USER: { color: '#8B94A3', label: 'User' }
}

export default function RoleBadge({ role, className = '' }) {
  if (!role) return null

  const key = String(role).toUpperCase()
  const style = STYLES[key] ?? { color: '#8B94A3', label: role }

  return (
    <span
      className={`inline-flex items-center font-mono text-[10px] sm:text-[11px] font-medium px-2 py-0.5 rounded-full border leading-none shrink-0 tracking-wide select-none ${className}`}
      style={{
        color: style.color,
        borderColor: `${style.color}40`,
        backgroundColor: `${style.color}14`
      }}
    >
      {style.label}
    </span>
  )
}

export const ROLE_OPTIONS = Object.keys(STYLES)