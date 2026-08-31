import { useState } from 'react'
import { KeyRound, Loader2, X, Copy, Check, RefreshCw } from 'lucide-react'
import Portal from './Portal.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { displayName } from '../utils/userDisplay.js'

export function generatePassword(length = 12) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  let out = ''
  for (let i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

// Reusable "set a new password for this user" dialog. `resetFn(id, password)`
// is the API call — the founder console and the workspace roster pass different
// endpoints, but the UX is identical.
export default function ResetPasswordModal({ target, resetFn, onClose }) {
  const { push } = useToast()
  const [password, setPassword] = useState(() => generatePassword())
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [done, setDone] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable; the value is still visible to copy manually */
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    if (password.trim().length < 8) {
      push('Password must be at least 8 characters.', 'error')
      return
    }
    setSaving(true)
    try {
      await resetFn(target.id, password.trim())
      setDone(true)
    } catch (err) {
      push(err.message || 'Could not reset the password.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={onClose}>
        <div
          className="relative glass-panel w-full max-w-sm p-6 space-y-4 rounded-xl border border-panelBorder shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-fog hover:text-paper rounded-lg transition-colors"
          >
            <X size={16} />
          </button>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent/10 text-accent">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="font-display text-base font-semibold text-paper">Reset password</h2>
              <p className="text-[11px] text-fog font-mono">
                {displayName(target)} · {target.email}
              </p>
            </div>
          </div>

          {done ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
                <Check size={15} className="shrink-0 mt-0.5" />
                <span>Password updated. Share the new password below with the user.</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-panelAlt/60 border border-panelBorder/60 rounded-lg px-3 py-2 text-paper break-all">
                  {password}
                </code>
                <button onClick={copy} className="btn-ghost p-2 rounded-lg" title="Copy">
                  {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                </button>
              </div>
              <button onClick={onClose} className="btn-primary w-full py-2 text-xs rounded-lg">Done</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-3.5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label-eyebrow">New password</label>
                  <button
                    type="button"
                    onClick={() => setPassword(generatePassword())}
                    className="text-[11px] text-accent hover:underline flex items-center gap-1 font-mono"
                  >
                    <RefreshCw size={11} /> Generate
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    className="input-field flex-1 text-xs py-2 px-3 rounded-lg font-mono bg-panelAlt/50 border border-panelBorder/60"
                  />
                  <button type="button" onClick={copy} className="btn-ghost p-2 rounded-lg" title="Copy">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[11px] text-fog/80 mt-1 font-mono">At least 8 characters.</p>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-panelBorder/60">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 py-2 text-xs rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Updating…</> : 'Set password'}
                </button>
                <button type="button" onClick={onClose} disabled={saving} className="btn-ghost py-2 px-4 text-xs rounded-lg disabled:opacity-50">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Portal>
  )
}
