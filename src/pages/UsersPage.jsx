import { useEffect, useMemo, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search as SearchIcon, Pencil, ShieldCheck, Users as UsersIcon, Crown, Shield, UserPlus, Users2, Loader2, Sparkles, MessageSquare, KeyRound } from 'lucide-react'
import { users as usersApi, teams as teamsApi, avatarSrc } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from '../components/Avatar.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import StatCard from '../components/StatCard.jsx'
import ChangeRoleModal from '../components/ChangeRoleModal.jsx'
import CreateUserModal from '../components/CreateUserModal.jsx'
import ResetPasswordModal from '../components/ResetPasswordModal.jsx'
import { canChangeRole, allowedTargetRoles, roleScopeHint } from '../utils/roles.js'
import { displayName } from '../utils/userDisplay.js'

export default function UsersPage() {
  const { user: actingUser, hasRole } = useAuth()
  const { push } = useToast()
  const navigate = useNavigate()

  // Open a direct message with a teammate straight from the roster.
  const openChat = (u) =>
    navigate('/messages', {
      state: {
        startWith: {
          id: u.id,
          username: u.username,
          email: u.email,
          name: u.name,
          avatarUrl: u.avatarUrl
        }
      }
    })
  
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [target, setTarget] = useState(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState(null)
  const [teamList, setTeamList] = useState([])
  const [assigningId, setAssigningId] = useState(null)

  const isMountedRef = useRef(true)

  const canCreateUsers = hasRole('ADMIN', 'MANAGER')
  const canAssignAnyTeam = hasRole('ADMIN', 'MANAGER')
  // Only an Admin (SUPER_ADMIN counts as Admin) may reset another member's
  // password. Managers change only their own password from their profile.
  const canResetPasswords = hasRole('ADMIN')
  const isTeamLead = hasRole('TEAM_LEAD')

  // Load Workspace Roster safely
  useEffect(() => {
    isMountedRef.current = true
    setLoading(true)

    usersApi
      .listInWorkspace()
      .then((data) => {
        if (isMountedRef.current) setList(data)
      })
      .catch((err) => {
        if (isMountedRef.current) push(err.message || 'Could not load team members.', 'error')
      })
      .finally(() => {
        if (isMountedRef.current) setLoading(false)
      })

    return () => {
      isMountedRef.current = false
    }
  }, [push])

  // Fetch teams list for dropdowns
  useEffect(() => {
    if (!canAssignAnyTeam) return
    let active = true

    teamsApi
      .list()
      .then((data) => {
        if (active) setTeamList(data)
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [canAssignAnyTeam])

  // Memoized Filtering for performance
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (u) => u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
    )
  }, [list, query])

  // Stats calculation
  const counts = useMemo(
    () => ({
      admins: list.filter((u) => u.role === 'ADMIN').length,
      managers: list.filter((u) => u.role === 'MANAGER').length,
      teamLeads: list.filter((u) => u.role === 'TEAM_LEAD').length
    }),
    [list]
  )

  const handleRoleSubmit = async (userId, role) => {
    try {
      const updated = await usersApi.changeRole(userId, role)
      if (isMountedRef.current) {
        setList((prev) => prev.map((u) => (u.id === userId ? { ...u, role: updated?.role ?? role } : u)))
        push('Role updated successfully.')
      }
    } catch (err) {
      push(err.message || 'Could not update role.', 'error')
      throw err // keep the modal open on failure
    }
  }

  const handleCreateUser = async (payload) => {
    try {
      const created = await usersApi.create(payload)
      if (isMountedRef.current) {
        setList((prev) => [created, ...prev])
        push(`${created.username || 'User'} was created successfully.`)
      }
    } catch (err) {
      push(err.message || 'Could not create user.', 'error')
      throw err // keep the modal open on failure
    }
  }

  const assignTeam = async (userId, teamId, teamName) => {
    setAssigningId(userId)
    try {
      await teamsApi.assignMember(teamId, userId)
      if (isMountedRef.current) {
        setList((prev) => prev.map((u) => (u.id === userId ? { ...u, teamId, teamName } : u)))
        push(`Assigned to ${teamName}.`)
      }
    } catch (err) {
      if (isMountedRef.current) push(err.message || 'Could not assign team.', 'error')
    } finally {
      if (isMountedRef.current) setAssigningId(null)
    }
  }

  return (
    <div className="space-y-6 animate-enter">
      {/* Header & Overview Section */}
      <div className="glass-panel p-5 border border-panelBorder/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-paper">
            {canAssignAnyTeam ? actingUser?.workspaceName || 'Workspace Roster' : actingUser?.teamName || 'Team Roster'}
          </h2>
          <p className="text-xs font-mono text-fog mt-1">{roleScopeHint(actingUser)}</p>
        </div>
        {canCreateUsers && (
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary shrink-0 py-2 px-4 text-xs flex items-center justify-center gap-1.5"
          >
            <UserPlus size={15} /> Add Member
          </button>
        )}
      </div>

      {/* Workspace Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={loading ? '—' : list.length} color="#8B94A3" icon={UsersIcon} />
        <StatCard label="Admins" value={loading ? '—' : counts.admins} color="#A78BFA" icon={Crown} />
        <StatCard label="Managers" value={loading ? '—' : counts.managers} color="#38BDF8" icon={Shield} />
        <StatCard label="Team Leads" value={loading ? '—' : counts.teamLeads} color="#34D399" icon={ShieldCheck} />
      </div>

      {/* Control Bar: Search & Counts */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs font-mono text-fog">
          Showing <span className="text-paper font-semibold">{visible.length}</span> of {list.length} workspace member{list.length === 1 ? '' : 's'}
        </p>
        <div className="relative sm:max-w-xs w-full">
          <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fog" />
          <input
            className="input-field pl-9 pr-3 py-1.5 text-xs w-full"
            placeholder="Search by name or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Member Roster Data Table */}
      {loading ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <Loader2 size={24} className="animate-spin text-accent mx-auto mb-2" />
          <p className="font-mono text-xs text-fog">Loading workspace roster…</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="glass-panel p-12 text-center border border-panelBorder/60">
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto mb-3">
            <Sparkles size={20} />
          </div>
          <p className="font-display text-base font-bold text-paper mb-1">No Matching Members</p>
          <p className="text-xs text-fog max-w-sm mx-auto">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden border border-panelBorder/80">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-panelBorder/80 bg-panelAlt/30 text-fog font-mono uppercase tracking-wider text-[10px]">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Team Assignment</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-panelBorder/40">
                {visible.map((u) => {
                  const editable = canChangeRole(actingUser, u)
                  const disabledReason =
                    u.id === actingUser?.id
                      ? 'that’s you'
                      : u.role === 'ADMIN'
                      ? 'Admins locked'
                      : u.role === actingUser?.role
                      ? 'same role'
                      : 'restricted'

                  const canRecruitToMyTeam = isTeamLead && !u.teamId && u.id !== actingUser?.id

                  return (
                    <tr key={u.id} className="hover:bg-panelAlt/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={displayName(u)} size={32} src={avatarSrc(u.avatarUrl)} />
                          <div className="min-w-0">
                            <p className="text-paper text-xs font-semibold truncate">
                              {u.name || u.username}
                              {u.name && <span className="text-fog font-normal font-mono ml-1.5">@{u.username}</span>}
                            </p>
                            <p className="text-fog text-[11px] truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-4 py-3">
                        {canAssignAnyTeam ? (
                          <div className="relative max-w-[180px]">
                            <select
                              className="input-field py-1 px-2 text-xs w-full appearance-none bg-panelAlt/60 cursor-pointer border-panelBorder/60 focus:border-accent"
                              value={u.teamId ?? ''}
                              disabled={assigningId === u.id}
                              onChange={(e) => {
                                const selectedId = e.target.value
                                const team = teamList.find((t) => String(t.id) === selectedId)
                                if (team) assignTeam(u.id, team.id, team.name)
                              }}
                            >
                              <option value="" disabled>
                                {u.teamName || 'Unassigned'}
                              </option>
                              {teamList.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                            {assigningId === u.id && (
                              <Loader2 size={12} className="animate-spin text-accent absolute right-2 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        ) : u.teamName ? (
                          <span className="text-xs text-fog font-mono bg-panelAlt/40 px-2 py-0.5 rounded border border-panelBorder/40">
                            {u.teamName}
                          </span>
                        ) : canRecruitToMyTeam ? (
                          <button
                            onClick={() => assignTeam(u.id, actingUser.teamId, actingUser.teamName)}
                            disabled={assigningId === u.id}
                            className="flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                          >
                            {assigningId === u.id ? <Loader2 size={12} className="animate-spin" /> : <Users2 size={12} />}
                            <span>Add to my team</span>
                          </button>
                        ) : (
                          <span className="text-xs text-fog/50 font-mono italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {u.id !== actingUser?.id && (
                            <button
                              onClick={() => openChat(u)}
                              title={`Message ${u.name || u.username}`}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-panelBorder/80 text-fog hover:text-accent hover:border-accent hover:bg-accent/10 transition-colors"
                            >
                              <MessageSquare size={13} />
                            </button>
                          )}
                          {canResetPasswords && u.role !== 'SUPER_ADMIN' && u.id !== actingUser?.id && (
                            <button
                              onClick={() => setResetTarget(u)}
                              title={`Reset password for ${u.name || u.username}`}
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-panelBorder/80 text-fog hover:text-accent hover:border-accent hover:bg-accent/10 transition-colors"
                            >
                              <KeyRound size={13} />
                            </button>
                          )}
                          {editable ? (
                            <button
                              onClick={() => setTarget(u)}
                              title="Change user role"
                              className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-panelBorder/80 text-fog hover:text-accent hover:border-accent hover:bg-accent/10 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                          ) : (
                            <span className="text-fog/50 text-[11px] font-mono">{disabledReason}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Modification & User Creation Modals */}
      <ChangeRoleModal
        open={Boolean(target)}
        targetUser={target}
        allowedRoles={allowedTargetRoles(actingUser)}
        onClose={() => setTarget(null)}
        onSubmit={handleRoleSubmit}
      />

      <CreateUserModal open={createOpen} onClose={() => setCreateOpen(false)} onSubmit={handleCreateUser} teams={teamList} />

      {resetTarget && (
        <ResetPasswordModal
          target={resetTarget}
          resetFn={(id, pw) => usersApi.resetPassword(id, pw)}
          onClose={() => setResetTarget(null)}
        />
      )}
    </div>
  )
}