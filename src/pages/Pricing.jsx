import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Loader2, Star } from 'lucide-react'
import { plans as plansApi } from '../api/client.js'
import { useI18n } from '../context/LanguageContext.jsx'
import Logo from '../components/Logo.jsx'

// Feature bullets per plan (marketing copy lives on the client).
const FEATURES = {
  FREE: {
    en: ['Task boards (Kanban, list, calendar)', 'Real-time chat & presence', 'Activity history', 'Email or username login'],
    ar: ['لوحات المهام (كانبان، قائمة، تقويم)', 'دردشة لحظية وحالة اتصال', 'سجل النشاط', 'دخول بالإيميل أو اليوزر']
  },
  STARTER: {
    en: ['Everything in Free', 'Labels & filtering', 'Attachments on tasks', 'Instant notifications'],
    ar: ['كل مزايا Free', 'وسوم وتصفية', 'مرفقات على المهام', 'إشعارات فورية']
  },
  PRO: {
    en: ['Everything in Starter', 'Priorities & sub-tasks', 'Read receipts & typing', 'Roles & team views'],
    ar: ['كل مزايا Starter', 'أولويات ومهام فرعية', 'إيصالات قراءة ومؤشّر كتابة', 'أدوار وعروض للفرق']
  },
  BUSINESS: {
    en: ['Everything in Pro', 'Unlimited members & teams', 'Priority support', 'Refresh-token sessions'],
    ar: ['كل مزايا Pro', 'أعضاء وفرق بلا حدود', 'دعم بأولوية', 'جلسات برموز تحديث']
  }
}

function limitLabel(value, unlimited, ar, noun) {
  if (unlimited) return ar ? `${noun} غير محدود` : `Unlimited ${noun}`
  return ar ? `حتى ${value} ${noun}` : `Up to ${value} ${noun}`
}

// Small segmented control shared by both toggles.
function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-panelBorder bg-panelAlt/40 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors ${
            value === o.value ? 'bg-accent text-white' : 'text-fog hover:text-paper'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Pricing() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [cycle, setCycle] = useState('monthly') // 'monthly' | 'yearly'
  const [currency, setCurrency] = useState('usd') // 'usd' | 'egp'

  useEffect(() => {
    let cancelled = false
    plansApi
      .list()
      .then((data) => !cancelled && setPlans(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  const yearly = cycle === 'yearly'
  const egp = currency === 'egp'

  // Format a money amount in the active currency.
  const money = (amount) => {
    const n = Number(amount || 0).toLocaleString(ar ? 'ar-EG' : 'en-US')
    return egp ? (ar ? `${n} ج.م` : `${n} EGP`) : `$${n}`
  }

  // The price to show for a plan given the active cycle + currency, plus the
  // per-month equivalent used in the "billed yearly" sub-line.
  const priceFor = (p) => {
    if (yearly) return egp ? p.yearlyEgp : p.yearlyUsd
    return egp ? p.monthlyEgp : p.monthlyUsd
  }
  const perMonthEquivalent = (p) => (egp ? p.yearlyEgp : p.yearlyUsd) / 12

  const cycleOptions = useMemo(
    () => [
      { value: 'monthly', label: ar ? 'شهري' : 'Monthly' },
      { value: 'yearly', label: ar ? 'سنوي' : 'Yearly' }
    ],
    [ar]
  )
  const currencyOptions = useMemo(
    () => [
      { value: 'usd', label: ar ? 'دولار $' : 'USD $' },
      { value: 'egp', label: ar ? 'جنيه ج.م' : 'EGP' }
    ],
    [ar]
  )

  return (
    <div className="min-h-screen bg-panel px-4 py-14 sm:px-6" dir={ar ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="flex items-center justify-center gap-2 text-accent">
            <Logo size={28} />
            <span className="font-display text-2xl font-bold text-paper">Orbitly</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-paper">
            {ar ? 'أسعار بسيطة تنمو مع فريقك' : 'Simple pricing that scales with your team'}
          </h1>
          <p className="text-fog text-sm max-w-2xl mx-auto">
            {ar
              ? 'لكل مستخدم. اختر شهري أو سنوي (شهرين مجانًا)، وادفع بالدولار أو بالجنيه المصري.'
              : 'Per user. Choose monthly or yearly (2 months free), pay in USD or EGP.'}
          </p>
        </div>

        {/* Toggles */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <Segmented options={cycleOptions} value={cycle} onChange={setCycle} />
          {yearly && (
            <span className="inline-flex items-center rounded-full bg-completed/15 text-completed px-2.5 py-1 text-[11px] font-semibold">
              {ar ? 'وفّر شهرين' : '2 months free'}
            </span>
          )}
          <Segmented options={currencyOptions} value={currency} onChange={setCurrency} />
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-accent" size={26} />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
            {plans.map((p) => {
              const highlight = p.key === 'PRO'
              const feats = FEATURES[p.key]?.[ar ? 'ar' : 'en'] ?? []
              const free = p.monthlyUsd === 0
              const amount = priceFor(p)
              return (
                <div
                  key={p.key}
                  className={`glass-panel p-6 flex flex-col ${
                    highlight ? 'border-accent ring-1 ring-accent/40' : 'border-panelBorder'
                  }`}
                >
                  {highlight && (
                    <span className="self-start inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold text-white mb-2">
                      <Star size={11} /> {ar ? 'الأكثر شيوعًا' : 'Most popular'}
                    </span>
                  )}
                  <h2 className="font-display text-lg font-bold text-paper">{p.name}</h2>

                  <div className="mt-3 min-h-[3.5rem]">
                    {free ? (
                      <span className="font-display text-3xl font-bold text-paper">{ar ? 'مجانًا' : 'Free'}</span>
                    ) : (
                      <>
                        <div className="flex items-baseline gap-1 flex-wrap">
                          <span className="font-display text-3xl font-bold text-paper">{money(amount)}</span>
                          <span className="text-fog text-xs font-mono">
                            /{ar ? 'مستخدم' : 'user'}/{yearly ? (ar ? 'سنة' : 'yr') : ar ? 'شهر' : 'mo'}
                          </span>
                        </div>
                        {yearly && (
                          <p className="text-[11px] text-fog font-mono mt-0.5">
                            ≈ {money(Math.round(perMonthEquivalent(p)))}/{ar ? 'شهر' : 'mo'} · {ar ? 'فوترة سنوية' : 'billed yearly'}
                          </p>
                        )}
                      </>
                    )}
                  </div>

                  <div className="mt-2 space-y-1.5 text-xs">
                    <p className="text-paper font-semibold">
                      {limitLabel(p.maxMembers, p.unlimitedMembers, ar, ar ? 'عضو' : 'members')}
                    </p>
                    <p className="text-paper font-semibold">
                      {limitLabel(p.maxTeams, p.unlimitedTeams, ar, ar ? 'فريق' : 'teams')}
                    </p>
                  </div>

                  <ul className="mt-5 space-y-2 flex-1">
                    {feats.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-fog">
                        <Check size={14} className="text-accent shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/register-company"
                    className={`mt-6 h-10 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${
                      highlight
                        ? 'bg-accent text-white hover:opacity-90'
                        : 'border border-panelBorder text-paper hover:border-accent hover:text-accent'
                    }`}
                  >
                    {free ? (ar ? 'ابدأ مجانًا' : 'Start free') : ar ? 'ابدأ الآن' : 'Get started'}
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        <p className="text-center text-xs text-fog mt-10">
          <Link to="/login" className="text-accent hover:underline">
            {ar ? '← العودة لتسجيل الدخول' : '← Back to sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}
