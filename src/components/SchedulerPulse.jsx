import { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'
import { system as systemApi } from '../api/client.js'

// Mirrors TaskScheduler's server-side sweep (now @Scheduled every 24 hours).
const SWEEP_INTERVAL_S = 24 * 60 * 60

function formatRemaining(sec) {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export default function SchedulerPulse({ onSweep }) {
  const [secondsLeft, setSecondsLeft] = useState(SWEEP_INTERVAL_S)
  const [isSyncing, setIsSyncing] = useState(false)
  const targetTimeRef = useRef(Date.now() + SWEEP_INTERVAL_S * 1000)
  const onSweepRef = useRef(onSweep)

  // Keep callback ref updated without triggering effect dependencies
  useEffect(() => {
    onSweepRef.current = onSweep
  }, [onSweep])

  const syncWithBackend = useCallback(async () => {
    setIsSyncing(true)
    try {
      const res = await systemApi.nextSweep()
      const nextAt = new Date(res?.nextSweepAt).getTime()
      if (!Number.isNaN(nextAt) && nextAt > Date.now()) {
        targetTimeRef.current = nextAt
        const remaining = Math.max(0, Math.round((nextAt - Date.now()) / 1000))
        setSecondsLeft(remaining)
      } else {
        targetTimeRef.current = Date.now() + SWEEP_INTERVAL_S * 1000
        setSecondsLeft(SWEEP_INTERVAL_S)
      }
    } catch {
      // Fallback: Reset local target time on network failure
      targetTimeRef.current = Date.now() + SWEEP_INTERVAL_S * 1000
      setSecondsLeft(SWEEP_INTERVAL_S)
    } finally {
      setIsSyncing(false)
    }
  }, [])

  // Sync on initial mount
  useEffect(() => {
    syncWithBackend()
  }, [syncWithBackend])

  // Precision ticker driven by target timestamp instead of accumulative setInterval
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now()
      const remaining = Math.round((targetTimeRef.current - now) / 1000)

      if (remaining <= 0) {
        onSweepRef.current?.()
        syncWithBackend()
      } else {
        setSecondsLeft(remaining)
      }
    }, 1000)

    return () => clearInterval(id)
  }, [syncWithBackend])

  // Recalculate precisely when tab becomes visible again
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const remaining = Math.round((targetTimeRef.current - Date.now()) / 1000)
        if (remaining <= 0) {
          onSweepRef.current?.()
          syncWithBackend()
        } else {
          setSecondsLeft(remaining)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [syncWithBackend])

  const progress = Math.min(1, Math.max(0, 1 - secondsLeft / SWEEP_INTERVAL_S))
  const circumference = 2 * Math.PI * 9
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <div
      className="inline-flex items-center gap-2 select-none"
      title="Time until the backend's next overdue sweep"
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        <svg width="20" height="20" viewBox="0 0 22 22" className="shrink-0">
          {/* Track Circle */}
          <circle
            cx="11"
            cy="11"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-panelBorder"
          />
          {/* Progress Circle */}
          <circle
            cx="11"
            cy="11"
            r="9"
            fill="none"
            stroke="#E8A33D"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 11 11)"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Syncing Activity Spinner Overlay */}
        {isSyncing && (
          <RefreshCw
            size={10}
            className="absolute text-accent animate-spin"
          />
        )}
      </div>

      <span className="font-mono text-xs text-fog hidden sm:inline-block leading-none">
        next sweep <span className="text-paper font-medium">{formatRemaining(secondsLeft)}</span>
      </span>
    </div>
  )
}