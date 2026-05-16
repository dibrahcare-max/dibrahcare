'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const SERVICE_LABELS: Record<string, string> = {
  medical:        'الرعاية الطبية المنزلية',
  childcare:      'حضانة الأطفال داخل المنزل',
  'child-travel': 'مرافقة الأطفال في السفر',
  elderly:        'رعاية كبار السن',
  'elderly-travel':'مرافقة كبار السن في السفر',
  hospital:       'مرافقة المرضى في المستشفى',
  postnatal:      'رعاية ما بعد الولادة',
  bride:          'وصيفة العروس',
  wedding:        'مرافقة الأعراس والمناسبات',
  teen:           'المرافقة الآمنة للمراهقين',
  religious:      'مرافقة المناسبات الدينية والأعياد',
}

const PACKAGE_LABELS: Record<string, string> = {
  daily_4:   'يومي ٤ ساعات',
  daily_8:   'يومي ٨ ساعات',
  weekly_4:  'أسبوعي ٤ ساعات',
  weekly_8:  'أسبوعي ٨ ساعات',
  monthly_4: 'شهري ٤ ساعات',
  monthly_8: 'شهري ٨ ساعات',
}

const LIVES_WITH_LABELS: Record<string, string> = {
  'الوالدين': 'الوالدين',
  'الأم فقط': 'الأم فقط',
  'الأب فقط': 'الأب فقط',
  'غير ذلك': 'غير ذلك',
}

const ACCEPTS_STRANGERS_LABELS: Record<string, string> = {
  normal:  'طبيعي',
  anxious: 'لديه قلق',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return iso }
}

function yesNoLabel(v: string | null | undefined): string {
  if (v === 'yes') return 'نعم'
  if (v === 'no') return 'لا'
  return '—'
}

