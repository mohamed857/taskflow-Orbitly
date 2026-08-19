import { useEffect, useState, useRef } from 'react'
import { Building2, Pencil, Check, X, Trash2, AlertTriangle, Loader2 } from 'lucide-react'
import { workspaces as workspacesApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

function formatDate(value) {
  if (!value) return 'unknown'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function WorkspacesPage() {
  const { hasRole, logout } = useAuth()
  const { push } = useToast()
  
  const canRename = hasRole('ADMIN', 'MANAGER')
  const canDelete = hasRole('ADMIN')

  const [workspace, setWorkspace] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isMountedRef = useRef(true)
  const redirectTimeoutRef = useRef(null)

  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)

    workspacesApi
      .mine()
      .then((data) => {
        if (isMountedRef.current) setWorkspace(data)
      })
      .catch((err) => {
        if (isMountedRef.current) push(err.message || 'Could not load your workspace.', 'error')
      })
      .finally(() => {
        if (isMountedRef.current) setLoading(false)
      })

    return () => {
      isMountedRef.current = false
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current)
    }
  }, [push])

  const startEdit = () => {
    setEditValue(workspace?.name || '')
    setEditing(true)
  }

  const submitEdit = async () => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === workspace?.name) {
      setEditing(false)
      return
    }

    setSaving(true)
    try {
      const updated = await workspacesApi.rename(trimmed)
      if (isMountedRef.current) {
        setWorkspace((prev) => ({ ...prev, name: updated?.name ?? trimmed }))
        push('Workspace renamed successfully.')
        setEditing(false)
      }
    } catch (err) {
      if (isMountedRef.current) push(err.message || 'Could not rename workspace.', 'error')
    } finally {
      if (isMountedRef.current) setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await workspacesApi.deleteMine()
      if (isMountedRef.current) {
        push('Workspace deleted. Signing out…')
      }
      
      redirectTimeoutRef.current = setTimeout(() => {
        if (typeof logout === 'function') logout()
        window.location.href = '/login'
      }, 1200)
    } catch (err) {
      if (isMountedRef.current) {
        push(err.message || 'Could not delete workspace.', 'error')
        setDeleting(false)
        setConfirmingDelete(false)
      }
    }
  }

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center max-w-xl border border-panelBorder/60 animate-enter">
        <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
        <p className="font-mono text-xs text-fog">Loading workspace details…</p>
      </div>
    )
  }

  if (!workspace) return null

  return (
    <div className="space-y-6 max-w-xl animate-enter">
      {/* Primary Workspace Card */}
      <div className="glass-panel p-5 border border-panelBorder/80 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
            <Building2 size={20} />
          </div>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  disabled={saving}
                  className="input-field py-1 px-2.5 text-xs flex-1"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitEdit()
                    if (e.key === 'Escape') setEditing(false)
                  }}
                />
                <button
                  onClick={submitEdit}
                  disabled={saving || !editValue.trim()}
                  className="p-1 text-completed hover:bg-completed/10 rounded-md transition-colors disabled:opacity-50"
                  aria-label="Save"
                >
                  {saving ? <Loader2 size={16} className="animate-spin text-accent" /> : <Check size={16} />}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={saving}
                  className="p-1 text-fog hover:bg-panelAlt/60 rounded-md transition-colors"
                  aria-label="Cancel"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-paper text-base font-display font-bold truncate">{workspace.name}</p>
                {canRename && (
                  <button
                    onClick={startEdit}
                    className="p-1 text-fog hover:text-paper hover:bg-panelAlt/60 rounded-md transition-colors shrink-0"
                    aria-label="Rename workspace"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            )}
            <p className="text-fog text-[11px] font-mono mt-1">Created {formatDate(workspace.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Danger Zone Section */}
      {canDelete && (
        <div className="glass-panel p-5 space-y-3 border border-overdue/30 bg-overdue/5">
          <p className="text-[10px] font-mono uppercase tracking-wider text-overdue font-bold">Danger Zone</p>
          {!confirmingDelete ? (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-overdue hover:underline"
            >
              <Trash2 size={14} />
              <span>Delete this workspace</span>
            </button>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="flex items-start gap-2.5 p-3 rounded-md bg-overdue/10 border border-overdue/20">
                <AlertTriangle size={15} className="text-overdue shrink-0 mt-0.5" />
                <p className="text-xs text-fog leading-relaxed">
                  Workspace deletion requires removing all other assigned members first. This action is permanent and cannot be undone.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="text-xs text-white bg-overdue hover:bg-overdue/90 font-medium rounded-md px-3 py-1.5 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Deleting…</span>
                    </>
                  ) : (
                    <span>Yes, delete workspace</span>
                  )}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="btn-ghost py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}