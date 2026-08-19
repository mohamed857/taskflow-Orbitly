import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { subscribeToastBus } from '../utils/toastBus.js'

const ToastContext = createContext(null)
let idCounter = 0
const MAX_TOASTS = 5

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  // Clear a specific timer
  const clearTimer = useCallback((id) => {
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id))
      timersRef.current.delete(id)
    }
  }, [])

  const dismiss = useCallback((id) => {
    clearTimer(id)
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [clearTimer])

  const push = useCallback(
    (message, variant = 'default', duration = 4000) => {
      const id = ++idCounter

      setToasts((prev) => {
        // Limit maximum visible toasts to prevent layout overflow
        const updated = [...prev, { id, message, variant }]
        if (updated.length > MAX_TOASTS) {
          const oldest = updated.shift()
          clearTimer(oldest.id)
        }
        return updated
      })

      if (duration > 0) {
        const timerId = setTimeout(() => dismiss(id), duration)
        timersRef.current.set(id, timerId)
      }

      return id
    },
    [dismiss, clearTimer]
  )

  // Cleanup all active timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timerId) => clearTimeout(timerId))
      timersRef.current.clear()
    }
  }, [])

  // Subscribe to global toast bus (for Axios/Fetch API interceptors)
  useEffect(() => {
    return subscribeToastBus((message, variant) => push(message, variant))
  }, [push])

  const value = useMemo(
    () => ({
      push,
      dismiss,
      success: (msg, dur) => push(msg, 'success', dur),
      error: (msg, dur) => push(msg, 'error', dur),
      info: (msg, dur) => push(msg, 'default', dur)
    }),
    [push, dismiss]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div 
        aria-live="polite" 
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isError = t.variant === 'error'
          const isSuccess = t.variant === 'success'

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${
                isError
                  ? 'bg-overdue/10 border-overdue/40 text-overdue'
                  : isSuccess
                  ? 'bg-accent/10 border-accent/40 text-accent'
                  : 'bg-panel/90 border-panelBorder/80 text-paper'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError ? (
                  <AlertCircle size={16} />
                ) : isSuccess ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <Info size={16} className="text-fog" />
                )}
              </div>

              <div className="flex-1 text-xs font-medium leading-relaxed break-words">
                {t.message}
              </div>

              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="shrink-0 text-fog hover:text-paper p-0.5 rounded-md hover:bg-panelAlt/60 transition-colors cursor-pointer"
                aria-label="Dismiss toast"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}