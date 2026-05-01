'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

function ResponseContent() {
  const params = useSearchParams()

  // Neoleap ترسل الحالة بأسماء مختلفة - نقرأ من كل الاحتمالات
  const result       = params.get('result') || params.get('Result') || ''
  const status       = params.get('status') || params.get('Status') || ''
  const authRespCode = params.get('authRespCode') || params.get('AuthRespCode') || ''
  const responseCode = params.get('responseCode') || params.get('ResponseCode') || ''
  const paymentId    = params.get('paymentid') || params.get('PaymentID') || params.get('paymentId') || ''
  const trackId      = params.get('trackId') || params.get('trackid') || params.get('TrackID') || ''
  const errorCode    = params.get('Error') || params.get('error') || params.get('ErrorCode') || ''
  const decryptErr   = params.get('decrypt_error') === '1'

  // ═══ منطق النجاح الصارم (whitelist) ═══
  // نعتبرها ناجحة فقط لو:
  //   1. فك تشفير trandata نجح (مو فاشل)
  //   2. القيمة الصريحة result/status = CAPTURED أو APPROVED أو SUCCESS
  //      أو authRespCode/responseCode = "00" (موافقة البنك)
  // أي شي ثاني → فاشل (مبدأ: في حالة الشك، نرفض)
  const SUCCESS_RESULTS = ['CAPTURED', 'APPROVED', 'SUCCESS']
  const resultUpper = result.toUpperCase().trim()
  const statusUpper = status.toUpperCase().trim()

  const success = !decryptErr && !errorCode && (
    SUCCESS_RESULTS.includes(resultUpper) ||
    SUCCESS_RESULTS.includes(statusUpper) ||
    authRespCode === '00' ||
    responseCode === '00'
  )

  const notified = useRef(false)

  useEffect(() => {
    // اطبع البيانات للديباج
    const allParams: Record<string, string> = {}
    params.forEach((v, k) => { allParams[k] = v })
    console.log('🔍 Neoleap response:', allParams)
    console.log(success ? '✅ SUCCESS' : '❌ FAILED')

    if (!success || notified.current) return
    notified.current = true

    const raw = sessionStorage.getItem('dibrah_booking')
    if (!raw) {
      console.warn('⚠️ لم يتم العثور على بيانات الحجز في sessionStorage')
      return
    }
    const booking = JSON.parse(raw)
    sessionStorage.removeItem('dibrah_booking')

    // إرسال إيميل إشعار
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...booking, trackId, paymentId }),
    }).catch(console.error)

    // حفظ الحجز + واتساب تلقائياً
    fetch('/api/save-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...booking, trackId, paymentId }),
    }).catch(console.error)
  }, [success, trackId, paymentId, params])

  return (
    <div style={{ background:'var(--bg)', minHeight:'60vh', display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
      <div style={{
        background:'white', borderRadius:24, padding:'56px 48px',
        maxWidth:480, width:'100%', textAlign:'center',
        border:'1px solid rgba(95,97,87,.15)',
        boxShadow:'0 4px 24px rgba(95,97,87,.08)',
      }}>
        <div style={{ fontSize:'4rem', marginBottom:20 }}>{success ? '✅' : '❌'}</div>
        <span style={{ fontSize:'2.5rem', fontWeight:900, color:'#777C6D', display:'block', marginBottom:8 }}>دِبرة</span>
        <h1 style={{ fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:900, color:'var(--dark)', marginBottom:12 }}>
          {success ? 'تمت العملية بنجاح' : 'فشلت العملية'}
        </h1>
        <p style={{ color:'var(--muted)', fontSize:'.95rem', lineHeight:1.8, marginBottom:28 }}>
          {success
            ? 'شكراً لك! تم استلام طلبك وسيتواصل معك فريق دِبرة قريباً.'
            : 'لم يتم خصم أي مبلغ من بطاقتك. يمكنك المحاولة مرة أخرى أو التواصل معنا للمساعدة.'}
        </p>
        {(trackId || paymentId) && (
          <div style={{ marginBottom:28, display:'flex', flexDirection:'column', gap:4 }}>
            {trackId && (
              <p style={{ fontSize:'.8rem', color:'rgba(95,97,87,.5)', margin:0 }}>
                رقم العملية: <span style={{ fontWeight:700, color:'var(--muted)' }}>{trackId}</span>
              </p>
            )}
            {paymentId && (
              <p style={{ fontSize:'.8rem', color:'rgba(95,97,87,.5)', margin:0 }}>
                الرقم المرجعي: <span style={{ fontWeight:700, color:'var(--muted)' }}>{paymentId}</span>
              </p>
            )}
          </div>
        )}
        <a href={success ? '/' : '/book'} style={{
          display:'inline-block', padding:'14px 36px',
          background:'var(--dark)', color:'#F6F0D7',
          borderRadius:10, textDecoration:'none', fontWeight:700, fontSize:'1rem',
        }}>
          {success ? 'العودة للرئيسية' : 'حاول مرة أخرى'}
        </a>
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
