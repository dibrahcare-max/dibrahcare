'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef, useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'
import { trackXConversion } from '@/components/XPixel'
import { trackMetaPurchase } from '@/components/MetaPixel'

function ResponseContent() {
  const params = useSearchParams()

  const result       = params.get('result') || params.get('Result') || ''
  const status       = params.get('status') || params.get('Status') || ''
  const authRespCode = params.get('authRespCode') || params.get('AuthRespCode') || ''
  const responseCode = params.get('responseCode') || params.get('ResponseCode') || ''
  const paymentId    = params.get('paymentid') || params.get('PaymentID') || params.get('paymentId') || ''
  const trackId      = params.get('trackId') || params.get('trackid') || params.get('TrackID') || ''
  const errorCode    = params.get('Error') || params.get('error') || params.get('ErrorCode') || ''
  const errorText    = params.get('ErrorText') || params.get('errorText') || ''

  // ═══ منطق النجاح المتساهل (مطابق لـ PHP القديم) ═══
  const SUCCESS_RESULTS = ['CAPTURED', 'APPROVED', 'SUCCESS']
  const FAIL_RESULTS = ['FAILED', 'DECLINED', 'CANCELED', 'CANCELLED', 'ERROR']
  const resultUpper = result.toUpperCase().trim()
  const statusUpper = status.toUpperCase().trim()

  // فشل صريح (إما errorCode أو نص فشل واضح)
  const explicitFail = !!errorCode ||
    FAIL_RESULTS.includes(resultUpper) ||
    FAIL_RESULTS.includes(statusUpper)

  // نجاح صريح: أحد الحقول يدل على نجاح
  const explicitSuccess =
    SUCCESS_RESULTS.includes(resultUpper) ||
    SUCCESS_RESULTS.includes(statusUpper) ||
    authRespCode === '00' ||
    responseCode === '00' ||
    // إذا في paymentId ولا في فشل صريح، اعتبرها نجاح (مطابق لـ PHP)
    (!!paymentId && !explicitFail)

  const success = !explicitFail && explicitSuccess

  const notified = useRef(false)
  const [serviceCategory, setServiceCategory] = useState<string>('')
  const [retryHref, setRetryHref] = useState('/services')

  useEffect(() => {
    const allParams: Record<string, string> = {}
    params.forEach((v, k) => { allParams[k] = v })
    console.log('🔍 [payment-response] All params:', allParams)
    console.log('🔍 [payment-response] result:', result, '| status:', status)
    console.log('🔍 [payment-response] authRespCode:', authRespCode, '| responseCode:', responseCode)
    console.log('🔍 [payment-response] paymentId:', paymentId, '| trackId:', trackId)
    console.log('🔍 [payment-response] errorCode:', errorCode, '| errorText:', errorText)
    console.log(success ? '✅ [payment-response] SUCCESS' : '❌ [payment-response] FAILED')

    // اقرأ بيانات الحجز من sessionStorage
    const raw = sessionStorage.getItem('dibrah_booking')
    if (!raw) return

    let booking: any = null
    try { booking = JSON.parse(raw) } catch {}

    if (booking?.service_category) setServiceCategory(booking.service_category)
    if (booking?.service_key) setRetryHref(`/book/${booking.service_key}`)

    if (success && !notified.current && booking) {
      notified.current = true

      // ═══ تتبع الـ Conversion في X Pixel ═══
      trackXConversion(booking.amount || 0, 'SAR')
      // ═══ تتبع الـ Purchase في Meta Pixel ═══
      trackMetaPurchase(booking.amount || 0, 'SAR')

      // حفظ الحجز في DB
      fetch('/api/save-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...booking, trackId, paymentId }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            // امسح sessionStorage بعد الحفظ الناجح
            sessionStorage.removeItem('dibrah_booking')
          }
        })
        .catch(err => console.error('save-booking failed:', err))
    }
  }, [success, trackId, paymentId, params])

  // ═══ الرسائل حسب الحالة ═══
  const messages = (() => {
    if (!success) {
      return {
        emoji: '❌',
        title: 'لم تكتمل عملية الدفع',
        body: 'نعتذر، لم تتم عملية الدفع بنجاح ولم يُخصم أي مبلغ من بطاقتك. يرجى المحاولة مرة أخرى أو التواصل معنا للمساعدة.',
        cta: 'إعادة المحاولة',
        ctaHref: retryHref,
      }
    }

    if (serviceCategory === 'medical') {
      return {
        emoji: '✅',
        title: 'تم الدفع بنجاح',
        body: 'تم استلام دفعتك بنجاح، وسيتم التواصل معك من قِبل مستشفى رعاية الطبية لإتمام الترتيبات.',
        cta: 'العودة للرئيسية',
        ctaHref: '/',
      }
    }

    return {
      emoji: '✅',
      title: 'تم تأكيد حجزك',
      body: 'شكراً لاختيارك دِبرة 💚 تم استلام طلبك، وسيتواصل معك فريقنا قريباً لتأكيد التفاصيل.',
      cta: 'العودة للرئيسية',
      ctaHref: '/',
    }
  })()

  return (
    <div style={{ background: 'var(--bg)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '56px 40px',
        maxWidth: 520, width: '100%', textAlign: 'center',
        border: '1px solid rgba(95,97,87,.15)',
        boxShadow: '0 4px 24px rgba(95,97,87,.08)',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: 18 }}>{messages.emoji}</div>
        <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 8, fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة</span>
        <h1 style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', fontWeight: 900, color: 'var(--dark)', marginBottom: 14, fontFamily: 'PNU, Tajawal, sans-serif' }}>
          {messages.title}
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.9, marginBottom: 28 }}>
          {messages.body}
        </p>

        {/* تذكير خاص بالرعاية الطبية بعد الدفع */}
        {success && serviceCategory === 'medical' && (
          <div style={{
            background: '#fafaf5', borderRadius: 16,
            padding: '22px 20px', marginBottom: 28,
            border: '1px solid rgba(95,97,87,.15)',
          }}>
            <img
              src="/images/care-medical-logo.webp"
              alt="رعاية الطبية"
              style={{
                height: 52, width: 'auto', objectFit: 'contain',
                marginBottom: 14, display: 'block', marginInline: 'auto',
              }}
            />
            <div style={{
              fontSize: '.78rem', color: 'var(--muted)',
              fontWeight: 600, marginBottom: 8, textAlign: 'center',
            }}>
              مزوّد الخدمة الطبية
            </div>
            <p style={{
              fontSize: '.92rem', color: 'var(--dark)',
              lineHeight: 1.85, margin: 0, textAlign: 'center',
            }}>
              ✉️ سيتواصل معك فريق <strong>مستشفى رعاية الطبية</strong> خلال <strong>٢٤ ساعة</strong> لتأكيد الموعد وتفاصيل الزيارة.
            </p>
          </div>
        )}

        {success && (trackId || paymentId) && (
          <div style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {paymentId && (
              <p style={{ fontSize: '.78rem', color: 'rgba(95,97,87,.6)', margin: 0 }}>
                رقم العملية: <span style={{ fontWeight: 700, color: 'var(--muted)' }}>{paymentId}</span>
              </p>
            )}
            {trackId && (
              <p style={{ fontSize: '.78rem', color: 'rgba(95,97,87,.6)', margin: 0 }}>
                المرجع: <span style={{ fontWeight: 700, color: 'var(--muted)' }}>{trackId}</span>
              </p>
            )}
          </div>
        )}

        <a href={messages.ctaHref} style={{
          display: 'inline-block', padding: '14px 36px',
          background: 'var(--dark)', color: '#F6F0D7',
          borderRadius: 10, textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
        }}>
          {messages.cta}
        </a>

        {success && (
          <div style={{ marginTop: 22 }}>
            <a href="/my-bookings" style={{
              fontSize: '.85rem', color: 'var(--muted)',
              textDecoration: 'underline', fontWeight: 600,
            }}>عرض حجوزاتي</a>
          </div>
        )}
      </div>
    </div>
  )
}

export default function PaymentResponse() {
  return (
    <>
      <Nav />
      <Suspense><ResponseContent /></Suspense>
      <Footer />
      <WhatsApp />
      <style jsx global>{`:root { --muted: #8a8e80; }`}</style>
    </>
  )
}
