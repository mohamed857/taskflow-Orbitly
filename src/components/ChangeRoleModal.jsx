import React, { useState, useEffect } from 'react'
import { ShieldAlert, Loader2, Check, X } from 'lucide-react'
import { roleLabel } from '../utils/roles.js'
import Portal from './Portal.jsx'

export default function ChangeRoleModal({
  open,
  targetUser,
  allowedRoles = [],
  onClose,
  onSubmit
}) {
  const [role, setRole] = useState(targetUser?.role ?? 'USER')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Sync state whenever targetUser changes or modal opens
  useEffect(() => {
    if (open && targetUser) {
      setRole(targetUser.role ?? 'USER')
      setError(null)
    }
  }, [targetUser, open])

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open && !saving) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onClose])

  if (!open || !targetUser) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (role === targetUser.role || saving) return

    setSaving(true)
    setError(null)
    try {
      await onSubmit(targetUser.id, role)
      onClose()
    } catch (err) {
      setError(err.message || 'Could not update the role.')
    } finally {
      setSaving(false)
    }
  }

  const isUnchanged = role === targetUser.role

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-enter">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={!saving ? onClose : undefined}
        />

        {/* Modal Container */}
        <div 
          onClick={(e) => e.stopPropagation()} 
          className="relative glass-panel w-full max-w-sm p-6 border border-panelBorder/80 shadow-xl z-10 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-bold text-paper">Change User Role</h2>
              <p className="text-xs text-fog mt-0.5">
                Updating role for{' '}
                <span className="text-paper font-semibold">
                  {targetUser.username || targetUser.email}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1 text-fog hover:text-paper hover:bg-panelAlt/60 rounded-md transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Options */}
            <div className="space-y-2">
              {allowedRoles.map((r) => {
                const isSelected = role === r
                return (
                  <label
                    key={r}
                    className={`flex items-center justify-between border rounded-xl px-3.5 py-2.5 cursor-pointer text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-accent/80 bg-accent/10 text-paper shadow-sm'
                        : 'border-panelBorder/60 text-fog hover:border-panelBorder hover:text-paper hover:bg-panelAlt/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="role"
                        value={r}
                        checked={isSelected}
                        onChange={() => setRole(r)}
                        disabled={saving}
                        className="accent-accent cursor-pointer"
                      />
                      <span>{roleLabel(r)}</span>
                    </div>
                    {isSelected && <Check size={14} className="text-accent shrink-0" />}
                  </label>
                )
              })}
            </div>

            {/* Role Warning Banner */}
            <div className="flex items-start gap-2.5 bg-pending/10 border border-pending/20 rounded-lg p-3 text-xs text-pending">
              <ShieldAlert size={15} className="mt-0.5 shrink-0" />
              <p className="leading-relaxed text-[11px]">
                Role updates apply on their next login session. Current active JWT tokens retain prior permissions.
              </p>
            </div>

            {/* Error State */}
            {error && (
              <p className="text-xs text-overdue font-mono bg-overdue/10 border border-overdue/20 rounded-md p-2">
                {error}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-panelBorder/40">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-ghost py-1.5 px-3 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || isUnchanged}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Updating…</span>
                  </>
                ) : (
                  <span>Update Role</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  )
}