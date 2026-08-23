import React, { useMemo, useState } from 'react'
import {
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GitBranch,
  Edit2,
  Trash2,
  Calendar,
  Clock
} from 'lucide-react'
import StatusChip, { STATUS_OPTIONS } from './StatusChip.jsx'
import PriorityBadge from './PriorityBadge.jsx'
import Avatar from './Avatar.jsx'
import { avatarSrc } from '../api/client.js'
import { displayName } from '../utils/userDisplay.js'
import LabelChips from './LabelChips.jsx'
import { useAuth } from '../context/AuthContext.jsx'

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

function PersonCell({ person }) {
  if (!person) {
    return <span className="text-fog/70 font-mono text-xs">Unassigned</span>
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Avatar
        name={displayName(person)}
        size={22}
        src={avatarSrc(person.avatarUrl)}
      />
      <span className="text-xs text-paper font-medium truncate">
        {displayName(person)}
      </span>
    </div>
  )
}

export default function TaskList({
  tasks = [],
  loading,
  onEdit,
  onDelete,
  onStatusChange,
  canManage,
  onOpen
}) {
  const { user } = useAuth()
  const [dueSort, setDueSort] = useState(null) // null | 'asc' | 'desc'

  const sortedTasks = useMemo(() => {
    if (!dueSort) return tasks
    const withDate = (t) =>
      t.dueDate ? new Date(t.dueDate).getTime() : Infinity
    return [...tasks].sort((a, b) =>
      dueSort === 'asc' ? withDate(a) - withDate(b) : withDate(b) - withDate(a)
    )
  }, [tasks, dueSort])

  const toggleDueSort = () => {
    setDueSort((cur) => (cur === null ? 'asc' : cur === 'asc' ? 'desc' : null))
  }

  if (loading) {
    return (
      <div className="console-panel p-12 text-center select-none">
        <p className="font-mono text-xs text-fog animate-pulse">
          loading tasks…
        </p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="console-panel p-12 text-center select-none">
        <p className="font-display font-medium text-paper text-base mb-1">
          Nothing here yet
        </p>
        <p className="text-xs text-fog max-w-sm mx-auto">
          Create a task, or clear your filters to see more.
        </p>
      </div>
    )
  }

  return (
    <div className="console-panel overflow-hidden border border-panelBorder">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[760px] border-collapse">
          <thead>
            <tr className="border-b border-panelBorder/80 bg-panelAlt/30 text-left">
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3">
                Title
              </th>
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3">
                Reporter
              </th>
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3">
                Assignee
              </th>
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3">
                Status
              </th>
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3">
                Priority
              </th>
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3">
                <button
                  type="button"
                  onClick={toggleDueSort}
                  className="inline-flex items-center gap-1 hover:text-paper transition-colors select-none"
                >
                  <span>Due</span>
                  {dueSort === 'asc' ? (
                    <ArrowUp size={12} className="text-accent" />
                  ) : dueSort === 'desc' ? (
                    <ArrowDown size={12} className="text-accent" />
                  ) : (
                    <ArrowUpDown size={12} className="opacity-40" />
                  )}
                </button>
              </th>
              <th className="label-eyebrow font-mono text-[11px] text-fog px-4 py-3 text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-panelBorder/40">
            {sortedTasks.map((task) => {
              const canChangeStatus =
                user?.id === task.reporter?.id ||
                user?.id === task.assignee?.id ||
                canManage

              const dueInfo = formatDue(task.dueDate)
              const isTaskOverdue =
                task.status === 'OVERDUE' ||
                (typeof dueInfo === 'object' &&
                  dueInfo.isOverdue &&
                  task.status !== 'COMPLETED')

              return (
                <tr
                  key={task.id}
                  className="hover:bg-panelAlt/30 transition-colors group"
                >
                  {/* Task Title & Description */}
                  <td
                    className="px-4 py-3.5 cursor-pointer max-w-xs"
                    onClick={() => onOpen?.(task)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-paper font-medium hover:text-accent transition-colors truncate text-sm">
                        {task.title}
                      </span>
                      {!task.parentTaskId && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onOpen?.(task)
                          }}
                          title="View sub-tasks"
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-mono text-fog hover:text-accent border border-panelBorder hover:border-accent/40 rounded-full px-2 py-0.5 transition-colors"
                        >
                          <GitBranch size={10} />
                          <span>sub-tasks</span>
                        </button>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-fog text-xs mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    <LabelChips labels={task.labels} className="mt-1" />
                  </td>

                  {/* Reporter */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PersonCell person={task.reporter} />
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PersonCell person={task.assignee} />
                  </td>

                  {/* Status Selection / Badge */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    {canChangeStatus ? (
                      <select
                        value={task.status}
                        onChange={(e) =>
                          onStatusChange?.(task, e.target.value)
                        }
                        className="bg-panelAlt/60 font-mono text-xs text-paper border border-panelBorder rounded px-2 py-0.5 hover:border-fog/60 focus:outline-none focus:ring-1 focus:ring-accent/50 transition-colors cursor-pointer"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option
                            key={s}
                            value={s}
                            className="bg-panel text-paper"
                          >
                            {s.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusChip status={task.status} variant="pill" />
                    )}
                  </td>

                  {/* Priority Badge */}
                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <PriorityBadge priority={task.priority} variant="pill" />
                  </td>

                  {/* Due Date Indicator */}
                  <td className="px-4 py-3.5 whitespace-nowrap font-mono text-xs">
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        isTaskOverdue
                          ? 'text-overdue font-semibold'
                          : 'text-fog'
                      }`}
                    >
                      {isTaskOverdue ? (
                        <Clock size={12} />
                      ) : (
                        <Calendar size={12} />
                      )}
                      <span>
                        {typeof dueInfo === 'object'
                          ? dueInfo.formatted
                          : dueInfo}
                      </span>
                    </div>
                  </td>

                  {/* Action Controls */}
                  <td className="px-4 py-3.5 whitespace-nowrap text-right">
                    {canManage ? (
                      <div className="inline-flex items-center justify-end gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onEdit?.(task)}
                          className="p-1 rounded text-fog hover:text-accent hover:bg-panelAlt/60 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(task)}
                          className="p-1 rounded text-fog hover:text-overdue hover:bg-panelAlt/60 transition-colors"
                          title="Delete Task"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ) : (
                      <span className="text-fog/50 text-xs font-mono">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}