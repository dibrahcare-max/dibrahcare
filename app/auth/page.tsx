'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// ===== Styles خارج component =====
const PAGE_STYLE = {
  background: 'var(--bg)',
  minHeight: 'calc(100vh - 100px)',
  padding: '60px 20px 80px',
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
} as const

const CARD_STYLE = {
  background: 'white',
  borderRadius: 24,
  padding: '40px 32px',
  maxWidth: 460,
  width: '100%',
  border: '1px solid rgba(95,97,87,.12)',
  boxShadow: '0 8px 30px rgba(0,0,0,.06)',
} as const

const LOGO_STYLE = {
  textAlign: 'center' as const,
  marginBottom: 28,
}

const TITLE_STYLE = {
  fontSize: '1.7rem',
  fontWeight: 900,
  color: 'var(--dark)',
  fontFamily: 'PNU, Tajawal, sans-serif',
  textAlign: 'center' as const,
  marginBottom: 8,
}

const SUBTITLE_STYLE = {
  fontSize: '.95rem',
  color: 'var(--muted)',
  textAlign: 'center' as const,
  marginBottom: 28,
  lineHeight: 1.7,
}

const INPUT_STYLE = {
  width: '100%',
  padding: '14px 16px',
  fontSize: '1rem',
  border: '1.5px solid rgba(95,97,87,.2)',
  borderRadius: 12,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#fafaf7',
  textAlign: 'center' as const,
  letterSpacing: '1px',
} as const

const BTN_PRIMARY = {
  width: '100%',
  padding: '14px 20px',
  fontSize: '1rem',
  fontWeight: 800,
  background: 'var(--dark)',
  color: '#F6F0D7',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'opacity .2s',
} as const

const BTN_SECONDARY = {
  background: 'transparent',
  color: 'var(--dark)',
  border: '1.5px solid rgba(95,97,87,.3)',
  borderRadius: 12,
  padding: '12px 20px',
  fontSize: '.95rem',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'inherit',
  width: '100%',
  marginTop: 12,
} as const

const ERROR_STYLE = {
  background: '#fde8e8',
  color: '#c0392b',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: '.88rem',
  marginBottom: 16,
  fontWeight: 700,
  textAlign: 'center' as const,
}

const SUCCESS_STYLE = {
  background: '#e8f5e9',
  color: '#2e7d32',
  borderRadius: 10,
  padding: '12px 16px',
  fontSize: '.88rem',
  marginBottom: 16,
  fontWeight: 700,
  textAlign: 'center' as const,
}

