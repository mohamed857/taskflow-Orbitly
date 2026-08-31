import React, { useEffect, useState, useRef } from 'react'
import { X, Calendar, User, AlertCircle, Loader2, Tag, Plus, Users2, Paperclip } from 'lucide-react'
import { toApiDateTime } from '../utils/date.js'
import { labels as labelsApi, teams as teamsApi, attachments as attachmentsApi } from '../api/client.js'
import { PRIORITY_OPTIONS } from './PriorityBadge.jsx'
import { displayName } from '../utils/userDisplay.js'
import Portal from './Portal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const EMPTY = {
  title: '',
  description: '',
  dueDate: '',
  assigneeId: '',
  priority: 'MEDIUM',
  teamId: ''
}

// Helper to format ISO date string to HTML datetime-local format (YYYY-MM-DDTHH:mm)
function formatForInput(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  if (Number.isNaN(d.getTime())) return dateString.slice(0, 16)
  
  const pad = (n) => String(n).padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export default function TaskForm({
  open,
  initialTask,
  users = [],
  defaultDueDate,
  onClose,
  onSubmit
}) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [labelList, setLabelList] = useState([])
  const [selectedLabelIds, setSelectedLabelIds] = useState([])
  const [newLabelName, setNewLabelName] = useState('')
  const [creatingLabel, setCreatingLabel] = useState(false)
  const [teamList, setTeamList] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const fileInputRef = useRef(null)
  const isEdit = Boolean(initialTask)
  const { user } = useAuth()

  // A Team Lead may only file tasks under their own team, so scope the picker to
  // it. Admins and Managers keep the full workspace team list.
  const isTeamLeadOnly = user?.role === 'TEAM_LEAD'
  const visibleTeams = isTeamLeadOnly
    ? teamList.filter((tm) => tm.id === user?.teamId)
    : teamList

  useEffect(() => {
    if (initialTask) {
      setForm({
        title: initialTask.title ?? '',
        description: initialTask.description ?? '',
        dueDate: formatForInput(initialTask.dueDate),
        assigneeId: initialTask.assignee?.id ?? '',
        priority: initialTask.priority ?? 'MEDIUM',
        teamId: initialTask.team?.id ?? ''
      })
      setSelectedLabelIds((initialTask.labels ?? []).map((l) => l.id))
    } else {
      setForm({ ...EMPTY, dueDate: formatForInput(defaultDueDate) ?? '' })
      setSelectedLabelIds([])
    }
    setPendingFiles([])
    setError(null)
  }, [initialTask, open, defaultDueDate])

  // Load the workspace's teams when the form opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    teamsApi.list()
      .then((data) => { if (!cancelled) setTeamList(Array.isArray(data) ? data : []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  // Load the workspace's labels when the form opens.
  useEffect(() => {
    if (!open) return
    let cancelled = false
    labelsApi.list()
      .then((data) => { if (!cancelled) setLabelList(Array.isArray(data) ? data : []) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [open])

  const toggleLabel = (id) =>
    setSelectedLabelIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))

  const createLabel = async () => {
    const name = newLabelName.trim()
    if (!name || creatingLabel) return
    setCreatingLabel(true)
    try {
      const created = await labelsApi.create(name)
      setLabelList((cur) => [...cur, created].sort((a, b) => a.name.localeCompare(b.name)))
      setSelectedLabelIds((cur) => [...cur, created.id])
      setNewLabelName('')
    } catch (err) {
      setError(err.message || 'Could not create the label.')
    } finally {
      setCreatingLabel(false)
    }
  }

  // Close on Escape key press
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !saving) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, saving, onClose])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Client-side validation — catch problems here before hitting the API.
    const title = form.title.trim()
    if (!title) {
      setError('Please enter a title for the task.')
      return
    }
    if (title.length > 200) {
      setError('The title is too long (keep it under 200 characters).')
      return
    }
    if (form.dueDate) {
      const due = new Date(form.dueDate)
      if (Number.isNaN(due.getTime())) {
        setError('That due date looks invalid — pick a date and time, or clear it.')
        return
      }
      // Only guard new tasks; an existing task may legitimately be overdue.
      if (!isEdit && due.getTime() < Date.now()) {
        setError('The due date can’t be in the past.')
        return
      }
    }

    setSaving(true)
    try {
      const dueDate = toApiDateTime(form.dueDate)
      const created = await onSubmit({
        title,
        description: form.description.trim(),
        dueDate,
        assigneeId: form.assigneeId ? Number(form.assigneeId) : null,
        priority: form.priority,
        labelIds: selectedLabelIds,
        teamId: form.teamId ? Number(form.teamId) : null
      })

      // On a fresh task, upload any files the user attached during creation.
      if (!isEdit && pendingFiles.length && created?.id) {
        for (const file of pendingFiles) {
          try {
            await attachmentsApi.upload(created.id, file, { silent: true })
          } catch {
            /* a failed attachment shouldn't undo the created task */
          }
        }
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Could not save the task.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={saving ? undefined : onClose}
        />

        {/* Slide-over Drawer Panel */}
        <div className="relative w-full max-w-md h-full bg-panel border-l border-panelBorder shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 pb-4 border-b border-panelBorder/60 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-paper">
              {isEdit ? 'Edit task' : 'New task'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1 rounded text-fog hover:text-paper hover:bg-panelAlt/60 transition-colors disabled:opacity-50 cursor-pointer"
              title="Close (Esc)"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content Body */}
          <form
            onSubmit={handleSubmit}
            className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4 flex flex-col"
          >
            <div className="space-y-4 flex-1">
              {/* Title */}
              <div>
                <label
                  className="label-eyebrow block mb-1.5 font-mono text-xs text-fog"
                  htmlFor="title"
                >
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  id="title"
                  required
                  className="input-field w-full bg-panelAlt/40 border border-panelBorder rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Design the sprint retro board"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  className="label-eyebrow block mb-1.5 font-mono text-xs text-fog"
                  htmlFor="description"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  rows={4}
                  className="input-field w-full bg-panelAlt/40 border border-panelBorder rounded-md px-3 py-2 text-sm text-paper resize-none focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Add context for the assignee..."
                />
              </div>

              {/* Priority & Due Date Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    className="label-eyebrow block mb-1.5 font-mono text-xs text-fog"
                    htmlFor="priority"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    className="input-field w-full bg-panelAlt/40 border border-panelBorder rounded-md px-2.5 py-2 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors cursor-pointer"
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p} className="bg-panel text-paper">
                        {p.charAt(0) + p.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className="label-eyebrow block mb-1.5 font-mono text-xs text-fog"
                    htmlFor="dueDate"
                  >
                    Due date
                  </label>
                  <input
                    id="dueDate"
                    type="datetime-local"
                    min={!isEdit ? formatForInput(new Date().toISOString()) : undefined}
                    className="input-field w-full bg-panelAlt/40 border border-panelBorder rounded-md px-2.5 py-2 text-xs text-paper focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors"
                    value={form.dueDate}
                    onChange={(e) =>
                      setForm({ ...form, dueDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Assignee Selection */}
              <div>
                <label
                  className="label-eyebrow block mb-1.5 font-mono text-xs text-fog"
                  htmlFor="assignee"
                >
                  Assignee
                </label>
                <select
                  id="assignee"
                  className="input-field w-full bg-panelAlt/40 border border-panelBorder rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors cursor-pointer"
                  value={form.assigneeId}
                  onChange={(e) =>
                    setForm({ ...form, assigneeId: e.target.value })
                  }
                >
                  <option value="" className="bg-panel text-fog">
                    Unassigned
                  </option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id} className="bg-panel text-paper">
                      {displayName(u)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Team */}
              <div>
                <label
                  className="label-eyebrow flex items-center gap-1.5 mb-1.5 font-mono text-xs text-fog"
                  htmlFor="team"
                >
                  <Users2 size={12} /> Team
                </label>
                <select
                  id="team"
                  className="input-field w-full bg-panelAlt/40 border border-panelBorder rounded-md px-3 py-2 text-sm text-paper focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors cursor-pointer"
                  value={form.teamId}
                  onChange={(e) => setForm({ ...form, teamId: e.target.value })}
                >
                  <option value="" className="bg-panel text-fog">
                    Default (your team)
                  </option>
                  {visibleTeams.map((tm) => (
                    <option key={tm.id} value={tm.id} className="bg-panel text-paper">
                      {tm.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Attachments (new task only) */}
              {!isEdit && (
                <div>
                  <label className="label-eyebrow flex items-center gap-1.5 mb-1.5 font-mono text-xs text-fog">
                    <Paperclip size={12} /> Attachments
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const picked = Array.from(e.target.files || [])
                      e.target.value = ''
                      if (picked.length) setPendingFiles((cur) => [...cur, ...picked])
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost text-xs px-2.5 py-1.5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> add files
                  </button>
                  {pendingFiles.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {pendingFiles.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between gap-2 text-[11px] text-fog bg-panelAlt/40 border border-panelBorder/60 rounded px-2 py-1"
                        >
                          <span className="truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() => setPendingFiles((cur) => cur.filter((_, x) => x !== i))}
                            className="text-fog hover:text-overdue shrink-0"
                            title="Remove"
                          >
                            <X size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Labels */}
              <div>
                <label className="label-eyebrow flex items-center gap-1.5 mb-1.5 font-mono text-xs text-fog">
                  <Tag size={12} /> Labels
                </label>
                {labelList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {labelList.map((l) => {
                      const selected = selectedLabelIds.includes(l.id)
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => toggleLabel(l.id)}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border transition-all ${
                            selected ? '' : 'opacity-50 hover:opacity-100'
                          }`}
                          style={{
                            color: l.color,
                            borderColor: `${l.color}66`,
                            backgroundColor: selected ? `${l.color}22` : 'transparent'
                          }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: l.color }} />
                          {l.name}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        createLabel()
                      }
                    }}
                    placeholder="New label…"
                    className="input-field flex-1 text-xs py-1.5 px-2.5 bg-panelAlt/40 border border-panelBorder rounded-md"
                  />
                  <button
                    type="button"
                    onClick={createLabel}
                    disabled={creatingLabel || !newLabelName.trim()}
                    className="btn-ghost text-xs px-2 py-1.5 inline-flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                  >
                    {creatingLabel ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} add
                  </button>
                </div>
              </div>

              {/* Error Message Display */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-overdue/10 border border-overdue/20 text-overdue text-xs font-mono">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-panelBorder/60 mt-auto">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 inline-flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Saving…</span>
                  </>
                ) : isEdit ? (
                  'Save changes'
                ) : (
                  'Create task'
                )
                }
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="btn-ghost py-2 px-4 rounded-md text-sm text-fog hover:text-paper transition-colors disabled:opacity-50 cursor-pointer"
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