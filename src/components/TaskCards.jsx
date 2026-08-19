import React from 'react'
import { GitBranch, Edit2, Trash2, Calendar, Clock } from 'lucide-react'
import StatusChip, { STATUS_OPTIONS } from './StatusChip.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import Avatar from './Avatar.jsx'
import { avatarSrc } from '../api/client.js'
import { displayName } from '../utils/userDisplay.js'
import LabelChips from './LabelChips.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const RAIL_COLOR = {
  PENDING: 'bg-pending',
  IN_PROGRESS: 'bg-inprogress',
  COMPLETED: 'bg-completed',
  OVERDUE: 'bg-overdue'
}

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
    <div className="flex items-center gap-1.5 text-xs min-w-0">
      <span className="text-fog shrink-0 w-8 font-mono text-[11px]">{label}</span>
      {person ? (
        <div className="flex items-center gap-1.5 min-w-0 truncate">
          <Avatar
            name={displayName(person)}
            size={18}
            src={avatarSrc(person.avatarUrl)}
          />
          <span className="text-paper truncate font-medium text-xs">
            {displayName(person)}
          </span>
        </div>
      ) : (
        <span className="text-fog/70 font-mono text-[11px]">Unassigned</span>
      )}
    </div>
  )
}

export default function TaskCards({
  tasks = [],
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  canManage,
  onOpen
}) {
  const { user } = useAuth()

  if (loading) {
    return (
      <div className="console-panel p-12 text-center select-none border border-panelBorder/80">
        <p className="font-mono text-xs text-fog animate-pulse">loading tasks…</p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="console-panel p-12 text-center select-none border border-panelBorder/80">
        <p className="font-display font-medium text-paper text-base mb-1">
          Nothing here yet
        </p>
        <p className="text-xs text-fog max-w-sm mx-auto">
          Create a task, or clear your filters to explore workspace activity.
        </p>
      </div>
    )
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map((task) => {
        const canChangeStatus =
          user?.id === task.reporter?.id ||
          user?.id === task.assignee?.id ||
          canManage

        const dueInfo = formatDue(task.dueDate)
        const isTaskOverdue =
          task.status === 'OVERDUE' ||
          (typeof dueInfo === 'object' && dueInfo.isOverdue && task.status !== 'COMPLETED')

        return (
          <div
            key={task.id}
            className="console-panel border border-panelBorder/80 hover:border-accent/40 rounded-lg overflow-hidden flex transition-all duration-200 group shadow-sm hover:shadow-md"
          >
            {/* Left Status Accent Rail */}
            <div
              className={`w-1.5 shrink-0 border-r border-black/10 ${
                RAIL_COLOR[task.status] ?? 'bg-fog'
              }`}
              aria-hidden="true"
            />

            <div className="p-4 flex-1 min-w-0 flex flex-col justify-between space-y-3">
              {/* Header: Title + Action Controls */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className="text-paper font-medium leading-snug cursor-pointer hover:text-accent transition-colors line-clamp-2 text-sm"
                    onClick={() => onOpen?.(task)}
                  >
                    {task.title}
                  </h3>

                  {canManage && (
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onEdit?.(task)}
                        className="p-1 rounded text-fog hover:text-accent hover:bg-panelAlt/60 border border-transparent hover:border-panelBorder transition-colors"
                        title="Edit Task"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete?.(task)}
                        className="p-1 rounded text-fog hover:text-overdue hover:bg-panelAlt/60 border border-transparent hover:border-panelBorder transition-colors"
                        title="Delete Task"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Priority & Sub-task Indicators */}
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={task.priority} variant="pill" />
                  {!task.parentTaskId && (
                    <button
                      type="button"
                      onClick={() => onOpen?.(task)}
                      title="View sub-tasks"
                      className="inline-flex items-center gap-1 text-[10px] font-mono text-fog hover:text-accent border border-panelBorder hover:border-accent/40 rounded-full px-2 py-0.5 transition-colors"
                    >
                      <GitBranch size={10} />
                      <span>sub-tasks</span>
                    </button>
                  )}
                </div>

                {/* Description Excerpt */}
                {task.description && (
                  <p className="text-fog text-xs line-clamp-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <LabelChips labels={task.labels} />
              </div>

              {/* People Attribution - Separated with upper & lower borders */}
              <div className="space-y-1.5 py-2 border-t border-b border-panelBorder/50 my-1">
                <PersonRow label="from" person={task.reporter} />
                <PersonRow label="to" person={task.assignee} />
              </div>

              {/* Footer: Due Date & Status Control */}
              <div className="flex items-center justify-between pt-2 mt-auto">
                {/* Due Date Indicator */}
                <div
                  className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                    isTaskOverdue ? 'text-overdue font-semibold' : 'text-fog'
                  }`}
                >
                  {isTaskOverdue ? <Clock size={12} /> : <Calendar size={12} />}
                  <span>
                    {typeof dueInfo === 'object' ? dueInfo.formatted : dueInfo}
                  </span>
                </div>

                {/* Status Selector / Badge */}
                {canChangeStatus ? (
                  <select
                    value={task.status}
                    onChange={(e) => onStatusChange?.(task, e.target.value)}
                    className="bg-panelAlt/60 font-mono text-xs text-paper border border-panelBorder rounded px-2 py-0.5 hover:border-fog/60 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s} className="bg-panel text-paper">
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                ) : (
                  <StatusChip status={task.status} variant="pill" />
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}