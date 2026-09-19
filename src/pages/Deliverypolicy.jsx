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

export default function DeliveryPolicy() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  if (ar) {
    return (
      <LegalPageLayout title="سياسة التسليم" updated="آخر تحديث: سبتمبر 2026">
        <Section title="طبيعة الخدمة">
          <p>
            Orbitly منتج رقمي بالكامل (Software-as-a-Service) — مفيش أي منتجات مادية يتم شحنها. الوصول
            للخدمة بيتم بالكامل عبر الإنترنت.
          </p>
        </Section>

        <Section title="تسليم الحساب">
          <p>
            بمجرد إنشاء شركتك بنجاح، بيتم تفعيل مساحة العمل (workspace) الخاصة بيك فورًا، وتقدر تبدأ
            تستخدم المنصة على طول من غير أي انتظار.
          </p>
        </Section>

        <Section title="تسليم الترقيات المدفوعة">
          <p>
            لما تدفع لترقية باقتك عبر Paymob، بيتم تفعيل الباقة الجديدة تلقائيًا بمجرد تأكيد الدفع من
            بوابة الدفع للسيرفر بتاعنا — ده عادةً بيحصل خلال ثواني لدقائق معدودة من إتمام الدفع بنجاح.
          </p>
          <p>
            لو مرّت مدة أطول من المتوقع من غير ما الباقة تتفعّل، تواصل معانا على{' '}
            <a href="mailto:hello@kvanthq.com" className="text-accent hover:underline">
              hello@kvanthq.com
            </a>{' '}
            مع تفاصيل عملية الدفع، وهنتحقق ونحلها بأسرع وقت.
          </p>
        </Section>

        <Section title="مفيش شحن مادي">
          <p>بما إن الخدمة رقمية بالكامل، مفيش تكاليف شحن، مواعيد توصيل، أو منتجات مادية مرتبطة بالخدمة.</p>
        </Section>
      </LegalPageLayout>
    )
  }

  return (
    <LegalPageLayout title="Delivery & Shipping Policy" updated="Last updated: September 2026">
      <Section title="Nature of the Service">
        <p>
          Orbitly is a fully digital product (Software-as-a-Service) — there are no physical goods to
          ship. Access to the service is provided entirely online.
        </p>
      </Section>

      <Section title="Account Delivery">
        <p>
          Once your company is created successfully, your workspace is provisioned and activated
          immediately, and you can start using the platform right away with no waiting period.
        </p>
      </Section>

      <Section title="Delivery of Paid Upgrades">
        <p>
          When you pay to upgrade your plan through Paymob, the new plan is activated automatically once
          our server receives payment confirmation from the payment gateway — this typically happens
          within seconds to a few minutes of a successful payment.
        </p>
        <p>
          If your plan hasn't updated after a longer than expected wait, contact us at{' '}
          <a href="mailto:hello@kvanthq.com" className="text-accent hover:underline">
            hello@kvanthq.com
          </a>{' '}
          with your payment details and we'll investigate and resolve it promptly.
        </p>
      </Section>

      <Section title="No Physical Shipping">
        <p>
          Since the service is entirely digital, there are no shipping costs, delivery timeframes, or
          physical products associated with it.
        </p>
      </Section>
    </LegalPageLayout>
  )
}