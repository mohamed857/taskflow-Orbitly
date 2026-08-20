import { useEffect, useState } from 'react'
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

export default function Pricing() {
  const { lang } = useI18n()
  const ar = lang === 'ar'
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)

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

  return (
    <div className="min-h-screen bg-panel px-4 py-14 sm:px-6" dir={ar ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center space-y-3 mb-12">
          <div className="flex items-center justify-center gap-2 text-accent">
            <Logo size={28} />
            <span className="font-display text-2xl font-bold text-paper">Orbitly</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-paper">
            {ar ? 'أسعار بسيطة تنمو مع فريقك' : 'Simple pricing that scales with your team'}
          </h1>
          <p className="text-fog text-sm max-w-2xl mx-auto">
            {ar
              ? 'لكل مستخدم/شهر، فوترة سنوية. أقل من المنافسين — بلا مفاجآت.'
              : 'Per user / month, billed annually. Less than the competition — no surprises.'}
          </p>
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
              return (
                <div
                  key={p.key}
                  className={`glass-panel p-6 flex flex-col relative ${
                    highlight ? 'border-accent ring-1 ring-accent/40' : 'border-panelBorder'
                  }`}
                >
                  {highlight && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[10px] font-bold text-white">
                      <Star size={11} /> {ar ? 'الأكثر شيوعًا' : 'Most popular'}
                    </span>
                  )}
                  <h2 className="font-display text-lg font-bold text-paper">{p.name}</h2>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-bold text-paper">${p.pricePerUser}</span>
                    <span className="text-fog text-xs font-mono">/{ar ? 'مستخدم/شهر' : 'user/mo'}</span>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs">
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
                    {p.pricePerUser === 0 ? (ar ? 'ابدأ مجانًا' : 'Start free') : ar ? 'ابدأ الآن' : 'Get started'}
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
