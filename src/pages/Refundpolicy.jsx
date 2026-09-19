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

export default function RefundPolicy() {
  const { lang } = useI18n()
  const ar = lang === 'ar'

  if (ar) {
    return (
      <LegalPageLayout title="سياسة الاسترجاع والإلغاء" updated="آخر تحديث: سبتمبر 2026">
        <Section title="الباقة المجانية">
          <p>باقة Free مجانية بالكامل ومفيش أي عملية دفع مرتبطة بيها، فمفيش داعي لاسترجاع.</p>
        </Section>

        <Section title="الباقات المدفوعة">
          <p>
            الباقات المدفوعة (Pro، Business، إلخ) بتتحصّل مقدمًا، إما شهريًا أو سنويًا حسب اختيارك وقت
            الترقية.
          </p>
        </Section>

        <Section title="الإلغاء">
          <p>
            تقدر تلغي اشتراكك أو ترجع لباقة Free في أي وقت من صفحة "الاشتراك". التبديل لباقة Free بيتم
            فورًا، لكن أي مبلغ اتحصّل بالفعل عن الفترة الحالية مش بيترد تلقائيًا عند الإلغاء.
          </p>
        </Section>

        <Section title="الاسترجاع">
          <p>
            بشكل عام، المبالغ المدفوعة عن باقات مدفوعة غير قابلة للاسترجاع بعد إتمام عملية الدفع بنجاح،
            نظرًا لطبيعة الخدمة الرقمية اللي بتتفعّل فورًا.
          </p>
          <p>
            في حالة وجود خطأ تقني فعلي (زي خصم مبلغ من غير ما الباقة تتفعّل، أو خصم مكرر بالغلط)، تواصل
            معانا خلال 7 أيام من تاريخ الدفع على{' '}
            <a href="mailto:hello@kvanthq.com" className="text-accent hover:underline">
              hello@kvanthq.com
            </a>{' '}
            وهنراجع الحالة ونحلها بشكل مناسب.
          </p>
        </Section>

        <Section title="التنازع على المدفوعات">
          <p>
            قبل ما تفتح نزاع (chargeback) مع البنك أو معالج الدفع، برجاء التواصل معانا الأول — أغلب
            المشاكل بتتحل أسرع بكتير من خلال التواصل المباشر.
          </p>
        </Section>
      </LegalPageLayout>
    )
  }

  return (
    <LegalPageLayout title="Refund & Cancellation Policy" updated="Last updated: September 2026">
      <Section title="Free Plan">
        <p>The Free plan is entirely free and involves no payment, so there is nothing to refund.</p>
      </Section>

      <Section title="Paid Plans">
        <p>
          Paid plans (Pro, Business, etc.) are billed in advance, either monthly or yearly depending on
          the billing cycle you choose at upgrade time.
        </p>
      </Section>

      <Section title="Cancellation">
        <p>
          You can cancel your subscription or switch back to the Free plan at any time from the
          Subscription page. Switching to Free takes effect immediately, but amounts already charged for
          the current billing period are not automatically refunded upon cancellation.
        </p>
      </Section>

      <Section title="Refunds">
        <p>
          As a general rule, amounts paid for a plan upgrade are non-refundable once payment has been
          successfully processed, given the digital nature of the service, which activates immediately.
        </p>
        <p>
          If there's a genuine technical error (e.g. you were charged but the plan wasn't activated, or
          you were charged twice by mistake), contact us within 7 days of the charge at{' '}
          <a href="mailto:hello@kvanthq.com" className="text-accent hover:underline">
            hello@kvanthq.com
          </a>{' '}
          and we will review and resolve it appropriately.
        </p>
      </Section>

      <Section title="Payment Disputes">
        <p>
          Before opening a chargeback with your bank or payment provider, please contact us first — most
          issues are resolved much faster through direct communication.
        </p>
      </Section>
    </LegalPageLayout>
  )
}