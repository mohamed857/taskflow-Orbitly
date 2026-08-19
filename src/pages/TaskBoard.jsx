import { useEffect, useMemo, useState, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { LayoutGrid, List, ChevronDown, Search, Plus, RotateCcw } from 'lucide-react'
import { tasks as tasksApi, users as usersApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import TaskList from '../components/TaskList.jsx'
import TaskCards from '../components/TaskCards.jsx'
import TaskForm from '../components/TaskForm.jsx'
import TaskDetailModal from '../components/TaskDetailModal.jsx'
import { STATUS_OPTIONS } from '../components/StatusChip.jsx'

const VIEW_STORAGE_KEY = 'taskflow_task_view'
// Must match the backend Priority enum (CRITICAL, not URGENT).
const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export default function TaskBoard({ fetchFn, emptyHint, allowCreate = false }) {
  const { hasRole } = useAuth()
  const { push } = useToast()
  
  // Safe extraction in case OutletContext is not provided
  const outletContext = useOutletContext()
  const sweepSignal = outletContext?.sweepSignal ?? 0

  const canCreate = allowCreate && hasRole('ADMIN', 'MANAGER', 'TEAM_LEAD')

  const [taskList, setTaskList] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [query, setQuery] = useState('')

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [hierarchyFilter, setHierarchyFilter] = useState('ALL') // ALL | MAIN | SUB

  const [formOpen, setFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [openTask, setOpenTask] = useState(null)
  const [view, setView] = useState(() => localStorage.getItem(VIEW_STORAGE_KEY) || 'table')

  const isMountedRef = useRef(true)
  const prevSignalRef = useRef(sweepSignal)

  const changeView = (next) => {
    setView(next)
    localStorage.setItem(VIEW_STORAGE_KEY, next)
  }

  const load = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await fetchFn()
      if (isMountedRef.current) {
        setTaskList(Array.isArray(data) ? data : data?.content ?? [])
      }
    } catch (err) {
      if (isMountedRef.current) {
        setLoadError(err.message || 'Could not load tasks.')
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    load()

    if (canCreate) {
      usersApi
        .listInWorkspace()
        .then((res) => {
          if (isMountedRef.current) setUsers(res)
        })
        .catch(() => {})
    }

    return () => {
      isMountedRef.current = false
    }
  }, [fetchFn, canCreate])

  // React strictly to sweepSignal updates
  useEffect(() => {
    if (sweepSignal > 0 && sweepSignal !== prevSignalRef.current) {
      prevSignalRef.current = sweepSignal
      load()
    }
  }, [sweepSignal])

  // Dynamic Multi-Filter Logic
  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase()
    return taskList.filter((t) => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false
      if (hierarchyFilter === 'MAIN' && t.parentTaskId) return false
      if (hierarchyFilter === 'SUB' && !t.parentTaskId) return false
      if (q) {
        const titleMatch = t.title?.toLowerCase().includes(q)
        const descMatch = t.description?.toLowerCase().includes(q)
        if (!titleMatch && !descMatch) return false
      }
      return true
    })
  }, [taskList, statusFilter, priorityFilter, hierarchyFilter, query])

  const openCreate = () => {
    setEditingTask(null)
    setFormOpen(true)
  }

  const openEdit = (task) => {
    setEditingTask(task)
    setFormOpen(true)
  }

  const handleSubmit = async (payload) => {
    try {
      if (editingTask) {
        const updated = await tasksApi.update(editingTask.id, payload)
        setTaskList((prev) => prev.map((t) => (t.id === editingTask.id ? updated : t)))
        push('Task updated.')
      } else {
        const created = await tasksApi.create(payload)
        setTaskList((prev) => [created, ...prev])
        push('Task created.')
      }
      setFormOpen(false)
    } catch (err) {
      push(err.message || 'Failed to save task.', 'error')
      // Re-throw so TaskForm keeps the drawer open with the user's input
      // instead of closing on a failed save.
      throw err
    }
  }

  const handleDelete = async (task) => {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return
    const prev = taskList
    setTaskList((current) => current.filter((t) => t.id !== task.id))
    try {
      await tasksApi.remove(task.id)
      push('Task deleted.')
    } catch (err) {
      setTaskList(prev)
      push(err.message || 'Could not delete the task.', 'error')
    }
  }

  const handleStatusChange = async (task, status) => {
    const prev = taskList
    setTaskList((current) => current.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await tasksApi.updateStatus(task.id, status)
      push(`Marked "${task.title}" as ${status.replace('_', ' ').toLowerCase()}.`)
    } catch (err) {
      setTaskList(prev)
      push(err.message || 'Could not update status.', 'error')
    }
  }

  const isFiltered = statusFilter !== 'ALL' || priorityFilter !== 'ALL' || hierarchyFilter !== 'ALL' || query.trim() !== ''

  return (
    <div className="space-y-5 animate-enter">
      {/* Top Header & View Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 border border-panelBorder/80">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
          <p className="text-xs text-fog font-mono">
            <strong className="text-paper">{visibleTasks.length}</strong> tasks displayed
            <span className="opacity-50"> ({taskList.length} total)</span>
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* View Mode Switcher */}
          <div className="flex bg-panelAlt/60 border border-panelBorder/60 rounded-lg p-1 gap-1">
            <button
              onClick={() => changeView('table')}
              className={`p-1.5 rounded-md transition-all ${
                view === 'table'
                  ? 'bg-accent/20 text-accent border border-accent/30 shadow-xs'
                  : 'text-fog hover:text-paper hover:bg-panelAlt/40'
              }`}
              title="Table view"
              aria-label="Table view"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => changeView('cards')}
              className={`p-1.5 rounded-md transition-all ${
                view === 'cards'
                  ? 'bg-accent/20 text-accent border border-accent/30 shadow-xs'
                  : 'text-fog hover:text-paper hover:bg-panelAlt/40'
              }`}
              title="Card view"
              aria-label="Card view"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {canCreate && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 py-2 px-3 text-xs">
              <Plus size={15} />
              <span>New Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-3.5 border border-panelBorder/80 flex flex-wrap items-center gap-3">
        {/* Search Input Box */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
          <input
            className="input-field pl-8 text-xs py-2 w-full"
            placeholder="Search title or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Task Hierarchy Segmented Toggle */}
        <div className="flex bg-panelAlt/50 border border-panelBorder/60 rounded-lg p-1 text-xs font-mono shrink-0">
          {[
            { key: 'ALL', label: 'All' },
            { key: 'MAIN', label: 'Main' },
            { key: 'SUB', label: 'Sub-tasks' }
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setHierarchyFilter(opt.key)}
              className={`px-2.5 py-1 rounded-md transition-all ${
                hierarchyFilter === opt.key
                  ? 'bg-accent/20 text-accent font-semibold border border-accent/30'
                  : 'text-fog hover:text-paper'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="relative inline-block">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none font-mono text-xs px-3 py-2 pr-8 rounded-lg border border-panelBorder/60 bg-panelAlt/40 text-fog hover:text-paper hover:border-panelBorder focus:outline-none focus:border-accent cursor-pointer transition-all"
          >
            <option value="ALL">Status: All</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                Status: {status.replace('_', ' ')}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        </div>

        {/* Priority Dropdown */}
        <div className="relative inline-block">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="appearance-none font-mono text-xs px-3 py-2 pr-8 rounded-lg border border-panelBorder/60 bg-panelAlt/40 text-fog hover:text-paper hover:border-panelBorder focus:outline-none focus:border-accent cursor-pointer transition-all"
          >
            <option value="ALL">Priority: All</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>
                Priority: {priority}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fog pointer-events-none" />
        </div>

        {/* Reset Active Filters Action */}
        {isFiltered && (
          <button
            onClick={() => {
              setStatusFilter('ALL')
              setPriorityFilter('ALL')
              setHierarchyFilter('ALL')
              setQuery('')
            }}
            className="flex items-center gap-1.5 text-xs font-mono text-accent hover:text-accent/80 transition-colors ml-auto sm:ml-0 px-2 py-1"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        )}
      </div>

      {/* Error State Banner */}
      {loadError && (
        <div className="glass-panel border-overdue/40 bg-overdue/10 p-4 rounded-xl">
          <p className="text-xs text-overdue font-mono">{loadError}</p>
        </div>
      )}

      {/* Empty Task State Display */}
      {!loading && taskList.length === 0 && !loadError && emptyHint && (
        <div className="glass-panel p-8 text-center border border-panelBorder/60">
          <p className="text-xs text-fog font-mono">{emptyHint}</p>
        </div>
      )}

      {/* Task Presentation Switcher */}
      {view === 'cards' ? (
        <TaskCards
          tasks={visibleTasks}
          loading={loading}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          canManage={canCreate}
          onOpen={setOpenTask}
        />
      ) : (
        <TaskList
          tasks={visibleTasks}
          loading={loading}
          onEdit={openEdit}
          onDelete={handleDelete}
          onStatusChange={handleStatusChange}
          canManage={canCreate}
          onOpen={setOpenTask}
        />
      )}

      {/* Workspace Task Modals */}
      {canCreate && (
        <TaskForm
          open={formOpen}
          initialTask={editingTask}
          users={users}
          onClose={() => setFormOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />
    </div>
  )
}