'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

// تسميات عربية للحقول (detail_data)
const FIELD_LABELS: Record<string, string> = {
  // طفل
  name: 'الاسم',
  id: 'رقم الهوية',
  gender: 'الجنس',
  nationality: 'الجنسية',
  age: 'العمر',
  street: 'الشارع',
  chronic_disease: 'مرض مزمن',
  disease_detail: 'تفاصيل المرض',
  medication: 'يتناول أدوية',
  medication_detail: 'تفاصيل الأدوية',
  siblings_male: 'عدد الإخوة',
  siblings_female: 'عدد الأخوات',
  sibling_order: 'ترتيب الطفل',
  lives_with: 'يسكن مع',
  education_level: 'المستوى التعليمي',
  basic_skills: 'المهارات الأساسية',
  language_level: 'مستوى اللغة',
  independence: 'الاستقلالية',
  instructions: 'التعليمات',
  emotions: 'المشاعر',
  fears: 'المخاوف',
  hobbies: 'الهوايات',
  notes: 'ملاحظات',
  // كبير السن
  relation: 'صلة القرابة',
  hearing_vision: 'السمع والبصر',
  mobility_aids: 'مساعدات الحركة',
  walks_alone: 'يمشي وحده',
  comfort_things: 'يرتاح بـ',
  preferred_treatment: 'طريقة المعاملة المفضلة',
  sleep_pattern: 'نمط النوم',
}

const PACKAGE_LABELS: Record<string, string> = {
  test_1: 'باقة اختبار',
  daily_4: 'يومي 4 ساعات',
  daily_8: 'يومي 8 ساعات',
  weekly_4: 'أسبوعي 4 ساعات',
  weekly_8: 'أسبوعي 8 ساعات',
  monthly_4: 'شهري 4 ساعات',
  monthly_8: 'شهري 16 ساعة',
  ramadan_2: 'باقة رمضان',
}

