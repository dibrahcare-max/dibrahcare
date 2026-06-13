'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

interface BookingData {
  id: string
  amount: number
  status: string
  payment_status: string
  notes: any
  customers: {
    full_name: string
    phone: string
  }
}

export default function PayPage() {
  const { id } = useParams()
  const router = useRouter()
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paying, setPaying] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/custom-request/pay-info?id=${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBooking(data.booking)
        } else {
          setError(data.message || 'الطلب غير موجود')
        }
      })
      .catch(() => setError('حدث خطأ، حاول لاحقاً'))
      .finally(() => setLoading(false))
  }, [id])

  async function handlePay() {
    if (!booking || paying) return
    setPaying(true)

    try {
      const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes || {}

      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          package: 'custom',
          packageLabel: notes.service_title || 'خدمة حسب الطلب',
          serviceKey: 'custom',
          serviceCategory: 'other',
          customerId: booking.customers ? undefined : null,
          phone: booking.customers?.phone,
          fullName: booking.customers?.full_name,
          startDate: notes.requested_date || '',
          customAmount: booking.amount, // المبلغ المحدد من الأدمن
          bookingId: booking.id,
        }),
      })

      const data = await res.json()
      if (data.success && data.url) {
        window.addEventListener('beforeunload', (e) => {
          e.preventDefault()
          e.returnValue = 'جاري معالجة الدفع، لا تغلق الصفحة حتى يكتمل.'
        })
        window.location.href = data.url
      } else {
        setError(data.message || 'فشل بدء الدفع')
        setPaying(false)
      }
    } catch (e: any) {
      setError(e.message || 'حدث خطأ')
      setPaying(false)
    }
  }

  const dark = '#5f6157'
  const green = '#e2ecd3'

  if (loading) return (
    <>
      <Nav />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        <div style={{ color: dark, fontSize: '1rem' }}>جاري التحميل...</div>
      </main>
      <Footer />
    </>
  )

  if (error || !booking) return (
    <>
      <Nav />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>
        <div style={{ textAlign: 'center', color: dark }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{error || 'الطلب غير موجود'}</div>
        </div>
      </main>
      <Footer />
    </>
  )

  const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes || '{}') : booking.notes || {}
  const alreadyPaid = booking.payment_status === 'paid'

  return (
    <>
      <Nav />
      <main style={{ direction: 'rtl', fontFamily: 'inherit', background: '#f8f9f6', minHeight: '80vh', padding: '48px 16px' }}>
        <div style={{ maxWidth: 540, margin: '0 auto' }}>

          {/* هيدر */}
          <div style={{ background: dark, borderRadius: '16px 16px 0 0', padding: '28px 28px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: 6 }}>إتمام الدفع</div>
            <div style={{ fontSize: '.85rem', color: '#b8c2ad' }}>خدمة حسب الطلب — دبرة</div>
          </div>

          {/* بيانات الطلب */}
          <div style={{ background: '#fff', padding: '24px 28px', borderBottom: `1px solid ${green}` }}>
            <div style={{ fontSize: '.8rem', color: '#888', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>تفاصيل الطلب</div>

            <Row label="الخدمة المطلوبة" value={notes.service_title || 'خدمة حسب الطلب'} />
            {notes.description && <Row label="الوصف" value={notes.description} />}
            {notes.requested_date && <Row label="التاريخ المفضل" value={notes.requested_date} />}
            {booking.customers?.full_name && <Row label="الاسم" value={booking.customers.full_name} />}
          </div>

          {/* المبلغ */}
          <div style={{ background: green, padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: dark }}>المبلغ الإجمالي</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: dark, direction: 'ltr' }}>
              {booking.amount.toFixed(2)} ر.س
            </span>
          </div>

          {/* زر الدفع */}
          <div style={{ background: '#fff', padding: '24px 28px', borderRadius: '0 0 16px 16px' }}>
            {alreadyPaid ? (
              <div style={{ textAlign: 'center', padding: '16px', background: '#f0f4ed', borderRadius: 12, color: dark, fontWeight: 700 }}>
                ✅ تم سداد هذا الطلب مسبقاً
              </div>
            ) : (
              <>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  style={{
                    width: '100%',
                    background: paying ? '#aaa' : dark,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '16px',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    cursor: paying ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: 12,
                  }}
                >
                  {paying ? 'جاري التوجيه...' : 'ادفع الآن 🔒'}
                </button>
                {error && (
                  <div style={{ color: '#c0392b', fontSize: '.85rem', textAlign: 'center', fontWeight: 600 }}>
                    {error}
                  </div>
                )}
                <div style={{ fontSize: '.78rem', color: '#888', textAlign: 'center', lineHeight: 1.7 }}>
                  الدفع آمن عبر بوابة نيوليب المعتمدة
                </div>
              </>
            )}
          </div>

        </div>
      </main>
      <WhatsApp />
      <Footer />
    </>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '.9rem', gap: 16 }}>
      <span style={{ color: '#888', flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 600, color: '#333', textAlign: 'right' }}>{value}</span>
    </div>
  )
}
