'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

const dark = '#5f6157'
const green = '#e2ecd3'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  border: '1.5px solid rgba(95,97,87,.25)',
  borderRadius: 10,
  fontSize: '.95rem',
  fontFamily: 'inherit',
  color: dark,
  background: '#fff',
  outline: 'none',
  direction: 'rtl',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.82rem',
  fontWeight: 700,
  color: dark,
  marginBottom: 6,
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  padding: '24px 20px',
  marginBottom: 16,
  boxShadow: '0 1px 6px rgba(95,97,87,.08)',
}

export default function CustomBookingPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    service_title: '',
    description: '',
    requested_date: '',
    phone: '',
    full_name: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customer, setCustomer] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          router.replace('/auth?next=/book/custom')
          return
        }
        if (!d.customer) {
          router.replace('/register?phone=' + encodeURIComponent(d.phone || ''))
          return
        }
        setCustomer(d.customer)
        setForm(f => ({ ...f, full_name: d.customer.full_name || '', phone: d.customer.phone || '' }))
        setAuthLoading(false)
      })
      .catch(() => setAuthLoading(false))
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'الاسم مطلوب'
    if (!form.phone.trim() || !/^05\d{8}$/.test(form.phone.trim())) e.phone = 'رقم جوال غير صالح'
    if (!form.service_title.trim()) e.service_title = 'نوع الخدمة مطلوب'
    if (!form.description.trim()) e.description = 'وصف الطلب مطلوب'
    return e
  }

  async function handleSubmit() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch('/api/custom-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, customer_id: customer?.id }),
      })
      const data = await res.json()
      if (data.success) {
        setSubmitted(true)
      } else {
        setSubmitError(data.message || 'حدث خطأ، حاول مجدداً')
      }
    } catch {
      setSubmitError('حدث خطأ، حاول مجدداً')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading) return (
    <>
      <Nav />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: dark }}>جاري التحميل...</div>
      </main>
      <Footer />
    </>
  )

  if (submitted) return (
    <>
      <Nav />
      <main style={{ direction: 'rtl', fontFamily: 'inherit', background: '#f8f9f6', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 16px' }}>
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: dark, marginBottom: 12 }}>تم استلام طلبك!</h2>
          <p style={{ fontSize: '.95rem', color: '#666', lineHeight: 1.8, marginBottom: 24 }}>
            سيتواصل معك فريق دبرة خلال وقت قصير لتحديد السعر وإرسال رابط الدفع عبر واتساب.
          </p>
          <button
            onClick={() => router.push('/services')}
            style={{ background: dark, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            العودة للخدمات
          </button>
        </div>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ direction: 'rtl', fontFamily: 'inherit', background: '#f8f9f6', minHeight: '80vh', padding: '48px 16px' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>

          {/* هيدر */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: dark, marginBottom: 8 }}>خدمة حسب الطلب</h1>
            <p style={{ fontSize: '.9rem', color: '#666', lineHeight: 1.7 }}>
              أخبرنا بما تحتاجه وسنتواصل معك بأفضل حل وسعر مناسب
            </p>
          </div>

          {/* بيانات التواصل */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: dark, marginBottom: 16 }}>بيانات التواصل</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>الاسم الكامل *</label>
              <input
                style={{ ...inputStyle, borderColor: errors.full_name ? '#c0392b' : 'rgba(95,97,87,.25)' }}
                value={form.full_name}
                placeholder="اسمك الكامل"
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
              {errors.full_name && <div style={{ color: '#c0392b', fontSize: '.8rem', marginTop: 4, fontWeight: 700 }}>{errors.full_name}</div>}
            </div>

            <div>
              <label style={labelStyle}>رقم الجوال *</label>
              <input
                style={{ ...inputStyle, borderColor: errors.phone ? '#c0392b' : 'rgba(95,97,87,.25)', direction: 'ltr', textAlign: 'right' }}
                value={form.phone}
                placeholder="05XXXXXXXX"
                inputMode="tel"
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              />
              {errors.phone && <div style={{ color: '#c0392b', fontSize: '.8rem', marginTop: 4, fontWeight: 700 }}>{errors.phone}</div>}
            </div>
          </div>

          {/* تفاصيل الطلب */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: dark, marginBottom: 16 }}>تفاصيل الطلب</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>نوع الخدمة المطلوبة *</label>
              <input
                style={{ ...inputStyle, borderColor: errors.service_title ? '#c0392b' : 'rgba(95,97,87,.25)' }}
                value={form.service_title}
                placeholder="مثال: مرافقة شخصية، رعاية مريض، إلخ"
                onChange={e => setForm(f => ({ ...f, service_title: e.target.value }))}
              />
              {errors.service_title && <div style={{ color: '#c0392b', fontSize: '.8rem', marginTop: 4, fontWeight: 700 }}>{errors.service_title}</div>}
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>وصف تفصيلي للطلب *</label>
              <textarea
                style={{ ...inputStyle, borderColor: errors.description ? '#c0392b' : 'rgba(95,97,87,.25)', minHeight: 110, resize: 'vertical' }}
                value={form.description}
                placeholder="اشرح ما تحتاجه بالتفصيل — عدد الأشخاص، المدة، أي متطلبات خاصة..."
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              {errors.description && <div style={{ color: '#c0392b', fontSize: '.8rem', marginTop: 4, fontWeight: 700 }}>{errors.description}</div>}
            </div>

            <div>
              <label style={labelStyle}>التاريخ المفضل <span style={{ fontWeight: 400, color: '#888' }}>(اختياري)</span></label>
              <input
                type="date"
                style={{ ...inputStyle, direction: 'ltr' }}
                value={form.requested_date}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(f => ({ ...f, requested_date: e.target.value }))}
              />
            </div>
          </div>

          {/* ملاحظة */}
          <div style={{ background: green, borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: '.85rem', color: dark, lineHeight: 1.7 }}>
            📞 بعد إرسال طلبك سيتواصل معك فريق دبرة عبر واتساب لتأكيد التفاصيل وإرسال رابط الدفع.
          </div>

          {/* زر الإرسال */}
          {submitError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#c0392b', fontSize: '.85rem', fontWeight: 600 }}>
              {submitError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              width: '100%',
              background: submitting ? '#aaa' : dark,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال الطلب'}
          </button>

        </div>
      </main>
      <WhatsApp />
      <Footer />
    </>
  )
}