const TYPE_LABELS: Record<string, string> = {
  child: 'رعاية طفل',
  elderly: 'رعاية كبير السن',
  medical: 'رعاية طبية',
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return iso }
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
      .catch(() => setError('خطأ في الاتصال'))
      .finally(() => setLoading(false))
  }, [bookingId])

  if (loading) {
    return <div style={{ padding: 80, textAlign: 'center', fontFamily: 'PNU, Tajawal, sans-serif' }}>جارٍ التحميل...</div>
  }

  if (error || !data) {
    return (
      <div style={{ padding: 80, textAlign: 'center', fontFamily: 'PNU, Tajawal, sans-serif', color: '#c0392b' }}>
        ⚠️ {error || 'بيانات غير موجودة'}
      </div>
    )
  }

  const { booking, customer, registration } = data
  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
  const detail = registration?.detail || {}
  const detailEntries = Object.entries(detail).filter(([_, v]) => v && v !== '')

  return (
    <div className="print-page" dir="rtl">
      {/* زر الطباعة — يختفي عند الطباعة */}
      <div className="no-print print-toolbar">
        <button onClick={() => window.print()} className="print-btn">
          🖨️  طباعة / حفظ PDF
        </button>
        <button onClick={() => window.close()} className="close-btn">
          ✕ إغلاق
        </button>
      </div>

      <div className="page">
        {/* الترويسة */}
        <header className="doc-header">
          <div className="logo-wrap">
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" className="logo" />
          </div>
          <div className="title-wrap">
            <h1>ملف العميل</h1>
            <div className="sub">دِبرة للرعاية</div>
          </div>
          <div className="meta">
            <div className="meta-row"><span>تاريخ الطباعة:</span> <strong>{today}</strong></div>
            <div className="meta-row"><span>رقم الحجز:</span> <strong>{booking.id?.slice(0, 8)}</strong></div>
          </div>
        </header>

        <hr className="divider" />

        {/* بيانات المشترك */}
        <Section title="بيانات المشترك">
          <Row label="الاسم" value={customer?.name} />
          <Row label="الجوال" value={customer?.phone} />
          <Row label="رقم الهوية" value={customer?.national_id} />
          <Row label="الجنسية" value={customer?.nationality} />
          <Row label="العنوان" value={customer?.address} />
          {registration?.subscriber_job && <Row label="الوظيفة" value={registration.subscriber_job} />}
          {registration?.subscriber_job_location && <Row label="مكان العمل" value={registration.subscriber_job_location} />}
          {(registration?.emergency_phone || booking.emergency_phone) &&
            <Row label="جوال الطوارئ" value={registration?.emergency_phone || booking.emergency_phone} />}
        </Section>

        {/* بيانات الاستبانة */}
        {registration && (
          <Section title="بيانات الاستبانة">
            <Row label="نوع الرعاية" value={TYPE_LABELS[registration.type] || registration.type} />
            <Row label="تاريخ التسجيل" value={formatDate(registration.created_at)} />

            {booking.beneficiary_name && <Row label="اسم المستفيد" value={booking.beneficiary_name} />}
            {booking.beneficiary_age && <Row label="عمر المستفيد" value={booking.beneficiary_age} />}
            {booking.beneficiary_relation && <Row label="صلة القرابة" value={booking.beneficiary_relation} />}

            {detailEntries.length > 0 && (
              <>
                <div className="sub-title">تفاصيل إضافية</div>
                {detailEntries.map(([k, v]) => (
                  <Row key={k} label={FIELD_LABELS[k] || k} value={String(v)} />
                ))}
              </>
            )}
          </Section>
        )}

        {/* تفاصيل الحجز الحالي */}
        <Section title="تفاصيل الحجز الحالي">
          <Row label="الباقة" value={PACKAGE_LABELS[booking.package] || booking.package} />
          <Row label="تاريخ الحجز" value={formatDate(booking.created_at)} />
          <Row label="تاريخ بداية الخدمة" value={booking.start_date} />
          {booking.start_time && <Row label="وقت البدء" value={booking.start_time} />}
          <Row label="السعر" value={`${booking.price?.toLocaleString('ar-SA')} ر.س`} />
          <Row label="حالة الدفع" value={booking.status === 'confirmed' ? 'مدفوع ✓' : booking.status} />
          {booking.track_id && <Row label="رقم العملية" value={booking.track_id} />}
          {booking.payment_id && <Row label="الرقم المرجعي (البنك)" value={booking.payment_id} />}
        </Section>

        {/* التذييل */}
        <footer className="doc-footer">
          <hr className="divider" />
          <div className="footer-text">
            <div>هذا المستند تم توليده تلقائياً من نظام دِبرة للرعاية</div>
            <div>للاستفسار: info@dibrahcare.com · dibrahcare.com</div>
          </div>
        </footer>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800;900&display=swap');

        body {
          margin: 0;
          font-family: 'PNU', 'Tajawal', sans-serif;
          background: #f5f5f0;
          color: #2d3a1e;
        }

        .print-page { padding: 20px 0 60px; }

        .print-toolbar {
          position: sticky; top: 0;
          background: #2d3a1e; color: #F6F0D7;
          padding: 14px 24px;
          display: flex; gap: 12px; align-items: center; justify-content: center;
          box-shadow: 0 2px 12px rgba(0,0,0,.15);
          z-index: 100;
          margin-bottom: 24px;
        }
        .print-btn, .close-btn {
          font-family: inherit; font-size: .95rem; font-weight: 800;
          padding: 10px 24px; border-radius: 8px; cursor: pointer;
          border: none;
        }
        .print-btn { background: #F6F0D7; color: #2d3a1e; }
        .close-btn { background: transparent; color: #F6F0D7; border: 1.5px solid rgba(246,240,215,.4); }

        .page {
          max-width: 794px; /* A4 عرض */
          margin: 0 auto;
          background: white;
          padding: 48px 56px;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
          border-radius: 8px;
        }

        .doc-header {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 24px;
          align-items: center;
          margin-bottom: 16px;
        }
        .logo { width: 72px; height: 72px; object-fit: contain; }
        .title-wrap h1 {
          font-size: 1.8rem; font-weight: 900; margin: 0 0 4px;
          color: #2d3a1e; font-family: PNU, Tajawal, sans-serif;
        }
        .title-wrap .sub {
          font-size: .9rem; color: #777C6D; font-weight: 700;
        }
        .meta { text-align: left; font-size: .78rem; color: #5f6157; }
        .meta-row { margin-bottom: 4px; }
        .meta-row strong { color: #2d3a1e; }

        .divider {
          border: none; border-top: 2px solid #777C6D;
          margin: 20px 0 24px;
        }

        .section {
          margin-bottom: 28px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 1.1rem; font-weight: 900;
          color: #2d3a1e; font-family: PNU, Tajawal, sans-serif;
          background: #eeeeee;
          padding: 10px 16px;
          border-right: 4px solid #777C6D;
          border-radius: 6px;
          margin-bottom: 14px;
        }
        .sub-title {
          font-size: .88rem; font-weight: 800;
          color: #777C6D;
          margin: 14px 0 8px;
          padding-right: 8px;
        }
        .row {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 12px;
          padding: 6px 8px;
          border-bottom: 1px dashed rgba(95,97,87,.15);
          font-size: .92rem;
        }
        .row:last-child { border-bottom: none; }
        .row .label { color: #777C6D; font-weight: 700; }
        .row .value { color: #2d3a1e; font-weight: 600; }

        .doc-footer {
          margin-top: 40px;
        }
        .footer-text {
          text-align: center;
          font-size: .75rem;
          color: #777C6D;
          line-height: 1.8;
        }

        /* ═══ Print Styles ═══ */
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-page { padding: 0; }
          .page {
            max-width: 100%;
            box-shadow: none; border-radius: 0;
            padding: 20mm;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  )
}

// مكوّنات مساعدة
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      <div>{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: any }) {
  if (!value && value !== 0) return null
  return (
    <div className="row">
      <span className="label">{label}:</span>
      <span className="value">{value}</span>
    </div>
  )
}
