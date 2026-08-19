import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { ListChecks, Clock, Loader, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { tasks as tasksApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../context/LanguageContext.jsx'
import StatCard from '../components/StatCard.jsx'
import StatusBreakdownChart from '../components/StatusBreakdownChart.jsx'
import AssigneeLoadChart from '../components/AssigneeLoadChart.jsx'

function dedupeById(list) {
  const map = new Map()
  list.forEach((t) => map.set(t.id, t))
  return Array.from(map.values())
}

const STATUS_BADGE_STYLE = {
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  IN_PROGRESS: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  OVERDUE: 'bg-rose-500/10 text-rose-500 border-rose-500/20'
}

export default function Dashboard() {
  const { user, hasRole } = useAuth()
  const { push } = useToast()
  const { t } = useI18n()

  const pushRef = useRef(push)
  useEffect(() => {
    pushRef.current = push
  }, [push])

  const [taskList, setTaskList] = useState([])
  const [loading, setLoading] = useState(true)

  const isWorkspaceView = hasRole('ADMIN', 'MANAGER')
  const isTeamLead = hasRole('TEAM_LEAD')
  const isTeamView = isWorkspaceView || isTeamLead

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
        pushRef.current(err.message || 'Could not load dashboard data.', 'error')
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

  // Memoized metric computations
  const metrics = useMemo(() => {
    const counts = {
      TOTAL: taskList.length,
      PENDING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      OVERDUE: 0
    }

    taskList.forEach((task) => {
      if (counts[task.status] !== undefined) {
        counts[task.status]++
      }
    })

    return counts
  }, [taskList])

  return (
    <div className="space-y-6 animate-enter">
      {/* Welcome Banner & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-panelBorder/40 pb-4">
        <div>
          <h2 className="text-lg font-bold font-display text-paper">
            {t('dash.welcome')}, <span className="text-accent">{user?.name || user?.username || user?.email}</span>
          </h2>
          <p className="text-xs text-fog mt-0.5">
            {isWorkspaceView
              ? "Here's how your workspace is tracking."
              : isTeamLead
              ? "Here's how your team is tracking."
              : "Here's what's on your plate."}
          </p>
        </div>

        <button
          onClick={() => load()}
          disabled={loading}
          className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 text-xs font-medium font-mono text-paper bg-panelAlt border border-panelBorder/60 rounded-lg hover:border-accent/40 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin text-accent' : 'text-fog'} />
          <span>{t('dash.refresh')}</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <StatCard label="Total" value={loading ? '—' : metrics.TOTAL} color="#8B94A3" icon={ListChecks} />
        <StatCard label="Pending" value={loading ? '—' : metrics.PENDING} color="#F59E0B" icon={Clock} />
        <StatCard label="In Progress" value={loading ? '—' : metrics.IN_PROGRESS} color="#38BDF8" icon={Loader} />
        <StatCard label="Completed" value={loading ? '—' : metrics.COMPLETED} color="#10B981" icon={CheckCircle2} />
        <StatCard label="Overdue" value={loading ? '—' : metrics.OVERDUE} color="#F43F5E" icon={AlertTriangle} />
      </div>

      {/* Analytics Charts & Recent Tasks Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Status Breakdown Panel */}
        <div className="glass-panel p-5">
          <div className="mb-4">
            <h3 className="font-display text-sm font-semibold text-paper">Status Breakdown</h3>
            <p className="text-xs text-fog">
              {isWorkspaceView
                ? 'Across every task in your workspace.'
                : isTeamLead
                ? 'Across every task in your team.'
                : 'Across tasks you report or are assigned.'}
            </p>
          </div>
          <StatusBreakdownChart tasks={taskList} />
        </div>

        {/* Workload / Recent Activity Panel */}
        <div className="glass-panel p-5">
          <div className="mb-4">
            <h3 className="font-display text-sm font-semibold text-paper">
              {isTeamView ? 'Workload by Assignee' : 'Your Recent Tasks'}
            </h3>
            <p className="text-xs text-fog">
              {isTeamView ? 'Open tasks per team member (top 8).' : 'Newest tasks assigned to you.'}
            </p>
          </div>

          {isTeamView ? (
            <AssigneeLoadChart tasks={taskList} />
          ) : (
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {taskList.length === 0 && !loading && (
                <div className="py-12 text-center border border-dashed border-panelBorder/60 rounded-xl bg-panelAlt/20">
                  <p className="text-xs font-mono text-fog">No tasks active yet</p>
                </div>
              )}

              {taskList.slice(0, 6).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-xs py-2 px-3 rounded-lg bg-panelAlt/40 border border-panelBorder/40 hover:border-accent/30 transition-colors"
                >
                  <span className="text-paper font-medium truncate mr-3">{t.title}</span>
                  <span
                    className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                      STATUS_BADGE_STYLE[t.status] ?? 'bg-fog/10 text-fog border-fog/20'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}