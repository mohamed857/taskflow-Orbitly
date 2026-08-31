import { useEffect, useState, useCallback, useRef } from 'react'
import { Search as SearchIcon, ShieldAlert, KeyRound, Loader2, Users as UsersIcon, DollarSign } from 'lucide-react'
import { admin as adminApi, avatarSrc } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from '../components/Avatar.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import ResetPasswordModal from '../components/ResetPasswordModal.jsx'
import { displayName } from '../utils/userDisplay.js'
import FounderPricing from './FounderPricing.jsx'

function UsersTab() {
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

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => load(query.trim()), 300)
    return () => clearTimeout(debounceRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  return (
    <div className="space-y-5">
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
        <ResetPasswordModal
          target={target}
          resetFn={(id, pw) => adminApi.resetPassword(id, pw)}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  )
}

export default function FounderConsole() {
  const [tab, setTab] = useState('users') // 'users' | 'pricing'

  const tabs = [
    { key: 'users', label: 'Users', icon: UsersIcon },
    { key: 'pricing', label: 'Pricing', icon: DollarSign }
  ]

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
              Platform-wide administration — manage every user, and set live plan pricing.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-panelBorder/60">
        {tabs.map((t) => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                active ? 'border-accent text-accent' : 'border-transparent text-fog hover:text-paper'
              }`}
            >
              <Icon size={15} /> {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'users' ? <UsersTab /> : <FounderPricing />}
    </div>
  )
}
