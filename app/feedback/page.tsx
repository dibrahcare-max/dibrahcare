'use client'
import { useState, Suspense, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

// ===== Styles constants (خارج component - ما يُعاد إنشاؤها) =====
const CARD_STYLE = {
  background: 'white', borderRadius: 18, padding: '24px 26px',
  border: '1px solid rgba(95,97,87,.1)', marginBottom: 18,
} as const

const LABEL_STYLE = {
  fontSize: '.95rem', fontWeight: 800, color: 'var(--dark)',
  marginBottom: 14, display: 'block', textAlign: 'center' as const,
  fontFamily: 'PNU, Tajawal, sans-serif',
} as const

const INPUT_STYLE = {
  width: '100%', padding: '12px 14px', fontSize: '.92rem',
  border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10,
  fontFamily: 'inherit', outline: 'none', background: '#fafaf7',
  lineHeight: 1.7,
} as const

const TEXTAREA_STYLE = { ...INPUT_STYLE, minHeight: 90, resize: 'vertical' as const }
const TEXTAREA_SMALL_STYLE = { ...INPUT_STYLE, minHeight: 70, resize: 'vertical' as const }

function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: '2.2rem', padding: 4, transition: 'transform .15s',
          transform: n <= value ? 'scale(1.05)' : 'scale(1)',
          color: n <= value ? '#f5b800' : '#d4d4d4',
          lineHeight: 1,
        }}>★</button>
      ))}
    </div>
  )
}