function AuthInner() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get('next') || '/services'

  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [info, setInfo]       = useState('')
  const [countdown, setCountdown] = useState(0)

  // عداد إعادة الإرسال
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // تحقق إذا العميل مسجل دخول مسبقاً — ووجّه حسب حالة بياناته
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) return

        // مسجّل دخول — نفس منطق verify-otp:
        // complete → للخدمات (أو الوجهة المطلوبة)
        // new      → يكمل بياناته في /register
        if (d.status === 'complete') {
          router.replace(next)
        } else {
          router.replace('/register?phone=' + encodeURIComponent(d.phone || ''))
        }
      })
      .catch(() => {})
  }, [next, router])

  const sendOtp = async () => {
    setError(''); setInfo(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'حدث خطأ')
        return
      }

      setInfo('تم إرسال الرمز عبر رسالة نصية')
      setStep('otp')
      setCountdown(60)
    } catch {
      setError('تعذر الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const verify = async () => {
    setError(''); setInfo(''); setLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'رمز غير صحيح')
        return
      }

      // ✅ نجح التحقق — وجّه حسب حالة العميل
      // new      → يبدأ التسجيل في /register
      // complete → يروح للخدمات (أو الوجهة المطلوبة)
      const status = data.status as 'new' | 'complete'

      if (status === 'complete') {
        // عميل مسجَّل — للخدمات أو الوجهة المطلوبة
        router.push(next)
      } else {
        // جديد — يكمل بياناته في /register
        router.push('/register?phone=' + encodeURIComponent(phone))
      }
    } catch {
      setError('تعذر الاتصال')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={PAGE_STYLE} dir="rtl">
      <div style={CARD_STYLE}>
        <div style={LOGO_STYLE}>
          <img src="/images/dibrah-logo.png" alt="دِبرة" style={{ height: 60, width: 'auto' }} />
        </div>

        {step === 'phone' && (
          <>
            <h1 style={TITLE_STYLE}>أهلاً بك في دِبرة</h1>
            <p style={SUBTITLE_STYLE}>أدخل رقم جوالك للمتابعة — سواء كنت عميلاً جديداً أو عندك حساب</p>

            {error && <div style={ERROR_STYLE}>⚠️ {error}</div>}
            {info && <div style={SUCCESS_STYLE}>✅ {info}</div>}

            <input
              style={INPUT_STYLE}
              type="tel"
              placeholder="05XXXXXXXX"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              maxLength={13}
              autoFocus
            />

            <button
              style={{ ...BTN_PRIMARY, marginTop: 14, opacity: loading || !phone ? 0.6 : 1 }}
              onClick={sendOtp}
              disabled={loading || !phone}
            >
              {loading ? '...جارٍ الإرسال' : 'إرسال رمز التحقق'}
            </button>

            <p style={{ marginTop: 20, textAlign: 'center', fontSize: '.8rem', color: 'var(--muted)', lineHeight: 1.8 }}>
              سنرسل لك رمز التحقق عبر رسالة نصية على نفس الرقم
            </p>

            <p style={{ marginTop: 12, textAlign: 'center', fontSize: '.72rem', color: '#8a8d83', lineHeight: 1.75, padding: '0 8px' }}>
              باستخدامك موقع دِبرة، أنت تؤكد اطلاعك على{' '}
              <a href="/terms" target="_blank" style={{ color: 'var(--dark)', textDecoration: 'underline', fontWeight: 700 }}>الشروط والأحكام</a>
              {' '}و{' '}
              <a href="/privacy" target="_blank" style={{ color: 'var(--dark)', textDecoration: 'underline', fontWeight: 700 }}>سياسة الخصوصية</a>
              {' '}وموافقتك عليها.
            </p>
          </>
        )}

        {step === 'otp' && (
          <>
            <h1 style={TITLE_STYLE}>أدخل رمز التحقق</h1>
            <p style={SUBTITLE_STYLE}>
              أرسلنا رمزاً مكوناً من 4 أرقام إلى<br/>
              <strong style={{ color: 'var(--dark)', direction: 'ltr', display: 'inline-block' }}>{phone}</strong> عبر رسالة نصية
            </p>

            {error && <div style={ERROR_STYLE}>⚠️ {error}</div>}
            {info && <div style={SUCCESS_STYLE}>✅ {info}</div>}

            <input
              style={{ ...INPUT_STYLE, fontSize: '1.6rem', letterSpacing: '8px', fontWeight: 800 }}
              type="tel"
              inputMode="numeric"
              placeholder="0000"
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              autoFocus
            />

            <button
              style={{ ...BTN_PRIMARY, marginTop: 14, opacity: loading || code.length !== 4 ? 0.6 : 1 }}
              onClick={verify}
              disabled={loading || code.length !== 4}
            >
              {loading ? '...جارٍ التحقق' : 'تأكيد'}
            </button>

            <button
              style={{ ...BTN_SECONDARY, opacity: countdown > 0 ? 0.5 : 1 }}
              onClick={countdown > 0 ? undefined : sendOtp}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `إعادة الإرسال خلال ${countdown}ث` : 'إعادة إرسال الرمز'}
            </button>

            <div style={{ marginTop: 18, textAlign: 'center', fontSize: '.88rem' }}>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError(''); setInfo('') }}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← تغيير الرقم
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <>
      <Nav />
      <Suspense fallback={<div style={{ minHeight: '60vh' }} />}>
        <AuthInner />
      </Suspense>
      <Footer />
    </>
  )
}
