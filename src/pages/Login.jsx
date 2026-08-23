import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../context/LanguageContext.jsx'
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Could not sign in. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink px-4 py-12 relative overflow-hidden">
      <div className="w-full max-w-sm relative z-10 animate-enter">
        {/* Header Indicator */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="status-dot-pulse" />
            <span className="font-mono text-xs text-fog uppercase tracking-wider">
              orbitly · session
            </span>
          </div>
        </div>

        {/* Glassmorphic Panel Container */}
        <div className="glass-panel p-8">
          <h1 className="text-2xl font-bold text-paper mb-1 tracking-tight">{t('auth.signIn')}</h1>
          <p className="text-xs text-fog mb-6">{t('auth.signInSubtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="identifier">
                {t('auth.emailOrUsername')}
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  type="text"
                  required
                  autoComplete="username"
                  className="input-field pl-9"
                  value={form.identifier}
                  onChange={(e) => setForm({ ...form, identifier: e.target.value })}
                  placeholder="you@example.com or your username"
                />
                <Mail className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="password">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pl-9 pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                />
                <Lock className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fog hover:text-paper transition-colors focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="p-3 rounded-lg bg-overdue/10 border border-overdue/20 text-overdue text-xs font-mono">
                {error}
              </div>
            )}

            {/* Glowing Action Button */}
            <button type="submit" disabled={loading} className="btn-primary w-full group mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('auth.signingIn')}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {t('auth.signIn')}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <p className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-xs text-fog hover:text-accent transition-colors"
            >
              {t('auth.forgot')}
            </Link>
          </p>
        </div>

        {/* Footer Navigation Link */}
        <p className="text-xs text-fog text-center mt-6">
          {t('auth.startingFresh')}{' '}
          <Link
            to="/register-company"
            className="text-accent hover:underline font-medium transition-all"
          >
            {t('auth.createCompany')}
          </Link>
        </p>

        <p className="text-[10px] text-fog/50 text-center mt-4 font-mono">
          © {new Date().getFullYear()} Orbitly by Kvant. All rights reserved.
        </p>
      </div>
    </div>
  )
}