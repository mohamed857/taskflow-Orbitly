import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import { tasks as tasksApi, users as usersApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import TaskDetailModal from '../components/TaskDetailModal.jsx'
import TaskForm from '../components/TaskForm.jsx'

const STATUS_DOT = {
  PENDING: 'bg-pending',
  IN_PROGRESS: 'bg-inprogress',
  COMPLETED: 'bg-completed',
  OVERDUE: 'bg-overdue'
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_PER_DAY = 3

function dedupeById(list) {
  const map = new Map()
  list.forEach((t) => map.set(t.id, t))
  return Array.from(map.values())
}

// Format Date safely taking local calendar context into account
function dateKey(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function CalendarPage() {
  const { hasRole } = useAuth()
  const { push } = useToast()
  const [taskList, setTaskList] = useState([])
  const [loading, setLoading] = useState(true)
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [openTask, setOpenTask] = useState(null)
  const [users, setUsers] = useState([])
  const [formDate, setFormDate] = useState(null)

  const canManage = hasRole('ADMIN', 'MANAGER', 'TEAM_LEAD')
  const isWorkspaceView = hasRole('ADMIN', 'MANAGER')
  const isTeamLead = hasRole('TEAM_LEAD')

  const load = async () => {
    setLoading(true)
    try {
      let list
      if (isWorkspaceView) {
        const data = await tasksApi.workspace()
        list = Array.isArray(data) ? data : data?.content ?? []
      } else if (isTeamLead) {
        const data = await tasksApi.team()
        list = Array.isArray(data) ? data : data?.content ?? []
      } else {
        const [mine, assigned] = await Promise.all([tasksApi.mine(), tasksApi.assigned()])
        list = dedupeById([...(mine ?? []), ...(assigned ?? [])])
      }
      setTaskList(list)
    } catch (err) {
      push(err.message || 'Could not load the calendar.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWorkspaceView, isTeamLead])

  // Group tasks by Local YYYY-MM-DD
  const tasksByDay = useMemo(() => {
    const map = new Map()
    taskList.forEach((t) => {
      if (!t.dueDate) return
      
      // Parse ISO String safely or handle standard Date string
      const d = new Date(t.dueDate)
      if (Number.isNaN(d.getTime())) return

      const key = dateKey(d)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(t)
    })
    return map
  }, [taskList])

  const cells = useMemo(() => {
    const firstOfMonth = cursor
    const startWeekday = firstOfMonth.getDay()
    const gridStart = new Date(firstOfMonth)
    gridStart.setDate(gridStart.getDate() - startWeekday)

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart)
      d.setDate(gridStart.getDate() + i)
      return d
    })
  }, [cursor])

  // Load users safely on drawer open with active flag to prevent unmounted leaks
  useEffect(() => {
    let isSubscribed = true
    if (formDate !== null && users.length === 0) {
      usersApi
        .listInWorkspace()
        .then((data) => {
          if (isSubscribed) setUsers(data)
        })
        .catch(() => {})
    }
    return () => {
      isSubscribed = false
    }
  }, [formDate, users.length])

  const createTaskForDay = async (payload) => {
    try {
      await tasksApi.create(payload)
      push('Task created successfully.', 'success')
      setFormDate(null)
      load()
    } catch (err) {
      push(err.message || 'Failed to create task.', 'error')
    }
  }

  const openAddForDay = (d) => {
    const pad = (n) => String(n).padStart(2, '0')
    const formatted = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T17:00`
    setFormDate(formatted)
  }

  const today = new Date()
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  const goPrev = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
  const goNext = () => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
  const goToday = () => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))

  return (
    <div className="space-y-5 animate-enter">
      {/* Control Header */}
      <div className="glass-panel p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-panelAlt/50 border border-panelBorder/60 rounded-lg p-1">
            <button
              onClick={goPrev}
              className="h-7 w-7 rounded-md text-fog hover:text-paper hover:bg-panel/80 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={goNext}
              className="h-7 w-7 rounded-md text-fog hover:text-paper hover:bg-panel/80 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <h2 className="font-display text-base sm:text-lg font-bold tracking-tight text-paper min-w-[140px]">
            {monthLabel}
          </h2>
        </div>

        <button
          onClick={goToday}
          className="btn-ghost py-1 px-3 text-xs flex items-center gap-1.5 cursor-pointer"
        >
          <CalendarIcon size={13} className="text-accent" />
          Today
        </button>
      </div>

      {/* Grid Container */}
      {loading ? (
        <div className="glass-panel p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="font-mono text-xs text-fog">Loading calendar matrix…</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-panelBorder/80">
          {/* Weekday Header */}
          <div className="grid grid-cols-7 border-b border-panelBorder/70 bg-panelAlt/30">
            {WEEKDAYS.map((w) => (
              <div key={w} className="label-eyebrow text-center py-2.5 text-[11px]">
                {w}
              </div>
            ))}
          </div>

          {/* Month Matrix Grid */}
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              const inMonth = d.getMonth() === cursor.getMonth()
              const isToday = isSameDay(d, today)
              const dayTasks = tasksByDay.get(dateKey(d)) ?? []
              const visible = dayTasks.slice(0, MAX_VISIBLE_PER_DAY)
              const overflow = dayTasks.length - visible.length

              return (
                <div
                  key={i}
                  className={`group relative min-h-[105px] p-2 border-b border-r border-panelBorder/50 transition-colors ${
                    inMonth ? 'bg-panel/20 hover:bg-panelAlt/30' : 'bg-panelAlt/10 opacity-40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center h-5 w-5 rounded-md text-xs font-mono font-medium ${
                        isToday
                          ? 'bg-accent text-slate-950 font-bold shadow-sm shadow-accent/40'
                          : 'text-fog'
                      }`}
                    >
                      {d.getDate()}
                    </span>

                    {canManage && (
                      <button
                        onClick={() => openAddForDay(d)}
                        title="Add task on this date"
                        className="opacity-0 group-hover:opacity-100 text-fog hover:text-accent p-0.5 rounded hover:bg-accent/10 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    {visible.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setOpenTask(t)}
                        title={t.title}
                        className="w-full flex items-center gap-1.5 text-left px-1.5 py-1 rounded-md bg-panelAlt/60 hover:bg-accent/15 border border-panelBorder/40 transition-all cursor-pointer"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[t.status] ?? 'bg-fog'}`} />
                        <span className="text-[11px] text-paper font-medium truncate leading-tight">
                          {t.title}
                        </span>
                      </button>
                    ))}

                    {overflow > 0 && (
                      <p className="text-[10px] text-accent font-mono font-medium px-1 pt-0.5">
                        +{overflow} more
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />

      {/* Task Creation Form Drawer */}
      {canManage && (
        <TaskForm
          open={formDate !== null}
          initialTask={null}
          users={users}
          defaultDueDate={formDate}
          onClose={() => setFormDate(null)}
          onSubmit={createTaskForDay}
        />
      )}
    </div>
  )
}