export default function PrintPage() {
  const params = useParams()
  const bookingId = params.bookingId as string

  const [data, setData] = useState<any>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/admin/print-data?bookingId=${bookingId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d)
        else setError(d.error || 'تعذّر جلب البيانات')
      })
      .catch(e => setError(e.message || 'خطأ في الاتصال'))
      .finally(() => setLoading(false))
  }, [bookingId])

  if (loading) return <div style={loadingStyle}>جاري التحميل...</div>
  if (error)   return <div style={errorStyle}>⚠️ {error}</div>
  if (!data)   return <div style={errorStyle}>لا توجد بيانات</div>

  const { booking, customer, serviceDetails } = data

  return (
    <div className="print-wrap">
      {/* زر الطباعة (يختفي عند الطباعة) */}
      <div className="no-print" style={{ textAlign: 'center', padding: 20 }}>
        <button onClick={() => window.print()} style={printBtn}>🖨️ طباعة الملف</button>
      </div>

      <div className="print-page">
        {/* Header */}
        <header style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#5f6157', margin: 0 }}>دِبرة</h1>
            <div style={{ fontSize: '.75rem', color: '#8a8e80', marginTop: 4 }}>ملف بيانات الحجز</div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '.7rem', color: '#8a8e80' }}>رقم الحجز</div>
            <div style={{ fontSize: '.85rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {booking.id?.slice(0, 8).toUpperCase() || '—'}
            </div>
            <div style={{ fontSize: '.7rem', color: '#8a8e80', marginTop: 4 }}>
              {formatDate(booking.created_at)}
            </div>
          </div>
        </header>

        {/* بيانات الحجز */}
        <Section title="تفاصيل الحجز">
          <Row label="نوع الخدمة" value={SERVICE_LABELS[booking.service_key] || booking.service_type || '—'} />
          <Row label="الباقة" value={booking.package_label || PACKAGE_LABELS[booking.package_id] || '—'} />
          <Row label="تاريخ البدء" value={booking.start_date || '—'} />
          {booking.start_time && <Row label="وقت البدء" value={booking.start_time} />}
          {booking.end_time && <Row label="وقت الانتهاء" value={booking.end_time} />}
          {booking.child_count && <Row label="عدد الأطفال" value={String(booking.child_count)} />}
          <Row label="المبلغ المدفوع" value={booking.amount ? `${Number(booking.amount).toLocaleString('ar-SA')} ريال` : '—'} />
          <Row label="حالة الدفع" value={booking.payment_status === 'paid' ? '✅ مدفوع' : booking.payment_status} />
          {booking.paymentId && <Row label="رقم العملية" value={booking.paymentId} mono />}
          {booking.trackId && <Row label="رقم المرجع" value={booking.trackId} mono />}
        </Section>

        {/* بيانات العميل */}
        <Section title="بيانات المشترك">
          <Row label="الاسم الرباعي" value={customer.full_name} />
          <Row label="رقم الهوية" value={customer.national_id} mono />
          <Row label="رقم الجوال" value={customer.phone} mono />
          <Row label="البريد الإلكتروني" value={customer.email} ltr />
          <Row label="الجنسية" value={customer.nationality} />
          <Row label="رقم الطوارئ" value={customer.emergency_phone} mono />
          <Row label="العنوان الوطني" value={customer.short_address} mono />
          {customer.district && customer.district !== '—' && <Row label="الحي" value={customer.district} />}
          {customer.street && customer.street !== '—' && <Row label="الشارع" value={customer.street} />}
        </Section>

        {/* بيانات الأطفال */}
        {serviceDetails?.type === 'child' && serviceDetails.children?.map((child: any, idx: number) => (
          <Section key={idx} title={serviceDetails.children.length > 1 ? `بيانات الطفل ${idx + 1}` : 'بيانات الطفل'}>
            <Row label="الاسم" value={child.name} />
            <Row label="العمر" value={`${child.age} سنة`} />
            <Row label="يعاني من أمراض صحية أو مزمنة" value={yesNoLabel(child.health?.answer)} />
            {child.health?.answer === 'yes' && child.health.note && (
              <Row label="تفاصيل الأمراض" value={child.health.note} multiline />
            )}
            <Row label="يستعمل أدوية" value={yesNoLabel(child.medications?.answer)} />
            {child.medications?.answer === 'yes' && child.medications.note && (
              <Row label="تفاصيل الأدوية" value={child.medications.note} multiline />
            )}
            <Row label="عدد الإخوة" value={child.siblings_count || '—'} />
            <Row label="يعيش مع" value={LIVES_WITH_LABELS[child.lives_with] || child.lives_with || '—'} />
            <Row label="المستوى الدراسي" value={child.education_level || '—'} />
            <Row label="المهارات الأكاديمية" value={
              [
                child.skills?.letters && 'الأحرف',
                child.skills?.numbers && 'الأرقام',
                child.skills?.colors && 'الألوان',
                child.skills?.shapes && 'الأشكال',
              ].filter(Boolean).join('، ') || '—'
            } />
            <Row label="يتحدث جمل كاملة" value={child.language_full_sentences || '—'} />
            <Row label="يتحدث كلمات فقط" value={child.language_words_only || '—'} />
            <Row label="يعتمد على نفسه (أكل/شرب/حمام)" value={child.independence || '—'} />
            <Row label="الالتزام بالتعليمات" value={child.instructions || '—'} />
            {child.emotions && <Row label="الانفعالات" value={child.emotions} multiline />}
            {child.fears && <Row label="المخاوف" value={child.fears} multiline />}
            {child.hobbies && <Row label="الهوايات" value={child.hobbies} multiline />}
            {child.notes && <Row label="ملاحظات" value={child.notes} multiline />}
          </Section>
        ))}

        {/* بيانات كبار السن */}
        {serviceDetails?.type === 'elderly' && serviceDetails.elderly && (() => {
          const e = serviceDetails.elderly
          return (
            <Section title="بيانات المستفيد">
              <Row label="الاسم الرباعي" value={e.name} />
              <Row label="العمر" value={`${e.age} سنة`} />

              <Row label="يعاني من أمراض مزمنة" value={yesNoLabel(e.diseases?.answer)} />
              {e.diseases?.answer === 'yes' && e.diseases.note && (
                <Row label="تفاصيل الأمراض" value={e.diseases.note} multiline />
              )}

              <Row label="يستعمل أدوية" value={yesNoLabel(e.medications?.answer)} />
              {e.medications?.answer === 'yes' && e.medications.note && (
                <Row label="تفاصيل الأدوية" value={e.medications.note} multiline />
              )}

              <Row label="مدى تقبّل الغرباء" value={ACCEPTS_STRANGERS_LABELS[e.accepts_strangers] || e.accepts_strangers || '—'} />
              <Row label="يتعرف على الأهل والأفراد" value={yesNoLabel(e.recognizes_family)} />

              <Row label="نظام غذائي معين" value={yesNoLabel(e.diet?.answer)} />
              {e.diet?.answer === 'yes' && e.diet.note && (
                <Row label="تفاصيل النظام الغذائي" value={e.diet.note} multiline />
              )}

              <Row label="أدوية يومية" value={yesNoLabel(e.daily_meds?.answer)} />
              {e.daily_meds?.answer === 'yes' && e.daily_meds.note && (
                <Row label="تفاصيل الأدوية اليومية" value={e.daily_meds.note} multiline />
              )}

              <Row label="مشاكل في السمع أو البصر" value={yesNoLabel(e.hearing_vision)} />
              <Row label="أنبوب تنفس أو كرسي متحرك" value={yesNoLabel(e.breathing_wheelchair)} />
              <Row label="يمشي وحده ويدخل دورة المياه" value={yesNoLabel(e.walks_alone)} />

              {e.reassurance && <Row label="ما يطمئنه" value={e.reassurance} multiline />}
              {e.preferred_treatment && <Row label="طريقة التعامل المفضلة" value={e.preferred_treatment} multiline />}

              <Row label="نظام نوم معين" value={yesNoLabel(e.sleep_pattern?.answer)} />
              {e.sleep_pattern?.answer === 'yes' && e.sleep_pattern.note && (
                <Row label="تفاصيل نظام النوم" value={e.sleep_pattern.note} multiline />
              )}
            </Section>
          )
        })()}

        {/* Footer */}
        <footer style={footerStyle}>
          <div>دِبرة — رعاية سعودية أصيلة</div>
          <div style={{ marginTop: 4 }}>dibrahcare.com</div>
        </footer>
      </div>

      <style jsx global>{`
        body {
          background: #f5f5f0;
          margin: 0;
          font-family: 'Tajawal', sans-serif;
        }
        .print-wrap { padding: 20px; }
        .print-page {
          background: white;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 50px;
          box-shadow: 0 2px 12px rgba(0,0,0,.06);
          color: #5f6157;
          direction: rtl;
        }
        @media print {
          .no-print { display: none !important; }
          .print-wrap { padding: 0; background: white; }
          .print-page {
            box-shadow: none;
            max-width: 100%;
            padding: 20px 24px;
          }
        }
      `}</style>
    </div>
  )
}