function ChoiceButtons({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { val: string; label: string; icon?: string }[]
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length},1fr)`, gap: 10 }}>
      {options.map(o => (
        <button key={o.val} type="button" onClick={() => onChange(o.val)} style={{
          padding: '14px 12px', borderRadius: 10, fontSize: '.9rem', fontWeight: 700,
          fontFamily: 'inherit', cursor: 'pointer', textAlign: 'center',
          border: value === o.val ? '2px solid var(--dark)' : '1.5px solid rgba(95,97,87,.2)',
          background: value === o.val ? 'var(--dark)' : 'white',
          color: value === o.val ? '#F6F0D7' : 'var(--dark)',
          transition: 'all .2s',
        }}>
          {o.icon && <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{o.icon}</div>}
          {o.label}
        </button>
      ))}
    </div>
  )
}

function FeedbackForm() {
  const params = useSearchParams()
  const bookingId = params.get('bookingId') || ''

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName]   = useState('')
  const [phone, setPhone] = useState('')

  const [ratings, setRatings] = useState({
    rating_overall: 0,
    rating_caregiver: 0,
    rating_punctuality: 0,
    rating_professionalism: 0,
    rating_cleanliness: 0,
    rating_communication: 0,
  })

  const [recommend, setRecommend] = useState('')
  const [rebook, setRebook]       = useState('')
  const [positive, setPositive]   = useState('')
  const [improve, setImprove]     = useState('')
  const [extra, setExtra]         = useState('')

  const setRating = (k: keyof typeof ratings, n: number) =>
    setRatings(r => ({ ...r, [k]: n }))

  const submit = async () => {
    setError('')
    if (!ratings.rating_overall) {
      setError('يرجى تقييم الخدمة بالنجوم أولاً')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          customer_name: name,
          customer_phone: phone,
          ...ratings,
          would_recommend: recommend,
          would_rebook: rebook,
          positive_feedback: positive,
          improvement_feedback: improve,
          additional_comments: extra,
        }),
      })
      const data = await res.json()
      if (data.success) setSubmitted(true)
      else setError(data.message || 'حدث خطأ في الإرسال')
    } catch {
      setError('حدث خطأ في الاتصال')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 100px)', padding: '80px 24px', direction: 'rtl' }}>
        <div style={{ maxWidth: 560, margin: '0 auto', background: 'white', borderRadius: 24, padding: '56px 32px', textAlign: 'center', border: '1px solid rgba(95,97,87,.1)' }}>
          <div style={{ fontSize: '4.5rem', marginBottom: 16 }}>💚</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 12 }}>شكراً لكم!</h2>
          <p style={{ fontSize: '1rem', color: 'var(--muted)', lineHeight: 1.9 }}>
            نقدّر وقتكم في تقييم خدمتنا. ملاحظاتكم تساعدنا على التطوير المستمر.
          </p>
          <a href="/" style={{ display: 'inline-block', marginTop: 28, padding: '13px 36px', background: 'var(--dark)', color: '#F6F0D7', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '.9rem' }}>
            العودة للرئيسية
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: 'calc(100vh - 100px)', padding: '40px 16px 80px' }} dir="rtl">
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: '3rem', marginBottom: 10 }}>📝</div>
          <h1 style={{ fontSize: 'clamp(1.6rem,3.5vw,2.2rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 8 }}>
            قيّم تجربتك معنا
          </h1>
          <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 1.8 }}>
            رأيك يهمّنا — ملاحظاتك تساعدنا في تحسين خدماتنا
          </p>
        </div>

        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', borderRadius: 10, padding: '12px 16px', fontSize: '.88rem', marginBottom: 16, fontWeight: 700, textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {/* بياناتك */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>بياناتك (اختياري)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="fb-grid">
            <input style={INPUT_STYLE} placeholder="الاسم" value={name} onChange={e => setName(e.target.value)} />
            <input style={INPUT_STYLE} placeholder="رقم الجوال" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
        </div>

        {/* التقييم العام */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>كيف كانت تجربتك بشكل عام؟ <span style={{color:'#c0392b'}}>*</span></label>
          <StarRating value={ratings.rating_overall} onChange={n => setRating('rating_overall', n)} />
        </div>

        {/* تقييمات تفصيلية */}
        <div style={CARD_STYLE}>
          <label style={{ ...LABEL_STYLE, marginBottom: 4 }}>تقييم تفصيلي</label>
          <p style={{ fontSize: '.82rem', color: 'var(--muted)', textAlign: 'center', marginBottom: 18 }}>اختياري — لكن يساعدنا كثير</p>

          {[
            { k: 'rating_caregiver',       q: 'جودة مقدّمة الرعاية' },
            { k: 'rating_punctuality',     q: 'الالتزام بالمواعيد' },
            { k: 'rating_professionalism', q: 'الاحترافية والآداب' },
            { k: 'rating_cleanliness',     q: 'النظافة والمظهر' },
            { k: 'rating_communication',   q: 'التواصل والاستجابة' },
          ].map(item => (
            <div key={item.k} style={{ marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #f0f0eb' }}>
              <div style={{ fontSize: '.92rem', fontWeight: 600, color: 'var(--dark)', textAlign: 'center', marginBottom: 8 }}>
                {item.q}
              </div>
              <StarRating value={(ratings as any)[item.k]} onChange={n => setRating(item.k as any, n)} />
            </div>
          ))}
        </div>

        {/* تنصح؟ */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>هل تنصح أهلك وأصدقاءك بدِبرة؟</label>
          <ChoiceButtons value={recommend} onChange={setRecommend} options={[
            { val: 'yes',   label: 'بكل تأكيد',  icon: '👍' },
            { val: 'maybe', label: 'ربّما',       icon: '🤔' },
            { val: 'no',    label: 'لا',         icon: '👎' },
          ]} />
        </div>

        {/* تعيد الحجز؟ */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>هل ستحجز معنا مرة أخرى؟</label>
          <ChoiceButtons value={rebook} onChange={setRebook} options={[
            { val: 'yes',   label: 'نعم', icon: '✓' },
            { val: 'maybe', label: 'ربما', icon: '⏳' },
            { val: 'no',    label: 'لا',  icon: '✗' },
          ]} />
        </div>

        {/* أعجبك */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>ما الذي أعجبك في الخدمة؟</label>
          <textarea style={TEXTAREA_STYLE} value={positive} onChange={e => setPositive(e.target.value)} placeholder="..." />
        </div>

        {/* تحسين */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>ما الذي نحتاج تحسينه؟</label>
          <textarea style={TEXTAREA_STYLE} value={improve} onChange={e => setImprove(e.target.value)} placeholder="..." />
        </div>

        {/* إضافي */}
        <div style={CARD_STYLE}>
          <label style={LABEL_STYLE}>ملاحظات أخرى</label>
          <textarea style={TEXTAREA_SMALL_STYLE} value={extra} onChange={e => setExtra(e.target.value)} placeholder="أي شيء تحب تشاركنا فيه..." />
        </div>

        {/* إرسال */}
        <button onClick={submit} disabled={loading} style={{
          width: '100%', padding: 16, background: loading ? '#aaa' : 'var(--dark)',
          color: '#F6F0D7', fontSize: '1.05rem', fontWeight: 800, fontFamily: 'inherit',
          border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 8,
        }}>
          {loading ? 'جاري الإرسال...' : 'إرسال التقييم 💚'}
        </button>
      </div>

      <style jsx global>{`
        @media (max-width: 600px) {
          .fb-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

export default function FeedbackPage() {
  return (
    <>
      <Nav />
      <Suspense>
        <FeedbackForm />
      </Suspense>
      <Footer />
    </>
  )
}
