import { useEffect, useState, useCallback } from 'react'
import { Loader2, Building2, Users, Network, Trash2, X, AlertTriangle } from 'lucide-react'
import { admin as adminApi, avatarSrc } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from '../components/Avatar.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import { displayName } from '../utils/userDisplay.js'

const fmt = (n) => Number(n || 0).toLocaleString('en-US')

function DetailModal({ id, onClose, onDeleted }) {
  const { push } = useToast()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    adminApi
      .company(id)
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => !cancelled && push(err.message || 'Could not load company.', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [id, push])

  const doDelete = async () => {
    setDeleting(true)
    try {
      await adminApi.deleteCompany(id)
      push('Company deleted permanently.', 'success')
      onDeleted()
    } catch (err) {
      push(err.message || 'Could not delete company.', 'error')
      setDeleting(false)
    }
  }

  const canDelete = detail && confirmText.trim() === detail.name

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-ink/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass-panel border border-panelBorder w-full max-w-2xl my-8">
        <div className="flex items-center justify-between px-5 py-4 border-b border-panelBorder/60">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <Building2 size={17} />
            </div>
            <div>
              <h3 className="font-display font-bold text-paper leading-tight">
                {detail?.name || '…'}
              </h3>
              <p className="text-[11px] font-mono text-fog">Company #{id}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-fog hover:text-paper hover:bg-panelAlt/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={22} className="animate-spin text-accent mx-auto" />
          </div>
        ) : detail ? (
          <div className="p-5 space-y-5">
            {/* plan + usage */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="glass-panel p-3 border border-panelBorder/70">
                <p className="label-eyebrow text-[10px]">Plan</p>
                <p className="font-display font-bold text-paper mt-0.5">{detail.planName}</p>
                <p className="text-[11px] font-mono text-fog">
                  {detail.monthlyUsdPerUser === 0 ? 'Free' : `$${detail.monthlyUsdPerUser}/user/mo`}
                </p>
              </div>
              <div className="glass-panel p-3 border border-panelBorder/70">
                <p className="label-eyebrow text-[10px] flex items-center gap-1"><Users size={11} /> Members</p>
                <p className="font-display font-bold text-paper mt-0.5">
                  {fmt(detail.membersUsed)}
                  <span className="text-fog text-xs font-mono">
                    {' '}/ {detail.unlimitedMembers ? '∞' : detail.maxMembers}
                  </span>
                </p>
              </div>
              <div className="glass-panel p-3 border border-panelBorder/70">
                <p className="label-eyebrow text-[10px] flex items-center gap-1"><Network size={11} /> Teams</p>
                <p className="font-display font-bold text-paper mt-0.5">
                  {fmt(detail.teamsUsed)}
                  <span className="text-fog text-xs font-mono">
                    {' '}/ {detail.unlimitedTeams ? '∞' : detail.maxTeams}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[11px] font-mono text-fog">
              <span>Est. bill: <span className="text-completed">${fmt(detail.monthlyBillUsd)}/mo</span></span>
              {detail.createdBy && <span>Owner: {detail.createdBy}</span>}
            </div>

            {/* members */}
            <div>
              <p className="label-eyebrow text-xs mb-2">Members ({detail.users.length})</p>
              <div className="rounded-lg border border-panelBorder/60 divide-y divide-panelBorder/40 max-h-64 overflow-y-auto">
                {detail.users.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2">
                    <Avatar name={displayName(u)} size={26} src={avatarSrc(u.avatarUrl)} />
                    <div className="min-w-0 flex-1">
                      <p className="text-paper text-xs font-semibold truncate">
                        {u.name || u.username}
                        <span className="text-fog font-normal font-mono ml-1.5">@{u.username}</span>
                      </p>
                      <p className="text-fog text-[10px] truncate">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                ))}
                {detail.users.length === 0 && (
                  <p className="px-3 py-4 text-center text-fog text-xs">No members.</p>
                )}
              </div>
            </div>

            {/* teams */}
            {detail.teams.length > 0 && (
              <div>
                <p className="label-eyebrow text-xs mb-2">Teams ({detail.teams.length})</p>
                <div className="flex flex-wrap gap-2">
                  {detail.teams.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 rounded-full border border-panelBorder/70 px-2.5 py-1 text-[11px] text-fog">
                      <Network size={11} /> {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* danger zone */}
            <div className="rounded-lg border border-overdue/40 bg-overdue/5 p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle size={15} className="text-overdue" />
                <p className="font-semibold text-overdue text-sm">Danger zone</p>
              </div>
              <p className="text-[11px] text-fog mb-3">
                Permanently delete this company and all of its data — members, teams, tasks, comments,
                attachments, messages and notifications. This cannot be undone.
              </p>
              {!confirming ? (
                <button
                  onClick={() => setConfirming(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-overdue/50 text-overdue text-xs font-semibold hover:bg-overdue/10 transition-colors"
                >
                  <Trash2 size={13} /> Delete company
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-[11px] text-fog">
                    Type <span className="font-mono text-paper font-semibold">{detail.name}</span> to confirm:
                  </p>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="input-field w-full py-2 text-sm"
                    placeholder={detail.name}
                    autoFocus
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={doDelete}
                      disabled={!canDelete || deleting}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-overdue text-white text-xs font-semibold hover:opacity-90 transition disabled:opacity-40"
                    >
                      {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                      Delete permanently
                    </button>
                    <button
                      onClick={() => { setConfirming(false); setConfirmText('') }}
                      className="px-3 py-2 rounded-lg border border-panelBorder text-fog text-xs font-semibold hover:text-paper transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function FounderCompanies() {
  const { push } = useToast()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await adminApi.companies()
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      push(err.message || 'Could not load companies.', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
          <p className="font-mono text-xs text-fog">Loading companies…</p>
        </div>
      ) : list.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <p className="font-display text-base font-bold text-paper mb-1">No companies yet</p>
          <p className="text-xs text-fog">Registered workspaces will appear here.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-panelBorder/80">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-panelBorder/80 bg-panelAlt/30 text-fog font-mono uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Members</th>
                  <th className="px-4 py-3">Teams</th>
                  <th className="px-4 py-3">Est. bill</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panelBorder/40">
                {list.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => setOpenId(c.id)}
                    className="hover:bg-panelAlt/20 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                          <Building2 size={14} />
                        </div>
                        <div>
                          <p className="text-paper font-semibold">{c.name}</p>
                          <p className="text-fog font-mono text-[10px]">#{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-paper font-semibold">{c.planName}</span>
                      <span className="text-fog font-mono text-[10px] ml-1.5">
                        {c.monthlyUsdPerUser === 0 ? 'Free' : `$${c.monthlyUsdPerUser}/u`}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-paper">{fmt(c.membersUsed)}</td>
                    <td className="px-4 py-3 font-mono text-fog">{fmt(c.teamsUsed)}</td>
                    <td className="px-4 py-3 font-mono text-completed">${fmt(c.monthlyBillUsd)}/mo</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-accent font-mono text-[11px]">view →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {openId != null && (
        <DetailModal
          id={openId}
          onClose={() => setOpenId(null)}
          onDeleted={() => { setOpenId(null); load() }}
        />
      )}
    </div>
  )
}
