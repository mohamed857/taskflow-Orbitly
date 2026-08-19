import React from 'react'

export default function StatCard({
  label,
  value,
  subvalue,
  color = '#8B94A3',
  icon: Icon,
  trend,
  trendDirection = 'up',
  active = false,
  onClick,
  className = ''
}) {
  const isClickable = Boolean(onClick)

  // Converts hex colors (#0F9B8E or #fff) to semi-transparent 8-digit hex codes
  const getAlphaColor = (hex, alphaHex) => {
    if (typeof hex !== 'string' || !hex.startsWith('#')) return hex

    let cleanHex = hex.slice(1)
    if (cleanHex.length === 3) {
      cleanHex = cleanHex
        .split('')
        .map((char) => char + char)
        .join('')
    }

    if (cleanHex.length === 6) {
      return `#${cleanHex}${alphaHex}`
    }

    return hex
  }

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e)
              }
            }
          : undefined
      }
      className={`console-panel p-4 flex items-center justify-between border border-panelBorder/80 rounded-xl shadow-sm transition-all duration-200 ${
        active
          ? 'ring-2 ring-accent/60 border-accent/60 bg-panelAlt/80'
          : ''
      } ${
        isClickable
          ? 'cursor-pointer hover:border-accent/40 hover:bg-panelAlt/50 active:scale-[0.99]'
          : 'hover:border-panelBorder'
      } ${className}`}
    >
      <div className="min-w-0 flex-1 pr-3 select-none">
        <p className="label-eyebrow truncate">{label}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="font-display text-2xl font-semibold text-paper tracking-tight truncate">
            {value ?? '—'}
          </p>

          {subvalue && (
            <span className="font-mono text-xs text-fog/70 shrink-0 truncate">
              {subvalue}
            </span>
          )}

          {trend && (
            <span
              className={`font-mono text-xs shrink-0 flex items-center gap-0.5 font-medium ${
                trendDirection === 'up'
                  ? 'text-emerald-500 dark:text-emerald-400'
                  : 'text-rose-500 dark:text-rose-400'
              }`}
            >
              <span>{trendDirection === 'up' ? '↑' : '↓'}</span>
              <span>{trend}</span>
            </span>
          )}
        </div>
      </div>

      {Icon && (
        <div
          className="h-9 w-9 rounded-md flex items-center justify-center shrink-0 border transition-colors"
          style={{
            backgroundColor: getAlphaColor(color, '18'),
            borderColor: getAlphaColor(color, '30'),
            color
          }}
        >
          <Icon size={18} strokeWidth={1.75} />
        </div>
      )}
    </div>
  )
}