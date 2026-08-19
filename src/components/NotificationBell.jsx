import { useEffect, useRef, useState } from 'react'
import { Bell, Check, UserPlus, MessageSquare, ShieldAlert, AlertTriangle, Loader2, RefreshCw, Users } from 'lucide-react'
import { notifications as notificationsApi, tasks as tasksApi } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import TaskDetailModal from './TaskDetailModal.jsx'

const ICONS = {
  TASK_ASSIGNED: UserPlus,
  TASK_COMMENTED: MessageSquare,
  TASK_STATUS_CHANGED: RefreshCw,
  TASK_OVERDUE: AlertTriangle,
  ROLE_CHANGED: ShieldAlert,
  TEAM_CHANGED: Users
}

function formatWhen(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function NotificationBell() {
  const { push } = useToast()
  const [open, setOpen] = useState(false)
  const [list, setList] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingTaskId, setLoadingTaskId] = useState(null)
  const [openTask, setOpenTask] = useState(null)
  const ref = useRef(null)

  const refreshUnread = () => {
    notificationsApi
      .unreadCount()
      .then((res) => setUnread(res?.unread ?? 0))
      .catch(() => {})
  }

  // Periodic polling for unread count
  useEffect(() => {
    let isMounted = true
    refreshUnread()
    const interval = setInterval(() => {
      if (isMounted) refreshUnread()
    }, 60000) // Changed to 1 min interval for better precision

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  // Fetch notifications on dropdown open
  useEffect(() => {
    if (!open) return
    let isMounted = true
    setLoading(true)

    notificationsApi
      .list()
      .then((data) => {
        if (isMounted) {
          const items = Array.isArray(data) ? data : []
          setList(items)
          // Dynamically compute exact unread count
          const unreadCount = items.filter((n) => !n.read).length
          setUnread(unreadCount)
        }
      })
      .catch((err) => {
        if (isMounted) push(err.message || 'Could not load notifications.', 'error')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [open, push])

  // Outside click & ESC dismissal
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleItemClick = async (n) => {
    if (!n.read) {
      setList((cur) => cur.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      setUnread((c) => Math.max(0, c - 1))
      notificationsApi.markAsRead(n.id).catch(() => {})
    }

    if (n.relatedTaskId) {
      setLoadingTaskId(n.id)
      try {
        const task = await tasksApi.get(n.relatedTaskId)
        setOpen(false)
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
    setUnread(0)
    try {
      await notificationsApi.markAllAsRead()
    } catch (err) {
      push(err.message || 'Could not mark all as read.', 'error')
    }
  }

  return (
    <div className="relative" ref={ref}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative text-fog hover:text-paper rounded-lg p-2 hover:bg-panelAlt/60 transition-colors focus:outline-none focus:ring-1 focus:ring-accent/50 cursor-pointer"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-overdue text-white text-[10px] font-mono font-medium flex items-center justify-center shadow-sm animate-in zoom-in-50">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-84 glass-panel rounded-xl border border-panelBorder/80 z-50 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-panel/60 border-b border-panelBorder/60">
            <span className="label-eyebrow font-display tracking-wider">Notifications</span>
            {list.some((n) => !n.read) && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80 font-mono font-medium transition-colors cursor-pointer"
              >
                <Check size={12} />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List Body */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-panelBorder/40 bg-panel/30">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8 text-fog gap-1.5">
                <Loader2 size={18} className="animate-spin text-accent" />
                <span className="text-xs font-mono">Loading notifications…</span>
              </div>
            ) : list.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs text-fog font-mono">You're all caught up. 🎉</p>
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
                    className={`w-full flex items-start gap-3 text-left px-3.5 py-2.5 hover:bg-panelAlt/60 transition-colors cursor-pointer disabled:opacity-50 ${
                      isUnread ? 'bg-accent/5' : 'opacity-65'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        n.type === 'TASK_OVERDUE'
                          ? 'bg-overdue/10 text-overdue'
                          : 'bg-accent/10 text-accent'
                      }`}
                    >
                      {isLoadingThisTask ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Icon size={14} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-relaxed ${
                          isUnread ? 'text-paper font-medium' : 'text-paper/80'
                        }`}
                      >
                        {n.message}
                      </p>
                      <p className="text-[10px] text-fog font-mono mt-1">
                        {formatWhen(n.createdAt)}
                      </p>
                    </div>

                    {isUnread && (
                      <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5 shadow-xs" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}