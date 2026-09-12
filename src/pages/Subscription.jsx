import { useEffect, useState, useCallback } from 'react'
import { Check, Loader2, Star, Users, Layers } from 'lucide-react'
import { plans as plansApi, subscription as subscriptionApi, payments as paymentsApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../context/LanguageContext.jsx'

// Prices shown here come straight from GET /api/plans (monthlyUsd/yearlyUsd/
// monthlyEgp/yearlyEgp) — the backend's PricingService is the only source of
// truth for the amount and the exchange rate, so nothing is computed here.
function formatPrice(plan, cycle, currency, ar) {
  const isYearly = cycle === 'YEARLY'
  if (currency === 'EGP') {
    const egp = isYearly ? plan.yearlyEgp : plan.monthlyEgp
    return ar ? `${egp} ج.م` : `EGP ${egp}`
  }
  const usd = isYearly ? plan.yearlyUsd : plan.monthlyUsd
  return `$${usd}`
}

function UsageBar({ icon: Icon, label, used, limit, unlimited, ar }) {
  const pct = unlimited ? 0 : Math.min(100, limit > 0 ? Math.round((used / limit) * 100) : 0)
  const over = !unlimited && used >= limit
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-xs font-semibold text-paper">
          <Icon size={14} className="text-accent" /> {label}
        </span>
        <span className="font-mono text-xs text-fog">
          {used}
          {unlimited ? ` / ${ar ? '∞' : '∞'}` : ` / ${limit}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 rounded-full bg-panelAlt overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-overdue' : 'bg-accent'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      {unlimited && <p className="text-[11px] text-completed font-mono">{ar ? 'غير محدود' : 'Unlimited'}</p>}
    </div>
  )
}

export default function Subscription() {
  const { hasRole } = useAuth()
  const { push } = useToast()
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const isAdmin = hasRole('ADMIN')

  const [sub, setSub] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [changing, setChanging] = useState(null)
  const [cycle, setCycle] = useState('MONTHLY') // MONTHLY | YEARLY
  const [currency, setCurrency] = useState('USD') // USD | EGP

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, p] = await Promise.all([subscriptionApi.get(), plansApi.list()])
      setSub(s)
      setPlans(Array.isArray(p) ? p : [])
    } catch (err) {
      push(err.message || 'Could not load subscription.', 'error')
    } finally {
      setLoading(false)
    }
  }, [push])

  useEffect(() => {
    load()
  }, [load])

  const switchPlan = async (key, pricePerUser) => {
    if (!isAdmin || key === sub?.plan || changing) return
    setChanging(key)

    // FREE has nothing to pay for, so it stays an instant, direct switch.
    if (pricePerUser === 0) {
      try {
        const updated = await subscriptionApi.change(key)
        setSub(updated)
        push(ar ? 'تم تغيير الباقة.' : 'Plan updated.', 'success')
      } catch (err) {
        push(err.message || 'Could not change plan.', 'error')
      } finally {
        setChanging(null)
      }
      return
    }

    // Any paid plan goes through Paymob. The actual upgrade only happens
    // server-side via Paymob's webhook once payment clears — this call just
    // opens the payment page. /billing/callback polls for the real result.
    try {
      const res = await paymentsApi.checkout(key, cycle)
      sessionStorage.setItem(
        'tf_pending_checkout',
        JSON.stringify({ fromPlan: sub?.plan, toPlan: res.plan, startedAt: Date.now() })
      )
      window.location.href = res.iframeUrl
    } catch (err) {
      push(err.message || (ar ? 'تعذر بدء عملية الدفع.' : 'Could not start checkout.'), 'error')
      setChanging(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-accent" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-enter">
      <div>
        <h1 className="font-display text-xl font-bold text-paper">
          {ar ? 'الاشتراك والباقة' : 'Subscription & Plan'}
        </h1>
        <p className="text-fog text-xs mt-1">
          {ar
            ? `باقتك الحالية: ${sub?.planName} — ${sub?.pricePerUser === 0 ? 'مجانًا' : `$${sub?.pricePerUser}/مستخدم/شهر`}`
            : `Current plan: ${sub?.planName} — ${sub?.pricePerUser === 0 ? 'Free' : `$${sub?.pricePerUser}/user/mo`}`}
        </p>
      </div>

      {/* Usage */}
      <div className="grid gap-4 sm:grid-cols-2">
        <UsageBar
          icon={Users}
          label={ar ? 'الأعضاء' : 'Members'}
          used={sub?.membersUsed ?? 0}
          limit={sub?.membersLimit ?? 0}
          unlimited={sub?.membersLimit < 0}
          ar={ar}
        />
        <UsageBar
          icon={Layers}
          label={ar ? 'الفرق' : 'Teams'}
          used={sub?.teamsUsed ?? 0}
          limit={sub?.teamsLimit ?? 0}
          unlimited={sub?.teamsLimit < 0}
          ar={ar}
        />
      </div>

      {/* Plans */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="label-eyebrow text-xs font-mono text-fog">
            {ar ? 'الباقات المتاحة' : 'Available plans'}
          </p>

          <div className="flex items-center gap-2">
            {/* Billing cycle toggle */}
            <div className="inline-flex rounded-lg border border-panelBorder p-0.5 bg-panelAlt/40">
              {['MONTHLY', 'YEARLY'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCycle(c)}
                  className={`px-2.5 h-7 rounded-md text-[11px] font-semibold transition-colors ${
                    cycle === c ? 'bg-accent text-white' : 'text-fog hover:text-paper'
                  }`}
                >
                  {c === 'MONTHLY' ? (ar ? 'شهري' : 'Monthly') : ar ? 'سنوي' : 'Yearly'}
                  {c === 'YEARLY' && (
                    <span className={`ms-1 ${cycle === c ? 'text-white/80' : 'text-completed'}`}>
                      {ar ? '(وفّر شهرين)' : '(2 free)'}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Currency toggle */}
            <div className="inline-flex rounded-lg border border-panelBorder p-0.5 bg-panelAlt/40">
              {['USD', 'EGP'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`px-2.5 h-7 rounded-md text-[11px] font-semibold transition-colors ${
                    currency === c ? 'bg-accent text-white' : 'text-fog hover:text-paper'
                  }`}
                >
                  {c === 'USD' ? '$ USD' : 'ج.م EGP'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {plans.map((p) => {
            const current = p.key === sub?.plan
            const highlight = p.key === 'PRO'
            return (
              <div
                key={p.key}
                className={`glass-panel p-5 flex flex-col ${
                  current ? 'border-accent ring-1 ring-accent/40' : 'border-panelBorder'
                }`}
              >
                {highlight && (
                  <span className="self-start inline-flex items-center gap-1 rounded-full bg-accent/90 px-2 py-0.5 text-[9px] font-bold text-white mb-2">
                    <Star size={10} /> {ar ? 'شائع' : 'Popular'}
                  </span>
                )}
                <h3 className="font-display font-bold text-paper">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-2xl font-bold text-paper">
                    {p.pricePerUser === 0 ? (ar ? 'مجانًا' : 'Free') : formatPrice(p, cycle, currency, ar)}
                  </span>
                  {p.pricePerUser > 0 && (
                    <span className="text-fog text-[10px] font-mono">
                      /{cycle === 'YEARLY' ? (ar ? 'مستخدم/سنة' : 'user/yr') : ar ? 'مستخدم/شهر' : 'user/mo'}
                    </span>
                  )}
                </div>
                {p.pricePerUser > 0 && cycle === 'YEARLY' && (
                  <p className="text-[10px] text-completed font-mono mt-0.5">
                    {ar ? 'مفوتر سنويًا (شهرين مجانًا)' : 'billed annually (2 months free)'}
                  </p>
                )}
                <div className="mt-3 space-y-1 text-[11px] text-fog font-mono">
                  <p>{p.unlimitedMembers ? (ar ? '∞ عضو' : '∞ members') : `${p.maxMembers} ${ar ? 'عضو' : 'members'}`}</p>
                  <p>{p.unlimitedTeams ? (ar ? '∞ فريق' : '∞ teams') : `${p.maxTeams} ${ar ? 'فريق' : 'teams'}`}</p>
                </div>

                <div className="mt-auto pt-5">
                  {current ? (
                    <span className="h-9 rounded-lg bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center gap-1">
                      <Check size={14} /> {ar ? 'باقتك الحالية' : 'Current plan'}
                    </span>
                  ) : isAdmin ? (
                    <button
                      type="button"
                      onClick={() => switchPlan(p.key, p.pricePerUser)}
                      disabled={changing === p.key}
                      className="h-9 w-full rounded-lg border border-panelBorder text-paper text-xs font-semibold hover:border-accent hover:text-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {changing === p.key && <Loader2 size={13} className="animate-spin" />}
                      {ar ? 'التبديل لهذه الباقة' : 'Switch to this plan'}
                    </button>
                  ) : (
                    <span className="text-[10px] text-fog/70 font-mono block text-center">
                      {ar ? 'المالك فقط يغيّر الباقة' : 'Owner changes the plan'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {isAdmin && (
          <p className="text-[11px] text-fog/70 mt-3">
            {ar
              ? 'الترقية للباقات المدفوعة بتفتح صفحة دفع آمنة عبر Paymob. لو سعر الصرف اتغيّر بعد ما فتحت الصفحة، المبلغ اللي هيتحصّل فعليًا هو المحسوب وقت الدفع.'
              : 'Upgrading to a paid plan opens a secure Paymob checkout page. If the exchange rate changes after this page loads, the amount actually charged is whatever it is at checkout time.'}
          </p>
        )}
      </div>
    </div>
  )
}