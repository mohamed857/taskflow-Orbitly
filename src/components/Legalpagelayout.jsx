import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useI18n } from '../context/LanguageContext.jsx'

// Shared shell for standalone public pages (About, Contact, legal policies).
// Kept outside the authenticated Layout — these must be reachable by anyone,
// logged in or not (payment-gateway reviewers included).
export default function LegalPageLayout({ title, updated, children }) {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  return (
    <div className="min-h-screen bg-ink text-paper" dir={ar ? 'rtl' : 'ltr'}>
      <header className="border-b border-panelBorder/60">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-sm font-display font-bold text-paper">
            <span className="status-dot-pulse" />
            Orbitly
          </Link>
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-fog hover:text-accent transition-colors"
          >
            {ar ? (
              <>
                {'الرئيسية'}
                <ArrowLeft size={14} className="rotate-180" />
              </>
            ) : (
              <>
                <ArrowLeft size={14} />
                {'Home'}
              </>
            )}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-2xl font-bold text-paper mb-1">{title}</h1>
        {updated && <p className="text-xs text-fog/70 font-mono mb-8">{updated}</p>}
        <div className="prose-legal space-y-6 text-sm text-fog leading-relaxed">{children}</div>
      </main>

      <footer className="border-t border-panelBorder/60 mt-10">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] text-fog/70">
          <Link to="/about" className="hover:text-accent transition-colors">
            {ar ? 'من نحن' : 'About'}
          </Link>
          <Link to="/contact" className="hover:text-accent transition-colors">
            {ar ? 'اتصل بنا' : 'Contact'}
          </Link>
          <Link to="/privacy-policy" className="hover:text-accent transition-colors">
            {ar ? 'سياسة الخصوصية' : 'Privacy Policy'}
          </Link>
          <Link to="/delivery-policy" className="hover:text-accent transition-colors">
            {ar ? 'سياسة التسليم' : 'Delivery Policy'}
          </Link>
          <Link to="/refund-policy" className="hover:text-accent transition-colors">
            {ar ? 'سياسة الاسترجاع' : 'Refund Policy'}
          </Link>
          <Link to="/pricing" className="hover:text-accent transition-colors">
            {ar ? 'الأسعار' : 'Pricing'}
          </Link>
        </div>
        <div className="max-w-3xl mx-auto px-4 pb-6 text-[10px] text-fog/50 font-mono">
          © {new Date().getFullYear()} Orbitly by Kvant. All rights reserved.
        </div>
      </footer>
    </div>
  )
}