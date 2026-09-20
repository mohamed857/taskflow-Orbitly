import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { subscription as subscriptionApi } from '../api/client.js'
import { useI18n } from '../context/LanguageContext.jsx'

const POLL_INTERVAL_MS = 2500
const MAX_ATTEMPTS = 6
const PENDING_KEY = 'tf_pending_checkout'

// Paymob redirects the browser back here after the user pays (or cancels).
// The redirect itself proves nothing — the plan only actually changes once
// Paymob's server-to-server webhook lands on our backend, which can take a
// few seconds. So instead of trusting the redirect, we poll GET /api/subscription
// until the plan reflects the checkout we started, or give up after a few tries.
export default function BillingCallback() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const navigate = useNavigate()
  const [state, setState] = useState('polling') // polling | success | failed
  const attemptsRef = useRef(0)

  useEffect(() => {
    let cancelled = false
    let pending = null
    try {
      pending = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null')
    } catch {
      pending = null
    }

    const finish = (result) => {
      if (cancelled) return
      sessionStorage.removeItem(PENDING_KEY)
      setState(result)
      if (result === 'success') {
        setTimeout(() => !cancelled && navigate('/subscription', { replace: true }), 1500)
      }
    }

    const poll = async () => {
      attemptsRef.current += 1
      try {
        const sub = await subscriptionApi.get()
        if (cancelled) return

        const upgraded = pending
          ? pending.toPlan
            ? sub?.plan === pending.toPlan
            : sub?.plan !== pending.fromPlan
          : false

        if (upgraded) {
          finish('success')
          return
        }
      } catch {
        // A transient network hiccup here shouldn't fail the whole flow —
        // just count it as an attempt and keep polling.
      }

      if (attemptsRef.current >= MAX_ATTEMPTS) {
        finish('failed')
        return
      }
      setTimeout(poll, POLL_INTERVAL_MS)
    }

    // No record of a checkout having started (e.g. page opened directly) —
    // nothing to verify.
    if (!pending) {
      finish('failed')
      return
    }

    poll()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-paper gap-4 px-6 text-center">
      {state === 'polling' && (
        <>
          <Loader2 size={32} className="animate-spin text-accent" />
          <div>
            <p className="font-display font-bold">
              {ar ? 'جاري التحقق من الدفع…' : 'Verifying your payment…'}
            </p>
            <p className="text-fog text-xs mt-1 font-mono">
              {ar ? 'ده بياخد كذا ثانية بس.' : 'This only takes a few seconds.'}
            </p>
          </div>
        </>
      )}

      {state === 'success' && (
        <>
          <CheckCircle2 size={36} className="text-completed" />
          <div>
            <p className="font-display font-bold">
              {ar ? 'تم الترقية بنجاح!' : 'Upgrade successful!'}
            </p>
            <p className="text-fog text-xs mt-1 font-mono">
              {ar ? 'جاري تحويلك…' : 'Redirecting you now…'}
            </p>
          </div>
        </>
      )}

      {state === 'failed' && (
        <>
          <XCircle size={36} className="text-overdue" />
          <div>
            <p className="font-display font-bold">
              {ar ? 'الدفع لم يكتمل' : 'Payment not completed'}
            </p>
            <p className="text-fog text-xs mt-1 font-mono max-w-xs">
              {ar
                ? 'ممكن تكون لغيت العملية أو حصلت مشكلة أثناء الدفع. جرّب تاني.'
                : "Either the payment was cancelled or something went wrong. Let's try again."}
            </p>
          </div>
          <Link
            to="/subscription"
            className="mt-2 h-9 px-4 rounded-lg bg-accent text-white text-xs font-semibold flex items-center justify-center hover:opacity-90 transition-opacity"
          >
            {ar ? 'حاول تاني' : 'Try again'}
          </Link>
        </>
      )}
    </div>
  )
}