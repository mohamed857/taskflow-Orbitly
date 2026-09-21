import { useEffect, useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import { subscription as subscriptionApi, payments as paymentsApi } from '../api/client.js'
import { useI18n } from '../context/LanguageContext.jsx'
import { useToast } from '../context/ToastContext.jsx'

// Full-screen account lock: shown once the subscription's grace period has
// expired. The backend rejects every protected endpoint with 402
// SUBSCRIPTION_LOCKED while in this state (see client.js's global handler),
// which redirects here automatically. Auth and billing endpoints stay open
// on purpose, so this page can always load and let the person pay their way
// out — there is deliberately no navigation away from here.
export default function BillingLocked() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const { push } = useToast()
  const [sub, setSub] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    let cancelled = false
    subscriptionApi
      .get()
      .then((s) => !cancelled && setSub(s))
      .catch((err) => !cancelled && push(err.message || 'Could not load your subscription.', 'error'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [push])

  const payNow = async () => {
    if (!sub || paying) return
    setPaying(true)
    try {
      const res = await paymentsApi.checkout(sub.plan, sub.billingCycle || 'MONTHLY')
      window.location.href = res.iframeUrl
    } catch (err) {
      push(err.message || (ar ? 'تعذر بدء عملية الدفع.' : 'Could not start checkout.'), 'error')
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-ink text-paper gap-4 px-6 text-center">
      <div className="h-14 w-14 rounded-full bg-overdue/15 flex items-center justify-center">
        <Lock size={24} className="text-overdue" />
      </div>

      {loading ? (
        <Loader2 size={22} className="animate-spin text-accent" />
      ) : (
        <>
          <div>
            <h1 className="font-display text-xl font-bold text-paper">
              {ar ? 'اشتراكك انتهى' : 'Your subscription has ended'}
            </h1>
            <p className="text-fog text-xs mt-1.5 max-w-xs mx-auto leading-relaxed">
              {ar
                ? `باقة ${sub?.planName || sub?.plan} محتاجة تجديد عشان تقدر تستخدم Orbitly تاني.`
                : `Your ${sub?.planName || sub?.plan} plan needs to be renewed before you can use Orbitly again.`}
            </p>
          </div>

          <button
            type="button"
            onClick={payNow}
            disabled={paying}
            className="btn-primary mt-2 px-6 h-10 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {paying && <Loader2 size={14} className="animate-spin" />}
            {ar ? 'ادفع الآن' : 'Pay now'}
          </button>
        </>
      )}
    </div>
  )
}