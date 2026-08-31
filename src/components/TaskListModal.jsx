import { useEffect, useState } from 'react'
import { X, Loader2, ListChecks } from 'lucide-react'
import Portal from './Portal.jsx'
import Avatar from './Avatar.jsx'
import TaskDetailModal from './TaskDetailModal.jsx'
import { avatarSrc } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { displayName } from '../utils/userDisplay.js'

const STATUS_DOT = {
  PENDING: 'bg-pending',
  IN_PROGRESS: 'bg-inprogress',
  COMPLETED: 'bg-completed',
  OVERDUE: 'bg-overdue'
}

// Read-only panel that loads a list of tasks (via `loader`) and lets the viewer
// open any of them. Used for "this user's tasks" and "this team's tasks".
export default function TaskListModal({ title, subtitle, loader, onClose }) {
  const { push } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [openTask, setOpenTask] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.resolve(loader())
      .then((data) => { if (alive) setTasks(Array.isArray(data) ? data : []) })
      .catch((err) => { if (alive) push(err.message || 'Could not load tasks.', 'error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={onClose}>
        <div
          className="relative glass-panel w-full max-w-lg max-h-[80vh] flex flex-col rounded-xl border border-panelBorder shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 p-5 border-b border-panelBorder/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <ListChecks size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-paper truncate">{title}</h2>
                {subtitle && <p className="text-[11px] text-fog font-mono truncate">{subtitle}</p>}
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-fog hover:text-paper rounded-lg transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-14 text-fog gap-2">
                <Loader2 size={20} className="animate-spin text-accent" />
                <span className="text-xs font-mono">Loading tasks…</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm text-fog font-mono">No tasks yet.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setOpenTask(t)}
                    className="w-full flex items-center gap-2.5 text-left px-3 py-2.5 rounded-lg bg-panelAlt/40 hover:bg-accent/10 border border-panelBorder/40 transition-colors"
                  >
                    <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[t.status] ?? 'bg-fog'}`} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-paper font-medium truncate">{t.title}</span>
                      {t.teamName && <span className="block text-[10px] text-fog font-mono">{t.teamName}</span>}
                    </span>
                    {t.assignee && (
                      <Avatar name={displayName(t.assignee)} size={22} src={avatarSrc(t.assignee.avatarUrl)} />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />
    </Portal>
  )
}
