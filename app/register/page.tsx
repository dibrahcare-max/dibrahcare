'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'
import VisitTracker from '@/components/VisitTracker'

// ─── حالة الفورم ────────────────────────────────────
type FormState = {
  full_name: string
  national_id: string
  phone: string
  nationality: string
  district: string
  street: string
  emergency_phone: string
  short_address: string
  email: string
}

const INITIAL: FormState = {
  full_name: '', national_id: '', phone: '',
  nationality: '', district: '', street: '',
  emergency_phone: '', short_address: '', email: '',
}

type FormKey = keyof FormState

// ─── التحقق لكل حقل ─────────────────────────────────
function validate(key: FormKey, value: string): string {
  const v = (value || '').trim()
  switch (key) {
    case 'full_name': {
      if (!v) return 'مطلوب'
      const words = v.split(/\s+/).filter(Boolean)
      if (words.length !== 4) return 'الاسم لازم يكون رباعي (٤ كلمات)'
      return ''
    }
    case 'national_id':
      if (!v) return 'مطلوب'
      if (!/^[12]\d{9}$/.test(v)) return 'لازم ١٠ أرقام تبدأ بـ ١ أو ٢'
      return ''
    case 'phone':
      if (!v) return 'مطلوب'
      if (!/^05\d{8}$/.test(v)) return 'لازم ١٠ أرقام تبدأ بـ ٠٥'
      return ''
    case 'nationality':
      if (!v) return 'مطلوب'
      if (v.split(/\s+/).filter(Boolean).length > 1) return 'كلمة واحدة فقط'
      if (v.length < 3) return 'لا تقل عن ٣ أحرف'
      return ''
    case 'emergency_phone':
      if (!v) return 'مطلوب'
      if (!/^05\d{8}$/.test(v)) return 'لازم ١٠ أرقام تبدأ بـ ٠٥'
      return ''
    case 'short_address':
      if (!v) return 'مطلوب'
      if (!/^[A-Z]{4}\d{4}$/.test(v)) return 'مثال: RYAR4321 (٤ حروف + ٤ أرقام)'
      return ''
    case 'email':
      if (!v) return 'مطلوب'
      if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v)) return 'صيغة الإيميل غير صحيحة'
      return ''
    default:
      return ''
  }
}

// ─── معالجة الإدخال (Auto-format) ───────────────────
function transform(key: FormKey, raw: string): string {
  switch (key) {
    case 'national_id':
    case 'phone':
    case 'emergency_phone':
      return raw.replace(/\D/g, '').slice(0, 10)
    case 'short_address':
      return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    case 'email':
      return raw.trim().slice(0, 100)
    case 'nationality':
      return raw.replace(/\s/g, '').slice(0, 30)
    default:
      return raw.slice(0, 100)
  }
}

// ─── أنماط ──────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 32,
  border: '1px solid rgba(95,97,87,.15)', marginBottom: 20,
}
const sectionTitle: React.CSSProperties = {
  fontSize: '1.15rem', fontWeight: 900, color: 'var(--dark)',
  fontFamily: 'PNU, Tajawal, sans-serif',
  marginBottom: 18, paddingBottom: 10,
  borderBottom: '2px solid rgba(201,168,76,.3)',
}
const inputBase: React.CSSProperties = {
  width: '100%', padding: '12px 14px',
  border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10,
  fontSize: '.95rem', fontFamily: 'Tajawal, sans-serif',
  background: 'white', color: 'var(--dark)',
  outline: 'none', direction: 'rtl', transition: 'border .2s',
}

