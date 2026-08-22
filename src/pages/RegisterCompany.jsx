import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Eye, EyeOff, Building2, User, AtSign, Mail, Lock, ArrowRight, Loader2, Check, Star } from 'lucide-react'

// Plans offered at signup. Kept in sync with the backend Plan enum.
const PLAN_OPTIONS = [
  { key: 'FREE', name: 'Free', price: 0, meta: '5 members · 1 team' },
  { key: 'STARTER', name: 'Starter', price: 4, meta: '15 members · 3 teams' },
  { key: 'PRO', name: 'Pro', price: 8, meta: '50 members · 15 teams', popular: true },
  { key: 'BUSINESS', name: 'Business', price: 16, meta: 'Unlimited members & teams' }
]

// Creates a brand-new, fully isolated company. This is the ONLY way a new
// workspace comes into existence now — no shared default workspace, no
// browsing other companies. The person who signs up here becomes the
// company's Owner (Admin role), scoped strictly to their own workspace.
export default function RegisterCompany() {
  const { registerCompany } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    companyName: '',
    ownerUsername: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    plan: 'FREE',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await registerCompany(form)
      navigate('/login')
    } catch (err) {
      setError(err.message || 'Could not create the company.')
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
              orbitly · new company
            </span>
          </div>
        </div>

        {/* Glassmorphic Panel Container */}
        <div className="glass-panel p-8">
          <h1 className="text-2xl font-bold text-paper mb-1 tracking-tight">Create your company</h1>
          <p className="text-xs text-fog mb-6 leading-relaxed">
            This sets up a brand-new, fully isolated workspace for your company. You'll be its Owner.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="companyName">
                Company name
              </label>
              <div className="relative">
                <input
                  id="companyName"
                  required
                  className="input-field pl-9"
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="Acme Inc."
                />
                <Building2 className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Owner Username */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="ownerUsername">
                Username
              </label>
              <div className="relative">
                <input
                  id="ownerUsername"
                  required
                  className="input-field pl-9"
                  value={form.ownerUsername}
                  onChange={(e) => setForm({ ...form, ownerUsername: e.target.value })}
                  placeholder="mohamed857"
                />
                <AtSign className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Owner Full Name */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="ownerName">
                Your name
              </label>
              <div className="relative">
                <input
                  id="ownerName"
                  required
                  className="input-field pl-9"
                  value={form.ownerName}
                  onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                  placeholder="Mohamed Ahmed"
                />
                <User className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Owner Email */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="ownerEmail">
                Your email
              </label>
              <div className="relative">
                <input
                  id="ownerEmail"
                  type="email"
                  required
                  className="input-field pl-9"
                  value={form.ownerEmail}
                  onChange={(e) => setForm({ ...form, ownerEmail: e.target.value })}
                  placeholder="you@example.com"
                />
                <Mail className="w-4 h-4 text-fog absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Owner Password */}
            <div>
              <label className="label-eyebrow block mb-1.5" htmlFor="ownerPassword">
                Password
              </label>
              <div className="relative">
                <input
                  id="ownerPassword"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="input-field pl-9 pr-10"
                  value={form.ownerPassword}
                  onChange={(e) => setForm({ ...form, ownerPassword: e.target.value })}
                  placeholder="At least 8 characters"
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

            {/* Plan selection */}
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <label className="label-eyebrow">Choose a plan</label>
                <span className="text-[10px] text-fog/70 font-mono">change anytime</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {PLAN_OPTIONS.map((p) => {
                  const selected = form.plan === p.key
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setForm({ ...form, plan: p.key })}
                      aria-pressed={selected}
                      className={`relative text-left rounded-xl border p-3 transition-all duration-150 ${
                        selected
                          ? 'border-accent bg-accent/10 ring-1 ring-accent/40 shadow-sm'
                          : 'border-panelBorder hover:border-accent/40 hover:bg-panelAlt/30'
                      }`}
                    >
                      {p.popular && (
                        <span className="absolute top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-accent/15 text-accent text-[9px] font-semibold font-mono px-1.5 py-0.5 border border-accent/25">
                          <Star size={8} className="fill-accent" /> Popular
                        </span>
                      )}
                      <span className="block text-xs font-semibold text-paper">{p.name}</span>
                      <div className="mt-1 flex items-baseline gap-0.5">
                        <span className="text-lg font-bold font-display text-paper leading-none">
                          {p.price === 0 ? 'Free' : `$${p.price}`}
                        </span>
                        {p.price > 0 && (
                          <span className="text-[9px] text-fog font-mono">/user·mo</span>
                        )}
                      </div>
                      <p className="text-[10px] text-fog mt-1.5 leading-snug">{p.meta}</p>
                      {selected && (
                        <span className="absolute bottom-2 right-2 inline-flex items-center justify-center h-4 w-4 rounded-full bg-accent text-white">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  )
                })}
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
                  Creating company…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create company
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>

        {/* Footer Navigation Link */}
        <p className="text-xs text-fog text-center mt-6">
          Already registered?{' '}
          <Link
            to="/login"
            className="text-accent hover:underline font-medium transition-all"
          >
            Sign in
          </Link>
        </p>

        <p className="text-[10px] text-fog/50 text-center mt-4 font-mono">
          © {new Date().getFullYear()} Orbitly by Kvant. All rights reserved.
        </p>
      </div>
    </div>
  )
}