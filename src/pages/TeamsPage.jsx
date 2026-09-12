import { useEffect, useState, useRef } from 'react'
import { Users2, Plus, Pencil, Trash2, Loader2, Sparkles, Check, X } from 'lucide-react'
import { teams as teamsApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import TeamDetailModal from '../components/TeamDetailModal.jsx'

function formatDate(value) {
  if (!value) return 'unknown'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TeamsPage() {
  const { hasRole } = useAuth()
  const { push } = useToast()
  const canCreate = hasRole('ADMIN', 'MANAGER')
  const canRename = hasRole('ADMIN', 'MANAGER')
  const canDelete = hasRole('ADMIN', 'MANAGER')
  // Admin/Manager can open a team to see its members and tasks.
  const canViewDetail = hasRole('ADMIN', 'MANAGER')
  const [detailTeam, setDetailTeam] = useState(null)

  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  // Inline Editing States
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [renaming, setRenaming] = useState(false)

  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)

    teamsApi
      .list()
      .then((data) => {
        if (isMountedRef.current) setList(data)
      })
      .catch((err) => {
        if (isMountedRef.current) push(err.message || 'Could not load teams.', 'error')
      })
      .finally(() => {
        if (isMountedRef.current) setLoading(false)
      })

    return () => {
      isMountedRef.current = false
    }
  }, [push])

  const handleCreate = async (e) => {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) return

    setCreating(true)
    try {
      const created = await teamsApi.create(trimmed)
      if (isMountedRef.current) {
        setList((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)))
        setNewName('')
        push('Team created successfully.')
      }
    } catch (err) {
      push(err.message || 'Could not create team.', 'error')
    } finally {
      if (isMountedRef.current) setCreating(false)
    }
  }

  const startRename = (team) => {
    setEditingId(team.id)
    setEditingName(team.name)
  }

  const cancelRename = () => {
    setEditingId(null)
    setEditingName('')
  }

  const saveRename = async (id) => {
    const trimmed = editingName.trim()
    if (!trimmed) return

    setRenaming(true)
    try {
      await teamsApi.rename(id, trimmed)
      if (isMountedRef.current) {
        setList((prev) =>
          prev
            .map((t) => (t.id === id ? { ...t, name: trimmed } : t))
            .sort((a, b) => a.name.localeCompare(b.name))
        )
        cancelRename()
        push('Team renamed successfully.')
      }
    } catch (err) {
      push(err.message || 'Could not rename team.', 'error')
    } finally {
      if (isMountedRef.current) setRenaming(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return

    try {
      await teamsApi.remove(id)
      if (isMountedRef.current) {
        setList((prev) => prev.filter((t) => t.id !== id))
        push('Team deleted successfully.')
      }
    } catch (err) {
      push(err.message || 'Could not delete team.', 'error')
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Context Summary Header */}
      <div className="glass-panel p-4 border border-panelBorder/80 flex items-center justify-between gap-4">
        <p className="text-xs font-mono text-fog">
          <strong className="text-paper">{list.length}</strong> team{list.length === 1 ? '' : 's'} active in workspace.
          Team Lead scope applies directly to team rosters.
        </p>
      </div>

      {/* Creation Form */}
      {canCreate && (
        <form onSubmit={handleCreate} className="glass-panel p-4 flex flex-col sm:flex-row gap-3 border border-panelBorder/80">
          <input
            className="input-field flex-1 text-xs py-2"
            placeholder="New team name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            type="submit"
            disabled={creating || !newName.trim()}
            className="btn-primary shrink-0 py-2 px-4 text-xs flex items-center justify-center gap-1.5"
          >
            {creating ? (
              <>
                <Loader2 size={14} className="animate-spin text-accent" />
                <span>Creating…</span>
              </>
            ) : (
              <>
                <Plus size={15} />
                <span>Create Team</span>
              </>
            )}
          </button>
        </form>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
          <p className="font-mono text-xs text-fog">Loading workspace teams…</p>
        </div>
      ) : list.length === 0 ? (
        /* Empty State */
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-3">
            <Sparkles size={20} />
          </div>
          <p className="font-display text-base font-bold text-paper mb-1">No Teams Configured</p>
          <p className="text-xs text-fog max-w-sm mx-auto">
            {canCreate ? 'Get started by creating your first team using the form above.' : 'Ask a Workspace Owner or Manager to create a team.'}
          </p>
        </div>
      ) : (
        /* Team Grid Cards */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((t) => (
            <div
              key={t.id}
              className="glass-panel p-4 flex items-start justify-between gap-3 border border-panelBorder/80 hover:border-accent/40 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                  <Users2 size={18} />
                </div>
                
                <div className="min-w-0 flex-1">
                  {editingId === t.id ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <input
                        type="text"
                        className="input-field text-xs py-1 px-2 w-full"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        autoFocus
                      />
                      <button
                        onClick={() => saveRename(t.id)}
                        disabled={renaming || !editingName.trim()}
                        className="p-1 text-accent hover:bg-accent/10 rounded"
                        title="Save"
                      >
                        {renaming ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                      </button>
                      <button
                        onClick={cancelRename}
                        className="p-1 text-fog hover:bg-panelAlt/60 rounded"
                        title="Cancel"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      {canViewDetail ? (
                        <button
                          onClick={() => setDetailTeam(t)}
                          className="text-paper text-sm font-bold truncate group-hover:text-accent transition-colors text-left hover:underline"
                          title="View team members & tasks"
                        >
                          {t.name}
                        </button>
                      ) : (
                        <p className="text-paper text-sm font-bold truncate group-hover:text-accent transition-colors">
                          {t.name}
                        </p>
                      )}
                      <p className="text-fog text-[11px] font-mono mt-0.5">Created {formatDate(t.createdAt)}</p>
                    </>
                  )}
                </div>
              </div>

              {editingId !== t.id && (canRename || canDelete) && (
                <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                  {canRename && (
                    <button
                      onClick={() => startRename(t)}
                      className="p-1.5 text-fog hover:text-paper hover:bg-panelAlt/60 rounded-md transition-colors"
                      title="Rename team"
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1.5 text-fog hover:text-overdue hover:bg-overdue/10 rounded-md transition-colors"
                      title="Delete team"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {detailTeam && (
        <TeamDetailModal team={detailTeam} onClose={() => setDetailTeam(null)} />
      )}
    </div>
  )
}