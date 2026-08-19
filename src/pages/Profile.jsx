import { useEffect, useRef, useState } from 'react'
import { Mail, Shield, CalendarDays, Camera, KeyRound, Loader2, CheckCircle2 } from 'lucide-react'
import { tasks as tasksApi, users as usersApi, avatarSrc } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import Avatar from '../components/Avatar.jsx'
import RoleBadge from '../components/RoleBadge.jsx'
import StatusBreakdownChart from '../components/StatusBreakdownChart.jsx'

function dedupeById(list) {
  const map = new Map()
  list.forEach((t) => map.set(t.id, t))
  return Array.from(map.values())
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

function ChangePasswordCard() {
  const { push } = useToast()
  const [form, setForm] = useState({ current: '', next: '', confirm: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (form.next.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }
    if (form.next !== form.confirm) {
      setError('New password and confirmation do not match.')
      return
    }

    setSaving(true)
    try {
      await usersApi.changePassword(form.current, form.next)
      push('Password updated successfully.')
      setForm({ current: '', next: '', confirm: '' })
    } catch (err) {
      setError(err.message || 'Could not change password.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="glass-panel p-6 border border-panelBorder/80">
      <div className="flex items-center gap-2 mb-1">
        <div className="p-1.5 rounded-md bg-accent/10 text-accent">
          <KeyRound size={16} />
        </div>
        <h3 className="font-display text-sm font-bold text-paper">Security & Password</h3>
      </div>
      <p className="text-xs text-fog mb-5">
        Update your password below. Your active session will remain logged in.
      </p>

      <form onSubmit={submit} className="space-y-4 max-w-md">
        <div>
          <label className="label-eyebrow block mb-1.5 text-xs" htmlFor="current-password">
            Current password
          </label>
          <input
            id="current-password"
            type="password"
            required
            className="input-field w-full text-xs py-2"
            value={form.current}
            onChange={(e) => setForm({ ...form, current: e.target.value })}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label-eyebrow block mb-1.5 text-xs" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              className="input-field w-full text-xs py-2"
              value={form.next}
              onChange={(e) => setForm({ ...form, next: e.target.value })}
            />
          </div>
          <div>
            <label className="label-eyebrow block mb-1.5 text-xs" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              className="input-field w-full text-xs py-2"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            />
          </div>
        </div>

        {error && (
          <p className="text-xs text-overdue font-mono bg-overdue/10 border border-overdue/20 rounded-md p-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="btn-primary px-4 py-2 text-xs flex items-center gap-2 shrink-0"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Updating…
            </>
          ) : (
            'Update password'
          )}
        </button>
      </form>
    </div>
  )
}

export default function Profile() {
  const { user, refresh } = useAuth()
  const { push } = useToast()
  const [taskList, setTaskList] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    let isMounted = true
    Promise.all([tasksApi.mine(), tasksApi.assigned()])
      .then(([mine, assigned]) => {
        if (isMounted) {
          setTaskList(dedupeById([...(mine ?? []), ...(assigned ?? [])]))
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const reportedCount = taskList.filter((t) => t.reporter?.id === user?.id).length
  const assignedCount = taskList.filter((t) => t.assignee?.id === user?.id).length

  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    if (!ALLOWED_TYPES.includes(file.type)) {
      push('Please choose a JPEG, PNG, or WEBP image.', 'error')
      return
    }
    if (file.size > MAX_SIZE) {
      push('Image must be under 2MB.', 'error')
      return
    }

    setUploading(true)
    try {
      await usersApi.uploadAvatar(file)
      await refresh()
      push('Profile picture updated successfully.')
    } catch (err) {
      push(err.message || 'Could not upload image.', 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl animate-enter">
      {/* User Info Header Card */}
      <div className="glass-panel p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 border border-panelBorder/80">
        <div className="relative group shrink-0">
          <Avatar name={user?.username || user?.email} size={64} src={avatarSrc(user?.avatarUrl)} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Change profile picture"
            className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-xs disabled:opacity-100"
          >
            {uploading ? (
              <Loader2 size={18} className="text-accent animate-spin" />
            ) : (
              <Camera size={18} className="text-paper hover:scale-110 transition-transform" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleAvatarPick}
          />
        </div>

        <div className="min-w-0 text-center sm:text-left flex-1">
          <h2 className="font-display text-xl font-bold text-paper truncate">{user?.username}</h2>
          <div className="flex items-center justify-center sm:justify-start gap-3 mt-2 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-fog font-mono bg-panelAlt/50 px-2.5 py-1 rounded-md border border-panelBorder/40">
              <Mail size={13} className="text-accent" /> {user?.email}
            </span>
            {user?.role && (
              <span className="flex items-center gap-1.5 text-xs text-fog">
                <Shield size={13} className="text-accent" /> <RoleBadge role={user.role} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Task Count Metrics */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass-panel p-5 border border-panelBorder/80 flex items-center justify-between">
          <div>
            <p className="label-eyebrow text-xs">Tasks Created</p>
            <p className="font-display text-3xl font-extrabold text-paper mt-1">
              {loading ? <Loader2 size={20} className="animate-spin text-accent my-1" /> : reportedCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="glass-panel p-5 border border-panelBorder/80 flex items-center justify-between">
          <div>
            <p className="label-eyebrow text-xs">Assigned to You</p>
            <p className="font-display text-3xl font-extrabold text-paper mt-1">
              {loading ? <Loader2 size={20} className="animate-spin text-accent my-1" /> : assignedCount}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Shield size={20} />
          </div>
        </div>
      </div>

      {/* Analytics Visual Chart */}
      <div className="glass-panel p-6 border border-panelBorder/80">
        <h3 className="font-display text-sm font-bold text-paper mb-1">Status Mix</h3>
        <p className="text-xs text-fog mb-4">Distribution across all tasks you report or work on.</p>
        <StatusBreakdownChart tasks={taskList} />
      </div>

      {/* Change Password Form */}
      <ChangePasswordCard />

      {/* Footer Info Notice */}
      <div className="glass-panel px-4 py-3 border border-panelBorder/60 flex items-center gap-2.5 text-xs text-fog font-mono">
        <CalendarDays size={14} className="text-accent shrink-0" />
        <span>Account roles and workspace permissions are managed by system administrators.</span>
      </div>
    </div>
  )
}