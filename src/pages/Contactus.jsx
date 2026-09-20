import { Mail, Phone, MapPin } from 'lucide-react'
import LegalPageLayout from '../components/LegalPageLayout.jsx'
import { useI18n } from '../context/LanguageContext.jsx'

export default function ContactUs() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  return (
    <LegalPageLayout title={ar ? 'اتصل بنا' : 'Contact Us'}>
      <p>
        {ar
          ? 'لو عندك أي سؤال عن Orbitly، الاشتراكات، أو أي مشكلة تقنية، تقدر تتواصل معانا مباشرة:'
          : "If you have any question about Orbitly, billing, or a technical issue, you can reach us directly:"}
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mt-2">
        <a
          href="mailto:hello@kvanthq.com"
          className="glass-panel p-4 flex flex-col items-start gap-2 hover:border-accent/50 transition-colors"
        >
          <Mail size={18} className="text-accent" />
          <span className="text-xs text-fog">{ar ? 'الإيميل' : 'Email'}</span>
          <span className="text-sm font-semibold text-paper">hello@kvanthq.com</span>
        </a>

        <a
          href="tel:+201033845428"
          className="glass-panel p-4 flex flex-col items-start gap-2 hover:border-accent/50 transition-colors"
        >
          <Phone size={18} className="text-accent" />
          <span className="text-xs text-fog">{ar ? 'الهاتف' : 'Phone'}</span>
          <span className="text-sm font-semibold text-paper" dir="ltr">
            +20 103 384 5428
          </span>
        </a>

        <div className="glass-panel p-4 flex flex-col items-start gap-2">
          <MapPin size={18} className="text-accent" />
          <span className="text-xs text-fog">{ar ? 'العنوان' : 'Address'}</span>
          <span className="text-sm font-semibold text-paper">Cairo, Egypt</span>
        </div>
      </div>

      <p className="text-xs text-fog/70 pt-4">
        {ar
          ? 'بنرد عادةً خلال يوم إلى يومي عمل.'
          : 'We typically respond within 1–2 business days.'}
      </p>
    </LegalPageLayout>
  )
}