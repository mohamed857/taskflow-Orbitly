import { useEffect, useState } from 'react'
import { X, ArrowLeft, Plus, GitBranch, Calendar, Clock } from 'lucide-react'
import { tasks as tasksApi, users as usersApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import StatusChip from './StatusChip.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import Avatar from './Avatar.jsx'
import { avatarSrc } from '../api/client.js'
import { displayName } from '../utils/userDisplay.js'
import AttachmentSection from './AttachmentSection.jsx'
import CommentThread from './CommentThread.jsx'
import TaskForm from './TaskForm.jsx'
import Portal from './Portal.jsx'

function formatDue(dueDate) {
  if (!dueDate) return 'No due date'
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return dueDate

  const isOverdue = d < new Date()
  const formatted = d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return { formatted, isOverdue }
}

function PersonRow({ label, person }) {
  return (
    <div className="flex items-center gap-2 text-sm min-w-0">
      <span className="text-fog text-xs font-mono w-20 shrink-0 font-medium">{label}</span>
      {person ? (
        <div className="flex items-center gap-2 min-w-0 truncate">
          <Avatar
            name={displayName(person)}
            size={22}
            src={avatarSrc(person.avatarUrl)}
          />
          <span className="text-paper truncate font-semibold text-xs">
            {displayName(person)}
          </span>
        </div>
      ) : (
        <span className="text-fog/80 font-mono text-xs italic">Unassigned</span>
      )}
    </div>
  )
}

export default function TaskDetailModal({ task, onClose }) {
  const { hasRole } = useAuth()
  const { push } = useToast()
  const [viewedTask, setViewedTask] = useState(task)
  const [subtasks, setSubtasks] = useState([])
  const [loadingSubtasks, setLoadingSubtasks] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [users, setUsers] = useState([])

  const canManage = hasRole('ADMIN', 'MANAGER', 'TEAM_LEAD')
  const isSubtask = Boolean(viewedTask?.parentTaskId)

  useEffect(() => {
    setViewedTask(task)
  }, [task])

  // ESC Key listener to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Fetch subtasks on viewedTask change
  useEffect(() => {
    if (!viewedTask || isSubtask) {
      setSubtasks([])
      return
    }
    let cancelled = false
    setLoadingSubtasks(true)
    tasksApi
      .subtasks(viewedTask.id)
      .then((data) => !cancelled && setSubtasks(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => !cancelled && setLoadingSubtasks(false))

    return () => {
      cancelled = true
    }
  }, [viewedTask, isSubtask])

  // Fetch users for subtask creation modal
  // Fetch users for subtask creation modal
useEffect(() => {
  if (!formOpen || users.length > 0) return

  let cancelled = false

  const loadUsers = async () => {
    try {
      // طلب المستخدمين المتاحين للـ Workspace/Team حسب صلاحيات المستخدم الحالية
      const data = await usersApi.listInWorkspace()
      if (!cancelled) {
        setUsers(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load users for subtask creation:', err)
    }
  }

  loadUsers()

  return () => {
    cancelled = true
  }
}, [formOpen, users.length])

  if (!viewedTask) return null

  const createSubtask = async (payload) => {
    try {
      const created = await tasksApi.create({ ...payload, parentTaskId: viewedTask.id })
      setSubtasks((cur) => [...cur, created])
      push('Sub-task created successfully.', 'success')
      setFormOpen(false)
    } catch (err) {
      push(err.message || 'Failed to create sub-task.', 'error')
      throw err // keep the sub-task drawer open on failure
    }
  }

  const dueInfo = formatDue(viewedTask.dueDate)
  const isTaskOverdue =
    viewedTask.status === 'OVERDUE' ||
    (typeof dueInfo === 'object' && dueInfo.isOverdue && viewedTask.status !== 'COMPLETED')

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
        {/* Darker, opaque Backdrop to focus attention */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Modal Container with solid background and clean borders */}
        <div className="relative console-panel bg-panel w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-panelBorder/90 z-10 animate-in zoom-in-95 duration-150">
          
          {/* Header Bar */}
          <div className="p-5 pb-4 border-b border-panelBorder/80 bg-panelAlt/40 space-y-3">
            {isSubtask && (
              <button
                type="button"
                onClick={() => setViewedTask(task)}
                className="inline-flex items-center gap-1.5 text-xs text-accent hover:underline font-mono transition-colors cursor-pointer"
              >
                <ArrowLeft size={13} /> back to parent task
              </button>
            )}

            <div className="flex items-start justify-between gap-3">
              <h2 className="font-display text-lg font-bold text-paper leading-snug tracking-wide">
                {viewedTask.title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded text-fog hover:text-paper hover:bg-panelAlt transition-colors shrink-0 cursor-pointer"
                title="Close (Esc)"
              >
                <X size={18} />
              </button>
            </div>

            {/* Badges & Due Date */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <StatusChip status={viewedTask.status} variant="pill" />
              <PriorityBadge priority={viewedTask.priority} variant="pill" />
              <div
                className={`inline-flex items-center gap-1.5 font-mono text-xs px-2 py-0.5 rounded border ${
                  isTaskOverdue
                    ? 'text-overdue bg-overdue/10 border-overdue/30 font-semibold'
                    : 'text-fog bg-panelAlt/80 border-panelBorder/60'
                }`}
              >
                {isTaskOverdue ? <Clock size={12} /> : <Calendar size={12} />}
                <span>
                  {typeof dueInfo === 'object' ? dueInfo.formatted : dueInfo}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-5 overflow-y-auto custom-scrollbar space-y-5 flex-1 bg-panel">
            {/* Description - Darker background for text contrast */}
            {viewedTask.description && (
              <div className="bg-panelAlt/80 rounded-lg p-4 border border-panelBorder/80 shadow-inner">
                <p className="text-xs text-paper/90 leading-relaxed whitespace-pre-wrap font-normal">
                  {viewedTask.description}
                </p>
              </div>
            )}

            {/* Attribution Details - Solid Box */}
            <div className="space-y-2.5 p-3.5 bg-panelAlt/60 rounded-lg border border-panelBorder/70">
              <PersonRow label="reporter" person={viewedTask.reporter} />
              <div className="border-t border-panelBorder/40 my-1" />
              <PersonRow label="assignee" person={viewedTask.assignee} />
            </div>

            {/* Sub-tasks Section */}
            {!isSubtask && (
              <div className="space-y-3 pt-3 border-t border-panelBorder/80">
                <div className="flex items-center justify-between">
                  <p className="label-eyebrow flex items-center gap-1.5 text-xs font-mono text-paper font-bold">
                    <GitBranch size={13} className="text-accent" />
                    <span>Sub-tasks</span>
                    {subtasks.length > 0 && (
                      <span className="text-fog font-medium">({subtasks.length})</span>
                    )}
                  </p>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setFormOpen(true)}
                      className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-mono font-semibold cursor-pointer"
                    >
                      <Plus size={12} /> add sub-task
                    </button>
                  )}
                </div>

                {loadingSubtasks ? (
                  <p className="text-xs text-fog font-mono py-1">loading sub-tasks…</p>
                ) : subtasks.length === 0 ? (
                  <p className="text-xs text-fog/80 font-mono py-1">No sub-tasks attached.</p>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setViewedTask(st)}
                        className="w-full flex items-center justify-between gap-3 text-left px-3.5 py-2.5 rounded-lg border border-panelBorder/80 bg-panelAlt/80 hover:bg-panelAlt hover:border-accent/60 transition-all group cursor-pointer shadow-xs"
                      >
                        <span className="text-xs text-paper font-semibold truncate group-hover:text-accent transition-colors">
                          {st.title}
                        </span>
                        <StatusChip status={st.status} variant="pill" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            <div className="pt-4 border-t border-panelBorder/80">
              <AttachmentSection taskId={viewedTask.id} task={viewedTask} />
            </div>

            {/* Comments Thread */}
            <div className="pt-4 border-t border-panelBorder/80">
              <CommentThread taskId={viewedTask.id} />
            </div>
          </div>
        </div>

        {/* Task Form Modal for Subtask Creation */}
        {canManage && (
          <TaskForm
            open={formOpen}
            initialTask={null}
            users={users}
            onClose={() => setFormOpen(false)}
            onSubmit={createSubtask}
          />
        )}
      </div>
    </Portal>
  )
}