// ─── مكوّنات صغيرة ───

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={sectionTitleStyle}>{title}</h2>
      <div style={{ borderTop: '1px solid #e7e6dd' }}>
        {children}
      </div>
    </section>
  )
}

function Row({ label, value, mono, ltr, multiline }: {
  label: string
  value: string | null | undefined
  mono?: boolean
  ltr?: boolean
  multiline?: boolean
}) {
  return (
    <div style={{
      display: 'flex',
      padding: multiline ? '10px 0' : '8px 0',
      borderBottom: '1px solid #f0eee5',
      flexDirection: multiline ? 'column' : 'row',
      gap: multiline ? 4 : 0,
    }}>
      <div style={{
        flex: multiline ? 'unset' : '0 0 200px',
        fontSize: '.8rem',
        color: '#8a8e80',
        fontWeight: 600,
      }}>{label}</div>
      <div style={{
        flex: 1,
        fontSize: '.88rem',
        color: '#5f6157',
        fontWeight: 700,
        direction: ltr ? 'ltr' : 'rtl',
        textAlign: ltr ? 'left' : 'right',
        fontFamily: mono ? 'monospace' : 'inherit',
        lineHeight: multiline ? 1.7 : 1.5,
        whiteSpace: multiline ? 'pre-wrap' : 'normal',
      }}>
        {value || '—'}
      </div>
    </div>
  )
}

// ─── الأنماط ───

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  paddingBottom: 20,
  borderBottom: '2px solid #c9a84c',
  marginBottom: 28,
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '1.05rem',
  fontWeight: 900,
  color: '#5f6157',
  margin: '0 0 10px',
  paddingBottom: 6,
}

const footerStyle: React.CSSProperties = {
  marginTop: 36,
  paddingTop: 18,
  borderTop: '1px solid #e7e6dd',
  textAlign: 'center',
  fontSize: '.7rem',
  color: '#8a8e80',
}

const printBtn: React.CSSProperties = {
  padding: '12px 32px',
  background: '#5f6157',
  color: '#F6F0D7',
  border: 'none',
  borderRadius: 10,
  fontWeight: 800,
  fontSize: '.95rem',
  cursor: 'pointer',
  fontFamily: 'Tajawal, sans-serif',
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center', padding: 80, color: '#8a8e80', fontSize: '1rem',
}

const errorStyle: React.CSSProperties = {
  textAlign: 'center', padding: 80, color: '#c0392b', fontSize: '1rem',
}
