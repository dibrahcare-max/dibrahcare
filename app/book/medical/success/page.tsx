'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

type RequestData = {
  bookingId: string
  customerName: string
  startDate: string
  startTime: string
}

export default function MedicalSuccessPage() {
  const [data, setData] = useState<RequestData | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dibrah_medical_request')
      if (raw) {
        setData(JSON.parse(raw))
        sessionStorage.removeItem('dibrah_medical_request')
      }
    } catch {}
    setLoaded(true)
  }, [])

  if (!loaded) return null

  return (
    <>
      <Nav />
      <section style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 80px)', padding: '64px 24px', direction: 'rtl' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            background: 'white',
            borderRadius: 24,
            padding: '56px 40px',
            border: '1px solid rgba(95,97,87,.1)',
            boxShadow: '0 4px 24px rgba(95,97,87,.06)',
            textAlign: 'center',
          }}>
            {/* أيقونة نجاح */}
            <div style={{
              width: 88, height: 88, borderRadius: '50%',
              background: 'rgba(34,197,94,.12)',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2.4rem', marginBottom: 20,
            }}>
              ✅
            </div>

            <h1 style={{
              fontSize: '1.8rem', fontWeight: 900,
              color: 'var(--dark)', margin: '0 0 12px',
              fontFamily: 'PNU, Tajawal, sans-serif',
            }}>
              تم استلام طلبك بنجاح
            </h1>

            {data?.customerName && (
              <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: '0 0 24px' }}>
                شكراً {data.customerName.split(' ')[0]}، طلبك في الطريق
              </p>
            )}

            {/* تفاصيل الطلب */}
            <div style={{
              background: '#fafaf5',
              borderRadius: 14,
              padding: '20px 24px',
              margin: '24px 0',
              textAlign: 'right',
              border: '1px solid rgba(95,97,87,.08)',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data?.bookingId && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.92rem' }}>
                    <span style={{ color: 'var(--muted)' }}>🆔 رقم الطلب</span>
                    <span style={{ fontWeight: 700, color: 'var(--dark)', fontFamily: 'monospace' }}>{data.bookingId.slice(0, 8).toUpperCase()}</span>
                  </div>
                )}
                {data?.startDate && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.92rem' }}>
                    <span style={{ color: 'var(--muted)' }}>📅 التاريخ المفضّل</span>
                    <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{data.startDate}</span>
                  </div>
                )}
                {data?.startTime && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.92rem' }}>
                    <span style={{ color: 'var(--muted)' }}>🕐 الوقت المفضّل</span>
                    <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{data.startTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* الخطوات التالية */}
            <div style={{
              background: 'rgba(201,168,76,.08)',
              borderRadius: 14,
              padding: '20px 24px',
              margin: '24px 0',
              textAlign: 'right',
              border: '1px solid rgba(201,168,76,.2)',
            }}>
              <div style={{ fontWeight: 800, color: 'var(--dark)', marginBottom: 12, fontSize: '.95rem' }}>
                الخطوات التالية
              </div>
              <div style={{ fontSize: '.88rem', color: 'var(--dark)', lineHeight: 1.85 }}>
                <div style={{ marginBottom: 8 }}>
                  <strong>1.</strong> سيتواصل معك فريق <strong>مستشفى رعاية الطبية</strong> خلال ٢٤ ساعة.
                </div>
                <div style={{ marginBottom: 8 }}>
                  <strong>2.</strong> سيتم تقييم حالتك وتحديد <strong>التكلفة والموعد المناسب</strong>.
                </div>
                <div>
                  <strong>3.</strong> بعد الموافقة، سنرسل لك تأكيد الحجز عبر الواتساب.
                </div>
              </div>
            </div>

            {/* أزرار */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <a href="/my-bookings" style={{
                flex: 1, minWidth: 200, padding: '14px 24px',
                background: 'var(--dark)', color: '#F6F0D7',
                borderRadius: 10, textDecoration: 'none',
                fontWeight: 800, fontSize: '.95rem',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                عرض حجوزاتي
              </a>
              <a href="/" style={{
                flex: 1, minWidth: 200, padding: '14px 24px',
                background: 'transparent', color: 'var(--dark)',
                border: '1.5px solid var(--dark)',
                borderRadius: 10, textDecoration: 'none',
                fontWeight: 700, fontSize: '.95rem',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                الصفحة الرئيسية
              </a>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
