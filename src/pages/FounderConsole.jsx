import { useEffect, useState, useCallback, useRef } from 'react'
import {
  Search as SearchIcon,
  ShieldAlert,
  KeyRound,
  Loader2,
  X,
  Copy,
  Check,
  RefreshCw
} from 'lucide-react'
import { admin as adminApi, avatarSrc } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from '../components/Avatar.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import Portal from '../components/Portal.jsx'
import { displayName } from '../utils/userDisplay.js'

function generatePassword(length = 12) {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%^&*'
  let out = ''
  for (let i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * chars.length))
  return out
}

function ResetPasswordModal({ target, onClose, onDone }) {
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
      await adminApi.resetPassword(target.id, password.trim())
      setDone(true)
      onDone?.()
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

export default function FounderConsole() {
  const { push } = useToast()
  const [query, setQuery] = useState('')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState(null)
  const debounceRef = useRef(null)

  const load = useCallback(async (q) => {
    setLoading(true)
    try {
      const data = await adminApi.users(q)
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      push(err.message || 'Could not load users.', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    load('')
  }, [load])

  // Debounced search as the founder types.
  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(query.trim()), 300)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="space-y-6 animate-enter">
      <div className="glass-panel p-5 border border-panelBorder/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight text-paper">Founder Console</h2>
            <p className="text-xs font-mono text-fog mt-0.5">
              Every user across all workspaces. Search by id, email, or name — and reset any password.
            </p>
          </div>
        </div>
      </div>

      <div className="relative sm:max-w-md">
        <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
        <input
          className="input-field pl-9 pr-3 py-2 text-sm w-full"
          placeholder="Search by id, email, or name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
          <p className="font-mono text-xs text-fog">Loading users…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <p className="font-display text-base font-bold text-paper mb-1">No users found</p>
          <p className="text-xs text-fog">Try a different search term.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-panelBorder/80">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-panelBorder/80 bg-panelAlt/30 text-fog font-mono uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panelBorder/40">
                {list.map((u) => (
                  <tr key={u.id} className="hover:bg-panelAlt/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-fog">#{u.id}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={displayName(u)} size={30} src={avatarSrc(u.avatarUrl)} />
                        <div className="min-w-0">
                          <p className="text-paper text-xs font-semibold truncate">
                            {u.name || u.username}
                            {u.name && <span className="text-fog font-normal font-mono ml-1.5">@{u.username}</span>}
                          </p>
                          <p className="text-fog text-[11px] truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3">
                      <span className="text-fog font-mono">{u.workspaceName || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setTarget(u)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-panelBorder/80 text-fog hover:text-accent hover:border-accent hover:bg-accent/10 transition-colors font-mono text-[11px]"
                      >
                        <KeyRound size={12} /> reset password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {target && (
        <ResetPasswordModal target={target} onClose={() => setTarget(null)} onDone={() => {}} />
      )}
    </div>
  )
}
