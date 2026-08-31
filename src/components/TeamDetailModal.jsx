import { useEffect, useState } from 'react'
import { X, Loader2, Users2, ListChecks } from 'lucide-react'
import Portal from './Portal.jsx'
import Avatar from './Avatar.jsx'
import RoleBadge from './RoleBadge.jsx'
import TaskDetailModal from './TaskDetailModal.jsx'
import { users as usersApi, tasks as tasksApi, avatarSrc } from '../api/client.js'
import { useToast } from '../context/ToastContext.jsx'
import { displayName } from '../utils/userDisplay.js'

const STATUS_DOT = {
  PENDING: 'bg-pending',
  IN_PROGRESS: 'bg-inprogress',
  COMPLETED: 'bg-completed',
  OVERDUE: 'bg-overdue'
}

// Admin/Manager: full detail of one team — its members and its tasks.
export default function TeamDetailModal({ team, onClose }) {
  const { push } = useToast()
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [openTask, setOpenTask] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    Promise.all([
      usersApi.listInWorkspace().catch(() => []),
      tasksApi.byTeam(team.id).catch(() => [])
    ])
      .then(([allUsers, teamTasks]) => {
        if (!alive) return
        const mem = (Array.isArray(allUsers) ? allUsers : []).filter((u) => u.teamId === team.id)
        setMembers(mem)
        setTasks(Array.isArray(teamTasks) ? teamTasks : [])
      })
      .catch((err) => { if (alive) push(err.message || 'Could not load the team.', 'error') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team.id])

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={onClose}>
        <div
          className="relative glass-panel w-full max-w-2xl max-h-[82vh] flex flex-col rounded-xl border border-panelBorder shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 p-5 border-b border-panelBorder/60">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <Users2 size={17} />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-paper truncate">{team.name}</h2>
                <p className="text-[11px] text-fog font-mono">
                  {members.length} member{members.length === 1 ? '' : 's'} · {tasks.length} task{tasks.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1 text-fog hover:text-paper rounded-lg transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-fog gap-2">
              <Loader2 size={20} className="animate-spin text-accent" />
              <span className="text-xs font-mono">Loading team…</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto grid md:grid-cols-2 gap-0 md:divide-x divide-panelBorder/50">
              {/* Members */}
              <div className="p-4">
                <p className="label-eyebrow text-[11px] mb-2.5 flex items-center gap-1.5"><Users2 size={12} /> Members</p>
                {members.length === 0 ? (
                  <p className="text-xs text-fog font-mono py-6 text-center">No members in this team yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg bg-panelAlt/40 border border-panelBorder/40">
                        <Avatar name={displayName(m)} size={26} src={avatarSrc(m.avatarUrl)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-paper font-medium truncate">{m.name || m.username}</p>
                          <p className="text-[10px] text-fog font-mono truncate">@{m.username}</p>
                        </div>
                        <RoleBadge role={m.role} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="p-4">
                <p className="label-eyebrow text-[11px] mb-2.5 flex items-center gap-1.5"><ListChecks size={12} /> Tasks</p>
                {tasks.length === 0 ? (
                  <p className="text-xs text-fog font-mono py-6 text-center">No tasks for this team yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {tasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setOpenTask(t)}
                        className="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg bg-panelAlt/40 hover:bg-accent/10 border border-panelBorder/40 transition-colors"
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${STATUS_DOT[t.status] ?? 'bg-fog'}`} />
                        <span className="flex-1 min-w-0 text-sm text-paper font-medium truncate">{t.title}</span>
                        {t.assignee && <Avatar name={displayName(t.assignee)} size={20} src={avatarSrc(t.assignee.avatarUrl)} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskDetailModal task={openTask} onClose={() => setOpenTask(null)} />
    </Portal>
  )
}
