import { useState } from 'react'
import { Link } from 'react-router-dom'
import { auth as authApi } from '../api/client.js'
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.forgotPassword(identifier)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not process the request.')
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
          <h1 className="text-2xl font-bold text-paper mb-1 tracking-tight">Reset your password</h1>
          <p className="text-xs text-fog mb-6">
            Enter your email or username and we'll send a reset link.
          </p>

          {sent ? (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>
                If an account matches, a password-reset link has been sent. Check your inbox (and in
                development, the server logs).
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label-eyebrow block mb-1.5" htmlFor="identifier">
                  Email or username
                </label>
                <div className="relative">
                  <input
                    id="identifier"
                    type="text"
                    required
                    className="input-field pl-9"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="you@example.com or your username"
                  />
                  <Mail className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Send reset link
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-xs text-fog text-center mt-6">
          <Link to="/login" className="inline-flex items-center gap-1 text-accent hover:underline font-medium">
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
