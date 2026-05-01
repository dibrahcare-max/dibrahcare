'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

const FIELD_LABELS: Record<string, string> = {
  // عام
  name: 'الاسم',
  id: 'رقم الهوية',
  age: 'العمر',
  gender: 'الجنس',
  nationality: 'الجنسية',
  // طبي
  patient_name: 'اسم المريض',
  patient_age: 'عمر المريض',
  diagnosis: 'التشخيص',
  chronic_disease: 'مرض مزمن',
  disease_detail: 'تفاصيل المرض',
  medication: 'الأدوية',
  medication_detail: 'تفاصيل الأدوية',
  allergies: 'الحساسية',
  doctor_name: 'الطبيب المعالج',
  hospital: 'المستشفى',
  visit_frequency: 'تكرار الزيارة',
  service_type: 'نوع الخدمة المطلوبة',
  required_service: 'الخدمة المطلوبة',
  notes: 'ملاحظات',
  emergency_phone: 'جوال الطوارئ',
  emergency_contact: 'جهة الاتصال للطوارئ',
}

function formatDate(s?: string): string {
  if (!s) return '—'
  try { return new Date(s).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' }) }
  catch { return s }
}

export default function MedicalPrintPage() {
  const params = useParams()
  const regId = params.regId as string
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/admin/medical-print?regId=${regId}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setData(d)
        else setError(d.error || 'فشل تحميل البيانات')
      })
      .catch(e => setError(e?.message || 'خطأ'))
      .finally(() => setLoading(false))
  }, [regId])

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#666' }}>جاري التحميل...</div>
  if (error) return <div style={{ padding: 60, textAlign: 'center', color: '#b91c1c' }}>⚠️ {error}</div>
  if (!data) return null

  const reg = data.registration
  const customer = data.customer
  const detail = reg?.detail || {}
  const detailEntries = Object.entries(detail).filter(([_, v]) => v && v !== '')

  const today = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="print-page" dir="rtl">
      <div className="no-print print-toolbar">
        <button onClick={() => window.print()} className="print-btn">🖨️ طباعة / حفظ PDF</button>
        <button onClick={() => window.close()} className="close-btn">✕ إغلاق</button>
      </div>

      <div className="page">
        <header className="doc-header">
          <div className="logo-wrap">
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" className="logo" />
          </div>
          <div className="title-wrap">
            <h1>طلب الرعاية الطبية المنزلية</h1>
            <div className="sub">دِبرة للرعاية · بشراكة مستشفى الرعاية الطبية</div>
          </div>
          <div className="meta">
            <div className="meta-row"><span>تاريخ الطباعة:</span> <strong>{today}</strong></div>
            <div className="meta-row"><span>رقم الطلب:</span> <strong>{reg.id?.slice(0, 8)}</strong></div>
          </div>
        </header>

        <hr className="divider" />

        <Section title="بيانات مقدّم الطلب">
          <Row label="الاسم" value={reg.subscriber_name} />
          <Row label="الجوال" value={reg.subscriber_phone} />
          <Row label="رقم الهوية" value={reg.subscriber_id} />
          <Row label="الجنسية" value={reg.subscriber_nationality} />
          <Row label="العنوان" value={reg.subscriber_address} />
          {reg.subscriber_job && <Row label="الوظيفة" value={reg.subscriber_job} />}
          {reg.subscriber_job_location && <Row label="مكان العمل" value={reg.subscriber_job_location} />}
          {reg.emergency_phone && <Row label="جوال الطوارئ" value={reg.emergency_phone} />}
        </Section>

        {detailEntries.length > 0 && (
          <Section title="تفاصيل الحالة الطبية">
            {detailEntries.map(([k, v]) => (
              <Row key={k} label={FIELD_LABELS[k] || k} value={String(v)} />
            ))}
          </Section>
        )}

        <Section title="معلومات إدارية">
          <Row label="نوع التسجيل" value="رعاية طبية منزلية" />
          <Row label="تاريخ التسجيل" value={formatDate(reg.created_at)} />
          <Row label="حالة الطلب" value={
            reg.status === 'pending' ? 'قيد المراجعة' :
            reg.status === 'contacted' ? 'تم التواصل' :
            reg.status === 'done' ? 'منفذ' :
            reg.status === 'cancelled' ? 'ملغي' : (reg.status || 'قيد المراجعة')
          } />
          {customer?.name && <Row label="العميل المرتبط" value={customer.name} />}
        </Section>

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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Tajawal', 'Tahoma', sans-serif; background: #f0f0f0; color: #2d3a1e; line-height: 1.7; }

        .print-toolbar {
          position: fixed; top: 16px; left: 16px; right: 16px;
          display: flex; gap: 10px; justify-content: center; z-index: 100;
        }
        .print-btn, .close-btn {
          padding: 12px 24px; border-radius: 10px; font-family: inherit;
          font-weight: 800; font-size: .9rem; cursor: pointer; border: none;
        }
        .print-btn { background: #2d3a1e; color: #F6F0D7; }
        .close-btn { background: white; color: #2d3a1e; border: 1.5px solid rgba(45,58,30,.2); }

        .print-page { padding: 80px 20px 40px; }
        .page {
          max-width: 800px; margin: 0 auto; background: white;
          padding: 50px 60px; border-radius: 12px;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
        }

        .doc-header { display: grid; grid-template-columns: auto 1fr auto; gap: 24px; align-items: center; margin-bottom: 24px; }
        .logo { height: 70px; width: auto; }
        .title-wrap h1 { font-size: 1.5rem; color: #2d3a1e; font-weight: 900; margin-bottom: 4px; }
        .title-wrap .sub { font-size: .88rem; color: #777C6D; font-weight: 700; }
        .meta { font-size: .82rem; color: #666; text-align: left; }
        .meta-row { margin-bottom: 4px; }
        .meta-row span { color: #999; }

        .divider { border: none; border-top: 2px solid #2d3a1e; margin: 18px 0; }

        section.section { margin-bottom: 22px; }
        section.section h2 { font-size: 1.05rem; color: #2d3a1e; font-weight: 900; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e6e6dd; }

        .row { display: grid; grid-template-columns: 180px 1fr; gap: 14px; padding: 7px 0; border-bottom: 1px dashed rgba(95,97,87,.15); font-size: .9rem; }
        .row:last-child { border-bottom: none; }
        .row .label { color: #777; font-weight: 700; }
        .row .value { color: #2d3a1e; font-weight: 600; }

        .doc-footer { margin-top: 32px; }
        .footer-text { text-align: center; font-size: .78rem; color: #888; line-height: 1.7; }

        @page { size: A4; margin: 12mm; }
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; }
          .page { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; border-radius: 0 !important; }
        }
      `}</style>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="section"><h2>{title}</h2>{children}</section>
}

function Row({ label, value }: { label: string; value: any }) {
  if (value === null || value === undefined || value === '') return null
  return <div className="row"><div className="label">{label}</div><div className="value">{value}</div></div>
}
