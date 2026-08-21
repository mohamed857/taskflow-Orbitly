import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import { ListChecks, Clock, Loader, CheckCircle2, AlertTriangle, RefreshCw, CalendarClock, Flame, TrendingUp, ArrowRight } from 'lucide-react'
import { tasks as tasksApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../context/LanguageContext.jsx'
import { parseServerDate } from '../utils/serverTime.js'
import StatCard from '../components/StatCard.jsx'
import StatusBreakdownChart from '../components/StatusBreakdownChart.jsx'
import AssigneeLoadChart from '../components/AssigneeLoadChart.jsx'

function dueMs(dateStr) {
  const d = parseServerDate(dateStr)
  return d ? d.getTime() : null
}

function formatDue(dateStr) {
  const d = parseServerDate(dateStr)
  if (!d) return 'No due date'
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

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

  // Overdue list, upcoming (next 7 days) list, and completion rate
  const lists = useMemo(() => {
    const now = Date.now()
    const weekAhead = now + 7 * 24 * 60 * 60 * 1000

    const overdue = taskList
      .filter((t) => {
        if (t.status === 'COMPLETED') return false
        if (t.status === 'OVERDUE') return true
        const ms = dueMs(t.dueDate)
        return ms !== null && ms < now
      })
      .sort((a, b) => (dueMs(a.dueDate) ?? Infinity) - (dueMs(b.dueDate) ?? Infinity))

    const upcoming = taskList
      .filter((t) => {
        if (t.status === 'COMPLETED') return false
        const ms = dueMs(t.dueDate)
        return ms !== null && ms >= now && ms <= weekAhead
      })
      .sort((a, b) => (dueMs(a.dueDate) ?? Infinity) - (dueMs(b.dueDate) ?? Infinity))

    const completionRate = metrics.TOTAL > 0 ? Math.round((metrics.COMPLETED / metrics.TOTAL) * 100) : 0
    const activeRate = metrics.TOTAL > 0 ? Math.round((metrics.IN_PROGRESS / metrics.TOTAL) * 100) : 0

    return { overdue, upcoming, completionRate, activeRate }
  }, [taskList, metrics])

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

      {/* Progress Overview: completion rate + active rate */}
      <div className="glass-panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} className="text-emerald-400" />
            <h3 className="font-display text-sm font-semibold text-paper">Progress Overview</h3>
          </div>
          <span className="text-xs font-mono text-fog">
            {loading ? '—' : `${metrics.COMPLETED}/${metrics.TOTAL} done`}
          </span>
        </div>

        <div className="space-y-3">
          {/* Completion rate bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-fog">Completion rate</span>
              <span className="text-emerald-400 font-semibold">{loading ? '—' : `${lists.completionRate}%`}</span>
            </div>
            <div className="h-2 rounded-full bg-panelAlt/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500/80 transition-all duration-500"
                style={{ width: loading ? '0%' : `${lists.completionRate}%` }}
              />
            </div>
          </div>

          {/* Active (in-progress) rate bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono mb-1">
              <span className="text-fog">In progress</span>
              <span className="text-sky-400 font-semibold">{loading ? '—' : `${lists.activeRate}%`}</span>
            </div>
            <div className="h-2 rounded-full bg-panelAlt/60 overflow-hidden">
              <div
                className="h-full rounded-full bg-sky-500/80 transition-all duration-500"
                style={{ width: loading ? '0%' : `${lists.activeRate}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Overdue & Due-this-week task panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Overdue Panel */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame size={15} className="text-rose-400" />
              <h3 className="font-display text-sm font-semibold text-paper">Overdue</h3>
              {!loading && lists.overdue.length > 0 && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  {lists.overdue.length}
                </span>
              )}
            </div>
            <Link to="/board" className="text-[11px] font-mono text-fog hover:text-accent inline-flex items-center gap-1 transition-colors">
              Board <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <p className="text-xs font-mono text-fog py-8 text-center">Loading…</p>
          ) : lists.overdue.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-panelBorder/60 rounded-xl bg-panelAlt/20">
              <CheckCircle2 size={20} className="text-emerald-400 mx-auto mb-2" />
              <p className="text-xs font-mono text-fog">Nothing overdue. Nice.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {lists.overdue.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 text-xs py-2 px-3 rounded-lg bg-rose-500/[0.04] border border-rose-500/15 hover:border-rose-500/40 transition-colors"
                >
                  <span className="text-paper font-medium truncate">{t.title}</span>
                  <span className="text-rose-400/90 font-mono text-[10px] shrink-0 flex items-center gap-1">
                    <Clock size={10} /> {formatDue(t.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Due This Week Panel */}
        <div className="glass-panel p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} className="text-amber-400" />
              <h3 className="font-display text-sm font-semibold text-paper">Due This Week</h3>
              {!loading && lists.upcoming.length > 0 && (
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  {lists.upcoming.length}
                </span>
              )}
            </div>
            <Link to="/board" className="text-[11px] font-mono text-fog hover:text-accent inline-flex items-center gap-1 transition-colors">
              Board <ArrowRight size={11} />
            </Link>
          </div>

          {loading ? (
            <p className="text-xs font-mono text-fog py-8 text-center">Loading…</p>
          ) : lists.upcoming.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-panelBorder/60 rounded-xl bg-panelAlt/20">
              <p className="text-xs font-mono text-fog">Nothing due in the next 7 days.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {lists.upcoming.slice(0, 8).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-3 text-xs py-2 px-3 rounded-lg bg-panelAlt/40 border border-panelBorder/40 hover:border-accent/30 transition-colors"
                >
                  <span className="text-paper font-medium truncate">{t.title}</span>
                  <span className="text-amber-400/90 font-mono text-[10px] shrink-0 flex items-center gap-1">
                    <CalendarClock size={10} /> {formatDue(t.dueDate)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
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