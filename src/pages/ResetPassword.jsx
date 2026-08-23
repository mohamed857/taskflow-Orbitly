import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { auth as authApi } from '../api/client.js'
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [form, setForm] = useState({ next: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (!token) {
      setError('This reset link is invalid or incomplete.')
      return
    }
    if (form.next.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (form.next !== form.confirm) {
      setError('The two passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, form.next)
      setDone(true)
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err.message || 'Could not reset the password. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-sm relative z-10 animate-enter">
        <div className="mb-6 flex items-center gap-2">
          <span className="status-dot-pulse" />
          <span className="font-mono text-xs text-fog uppercase tracking-wider">orbitly · recovery</span>
        </div>

        <div className="glass-panel p-8">
          <h1 className="text-2xl font-bold text-paper mb-1 tracking-tight">Choose a new password</h1>
          <p className="text-xs text-fog mb-6">Enter and confirm your new password below.</p>

          {done ? (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>Password reset successfully. Redirecting you to sign in…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!token && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-overdue/10 border border-overdue/20 text-overdue text-xs">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>Missing reset token. Please use the link from your email.</span>
                </div>
              )}

              <div>
                <label className="label-eyebrow block mb-1.5" htmlFor="new-password">New password</label>
                <div className="relative">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    className="input-field pl-9 pr-10"
                    value={form.next}
                    onChange={(e) => setForm({ ...form, next: e.target.value })}
                    placeholder="At least 8 characters"
                  />
                  <Lock className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fog hover:text-paper transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="label-eyebrow block mb-1.5" htmlFor="confirm-password">Confirm password</label>
                <div className="relative">
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-field pl-9"
                    value={form.confirm}
                    onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    placeholder="Repeat the password"
                  />
                  <Lock className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-overdue/10 border border-overdue/20 text-overdue text-xs font-mono">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full group mt-2">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Resetting…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Reset password
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-fog text-center mt-6">
          <Link to="/login" className="text-accent hover:underline font-medium">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
