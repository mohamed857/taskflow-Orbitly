import LegalPageLayout from '../components/LegalPageLayout.jsx'
import { useI18n } from '../context/LanguageContext.jsx'

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-paper font-semibold text-sm mb-1.5">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export default function PrivacyPolicy() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  if (ar) {
    return (
      <LegalPageLayout title="سياسة الخصوصية" updated="آخر تحديث: سبتمبر 2026">
        <Section title="١. المقدمة">
          <p>
            سياسة الخصوصية دي بتوضح إزاي Orbitly (منتج من Kvant) بتجمع وتستخدم وتحمي بياناتك لما تستخدم
            المنصة. باستخدامك للمنصة، انت موافق على الممارسات الموضحة هنا.
          </p>
        </Section>

        <Section title="٢. البيانات اللي بنجمعها">
          <p>بنجمع الأنواع دي من البيانات:</p>
          <ul className="list-disc ps-5 space-y-1">
            <li>بيانات الحساب: الاسم، اسم المستخدم، البريد الإلكتروني، كلمة المرور (مشفّرة).</li>
            <li>بيانات الشركة: اسم الشركة، الأعضاء، الفرق، والمهام اللي بتنشئها داخل مساحة عملك.</li>
            <li>بيانات الاستخدام: سجلات النشاط، أوقات تسجيل الدخول، لأغراض الأمان والدعم الفني.</li>
            <li>بيانات الدفع: عند الترقية لباقة مدفوعة، معالج الدفع (Paymob) هو اللي بيتعامل مع بيانات
              البطاقة مباشرة — إحنا مش بنخزّن أو نشوف أرقام البطاقات خالص.</li>
          </ul>
        </Section>

        <Section title="٣. إزاي بنستخدم البيانات">
          <ul className="list-disc ps-5 space-y-1">
            <li>تشغيل الحساب وميزات المنصة (المهام، الفرق، الرسائل، الإشعارات).</li>
            <li>معالجة الاشتراكات والترقيات المدفوعة.</li>
            <li>حماية الحسابات من الاستخدام غير المصرح به (تحديد معدل الطلبات، كشف الأنشطة المشبوهة).</li>
            <li>التواصل معك بخصوص حسابك أو تحديثات مهمة على الخدمة.</li>
          </ul>
        </Section>

        <Section title="٤. الكوكيز والتخزين المحلي">
          <p>
            بنستخدم التخزين المحلي في متصفحك (localStorage) لحفظ جلسة تسجيل الدخول (التوكن) بس — مش
            بنستخدمه لأغراض إعلانية أو تتبّع خارج المنصة.
          </p>
        </Section>

        <Section title="٥. مشاركة البيانات مع أطراف ثالثة">
          <p>
            بنشارك أقل قدر ممكن من البيانات مع Paymob (معالج الدفع) لإتمام عمليات الترقية المدفوعة فقط.
            مش بنبيع أو نأجّر بياناتك لأي طرف تالت لأغراض تسويقية.
          </p>
        </Section>

        <Section title="٦. الاحتفاظ بالبيانات">
          <p>
            بنحتفظ ببياناتك طول ما حسابك نشط. لو حذفت الشركة/مساحة العمل، بنحذف البيانات المرتبطة بيها
            خلال فترة معقولة، ما عدا اللي القانون بيلزمنا نحتفظ بيه (زي سجلات المعاملات المالية).
          </p>
        </Section>

        <Section title="٧. حقوقك">
          <p>
            تقدر تطلب الاطلاع على بياناتك، تعديلها، أو حذف حسابك بالكامل في أي وقت من خلال صفحة الملف
            الشخصي، أو بالتواصل معانا مباشرة.
          </p>
        </Section>

        <Section title="٨. التعديلات على هذه السياسة">
          <p>ممكن نحدّث سياسة الخصوصية دي من وقت للتاني. أي تعديل جوهري هنوضحه على المنصة.</p>
        </Section>

        <Section title="٩. التواصل">
          <p>
            لأي استفسار عن الخصوصية، تواصل معانا على{' '}
            <a href="mailto:hello@kvanthq.com" className="text-accent hover:underline">
              hello@kvanthq.com
            </a>
            .
          </p>
        </Section>
      </LegalPageLayout>
    )
  }

  return (
    <LegalPageLayout title="Privacy Policy" updated="Last updated: September 2026">
      <Section title="1. Introduction">
        <p>
          This Privacy Policy explains how Orbitly (a product by Kvant) collects, uses, and protects your
          data when you use the platform. By using Orbitly, you agree to the practices described here.
        </p>
      </Section>

      <Section title="2. Information We Collect">
        <ul className="list-disc ps-5 space-y-1">
          <li>Account data: name, username, email address, and password (stored hashed).</li>
          <li>Company data: company name, members, teams, and tasks created within your workspace.</li>
          <li>Usage data: activity logs and login timestamps, used for security and support.</li>
          <li>
            Payment data: when you upgrade to a paid plan, our payment processor (Paymob) handles your
            card details directly — we never store or see full card numbers.
          </li>
        </ul>
      </Section>

      <Section title="3. How We Use Your Information">
        <ul className="list-disc ps-5 space-y-1">
          <li>To operate your account and the platform's features (tasks, teams, messaging, notifications).</li>
          <li>To process subscriptions and paid upgrades.</li>
          <li>To protect accounts from unauthorized access (rate limiting, abuse detection).</li>
          <li>To contact you about your account or important service updates.</li>
        </ul>
      </Section>

      <Section title="4. Cookies & Local Storage">
        <p>
          We use your browser's local storage to keep your login session (access token) only — not for
          advertising or tracking outside the platform.
        </p>
      </Section>

      <Section title="5. Sharing With Third Parties">
        <p>
          We share the minimum data necessary with Paymob (our payment processor) solely to complete
          paid upgrades. We do not sell or rent your data to third parties for marketing purposes.
        </p>
      </Section>

      <Section title="6. Data Retention">
        <p>
          We retain your data for as long as your account is active. If a company/workspace is deleted,
          associated data is removed within a reasonable period, except where we're legally required to
          keep records (e.g. financial transaction logs).
        </p>
      </Section>

      <Section title="7. Your Rights">
        <p>
          You can access, correct, or delete your account at any time from your Profile page, or by
          contacting us directly.
        </p>
      </Section>

      <Section title="8. Changes to This Policy">
        <p>We may update this Privacy Policy from time to time. Material changes will be noted on the platform.</p>
      </Section>

      <Section title="9. Contact">
        <p>
          For privacy questions, reach us at{' '}
          <a href="mailto:hello@kvanthq.com" className="text-accent hover:underline">
            hello@kvanthq.com
          </a>
          .
        </p>
      </Section>
    </LegalPageLayout>
  )
}