import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, LifeBuoy, Copy, Check } from 'lucide-react'
import { useState } from 'react'

// The support inbox shown to locked-out users. Set VITE_SUPPORT_EMAIL at build
// time to your own address; this is the fallback.
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || 'support@orbitly.app'

export default function ForgotPassword() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked; the address is visible to copy manually */
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
          <div className="h-11 w-11 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
            <LifeBuoy size={22} />
          </div>
          <h1 className="text-2xl font-bold text-paper mb-1 tracking-tight">Forgot your password?</h1>
          <p className="text-xs text-fog mb-6 leading-relaxed">
            For your security, passwords are reset by our team. Email us from the address on your
            account and we'll set a new one for you right away.
          </p>

          <label className="label-eyebrow block mb-1.5">Contact us</label>
          <div className="flex items-center gap-2">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=Password%20reset%20request`}
              className="flex-1 inline-flex items-center gap-2 text-sm font-mono bg-panelAlt/60 border border-panelBorder/60 rounded-lg px-3 py-2.5 text-paper hover:border-accent/40 transition-colors truncate"
            >
              <Mail size={15} className="text-accent shrink-0" />
              <span className="truncate">{SUPPORT_EMAIL}</span>
            </a>
            <button onClick={copy} className="btn-ghost p-2.5 rounded-lg" title="Copy email">
              {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
            </button>
          </div>

          <p className="text-[11px] text-fog/70 mt-3 font-mono">
            Tip: send it from your account email so we can verify it's you.
          </p>
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