// ─── حقل واحد ───────────────────────────────────────
function Field({
  label, value, error, touched, optional, type, inputMode, placeholder,
  onChange, onBlur, dir, hint,
}: {
  label: string
  value: string
  error: string
  touched: boolean
  optional?: boolean
  type?: string
  inputMode?: 'text' | 'tel' | 'email' | 'numeric'
  placeholder?: string
  onChange: (v: string) => void
  onBlur: () => void
  dir?: 'ltr' | 'rtl'
  hint?: string
}) {
  const showError = touched && !!error
  const showSuccess = touched && !error && !!value
  const borderColor = showError ? '#e53935' : showSuccess ? '#4caf50' : 'rgba(95,97,87,.2)'

  return (
    <div>
      <label style={{
        fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{label}</span>
        {optional ? (
          <span style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 500 }}>(اختياري)</span>
        ) : (
          <span style={{ color: '#e53935' }}>*</span>
        )}
        {showSuccess && (
          <span style={{ marginInlineStart: 'auto', color: '#4caf50', fontSize: '.95rem' }}>✓</span>
        )}
      </label>
      <input
        type={type || 'text'}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        dir={dir}
        style={{ ...inputBase, borderColor }}
      />
      {!showError && hint && (
        <div style={{ color: 'var(--muted)', fontSize: '.72rem', marginTop: 4, fontWeight: 500 }}>
          {hint}
        </div>
      )}
      {showError && (
        <div style={{ color: '#e53935', fontSize: '.78rem', marginTop: 4, fontWeight: 600 }}>
          {error}
        </div>
      )}
    </div>
  )
}

