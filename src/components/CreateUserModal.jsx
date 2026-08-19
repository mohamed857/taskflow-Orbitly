import { useEffect, useState, useRef } from 'react'
import { UserPlus, X, Loader2, AlertCircle, KeyRound } from 'lucide-react'
import Portal from './Portal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY = { username: '', email: '', password: '' }

// Helper to generate a random secure temporary password
function generateTempPassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return pwd
}

export default function CreateUserModal({ open, onClose, onSubmit }) {
  const { user, hasRole } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  
  const usernameInputRef = useRef(null)
  const previousFocusRef = useRef(null)

  // Handle focus management & lock body scroll
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement
      setForm(EMPTY)
      setError(null)
      
      document.body.style.overflow = 'hidden'
      
      const timer = setTimeout(() => usernameInputRef.current?.focus(), 50)
      return () => {
        clearTimeout(timer)
        document.body.style.overflow = ''
        if (previousFocusRef.current) {
          previousFocusRef.current.focus()
        }
      }
    }
  }, [open])

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onClose])

  if (!open) return null

  const handleGeneratePassword = () => {
    setForm((prev) => ({ ...prev, password: generateTempPassword() }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not create user.')
    } finally {
      setSaving(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !saving) {
      onClose()
    }
  }

  return (
    <Portal>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      >
        {/* Modal Container */}
        <div 
          className="relative glass-panel w-full max-w-sm p-6 space-y-4 rounded-xl border border-panelBorder shadow-2xl z-10 animate-in zoom-in-95 duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="absolute top-4 right-4 p-1 text-fog hover:text-paper hover:bg-panelAlt/60 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>

          {/* Modal Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10 text-accent">
                <UserPlus size={18} />
              </div>
              <h2 id="modal-title" className="font-display text-base font-semibold text-paper">
                Add a team member
              </h2>
            </div>
            <p className="text-xs text-fog leading-relaxed">
              {hasRole('ADMIN')
                ? 'They’ll be added directly to the organization without an invite step.'
                : `They’ll be added directly to ${user?.workspaceName || 'your workspace'}.`}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="new-username">
                Username
              </label>
              <input
                ref={usernameInputRef}
                id="new-username"
                type="text"
                required
                disabled={saving}
                className="input-field w-full text-xs py-2 px-3 rounded-lg bg-panelAlt/50 focus:bg-panelAlt border border-panelBorder/60"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>

            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="new-email">
                Email
              </label>
              <input
                id="new-email"
                type="email"
                required
                disabled={saving}
                className="input-field w-full text-xs py-2 px-3 rounded-lg bg-panelAlt/50 focus:bg-panelAlt border border-panelBorder/60"
                placeholder="john@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label-eyebrow block" htmlFor="new-password">
                  Temporary password
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  disabled={saving}
                  className="text-[11px] text-accent hover:underline flex items-center gap-1 font-mono disabled:opacity-50 cursor-pointer"
                >
                  <KeyRound size={11} />
                  <span>Generate</span>
                </button>
              </div>
              <input
                id="new-password"
                type="text" // Shown as text so admin can copy and send it easily
                required
                minLength={8}
                disabled={saving}
                className="input-field w-full text-xs py-2 px-3 rounded-lg bg-panelAlt/50 focus:bg-panelAlt border border-panelBorder/60 font-mono"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-[11px] text-fog/80 mt-1 font-mono">
                At least 8 characters. Share this directly with them.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-overdue/10 border border-overdue/20 text-overdue text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-2.5 pt-3 border-t border-panelBorder/60">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 py-2 text-xs font-medium rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Creating…</span>
                  </>
                ) : (
                  <span>Create user</span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-ghost py-2 text-xs font-medium rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}