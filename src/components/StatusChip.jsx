import React from 'react'

const STYLES = {
  PENDING: {
    dot: 'bg-pending',
    text: 'text-pending',
    chipBg: 'bg-pending/10 border-pending/20',
    label: 'Pending'
  },
  IN_PROGRESS: {
    dot: 'bg-inprogress',
    text: 'text-inprogress',
    chipBg: 'bg-inprogress/10 border-inprogress/20',
    label: 'In Progress'
  },
  COMPLETED: {
    dot: 'bg-completed',
    text: 'text-completed',
    chipBg: 'bg-completed/10 border-completed/20',
    label: 'Completed'
  },
  OVERDUE: {
    dot: 'bg-overdue',
    text: 'text-overdue',
    chipBg: 'bg-overdue/10 border-overdue/20',
    label: 'Overdue'
  }
}

export default function StatusChip({ status, variant = 'minimal', className = '' }) {
  if (!status) return null

  const key = String(status).toUpperCase()
  const style = STYLES[key] ?? {
    dot: 'bg-fog',
    text: 'text-fog',
    chipBg: 'bg-fog/10 border-fog/20',
    label: status
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium leading-none shrink-0 select-none ${style.chipBg} ${style.text} ${className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        <span>{style.label}</span>
      </span>
    )
  }

  // Default 'minimal' variant
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium leading-none shrink-0 select-none ${style.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </span>
  )
}

export const STATUS_OPTIONS = Object.keys(STYLES)