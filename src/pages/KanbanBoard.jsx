import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { tasks as tasksApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from '../components/Avatar.jsx'
import { avatarSrc } from '../api/client.js'
import { displayName } from '../utils/userDisplay.js'
import LabelChips from '../components/LabelChips.jsx'
import TaskDetailModal from '../components/TaskDetailModal.jsx'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { STATUS_OPTIONS } from '../components/StatusChip.jsx'

const COLUMN_META = {
  PENDING: { label: 'Pending', dot: 'bg-pending', rail: 'bg-pending', badge: 'bg-pending/10 text-pending' },
  IN_PROGRESS: { label: 'In Progress', dot: 'bg-inprogress', rail: 'bg-inprogress', badge: 'bg-inprogress/10 text-inprogress' },
  COMPLETED: { label: 'Completed', dot: 'bg-completed', rail: 'bg-completed', badge: 'bg-completed/10 text-completed' },
  OVERDUE: { label: 'Overdue', dot: 'bg-overdue', rail: 'bg-overdue', badge: 'bg-overdue/10 text-overdue' }
}

function dedupeById(list) {
  const map = new Map()
  list.forEach((t) => map.set(t.id, t))
  return Array.from(map.values())
}

function formatDue(dueDate) {
  if (!dueDate) return 'No due date'
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return dueDate
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function Card({ task, draggable, onDragStart, dragging, onOpen }) {
  const meta = COLUMN_META[task.status] ?? COLUMN_META.PENDING

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onOpen(task)}
      className={`glass-panel overflow-hidden flex cursor-pointer transition-all duration-200 group relative ${
        dragging ? 'opacity-30 scale-95 border-dashed border-accent' : 'hover:-translate-y-1 hover:shadow-xl'
      }`}
    >
      <div className={`w-1 shrink-0 ${meta.rail}`} aria-hidden="true" />
      
      <div className="p-3.5 flex-1 min-w-0 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-paper text-xs font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
            {task.title}
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <PriorityBadge priority={task.priority} />
          <span className="font-mono text-[10px] text-fog bg-panelAlt/60 px-2 py-0.5 rounded border border-panelBorder/40">
            {formatDue(task.dueDate)}
          </span>
        </div>

        <LabelChips labels={task.labels} />

        <div className="flex items-center justify-between text-xs pt-1 border-t border-panelBorder/30">
          {task.assignee ? (
            <div className="flex items-center gap-1.5 min-w-0">
              <Avatar
                name={displayName(task.assignee)}
                size={18}
                src={avatarSrc(task.assignee.avatarUrl)}
              />
              <span className="text-[11px] text-fog font-medium truncate max-w-[100px]">
                {displayName(task.assignee)}
              </span>
            </div>
          ) : (
            <span className="text-[10px] text-fog/60 font-mono italic">Unassigned</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function KanbanBoard() {
  const { user, hasRole } = useAuth()
  const { push } = useToast()

  const pushRef = useRef(push)
  useEffect(() => {
    pushRef.current = push
  }, [push])

  const [taskList, setTaskList] = useState([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState(null)
  const [overColumn, setOverColumn] = useState(null)
  const [openTask, setOpenTask] = useState(null)

  const isWorkspaceView = hasRole('ADMIN', 'MANAGER')
  const isTeamLead = hasRole('TEAM_LEAD')

  const load = useCallback(async (isSubscribed = { current: true }) => {
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

      if (isSubscribed.current) {
        setTaskList(list)
      }
    } catch (err) {
      if (isSubscribed.current) {
        pushRef.current(err.message || 'Could not load the board.', 'error')
      }
    } finally {
      if (isSubscribed.current) {
        setLoading(false)
      }
    }
  }, [isWorkspaceView, isTeamLead])

  useEffect(() => {
    const isSubscribed = { current: true }
    load(isSubscribed)

    return () => {
      isSubscribed.current = false
    }
  }, [load])

  // Refresh when the backend's overdue sweep fires (signalled via Layout).
  const sweepSignal = useOutletContext()?.sweepSignal ?? 0
  const prevSweepRef = useRef(sweepSignal)
  useEffect(() => {
    if (sweepSignal > 0 && sweepSignal !== prevSweepRef.current) {
      prevSweepRef.current = sweepSignal
      load()
    }
  }, [sweepSignal, load])

  const canDrag = (task) =>
    isWorkspaceView || isTeamLead || user?.id === task.reporter?.id || user?.id === task.assignee?.id

  const columns = useMemo(() => {
    const byStatus = Object.fromEntries(STATUS_OPTIONS.map((s) => [s, []]))
    taskList.forEach((t) => {
      if (byStatus[t.status]) byStatus[t.status].push(t)
    })
    return byStatus
  }, [taskList])

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('text/plain', String(task.id))
    e.dataTransfer.effectAllowed = 'move'
    setDraggingId(task.id)
  }

  const handleDrop = async (e, status) => {
    e.preventDefault()
    setOverColumn(null)
    const taskId = Number(e.dataTransfer.getData('text/plain'))
    setDraggingId(null)
    if (!taskId) return

    const task = taskList.find((t) => t.id === taskId)
    if (!task || task.status === status) return

    const prev = taskList
    setTaskList((cur) => cur.map((t) => (t.id === taskId ? { ...t, status } : t)))

    // التحديث الفوري المزامَن لـ Open Task Modal إذا كانت مفتوحة
    if (openTask?.id === taskId) {
      setOpenTask((prevTask) => prevTask ? { ...prevTask, status } : null)
    }

    try {
      await tasksApi.updateStatus(taskId, status)
    } catch (err) {
      setTaskList(prev)
      if (openTask?.id === taskId) {
        setOpenTask(task) // إرجاع الحالة القديمة داخل الـ Modal
      }
      pushRef.current(err.message || 'Could not update status.', 'error')
    }
  }

  return (
    <div className="space-y-4 animate-enter">
      <div className="flex items-center justify-between border-b border-panelBorder/40 pb-3">
        <p className="text-xs font-medium text-fog">
          Drag cards to transition statuses across the task workflow.
        </p>
      </div>
      

      {loading ? (
        <div className="glass-panel p-16 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 size={24} className="animate-spin text-accent" />
          <p className="font-mono text-xs text-fog">Rendering Kanban state…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_OPTIONS.map((status) => {
            const meta = COLUMN_META[status]
            const items = columns[status] ?? []
            const isOver = overColumn === status

            return (
              <div
                key={status}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverColumn(status)
                }}
                onDragLeave={() => setOverColumn((cur) => (cur === status ? null : cur))}
                onDrop={(e) => handleDrop(e, status)}
                className={`rounded-xl border-2 border-dashed transition-all duration-200 p-2.5 h-fit space-y-3 bg-panel/30 ${
                  isOver
                    ? 'border-accent bg-accent/10 shadow-lg shadow-accent/5'
                    : 'border-panelBorder/50'
                }`}
              >
                {/* Column Title Bar */}
                <div className="flex items-center justify-between px-2 py-1 bg-panelAlt/30 rounded-lg border border-panelBorder/40">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                    <span className="label-eyebrow text-[11px]">{meta.label}</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-paper px-1.5 py-0.5 rounded bg-panelBorder/40">
                    {items.length}
                  </span>
                </div>

                {/* Task Items */}
                <div className="space-y-2.5">
                  {items.length === 0 ? (
                    <div className="border border-dashed border-panelBorder/60 rounded-xl py-12 text-center bg-panelAlt/10">
                      <p className="text-xs text-fog font-mono">No tasks</p>
                    </div>
                  ) : (
                    items.map((task) => (
                      <Card
                        key={task.id}
                        task={task}
                        draggable={canDrag(task)}
                        dragging={draggingId === task.id}
                        onDragStart={handleDragStart}
                        onOpen={setOpenTask}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}