// ─── الصفحة ─────────────────────────────────────────
function RegisterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [form, setForm] = useState<FormState>(INITIAL)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [phoneLocked, setPhoneLocked] = useState(false)

  // تعبئة رقم الجوال من /auth (مأخوذ من OTP)
  useEffect(() => {
    const phoneParam = searchParams.get('phone')
    if (!phoneParam) return
    const display = phoneParam.startsWith('966') ? '0' + phoneParam.slice(3) : phoneParam
    if (/^05\d{8}$/.test(display)) {
      setForm(f => ({ ...f, phone: display }))
      setPhoneLocked(true)
    }
  }, [searchParams])

  const setField = (key: FormKey, raw: string) => {
    const v = transform(key, raw)
    setForm(f => ({ ...f, [key]: v }))
    if (touched[key]) {
      setErrors(e => ({ ...e, [key]: validate(key, v) }))
    }
  }

  const blurField = (key: FormKey) => {
    setTouched(t => ({ ...t, [key]: true }))
    setErrors(e => ({ ...e, [key]: validate(key, form[key]) }))
  }

  const REQUIRED: FormKey[] = [
    'full_name', 'national_id', 'phone', 'nationality',
    'emergency_phone', 'short_address', 'email',
  ]

  const allRequiredValid = REQUIRED.every(k => form[k] && !validate(k, form[k]))
  const canSubmit = allRequiredValid && agreed && !submitting

  const submit = async () => {
    const allErrors: Record<string, string> = {}
    REQUIRED.forEach(k => {
      const err = validate(k, form[k])
      if (err) allErrors[k] = err
    })
    setErrors(allErrors)
    setTouched(Object.fromEntries(REQUIRED.map(k => [k, true])))

    if (Object.keys(allErrors).length > 0) {
      setServerError('فيه حقول تحتاج مراجعة')
      return
    }

    setSubmitting(true)
    setServerError('')

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.message || 'حدث خطأ')
      setSubmitted(true)
      // بعد التسجيل: إذا فيه next param روح له، وإلا /services
      const nextTarget = searchParams.get('next') || '/services'
      setTimeout(() => router.push(nextTarget), 1800)
    } catch (e: any) {
      setServerError(e.message || 'تعذّر الحفظ، حاول مجدداً')
    } finally {
      setSubmitting(false)
    }
  }

  // شاشة النجاح
  if (submitted) {
    return (
      <>
        <Nav />
        <section style={{ padding: '80px 24px', background: 'var(--bg)', minHeight: '60vh' }}>
          <div style={{ maxWidth: 520, margin: '0 auto', ...cardStyle, textAlign: 'center', padding: '56px 32px' }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 12 }}>
              تم تسجيلك في دِبرة
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.9 }}>
              يا هلا فيك 💚 جاري تحويلك لاختيار الخدمة المناسبة...
            </p>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  return (
    <>
      <VisitTracker page="register" />
      <Nav />

      {/* Hero */}
      <section style={{ padding: '48px 64px 24px', background: 'var(--bg)' }} className="reg-hero">
        <div style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900,
            color: 'var(--dark)', lineHeight: 1.15, marginBottom: 14,
            fontFamily: 'PNU, Tajawal, sans-serif',
          }}>
            حيّاك الله في دِبرة
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 1.7vw, 1.15rem)', fontWeight: 700,
            color: 'var(--dark)', marginBottom: 10,
            fontFamily: 'PNU, Tajawal, sans-serif',
          }}>
            خطوة وحدة وتصير من عائلتنا
          </p>
          <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 1.9, fontWeight: 500 }}>
            عبّئ بياناتك مرة واحدة، ونحفظها لك لتسهيل حجوزاتك القادمة.
          </p>
        </div>
      </section>

      {/* Form */}
      <section style={{ padding: '24px 64px 64px', background: 'var(--bg)' }} className="reg-wrap">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          <div style={cardStyle}>
            <div style={sectionTitle}>بياناتك الأساسية</div>

            <div style={{ display: 'grid', gap: 18 }}>
              <Field
                label="الاسم الرباعي"
                placeholder=""
                hint="اكتب الاسم رباعياً"
                value={form.full_name}
                error={errors.full_name || ''}
                touched={!!touched.full_name}
                onChange={v => setField('full_name', v)}
                onBlur={() => blurField('full_name')}
              />

              <Field
                label="رقم الهوية الوطنية"
                placeholder=""
                hint="١٠ أرقام، يبدأ بـ ١ أو ٢"
                inputMode="numeric"
                type="tel"
                dir="ltr"
                value={form.national_id}
                error={errors.national_id || ''}
                touched={!!touched.national_id}
                onChange={v => setField('national_id', v)}
                onBlur={() => blurField('national_id')}
              />

              {/* رقم الجوال — مقفل من OTP */}
              <div>
                <label style={{
                  fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)',
                  marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span>رقم الجوال</span>
                  <span style={{ color: '#e53935' }}>*</span>
                  {phoneLocked && (
                    <span style={{
                      marginInlineStart: 'auto', fontSize: '.68rem',
                      color: 'var(--muted)', background: '#f0f0e8',
                      padding: '2px 8px', borderRadius: 6, fontWeight: 600,
                    }}>
                      🔒 موثَّق عبر OTP
                    </span>
                  )}
                </label>
                <input
                  type="tel"
                  inputMode="numeric"
                  dir="ltr"
                  placeholder=""
                  value={form.phone}
                  readOnly={phoneLocked}
                  onChange={e => !phoneLocked && setField('phone', e.target.value)}
                  onBlur={() => !phoneLocked && blurField('phone')}
                  style={{
                    ...inputBase,
                    borderColor: errors.phone && touched.phone ? '#e53935' : 'rgba(95,97,87,.2)',
                    background: phoneLocked ? '#f7f6ee' : 'white',
                    cursor: phoneLocked ? 'not-allowed' : 'text',
                  }}
                />
                {!phoneLocked && !errors.phone && (
                  <div style={{ color: 'var(--muted)', fontSize: '.72rem', marginTop: 4, fontWeight: 500 }}>
                    ١٠ أرقام، يبدأ بـ ٠٥
                  </div>
                )}
                {touched.phone && errors.phone && !phoneLocked && (
                  <div style={{ color: '#e53935', fontSize: '.78rem', marginTop: 4, fontWeight: 600 }}>{errors.phone}</div>
                )}
              </div>

              <Field
                label="الجنسية"
                placeholder=""
                hint="كلمة واحدة — مثال: سعودي"
                value={form.nationality}
                error={errors.nationality || ''}
                touched={!!touched.nationality}
                onChange={v => setField('nationality', v)}
                onBlur={() => blurField('nationality')}
              />

              <Field
                label="البريد الإلكتروني"
                placeholder=""
                hint="مثال: name@email.com"
                type="email"
                inputMode="email"
                dir="ltr"
                value={form.email}
                error={errors.email || ''}
                touched={!!touched.email}
                onChange={v => setField('email', v)}
                onBlur={() => blurField('email')}
              />

              <Field
                label="العنوان الوطني المختصر"
                placeholder=""
                hint="٤ حروف إنجليزية + ٤ أرقام — مثال: RYAR4321"
                dir="ltr"
                value={form.short_address}
                error={errors.short_address || ''}
                touched={!!touched.short_address}
                onChange={v => setField('short_address', v)}
                onBlur={() => blurField('short_address')}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="f-grid">
                <Field
                  label="اسم الحي"
                  optional
                  placeholder="اختياري"
                  value={form.district}
                  error=""
                  touched={false}
                  onChange={v => setField('district', v)}
                  onBlur={() => {}}
                />
                <Field
                  label="اسم الشارع"
                  optional
                  placeholder="اختياري"
                  value={form.street}
                  error=""
                  touched={false}
                  onChange={v => setField('street', v)}
                  onBlur={() => {}}
                />
              </div>

              <Field
                label="رقم طوارئ آخر"
                placeholder=""
                hint="رقم تواصل بديل — ١٠ أرقام، يبدأ بـ ٠٥"
                inputMode="numeric"
                type="tel"
                dir="ltr"
                value={form.emergency_phone}
                error={errors.emergency_phone || ''}
                touched={!!touched.emergency_phone}
                onChange={v => setField('emergency_phone', v)}
                onBlur={() => blurField('emergency_phone')}
              />
            </div>
          </div>

          {/* الموافقة + الإرسال */}
          <div style={cardStyle}>
            <p style={{ fontSize: '.88rem', color: 'var(--muted)', lineHeight: 1.9, marginBottom: 18 }}>
              أقرّ بأن جميع البيانات المُدخلة صحيحة ودقيقة، وأتحمل المسؤولية الكاملة عن صحتها.
              يُعتبر تأشيري على الموافقة أدناه بمثابة توقيعي على صحة هذه المعلومات.
            </p>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 20 }}>
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                style={{ width: 20, height: 20, accentColor: 'var(--dark)', marginTop: 2, flexShrink: 0 }}
              />
              <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--dark)' }}>
                أوافق على صحة البيانات وأُقرّ بدقتها ومشاركتها
              </span>
            </label>

            {serverError && (
              <div style={{
                background: '#fde8e8', color: '#c0392b',
                borderRadius: 8, padding: 12, fontSize: '.85rem',
                marginBottom: 14, fontWeight: 700,
              }}>
                ⚠️ {serverError}
              </div>
            )}

            <button
              onClick={submit}
              disabled={!canSubmit}
              style={{
                width: '100%', padding: '15px',
                background: canSubmit ? 'var(--dark)' : '#aaa',
                color: '#F6F0D7', fontSize: '1rem', fontWeight: 800,
                fontFamily: 'Tajawal, sans-serif',
                border: 'none', borderRadius: 10,
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'background .2s, opacity .2s',
                opacity: canSubmit ? 1 : 0.7,
              }}
            >
              {submitting ? '...جارِ التسجيل' : 'إكمال التسجيل ←'}
            </button>

            {!allRequiredValid && (
              <p style={{ textAlign: 'center', marginTop: 12, fontSize: '.78rem', color: 'var(--muted)' }}>
                أكمل البيانات الإلزامية لتفعيل الزر
              </p>
            )}
          </div>

        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .reg-hero, .reg-wrap { padding-left: 24px !important; padding-right: 24px !important; }
        }
        @media (max-width: 640px) {
          .f-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
      <WhatsApp />
    </>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterInner />
    </Suspense>
  )
}
