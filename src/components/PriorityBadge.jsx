import React from 'react'

const STYLES = {
  LOW: { 
    dot: 'bg-fog', 
    text: 'text-fog', 
    badgeBg: 'bg-fog/10 border-fog/20',
    label: 'Low' 
  },
  MEDIUM: { 
    dot: 'bg-inprogress', 
    text: 'text-inprogress', 
    badgeBg: 'bg-inprogress/10 border-inprogress/20',
    label: 'Medium' 
  },
  HIGH: { 
    dot: 'bg-pending', 
    text: 'text-pending', 
    badgeBg: 'bg-pending/10 border-pending/20',
    label: 'High' 
  },
  CRITICAL: { 
    dot: 'bg-overdue', 
    text: 'text-overdue', 
    badgeBg: 'bg-overdue/10 border-overdue/20',
    label: 'Critical' 
  }
}

export default function PriorityBadge({ priority, variant = 'minimal', className = '' }) {
  if (!priority) return null

  const key = String(priority).toUpperCase()
  const style = STYLES[key] ?? {
    dot: 'bg-fog',
    text: 'text-fog',
    badgeBg: 'bg-fog/10 border-fog/20',
    label: priority
  }

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium leading-none shrink-0 ${style.badgeBg} ${style.text} ${className}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
        <span>{style.label}</span>
      </span>
    )
  }

  // Default 'minimal' variant
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[11px] font-medium leading-none shrink-0 ${style.text} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{style.label}</span>
    </span>
  )
}

export const PRIORITY_OPTIONS = Object.keys(STYLES)