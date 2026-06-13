'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SupporterLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [supportNumber, setSupportNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')
    if (!phone || !supportNumber) {
      setError('أدخل رقم الجوال ورقم الدعم')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/supports/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, support_number: supportNumber }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'تعذر الدخول')
        setLoading(false)
        return
      }
      // حفظ مؤقت في session لعرض الرحلة
      sessionStorage.setItem('supporter_phone', phone)
      router.push(`/supporters/journey/${data.support.support_number}`)
    } catch (e: any) {
      setError(e?.message || 'خطأ في الاتصال')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'white',
        borderRadius: 24,
        padding: '48px 36px',
        maxWidth: 460,
        width: '100%',
        boxShadow: '0 20px 60px rgba(45, 74, 30, 0.08)',
        border: '1px solid rgba(45, 74, 30, 0.06)',
      }}>
        {/* اللوقو */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
            src="/images/dibrah-logo.png"
            alt="دِبرة"
            style={{ height: 56, width: 'auto', marginBottom: 16 }}
          />
          <h1 style={{
            fontSize: '1.6rem',
            fontWeight: 900,
            color: '#2D4A1E',
            margin: 0,
            marginBottom: 8,
          }}>
            بوابة الداعمين
          </h1>

          {/* آية كريمة */}
          <div style={{
            background: 'rgba(201, 168, 76, .08)',
            border: '1px solid rgba(201, 168, 76, .25)',
            borderRadius: 12,
            padding: '16px 18px',
            margin: '16px 0',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '.72rem',
              fontWeight: 700,
              color: 'rgba(45, 74, 30, .55)',
              letterSpacing: '.1em',
              marginBottom: 8,
            }}>
              قال تعالى
            </div>
            <p style={{
              fontSize: '.95rem',
              lineHeight: 1.95,
              color: '#2D4A1E',
              margin: 0,
              fontWeight: 600,
              fontFamily: '"Amiri", "Traditional Arabic", "PNU", Tajawal, serif',
            }}>
              مَّثَلُ ٱلَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِى سَبِيلِ ٱللَّهِ كَمَثَلِ حَبَّةٍ أَنۢبَتَتْ سَبْعَ سَنَابِلَ فِى كُلِّ سُنۢبُلَةٍ مِّا۟ئَةُ حَبَّةٍ ۗ وَٱللَّهُ يُضَـٰعِفُ لِمَن يَشَآءُ ۗ وَٱللَّهُ وَٰسِعٌ عَلِيمٌ
            </p>
            <div style={{
              fontSize: '.78rem',
              color: 'rgba(45, 74, 30, .55)',
              marginTop: 10,
              fontWeight: 600,
            }}>
              ﴿٢٦١﴾ سورة البقرة
            </div>
          </div>

          <p style={{
            fontSize: '.95rem',
            color: 'rgba(45, 74, 30, .6)',
            margin: 0,
          }}>
            تابع رحلة دعمك الكريم 🌿
          </p>
        </div>

        {/* النموذج */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '.88rem',
              fontWeight: 700,
              marginBottom: 6,
              color: '#2D4A1E',
            }}>
              رقم الجوال
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="05XXXXXXXX"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid rgba(45, 74, 30, 0.15)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                direction: 'ltr',
                textAlign: 'right',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '.88rem',
              fontWeight: 700,
              marginBottom: 6,
              color: '#2D4A1E',
            }}>
              رقم الدعم
            </label>
            <input
              type="text"
              value={supportNumber}
              onChange={e => setSupportNumber(e.target.value.toUpperCase())}
              placeholder="SUP-XXXXXXXX"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1.5px solid rgba(45, 74, 30, 0.15)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                direction: 'ltr',
                textAlign: 'right',
                letterSpacing: '.05em',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: 12,
              borderRadius: 8,
              background: 'rgba(239, 68, 68, .08)',
              color: '#dc2626',
              fontSize: '.88rem',
              fontWeight: 600,
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              padding: '16px',
              borderRadius: 12,
              border: 'none',
              background: loading ? '#9CB58A' : '#2D4A1E',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 800,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              transition: 'background .2s',
            }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </div>

        {/* تذييل */}
        <div style={{
          textAlign: 'center',
          marginTop: 24,
          fontSize: '.8rem',
          color: 'rgba(45, 74, 30, .45)',
        }}>
          رقم الدعم وصلك في رسالة الواتساب
        </div>
      </div>
    </div>
  )
}
