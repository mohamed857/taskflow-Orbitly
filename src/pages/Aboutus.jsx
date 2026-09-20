import LegalPageLayout from '../components/LegalPageLayout.jsx'
import { useI18n } from '../context/LanguageContext.jsx'

export default function AboutUs() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  return (
    <LegalPageLayout title={ar ? 'من نحن' : 'About Us'}>
      {ar ? (
        <>
          <p>
            <strong className="text-paper">Orbitly</strong> منتج من <strong className="text-paper">Kvant</strong>،
            وهو نظام إدارة مهام وعمل جماعي (SaaS) مصمم للشركات والفرق اللي محتاجة تنظّم شغلها بشكل واضح
            ومعزول عن أي شركة تانية على نفس المنصة.
          </p>
          <p>
            كل شركة بتسجّل على Orbitly بتحصل على مساحة عمل (workspace) خاصة بيها بالكامل، وهرمية أدوار
            واضحة (Admin، Manager، Team Lead، User) بتحدد مين يقدر يشوف ويعدّل إيه. الهدف إننا نديك أداة
            بسيطة وسريعة، من غير التعقيد الزائد اللي بيتعب بيه أدوات إدارة المشاريع الكبيرة.
          </p>
          <p>
            المنصة بتقدّم متابعة المهام، الفرق، التواصل الداخلي، والاشتراكات المدفوعة لفتح إمكانيات أكبر
            (عدد أعضاء وفرق غير محدود في الباقات الأعلى).
          </p>
          <div className="pt-2">
            <p className="text-paper font-semibold text-xs mb-1">التواصل معنا</p>
            <p>لأي استفسار عن الشركة أو المنتج، تقدر تزور صفحة "اتصل بنا".</p>
          </div>
        </>
      ) : (
        <>
          <p>
            <strong className="text-paper">Orbitly</strong> is a product by{' '}
            <strong className="text-paper">Kvant</strong> — a team task and workspace management SaaS
            built for companies that need a clear, isolated way to organize their work, fully separated
            from any other company on the platform.
          </p>
          <p>
            Every company that signs up on Orbitly gets its own fully isolated workspace, along with a
            clear role hierarchy (Admin, Manager, Team Lead, User) that defines who can see and change
            what. Our goal is to give teams a fast, uncomplicated tool without the overhead that comes
            with heavier project-management software.
          </p>
          <p>
            The platform covers task tracking, teams, internal messaging, and paid subscriptions that
            unlock higher member and team limits.
          </p>
          <div className="pt-2">
            <p className="text-paper font-semibold text-xs mb-1">Get in touch</p>
            <p>For any question about the company or the product, visit our Contact Us page.</p>
          </div>
        </>
      )}
    </LegalPageLayout>
  )
}