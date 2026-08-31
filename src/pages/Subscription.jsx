import { useEffect, useState, useCallback, useMemo } from 'react'
import { Check, Loader2, Star, Users, Layers, Lock } from 'lucide-react'
import { plans as plansApi, subscription as subscriptionApi } from '../api/client.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { useI18n } from '../context/LanguageContext.jsx'

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
          {unlimited ? ' / ∞' : ` / ${limit}`}
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

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-panelBorder bg-panelAlt/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-colors ${
            value === o.value ? 'bg-accent text-white' : 'text-fog hover:text-paper'
          }`}
        >
          {o.label}
        </button>
      ))}
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
  const [cycle, setCycle] = useState('monthly')
  const [currency, setCurrency] = useState('usd')

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

  const yearly = cycle === 'yearly'
  const egp = currency === 'egp'

  const money = (amount) => {
    const n = Number(amount || 0).toLocaleString(ar ? 'ar-EG' : 'en-US')
    return egp ? (ar ? `${n} ج.م` : `${n} EGP`) : `$${n}`
  }
  const priceFor = (p) => (yearly ? (egp ? p.yearlyEgp : p.yearlyUsd) : egp ? p.monthlyEgp : p.monthlyUsd)

  // A plan is a blocked downgrade when its limits are below current usage.
  const isDowngradeBlocked = useCallback(
    (p) => {
      if (!sub) return false
      const overMembers = !p.unlimitedMembers && (sub.membersUsed ?? 0) > p.maxMembers
      const overTeams = !p.unlimitedTeams && (sub.teamsUsed ?? 0) > p.maxTeams
      return overMembers || overTeams
    },
    [sub]
  )

  const cycleOptions = useMemo(
    () => [
      { value: 'monthly', label: ar ? 'شهري' : 'Monthly' },
      { value: 'yearly', label: ar ? 'سنوي' : 'Yearly' }
    ],
    [ar]
  )
  const currencyOptions = useMemo(
    () => [
      { value: 'usd', label: 'USD $' },
      { value: 'egp', label: ar ? 'ج.م' : 'EGP' }
    ],
    [ar]
  )

  const switchPlan = async (key) => {
    if (!isAdmin || key === sub?.plan) return
    setChanging(key)
    try {
      const updated = await subscriptionApi.change(key)
      setSub(updated)
      push(ar ? 'تم تغيير الباقة.' : 'Plan updated.', 'success')
    } catch (err) {
      push(err.message || 'Could not change plan.', 'error')
    } finally {
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <p className="label-eyebrow text-xs font-mono text-fog">
            {ar ? 'الباقات المتاحة' : 'Available plans'}
          </p>
          <div className="flex items-center gap-2">
            <Segmented options={cycleOptions} value={cycle} onChange={setCycle} />
            {yearly && (
              <span className="inline-flex items-center rounded-full bg-completed/15 text-completed px-2 py-0.5 text-[10px] font-semibold">
                {ar ? 'شهران مجانًا' : '2 mo free'}
              </span>
            )}
            <Segmented options={currencyOptions} value={currency} onChange={setCurrency} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {plans.map((p) => {
            const current = p.key === sub?.plan
            const highlight = p.key === 'PRO'
            const free = p.monthlyUsd === 0
            const blocked = !current && isDowngradeBlocked(p)
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
                <div className="mt-2 min-h-[3rem]">
                  {free ? (
                    <span className="font-display text-2xl font-bold text-paper">{ar ? 'مجانًا' : 'Free'}</span>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="font-display text-2xl font-bold text-paper">{money(priceFor(p))}</span>
                        <span className="text-fog text-[10px] font-mono">
                          /{ar ? 'مستخدم' : 'user'}/{yearly ? (ar ? 'سنة' : 'yr') : ar ? 'شهر' : 'mo'}
                        </span>
                      </div>
                      {yearly && (
                        <p className="text-[10px] text-fog font-mono mt-0.5">
                          ≈ {money(Math.round((egp ? p.yearlyEgp : p.yearlyUsd) / 12))}/{ar ? 'شهر' : 'mo'}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="mt-3 space-y-1 text-[11px] text-fog font-mono">
                  <p>{p.unlimitedMembers ? (ar ? '∞ عضو' : '∞ members') : `${p.maxMembers} ${ar ? 'عضو' : 'members'}`}</p>
                  <p>{p.unlimitedTeams ? (ar ? '∞ فريق' : '∞ teams') : `${p.maxTeams} ${ar ? 'فريق' : 'teams'}`}</p>
                </div>

                <div className="mt-auto pt-5">
                  {current ? (
                    <span className="h-9 rounded-lg bg-accent/15 text-accent text-xs font-semibold flex items-center justify-center gap-1">
                      <Check size={14} /> {ar ? 'باقتك الحالية' : 'Current plan'}
                    </span>
                  ) : !isAdmin ? (
                    <span className="text-[10px] text-fog/70 font-mono block text-center">
                      {ar ? 'المالك فقط يغيّر الباقة' : 'Owner changes the plan'}
                    </span>
                  ) : blocked ? (
                    <div className="space-y-1.5">
                      <span className="h-9 rounded-lg bg-overdue/10 text-overdue text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed">
                        <Lock size={12} /> {ar ? 'غير متاح' : 'Unavailable'}
                      </span>
                      <p className="text-[10px] text-overdue/90 text-center leading-tight">
                        {ar
                          ? 'استخدامك الحالي يتجاوز حدود هذه الباقة. أزل أعضاء أو فرقًا أولًا.'
                          : 'Your usage exceeds this plan. Remove members or teams first.'}
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchPlan(p.key)}
                      disabled={changing === p.key}
                      className="h-9 w-full rounded-lg border border-panelBorder text-paper text-xs font-semibold hover:border-accent hover:text-accent transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      {changing === p.key && <Loader2 size={13} className="animate-spin" />}
                      {ar ? 'التبديل لهذه الباقة' : 'Switch to this plan'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {isAdmin && (
          <p className="text-[11px] text-fog/70 mt-3">
            {ar
              ? 'التبديل فوري (بدون دفع حاليًا). دمج بوابة الدفع يمكن إضافته لاحقًا.'
              : 'Switching is instant (no payment yet). A payment gateway can be added later.'}
          </p>
        )}
      </div>
    </div>
  )
}
