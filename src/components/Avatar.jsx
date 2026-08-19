import { useState } from 'react'

const PALETTE = ['#A78BFA', '#38BDF8', '#3FB68B', '#E8A33D', '#D64545', '#4C7BF3']

function hashString(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function initials(name = '') {
  const parts = name.trim().split(/[\s.@_]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function Avatar({ name, size = 32, src, status, className = '' }) {
  const [imageError, setImageError] = useState(false)

  const showImage = src && !imageError
  const color = PALETTE[hashString(name) % PALETTE.length]

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      {showImage ? (
        <img
          src={src}
          alt={name || 'User avatar'}
          onError={() => setImageError(true)}
          className="rounded-full object-cover shrink-0 ring-1 ring-panelBorder/40"
          style={{ width: size, height: size }}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full font-mono font-bold shrink-0 ring-1 ring-panelBorder/30 select-none"
          style={{
            width: size,
            height: size,
            backgroundColor: `${color}20`,
            color: color,
            fontSize: Math.max(10, size * 0.38)
          }}
        >
          {initials(name)}
        </div>
      )}

      {/* Optional Status Indicator Badge */}
      {status && (
        <span
          className={`absolute bottom-0 right-0 rounded-full ring-2 ring-panel ${
            status === 'online'
              ? 'bg-completed'
              : status === 'busy'
              ? 'bg-overdue'
              : status === 'away'
              ? 'bg-amber-400'
              : 'bg-fog'
          }`}
          style={{
            width: Math.max(8, size * 0.25),
            height: Math.max(8, size * 0.25)
          }}
        />
      )}
    </div>
  )
}