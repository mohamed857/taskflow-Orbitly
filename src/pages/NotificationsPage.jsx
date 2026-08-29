import { useEffect, useState } from 'react'
import { Bell, Check, UserPlus, MessageSquare, ShieldAlert, AlertTriangle, Loader2, RefreshCw, Users } from 'lucide-react'
import { notifications as notificationsApi, tasks as tasksApi } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import TaskDetailModal from '../components/TaskDetailModal.jsx'
import { parseServerDate } from '../utils/serverTime.js'

const ICONS = {
  TASK_ASSIGNED: UserPlus,
  TASK_COMMENTED: MessageSquare,
  TASK_STATUS_CHANGED: RefreshCw,
  TASK_OVERDUE: AlertTriangle,
  ROLE_CHANGED: ShieldAlert,
  TEAM_CHANGED: Users
}

function formatWhen(dateStr) {
  const d = parseServerDate(dateStr)
  if (!d) return ''
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Full-page notifications view. On mobile the bell routes here instead of
// opening a dropdown that doesn't fit the screen.
export default function NotificationsPage() {
  const { push } = useToast()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingTaskId, setLoadingTaskId] = useState(null)
  const [openTask, setOpenTask] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    notificationsApi
      .list()
      .then((data) => { if (alive) setList(Array.isArray(data) ? data : []) })
      .catch((err) => { if (alive) push(err.message || 'Could not load notifications.', 'error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [push])

  const handleItemClick = async (n) => {
    if (!n.read) {
      setList((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      notificationsApi.markAsRead(n.id).catch(() => {})
    }
    if (n.relatedTaskId) {
      setLoadingTaskId(n.id)
      try {
        const task = await tasksApi.get(n.relatedTaskId)
        setOpenTask(task)
      } catch {
        push('That task is no longer available.', 'error')
      } finally {
        setLoadingTaskId(null)
      }
    }
  }

  const markAllRead = async () => {
    setList((cur) => cur.map((x) => ({ ...x, read: true })))
    try {
      await notificationsApi.markAllAsRead()
    } catch (err) {
      push(err.message || 'Could not mark all as read.', 'error')
    }
  }

  return (
    <div className="space-y-4 animate-enter">
      <div className="glass-panel p-4 flex items-center justify-between border border-panelBorder/80">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Bell size={17} />
          </div>
          <h2 className="font-display text-lg font-bold tracking-tight text-paper">Notifications</h2>
        </div>
        {list.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-mono font-medium transition-colors"
          >
            <Check size={13} /> Mark all read
          </button>
        )}
      </div>

      <div className="glass-panel overflow-hidden border border-panelBorder/80 divide-y divide-panelBorder/40">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-fog gap-2">
            <Loader2 size={20} className="animate-spin text-accent" />
            <span className="text-xs font-mono">Loading notifications…</span>
          </div>
        ) : list.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-fog font-mono">You're all caught up. 🎉</p>
          </div>
        ) : (
          list.map((n) => {
            const Icon = ICONS[n.type] ?? Bell
            const isUnread = !n.read
            const isLoadingThisTask = loadingTaskId === n.id
            return (
              <button
                key={n.id}
                type="button"
                disabled={isLoadingThisTask}
                onClick={() => handleItemClick(n)}
                className={`w-full flex items-start gap-3 text-left px-4 py-3.5 hover:bg-panelAlt/50 transition-colors disabled:opacity-50 ${
                  isUnread ? 'bg-accent/5' : 'opacity-70'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${n.type === 'TASK_OVERDUE' ? 'bg-overdue/10 text-overdue' : 'bg-accent/10 text-accent'}`}>
                  {isLoadingThisTask ? <Loader2 size={15} className="animate-spin" /> : <Icon size={15} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm leading-relaxed ${isUnread ? 'text-paper font-medium' : 'text-paper/80'}`}>{n.message}</p>
                  <p className="text-[11px] text-fog font-mono mt-1">{formatWhen(n.createdAt)}</p>
                </div>
                {isUnread && <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-2" />}
              </button>
            )
          })
        )}
      </div>

      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}
