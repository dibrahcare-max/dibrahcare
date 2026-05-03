'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'
import VisitTracker from '@/components/VisitTracker'

// ════════════════════════════════════════════
// تعريف الخدمات والباقات
// ════════════════════════════════════════════

const SERVICE_INFO: Record<string, {
  title: string
  category: 'medical' | 'child' | 'elderly' | 'other'
  desc: string
  emoji: string
}> = {
  'medical':         { title: 'الرعاية الطبية المنزلية',           category: 'medical',  desc: 'بالشراكة مع مستشفى رعاية الطبية',           emoji: '🏥' },
  'childcare':       { title: 'حضانة الأطفال داخل المنزل',         category: 'child',    desc: 'رعاية الأطفال داخل المنزل',                emoji: '👶' },
  'child-travel':    { title: 'مرافقة الأطفال في السفر',           category: 'other',    desc: 'مرافقة الأطفال أثناء الرحلات',             emoji: '✈️' },
  'elderly':         { title: 'رعاية كبار السن',                    category: 'elderly',  desc: 'مرافقة ورعاية كبار السن',                  emoji: '👴' },
  'elderly-travel':  { title: 'مرافقة كبار السن في السفر',          category: 'other',    desc: 'مرافقة كبار السن أثناء الرحلات',          emoji: '🛫' },
  'hospital':        { title: 'مرافقة المرضى في المستشفى',         category: 'other',    desc: 'مرافقة المرضى داخل المستشفى',              emoji: '🏨' },
  'postnatal':       { title: 'رعاية ما بعد الولادة',                category: 'other',    desc: 'رعاية الأم والمولود',                       emoji: '🤱' },
  'bride':           { title: 'وصيفة العروس',                       category: 'other',    desc: 'مرافقة العروس في حفلها',                   emoji: '👰' },
  'wedding':         { title: 'مرافقة الأعراس والمناسبات',          category: 'other',    desc: 'مرافقة المناسبات والأعراس',                emoji: '💍' },
  'teen':            { title: 'المرافقة الآمنة للمراهقين',          category: 'other',    desc: 'مرافقة آمنة للمراهقين',                    emoji: '🧒' },
  'religious':       { title: 'مرافقة المناسبات الدينية والأعياد',  category: 'other',    desc: 'مرافقة الأعياد والمناسبات الدينية',         emoji: '🕌' },
}

const PACKAGES = [
  { id: 'daily_4',   label: 'يومي ٤ ساعات',     price: 350,   duration: 'يوم واحد', hours: 4 },
  { id: 'daily_8',   label: 'يومي ٨ ساعات',     price: 700,   duration: 'يوم واحد', hours: 8 },
  { id: 'weekly_4',  label: 'أسبوعي ٤ ساعات',  price: 1750,  duration: '٥ أيام',   hours: 4 },
  { id: 'weekly_8',  label: 'أسبوعي ٨ ساعات',  price: 3500,  duration: '٥ أيام',   hours: 8 },
  { id: 'monthly_4', label: 'شهري ٤ ساعات',    price: 8000,  duration: '٢٦ يوم',   hours: 4 },
  { id: 'monthly_8', label: 'شهري ٨ ساعات',    price: 16000, duration: '٢٦ يوم',   hours: 8 },
]

// ════════════════════════════════════════════
// دوال حساب الوقت
// ════════════════════════════════════════════

function getPackageHours(packageId: string): number {
  if (packageId.endsWith('_4')) return 4
  if (packageId.endsWith('_8')) return 8
  return 0
}

function to12h(h: number, m: number): string {
  const period = h >= 12 ? 'مساءً' : 'صباحاً'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

function displayTime(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  return to12h(h, m)
}

function calcEndTime(startTime: string, hours: number): string {
  if (!startTime || !hours) return ''
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + hours * 60
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return to12h(eh, em)
}

// ════════════════════════════════════════════
// الأنماط
// ════════════════════════════════════════════

const card: React.CSSProperties = {
  background: 'white', borderRadius: 20, padding: 28,
  border: '1px solid rgba(95,97,87,.15)', marginBottom: 18,
}
const sectionTitle: React.CSSProperties = {
  fontSize: '1.05rem', fontWeight: 900, color: 'var(--dark)',
  fontFamily: 'PNU, Tajawal, sans-serif',
  marginBottom: 18, paddingBottom: 10,
  borderBottom: '2px solid rgba(201,168,76,.3)',
}
const inputBase: React.CSSProperties = {
  width: '100%', padding: '11px 14px',
  border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10,
  fontSize: '.92rem', fontFamily: 'Tajawal, sans-serif',
  background: 'white', color: 'var(--dark)',
  outline: 'none', direction: 'rtl', transition: 'border .2s',
}
const labelStyle: React.CSSProperties = {
  fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)',
  marginBottom: 6, display: 'block',
}
const requiredStar: React.CSSProperties = { color: '#e53935', marginInlineStart: 3 }

const payIcon: React.CSSProperties = {
  height: 28, width: 'auto', objectFit: 'contain',
}

// ════════════════════════════════════════════
// مكوّنات صغيرة
// ════════════════════════════════════════════

function YesNoNote({
  question, value, onChange, requireNoteOnYes, placeholderNote,
}: {
  question: string
  value: { answer: 'yes' | 'no' | ''; note: string }
  onChange: (v: { answer: 'yes' | 'no' | ''; note: string }) => void
  requireNoteOnYes?: boolean
  placeholderNote?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{question}</label>
      <div style={{ display: 'flex', gap: 12, marginBottom: value.answer === 'yes' && requireNoteOnYes ? 10 : 0 }}>
        {(['no', 'yes'] as const).map(opt => (
          <label key={opt} style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid ' + (value.answer === opt ? 'var(--dark)' : 'rgba(95,97,87,.2)'),
            background: value.answer === opt ? 'var(--dark)' : 'white',
            color: value.answer === opt ? '#F6F0D7' : 'var(--dark)',
            cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '.9rem',
            transition: 'all .2s',
          }}>
            <input
              type="radio"
              checked={value.answer === opt}
              onChange={() => onChange({ ...value, answer: opt })}
              style={{ display: 'none' }}
            />
            {opt === 'yes' ? 'نعم' : 'لا'}
          </label>
        ))}
      </div>
      {value.answer === 'yes' && requireNoteOnYes && (
        <textarea
          value={value.note}
          onChange={e => onChange({ ...value, note: e.target.value })}
          placeholder={placeholderNote || 'يرجى التوضيح...'}
          rows={2}
          style={{ ...inputBase, resize: 'vertical' }}
        />
      )}
    </div>
  )
}

// نعم/لا بسيط بدون مربع نص (للأسئلة اللي ما تحتاج شرح)
function SimpleYesNo({
  question, value, onChange,
}: {
  question: string
  value: 'yes' | 'no' | ''
  onChange: (v: 'yes' | 'no') => void
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{question}<span style={requiredStar}>*</span></label>
      <div style={{ display: 'flex', gap: 12 }}>
        {(['no', 'yes'] as const).map(opt => (
          <label key={opt} style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid ' + (value === opt ? 'var(--dark)' : 'rgba(95,97,87,.2)'),
            background: value === opt ? 'var(--dark)' : 'white',
            color: value === opt ? '#F6F0D7' : 'var(--dark)',
            cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '.9rem',
            transition: 'all .2s',
          }}>
            <input
              type="radio"
              checked={value === opt}
              onChange={() => onChange(opt)}
              style={{ display: 'none' }}
            />
            {opt === 'yes' ? 'نعم' : 'لا'}
          </label>
        ))}
      </div>
    </div>
  )
}

// خيارين مخصصين (مثل: طبيعي / لديه قلق)
function ChoiceButtons<T extends string>({
  question, value, onChange, choices,
}: {
  question: string
  value: T | ''
  onChange: (v: T) => void
  choices: { value: T; label: string }[]
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{question}<span style={requiredStar}>*</span></label>
      <div style={{ display: 'flex', gap: 12 }}>
        {choices.map(c => (
          <label key={c.value} style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid ' + (value === c.value ? 'var(--dark)' : 'rgba(95,97,87,.2)'),
            background: value === c.value ? 'var(--dark)' : 'white',
            color: value === c.value ? '#F6F0D7' : 'var(--dark)',
            cursor: 'pointer', textAlign: 'center', fontWeight: 700, fontSize: '.88rem',
            transition: 'all .2s',
          }}>
            <input
              type="radio"
              checked={value === c.value}
              onChange={() => onChange(c.value)}
              style={{ display: 'none' }}
            />
            {c.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, required, placeholder, rows, hint }: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  placeholder?: string
  rows?: number
  hint?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={requiredStar}>*</span>}
      </label>
      {rows && rows > 1 ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          style={{ ...inputBase, resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputBase}
        />
      )}
      {hint && (
        <div style={{ color: 'var(--muted)', fontSize: '.72rem', marginTop: 4, fontWeight: 500 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function NumberField({ label, value, onChange, required, min, max, placeholder, hint }: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  min?: number
  max?: number
  placeholder?: string
  hint?: string
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={requiredStar}>*</span>}
      </label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => {
          const v = e.target.value.replace(/\D/g, '')
          onChange(v)
        }}
        placeholder={placeholder}
        style={inputBase}
      />
      {hint && (
        <div style={{ color: 'var(--muted)', fontSize: '.72rem', marginTop: 4, fontWeight: 500 }}>
          {hint}
        </div>
      )}
    </div>
  )
}

function SelectField({ label, value, onChange, options, required }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  required?: boolean
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={requiredStar}>*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputBase, cursor: 'pointer' }}
      >
        <option value="">— اختر —</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

// ════════════════════════════════════════════
// أنواع البيانات
// ════════════════════════════════════════════

type ChildForm = {
  name: string
  age: string
  health: { answer: 'yes' | 'no' | ''; note: string }
  medications: { answer: 'yes' | 'no' | ''; note: string }
  siblings_count: string
  lives_with: string  // الوالدين / الأم فقط / الأب فقط / غير ذلك
  education_level: string
  skills: { letters: boolean; numbers: boolean; colors: boolean; shapes: boolean }
  language_full_sentences: 'yes' | 'no' | ''
  language_words_only: 'yes' | 'no' | ''
  independence: 'yes' | 'no' | ''
  instructions: string  // يتجاوب بسرعة / يحتاج وقت / يرفض أحياناً
  emotions: string
  fears: string
  hobbies: string
  notes: string
}

const NEW_CHILD: ChildForm = {
  name: '', age: '',
  health: { answer: '', note: '' },
  medications: { answer: '', note: '' },
  siblings_count: '',
  lives_with: '',
  education_level: '',
  skills: { letters: false, numbers: false, colors: false, shapes: false },
  language_full_sentences: '',
  language_words_only: '',
  independence: '',
  instructions: '',
  emotions: '',
  fears: '',
  hobbies: '',
  notes: '',
}

type ElderlyForm = {
  name: string
  age: string
  diseases: { answer: 'yes' | 'no' | ''; note: string }
  medications: { answer: 'yes' | 'no' | ''; note: string }
  accepts_strangers: 'normal' | 'anxious' | ''         // طبيعي / لديه قلق
  recognizes_family: 'yes' | 'no' | ''                 // نعم / لا
  diet: { answer: 'yes' | 'no' | ''; note: string }    // نعم → نص / لا
  daily_meds: { answer: 'yes' | 'no' | ''; note: string }  // نعم → نص / لا
  hearing_vision: 'yes' | 'no' | ''                    // نعم / لا
  breathing_wheelchair: 'yes' | 'no' | ''              // نعم / لا
  walks_alone: 'yes' | 'no' | ''                       // نعم / لا
  reassurance: string                                  // نص حر
  preferred_treatment: string                          // نص حر
  sleep_pattern: { answer: 'yes' | 'no' | ''; note: string }  // نعم → نص / لا
}

const INITIAL_ELDERLY: ElderlyForm = {
  name: '', age: '',
  diseases: { answer: '', note: '' },
  medications: { answer: '', note: '' },
  accepts_strangers: '',
  recognizes_family: '',
  diet: { answer: '', note: '' },
  daily_meds: { answer: '', note: '' },
  hearing_vision: '',
  breathing_wheelchair: '',
  walks_alone: '',
  reassurance: '',
  preferred_treatment: '',
  sleep_pattern: { answer: '', note: '' },
}

type Customer = {
  id: string
  full_name: string
  phone: string
  national_id: string
  email: string
  nationality?: string | null
  short_address: string
  district?: string | null
  street?: string | null
  emergency_phone: string
}

// ════════════════════════════════════════════
// الصفحة الرئيسية
// ════════════════════════════════════════════

function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const serviceKey = (params?.service as string) || ''
  const serviceInfo = SERVICE_INFO[serviceKey]

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const [selectedPackage, setSelectedPackage] = useState<string>(
    searchParams.get('package') || ''
  )
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [agreed, setAgreed] = useState(false)

  // children form
  const [childCount, setChildCount] = useState<1 | 2>(1)
  const [children, setChildren] = useState<ChildForm[]>([{ ...NEW_CHILD }])

  // elderly form
  const [elderly, setElderly] = useState<ElderlyForm>(INITIAL_ELDERLY)

  // step: 'form' | 'review' | 'paying'
  const [step, setStep] = useState<'form' | 'review'>('form')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ─── جلب بيانات العميل من /api/auth/me ───
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) {
          // غير مسجّل دخول → روح للـ auth
          const next = encodeURIComponent(`/book/${serviceKey}`)
          router.replace(`/auth?next=${next}`)
          return
        }
        if (!d.customer) {
          // مسجّل دخول لكن ما اكتمل التسجيل
          router.replace('/register?phone=' + encodeURIComponent(d.phone || ''))
          return
        }
        setCustomer(d.customer)
        setLoading(false)
      })
      .catch(() => {
        setAuthError('تعذّر الاتصال — جرّب تحديث الصفحة')
        setLoading(false)
      })
  }, [serviceKey, router])

  // ─── ضبط عدد الأطفال ───
  useEffect(() => {
    if (childCount === 1 && children.length > 1) {
      setChildren([children[0]])
    } else if (childCount === 2 && children.length < 2) {
      setChildren([children[0] || { ...NEW_CHILD }, { ...NEW_CHILD }])
    }
  }, [childCount]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── حماية: خدمة غير معروفة ───
  if (!serviceInfo) {
    return (
      <>
        <Nav />
        <section style={{ padding: '80px 24px', background: 'var(--bg)', minHeight: '60vh' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', ...card, textAlign: 'center' }}>
            <h2 style={{ fontWeight: 900, color: 'var(--dark)', marginBottom: 12 }}>الخدمة غير موجودة</h2>
            <a href="/services" style={{ color: 'var(--dark)', fontWeight: 700, textDecoration: 'underline' }}>عودة لصفحة الخدمات</a>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  // ─── شاشة تحميل ───
  if (loading) {
    return (
      <>
        <Nav />
        <section style={{ padding: '80px 24px', background: 'var(--bg)', minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ ...card, textAlign: 'center', minWidth: 280 }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>⏳</div>
            <p style={{ color: 'var(--muted)' }}>جاري تجهيز بياناتك...</p>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  if (authError) {
    return (
      <>
        <Nav />
        <section style={{ padding: '80px 24px', background: 'var(--bg)', minHeight: '60vh' }}>
          <div style={{ maxWidth: 480, margin: '0 auto', ...card, textAlign: 'center' }}>
            <h2 style={{ fontWeight: 900, color: '#e53935', marginBottom: 12 }}>{authError}</h2>
            <button onClick={() => location.reload()} style={{
              padding: '12px 24px', background: 'var(--dark)', color: '#F6F0D7',
              border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer',
            }}>إعادة المحاولة</button>
          </div>
        </section>
        <Footer />
      </>
    )
  }

  // ════════════════════════════════════════════
  // التحقق وحساب السعر
  // ════════════════════════════════════════════

  const selectedPkg = PACKAGES.find(p => p.id === selectedPackage)
  const totalPrice = selectedPkg ? selectedPkg.price * (serviceInfo.category === 'child' ? childCount : 1) : 0

  function validateChildForm(c: ChildForm): string {
    // اسم رباعي
    const nameWords = c.name.trim().split(/\s+/).filter(Boolean)
    if (nameWords.length === 0) return 'اسم الطفل مطلوب'
    if (nameWords.length !== 4) return 'اسم الطفل لازم يكون رباعي (٤ أسماء)'

    // العمر — رقم
    const age = parseInt(c.age, 10)
    if (!c.age.trim()) return 'عمر الطفل مطلوب'
    if (isNaN(age) || age < 0 || age > 17) return 'عمر الطفل غير صحيح (٠–١٧ سنة)'

    // الصحة
    if (!c.health.answer) return 'يرجى تحديد الحالة الصحية'
    if (c.health.answer === 'yes' && !c.health.note.trim()) return 'يرجى ذكر الأمراض'

    // الأدوية
    if (!c.medications.answer) return 'يرجى تحديد إن كان يستعمل أدوية'
    if (c.medications.answer === 'yes' && !c.medications.note.trim()) return 'يرجى ذكر الأدوية وطريقة استخدامها'

    // كل الحقول إلزامية
    if (!c.siblings_count.trim()) return 'يرجى إدخال عدد الإخوة'
    if (!c.lives_with) return 'يرجى تحديد مع من يعيش الطفل'
    if (!c.education_level.trim()) return 'يرجى إدخال المستوى الدراسي'
    if (!c.language_full_sentences) return 'يرجى تحديد إن كان يتحدث جمل كاملة'
    if (!c.language_words_only) return 'يرجى تحديد إن كان يتحدث كلمات فقط'
    if (!c.independence) return 'يرجى تحديد مستوى الاستقلالية'
    if (!c.instructions) return 'يرجى تحديد الالتزام بالتعليمات'
    if (!c.emotions.trim()) return 'يرجى وصف كيفية التعامل وقت الانفعال'
    if (!c.fears.trim()) return 'يرجى ذكر المخاوف والتأثر النفسي'
    if (!c.hobbies.trim()) return 'يرجى ذكر الهوايات والميول'

    return ''
  }

  function validateElderlyForm(e: ElderlyForm): string {
    // اسم رباعي
    const nameWords = e.name.trim().split(/\s+/).filter(Boolean)
    if (nameWords.length === 0) return 'اسم المستفيد مطلوب'
    if (nameWords.length !== 4) return 'اسم المستفيد لازم يكون رباعي (٤ أسماء)'

    // العمر — رقم
    const age = parseInt(e.age, 10)
    if (!e.age.trim()) return 'عمر المستفيد مطلوب'
    if (isNaN(age) || age < 18 || age > 130) return 'عمر المستفيد غير صحيح'

    // الأمراض
    if (!e.diseases.answer) return 'يرجى تحديد الأمراض المزمنة'
    if (e.diseases.answer === 'yes' && !e.diseases.note.trim()) return 'يرجى ذكر الأمراض'

    // الأدوية
    if (!e.medications.answer) return 'يرجى تحديد إن كان يستعمل أدوية'
    if (e.medications.answer === 'yes' && !e.medications.note.trim()) return 'يرجى ذكر الأدوية وآلية الاستخدام'

    // كل الأسئلة إلزامية
    if (!e.accepts_strangers)   return 'يرجى تحديد مدى تقبّل الغرباء'
    if (!e.recognizes_family)   return 'يرجى تحديد التعرف على الأهل'

    if (!e.diet.answer)         return 'يرجى تحديد النظام الغذائي'
    if (e.diet.answer === 'yes' && !e.diet.note.trim()) return 'يرجى ذكر تفاصيل النظام الغذائي'

    if (!e.daily_meds.answer)   return 'يرجى تحديد الأدوية اليومية'
    if (e.daily_meds.answer === 'yes' && !e.daily_meds.note.trim()) return 'يرجى ذكر الأدوية اليومية'

    if (!e.hearing_vision)      return 'يرجى تحديد مشاكل السمع والبصر'
    if (!e.breathing_wheelchair)return 'يرجى الإجابة عن أنبوب التنفس / الكرسي'
    if (!e.walks_alone)         return 'يرجى الإجابة عن المشي ودخول الحمام'

    if (!e.reassurance.trim())         return 'يرجى ذكر ما يطمئنه'
    if (!e.preferred_treatment.trim()) return 'يرجى ذكر الطريقة المفضلة للتعامل'

    if (!e.sleep_pattern.answer) return 'يرجى تحديد نظام النوم'
    if (e.sleep_pattern.answer === 'yes' && !e.sleep_pattern.note.trim()) return 'يرجى ذكر نظام النوم'

    return ''
  }

  function validateBeforeReview(): string {
    if (!selectedPackage) return 'يرجى اختيار باقة'
    if (!startDate) return 'يرجى تحديد تاريخ البدء'

    // التحقق من إن التاريخ ليس اليوم الحالي أو السابق
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(startDate + 'T00:00:00')
    if (selectedDate <= today) {
      return 'الحجز متاح من اليوم التالي فأكثر'
    }

    if (!startTime) return 'يرجى تحديد وقت البدء'

    if (serviceInfo.category === 'child') {
      for (let i = 0; i < children.length; i++) {
        const err = validateChildForm(children[i])
        if (err) return `الطفل ${i + 1}: ${err}`
      }
    }
    if (serviceInfo.category === 'elderly') {
      const err = validateElderlyForm(elderly)
      if (err) return err
    }
    return ''
  }

  // ════════════════════════════════════════════
  // إرسال الحجز للدفع
  // ════════════════════════════════════════════

  async function proceedToPayment() {
    setSubmitError('')
    setSubmitting(true)

    try {
      // 1. حضّر service_details
      let serviceDetails: any = null
      if (serviceInfo.category === 'child') {
        serviceDetails = { type: 'child', child_count: childCount, children }
      } else if (serviceInfo.category === 'elderly') {
        serviceDetails = { type: 'elderly', elderly }
      }

      // 2. أنشئ trackId مؤقت — السيرفر بيُعطينا الرسمي
      // (لكن نحفظ بياناتنا أولاً عشان نلتقطها بعد الدفع)

      // 3. اطلب رابط الدفع من API (السيرفر يولّد trackId)
      const endTime = startTime && selectedPkg
        ? calcEndTime(startTime, getPackageHours(selectedPackage))
        : ''
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // التسعير
          package: selectedPackage,
          quantity: serviceInfo.category === 'child' ? childCount : 1,
          // معلومات إضافية للسجل في payment_attempts
          packageLabel: selectedPkg?.label,
          serviceKey: serviceKey,
          serviceCategory: serviceInfo.category,
          customerId: customer?.id,
          phone: customer?.phone,
          fullName: customer?.full_name,
          startDate: startDate,
          startTime: startTime,
          endTime: endTime,
          childCount: serviceInfo.category === 'child' ? childCount : null,
        }),
      })
      const data = await res.json()

      if (!data.success || !data.url) {
        throw new Error(data.message || 'تعذّر فتح بوابة الدفع')
      }

      // 4. حفظ في sessionStorage بالـ trackId الرسمي من السيرفر
      const bookingData = {
        customer_id: customer!.id,
        service_key: serviceKey,
        service_category: serviceInfo.category,
        package_id: selectedPackage,
        package_label: selectedPkg!.label,
        start_date: startDate,
        start_time: startTime,
        end_time: endTime,
        child_count: serviceInfo.category === 'child' ? childCount : null,
        amount: totalPrice,
        service_details: serviceDetails,
        trackId: data.trackId,
      }
      sessionStorage.setItem('dibrah_booking', JSON.stringify(bookingData))

      // 5. حوّل لبوابة Neoleap
      window.location.href = data.url
    } catch (e: any) {
      setSubmitError(e.message || 'حدث خطأ، حاول مجدداً')
      setSubmitting(false)
    }
  }

  // ════════════════════════════════════════════
  // الواجهة
  // ════════════════════════════════════════════

  return (
    <>
      <VisitTracker page={`book-${serviceKey}`} />
      <Nav />

      {/* Hero */}
      <section style={{ padding: '40px 64px 16px', background: 'var(--bg)' }} className="b-hero">
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '2.6rem', marginBottom: 10 }}>{serviceInfo.emoji}</div>
          <h1 style={{
            fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 900,
            color: 'var(--dark)', marginBottom: 8,
            fontFamily: 'PNU, Tajawal, sans-serif',
          }}>
            حجز: {serviceInfo.title}
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '.95rem' }}>
            {step === 'form' ? 'أكمل البيانات لإتمام الحجز' : 'مراجعة الحجز قبل الدفع'}
          </p>
        </div>
      </section>

      {/* Body */}
      <section style={{ padding: '24px 64px 64px', background: 'var(--bg)' }} className="b-wrap">
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* ═══ ملخص بيانات المشترك (يظهر دائماً) ═══ */}
          <div style={card}>
            <div style={sectionTitle}>بيانات المشترك</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, fontSize: '.9rem', color: 'var(--dark)' }} className="cust-grid">
              <SummaryRow label="الاسم" value={customer!.full_name} />
              <SummaryRow label="رقم الجوال" value={customer!.phone} />
              <SummaryRow label="رقم الهوية" value={customer!.national_id} />
              <SummaryRow label="البريد" value={customer!.email} />
              {customer!.nationality && <SummaryRow label="الجنسية" value={customer!.nationality} />}
              <SummaryRow label="رقم طوارئ" value={customer!.emergency_phone} />
              <SummaryRow label="العنوان الوطني" value={customer!.short_address} />
              {customer!.district && <SummaryRow label="الحي" value={customer!.district} />}
              {customer!.street && <SummaryRow label="الشارع" value={customer!.street} />}
            </div>
            <p style={{ marginTop: 14, fontSize: '.78rem', color: 'var(--muted)' }}>
              لتعديل بياناتك:{' '}
              <a href="/my-bookings" style={{ color: 'var(--dark)', fontWeight: 700, textDecoration: 'underline' }}>
                حسابي
              </a>
            </p>
          </div>

          {step === 'form' && (
            <>
              {/* ═══ فورم الأطفال ═══ */}
              {serviceInfo.category === 'child' && (
                <>
                  <div style={card}>
                    <div style={sectionTitle}>عدد الأطفال</div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      {[1, 2].map(n => (
                        <label key={n} style={{
                          flex: 1, padding: '14px', borderRadius: 12,
                          border: '1.5px solid ' + (childCount === n ? 'var(--dark)' : 'rgba(95,97,87,.2)'),
                          background: childCount === n ? 'var(--dark)' : 'white',
                          color: childCount === n ? '#F6F0D7' : 'var(--dark)',
                          textAlign: 'center', fontWeight: 800, cursor: 'pointer', transition: 'all .2s',
                        }}>
                          <input
                            type="radio"
                            checked={childCount === n}
                            onChange={() => setChildCount(n as 1 | 2)}
                            style={{ display: 'none' }}
                          />
                          {n === 1 ? 'طفل واحد' : 'طفلان'}
                        </label>
                      ))}
                    </div>
                  </div>

                  {children.map((child, idx) => (
                    <div key={idx} style={card}>
                      <div style={sectionTitle}>
                        {childCount === 1 ? 'بيانات الطفل' : `بيانات الطفل ${idx + 1}`}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }} className="b-row">
                        <TextField
                          label="اسم الطفل"
                          value={child.name}
                          onChange={v => updateChild(idx, { ...child, name: v })}
                          required
                          placeholder=""
                          hint="اكتب الاسم رباعياً"
                        />
                        <NumberField
                          label="العمر"
                          value={child.age}
                          onChange={v => updateChild(idx, { ...child, age: v })}
                          required
                          placeholder=""
                          hint="بالسنوات"
                        />
                      </div>

                      <YesNoNote
                        question="هل يعاني من أمراض صحية أو مزمنة؟"
                        value={child.health}
                        onChange={v => updateChild(idx, { ...child, health: v })}
                        requireNoteOnYes
                        placeholderNote="اذكر الأمراض"
                      />
                      <YesNoNote
                        question="هل يستعمل أدوية؟"
                        value={child.medications}
                        onChange={v => updateChild(idx, { ...child, medications: v })}
                        requireNoteOnYes
                        placeholderNote="اذكر الأدوية وطريقة الاستخدام"
                      />

                      <NumberField
                        label="عدد الإخوة"
                        value={child.siblings_count}
                        onChange={v => updateChild(idx, { ...child, siblings_count: v })}
                        placeholder="رقم"
                      />

                      <SelectField
                        label="الطفل يعيش مع"
                        value={child.lives_with}
                        onChange={v => updateChild(idx, { ...child, lives_with: v })}
                        options={['الوالدين', 'الأم فقط', 'الأب فقط', 'غير ذلك']}
                      />

                      <TextField
                        label="المستوى الدراسي"
                        value={child.education_level}
                        onChange={v => updateChild(idx, { ...child, education_level: v })}
                        placeholder="مثال: روضة - أول ابتدائي..."
                      />

                      <div style={{ marginBottom: 16 }}>
                        <label style={labelStyle}>المهارات الأكاديمية</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }} className="skills-grid">
                          {(['letters', 'numbers', 'colors', 'shapes'] as const).map(skill => {
                            const labels: Record<typeof skill, string> = {
                              letters: 'الأحرف', numbers: 'الأرقام', colors: 'الألوان', shapes: 'الأشكال'
                            } as const
                            return (
                              <label key={skill} style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '10px 12px', borderRadius: 10,
                                border: '1.5px solid ' + (child.skills[skill] ? 'var(--dark)' : 'rgba(95,97,87,.2)'),
                                background: child.skills[skill] ? 'rgba(95,97,87,.06)' : 'white',
                                cursor: 'pointer', transition: 'all .2s',
                              }}>
                                <input
                                  type="checkbox"
                                  checked={child.skills[skill]}
                                  onChange={e => updateChild(idx, {
                                    ...child,
                                    skills: { ...child.skills, [skill]: e.target.checked }
                                  })}
                                  style={{ width: 18, height: 18, accentColor: 'var(--dark)' }}
                                />
                                <span style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--dark)' }}>{labels[skill]}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="b-row">
                        <SelectField
                          label="يتحدث جمل كاملة؟"
                          value={child.language_full_sentences}
                          onChange={v => updateChild(idx, { ...child, language_full_sentences: v as any })}
                          options={['نعم', 'لا']}
                        />
                        <SelectField
                          label="كلمات فقط؟"
                          value={child.language_words_only}
                          onChange={v => updateChild(idx, { ...child, language_words_only: v as any })}
                          options={['نعم', 'لا']}
                        />
                      </div>

                      <SelectField
                        label="هل يعتمد على نفسه في الأكل والشرب والحمام؟"
                        value={child.independence}
                        onChange={v => updateChild(idx, { ...child, independence: v as any })}
                        options={['نعم', 'لا']}
                      />

                      <SelectField
                        label="الالتزام بالتعليمات"
                        value={child.instructions}
                        onChange={v => updateChild(idx, { ...child, instructions: v })}
                        options={['يتجاوب بسرعة', 'يحتاج وقت', 'يرفض أحياناً']}
                      />

                      <TextField
                        label="الانفعالات (كيف يتم التعامل معه وقت الغضب؟)"
                        value={child.emotions}
                        onChange={v => updateChild(idx, { ...child, emotions: v })}
                        rows={2}
                      />

                      <TextField
                        label="المخاوف والتأثر النفسي"
                        value={child.fears}
                        onChange={v => updateChild(idx, { ...child, fears: v })}
                        rows={2}
                        placeholder="مثال: الخوف من الصوت العالي، الظلام..."
                      />

                      <TextField
                        label="الهوايات والميول"
                        value={child.hobbies}
                        onChange={v => updateChild(idx, { ...child, hobbies: v })}
                        rows={2}
                        placeholder="مثال: الرسم، اللعب بالمكعبات..."
                      />

                      <TextField
                        label="ملاحظات أخرى"
                        value={child.notes}
                        onChange={v => updateChild(idx, { ...child, notes: v })}
                        rows={2}
                      />
                    </div>
                  ))}
                </>
              )}

              {/* ═══ فورم كبار السن ═══ */}
              {serviceInfo.category === 'elderly' && (
                <div style={card}>
                  <div style={sectionTitle}>بيانات المستفيد</div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }} className="b-row">
                    <TextField
                      label="اسم المستفيد"
                      value={elderly.name}
                      onChange={v => setElderly({ ...elderly, name: v })}
                      required
                      hint="اكتب الاسم رباعياً"
                    />
                    <NumberField
                      label="العمر"
                      value={elderly.age}
                      onChange={v => setElderly({ ...elderly, age: v })}
                      required
                      placeholder=""
                      hint="بالسنوات"
                    />
                  </div>

                  <YesNoNote
                    question="هل يعاني من أمراض مزمنة؟"
                    value={elderly.diseases}
                    onChange={v => setElderly({ ...elderly, diseases: v })}
                    requireNoteOnYes
                    placeholderNote="اذكر الأمراض"
                  />
                  <YesNoNote
                    question="هل يستعمل أدوية؟"
                    value={elderly.medications}
                    onChange={v => setElderly({ ...elderly, medications: v })}
                    requireNoteOnYes
                    placeholderNote="اذكر الأدوية وآلية الاستخدام"
                  />

                  <ChoiceButtons
                    question="مدى تقبّل الغرباء"
                    value={elderly.accepts_strangers}
                    onChange={v => setElderly({ ...elderly, accepts_strangers: v })}
                    choices={[
                      { value: 'normal',  label: 'طبيعي' },
                      { value: 'anxious', label: 'لديه قلق' },
                    ]}
                  />

                  <SimpleYesNo
                    question="هل يستطيع التعرف على الأهل والأفراد من حوله؟"
                    value={elderly.recognizes_family}
                    onChange={v => setElderly({ ...elderly, recognizes_family: v })}
                  />

                  <YesNoNote
                    question="هل لديه نظام غذائي معين؟"
                    value={elderly.diet}
                    onChange={v => setElderly({ ...elderly, diet: v })}
                    requireNoteOnYes
                    placeholderNote="اذكر تفاصيل النظام الغذائي"
                  />

                  <YesNoNote
                    question="هل لديه أدوية يومية؟"
                    value={elderly.daily_meds}
                    onChange={v => setElderly({ ...elderly, daily_meds: v })}
                    requireNoteOnYes
                    placeholderNote="اذكر الأدوية اليومية"
                  />

                  <SimpleYesNo
                    question="هل لديه مشاكل في السمع أو البصر؟"
                    value={elderly.hearing_vision}
                    onChange={v => setElderly({ ...elderly, hearing_vision: v })}
                  />

                  <SimpleYesNo
                    question="هل يستخدم أنبوب تنفس أو كرسي متحرك؟"
                    value={elderly.breathing_wheelchair}
                    onChange={v => setElderly({ ...elderly, breathing_wheelchair: v })}
                  />

                  <SimpleYesNo
                    question="هل يستطيع المشي وحده ودخول دورة المياه؟"
                    value={elderly.walks_alone}
                    onChange={v => setElderly({ ...elderly, walks_alone: v })}
                  />

                  <TextField
                    label="ما الأشياء التي تشعره بالاطمئنان؟"
                    value={elderly.reassurance}
                    onChange={v => setElderly({ ...elderly, reassurance: v })}
                    required
                    rows={2}
                  />

                  <TextField
                    label="هل توجد طريقة خاصة يفضل التعامل معه بها؟"
                    value={elderly.preferred_treatment}
                    onChange={v => setElderly({ ...elderly, preferred_treatment: v })}
                    required
                    rows={2}
                  />

                  <YesNoNote
                    question="هل لديه نظام نوم معين؟"
                    value={elderly.sleep_pattern}
                    onChange={v => setElderly({ ...elderly, sleep_pattern: v })}
                    requireNoteOnYes
                    placeholderNote="اذكر تفاصيل نظام النوم"
                  />
                </div>
              )}

              {/* ═══ اختيار الباقة ═══ */}
              <div style={card}>
                <div style={sectionTitle}>اختر الباقة</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }} className="pkg-grid">
                  {PACKAGES.map(p => {
                    const selected = selectedPackage === p.id
                    return (
                      <label key={p.id} style={{
                        padding: '18px 16px', borderRadius: 14, cursor: 'pointer',
                        border: '2px solid ' + (selected ? 'var(--dark)' : 'rgba(95,97,87,.15)'),
                        background: selected ? 'var(--dark)' : 'white',
                        color: selected ? '#F6F0D7' : 'var(--dark)',
                        transition: 'all .2s', display: 'block',
                      }}>
                        <input type="radio" checked={selected} onChange={() => setSelectedPackage(p.id)} style={{ display: 'none' }} />
                        <div style={{ fontSize: '.9rem', fontWeight: 700, marginBottom: 4 }}>{p.label}</div>
                        <div style={{ fontSize: '.72rem', opacity: .75, marginBottom: 10 }}>{p.duration}</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 900, fontFamily: 'PNU, Tajawal, sans-serif' }}>
                          {p.price.toLocaleString('ar-SA')} <span style={{ fontSize: '.75rem' }}>ريال</span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* ═══ تاريخ ووقت البدء ═══ */}
              <div style={card}>
                <div style={sectionTitle}>تاريخ ووقت البدء</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="b-row">
                  <div>
                    <label style={labelStyle}>التاريخ <span style={requiredStar}>*</span></label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                      style={{ ...inputBase, direction: 'ltr', textAlign: 'center' }}
                    />
                    <div style={{ color: 'var(--muted)', fontSize: '.72rem', marginTop: 4, fontWeight: 500 }}>
                      الحجز متاح من اليوم التالي فأكثر
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>الساعة <span style={requiredStar}>*</span></label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      style={{ ...inputBase, direction: 'ltr', textAlign: 'center' }}
                    />
                  </div>
                </div>

                {/* عرض وقت الانتهاء تلقائياً */}
                {startTime && selectedPkg && (
                  <div style={{
                    marginTop: 14, padding: '10px 14px',
                    background: 'rgba(95,97,87,.06)', borderRadius: 10,
                    fontSize: '.88rem', color: 'var(--dark)', fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    ⏱️ ينتهي الساعة: <strong>{calcEndTime(startTime, getPackageHours(selectedPackage))}</strong>
                    {' '}(حسب باقة <strong>{selectedPkg.label}</strong>)
                  </div>
                )}
              </div>

              {/* ═══ زر المتابعة ═══ */}
              {submitError && (
                <div style={{
                  background: '#fde8e8', color: '#c0392b',
                  borderRadius: 10, padding: 14, marginBottom: 14,
                  fontWeight: 700, fontSize: '.9rem', textAlign: 'center',
                }}>
                  ⚠️ {submitError}
                </div>
              )}

              <button
                onClick={() => {
                  const err = validateBeforeReview()
                  if (err) {
                    setSubmitError(err)
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                    return
                  }
                  setSubmitError('')
                  setStep('review')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                style={{
                  width: '100%', padding: 16, fontSize: '1rem', fontWeight: 800,
                  background: 'var(--dark)', color: '#F6F0D7',
                  border: 'none', borderRadius: 12, cursor: 'pointer',
                }}
              >
                مراجعة الطلب ←
              </button>
            </>
          )}

          {/* ═══ شاشة المراجعة ═══ */}
          {step === 'review' && (
            <div style={card}>
              <div style={sectionTitle}>مراجعة الطلب</div>

              <ReviewRow label="الخدمة" value={serviceInfo.title} />
              <ReviewRow label="الباقة" value={selectedPkg?.label || '—'} />
              <ReviewRow label="تاريخ البدء" value={startDate} />
              <ReviewRow label="وقت البدء" value={displayTime(startTime)} />
              {startTime && selectedPkg && (
                <ReviewRow label="وقت الانتهاء" value={calcEndTime(startTime, getPackageHours(selectedPackage))} />
              )}

              {serviceInfo.category === 'child' && (
                <>
                  <ReviewRow label="عدد الأطفال" value={String(childCount)} />
                  {children.map((c, i) => (
                    <ReviewRow key={i} label={`الطفل ${i + 1}`} value={`${c.name} (${c.age} سنة)`} />
                  ))}
                </>
              )}
              {serviceInfo.category === 'elderly' && (
                <ReviewRow label="المستفيد" value={`${elderly.name} (${elderly.age} سنة)`} />
              )}

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '20px 0 4px', borderTop: '2px solid rgba(201,168,76,.3)',
                marginTop: 16,
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)' }}>الإجمالي</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>
                  {totalPrice.toLocaleString('ar-SA')} ريال
                </div>
              </div>

              {serviceInfo.category === 'medical' && (
                <div style={{
                  background: 'white', borderRadius: 14, padding: 20,
                  marginTop: 18, fontSize: '.88rem', color: 'var(--dark)',
                  border: '1px solid rgba(95,97,87,.15)',
                  boxShadow: '0 2px 8px rgba(95,97,87,.04)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    marginBottom: 12, paddingBottom: 14,
                    borderBottom: '1px solid rgba(95,97,87,.1)',
                  }}>
                    <img
                      src="/images/care-medical-logo.webp"
                      alt="رعاية الطبية"
                      style={{ height: 40, width: 'auto', objectFit: 'contain' }}
                    />
                    <div style={{ textAlign: 'right', flex: 1 }}>
                      <div style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 600 }}>
                        مزوّد الخدمة
                      </div>
                      <div style={{ fontSize: '.92rem', fontWeight: 800, color: 'var(--dark)' }}>
                        مستشفى رعاية الطبية
                      </div>
                    </div>
                  </div>
                  <div style={{ lineHeight: 1.85, fontSize: '.85rem' }}>
                    <strong>تذكير:</strong> هذه الخدمة مقدّمة من <strong>مستشفى رعاية الطبية</strong>.
                    {' '}بعد إتمام الدفع، سيتواصل معك فريق المستشفى خلال ٢٤ ساعة.
                  </div>
                </div>
              )}

              {submitError && (
                <div style={{
                  background: '#fde8e8', color: '#c0392b', marginTop: 16,
                  borderRadius: 10, padding: 12, fontWeight: 700, fontSize: '.9rem',
                }}>⚠️ {submitError}</div>
              )}

              {/* ═══ شعارات وسائل الدفع ═══ */}
              <div style={{
                marginTop: 22, padding: '18px 14px',
                background: '#fafaf5', borderRadius: 12,
                border: '1px solid rgba(95,97,87,.1)',
              }}>
                <div style={{
                  fontSize: '.78rem', color: 'var(--muted)',
                  fontWeight: 600, marginBottom: 12, textAlign: 'center',
                }}>
                  وسائل الدفع المقبولة
                </div>
                <div style={{
                  display: 'flex', gap: 14, justifyContent: 'center',
                  alignItems: 'center', flexWrap: 'wrap',
                }}>
                  <img src="/images/mada.svg"       alt="مدى"        style={payIcon} />
                  <img src="/images/visa.png"        alt="Visa"       style={payIcon} />
                  <img src="/images/mastercard.png"  alt="Mastercard" style={payIcon} />
                  <img src="/images/applepay.png"    alt="Apple Pay"  style={payIcon} />
                </div>
                <div style={{
                  marginTop: 14, paddingTop: 12,
                  borderTop: '1px dashed rgba(95,97,87,.15)',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '.72rem', color: 'var(--muted)', fontWeight: 600, marginBottom: 8 }}>
                    قريباً — تقسيط بدون فوائد
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', opacity: .55 }}>
                    <img src="/images/tabby.webp"  alt="تابي"  style={{ ...payIcon, filter: 'grayscale(40%)' }} />
                    <img src="/images/tamara.jpeg" alt="تمارا" style={{ ...payIcon, filter: 'grayscale(40%)' }} />
                  </div>
                </div>
              </div>

              {/* ═══ إقرار قبل الدفع ═══ */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                marginTop: 18, padding: 14, cursor: 'pointer',
                background: agreed ? 'rgba(95,97,87,.05)' : 'white',
                border: '1.5px solid ' + (agreed ? 'var(--dark)' : 'rgba(95,97,87,.2)'),
                borderRadius: 10, transition: 'all .2s',
              }}>
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ width: 20, height: 20, accentColor: 'var(--dark)', marginTop: 2, flexShrink: 0 }}
                />
                <span style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--dark)', lineHeight: 1.7 }}>
                  أُقرّ بصحة جميع البيانات المُدخلة، وأوافق على{' '}
                  <a href="/terms" target="_blank" style={{ color: 'var(--dark)', textDecoration: 'underline', fontWeight: 700 }}>الشروط والأحكام</a>
                  {' '}و{' '}
                  <a href="/privacy" target="_blank" style={{ color: 'var(--dark)', textDecoration: 'underline', fontWeight: 700 }}>سياسة الخصوصية</a>
                  {' '}الخاصة بمنصة دِبرة.
                </span>
              </label>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => setStep('form')}
                  disabled={submitting}
                  style={{
                    flex: 1, padding: 14, fontWeight: 700,
                    background: 'transparent', color: 'var(--dark)',
                    border: '1.5px solid var(--dark)', borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  تعديل
                </button>
                <button
                  onClick={proceedToPayment}
                  disabled={submitting || !agreed}
                  style={{
                    flex: 2, padding: 14, fontWeight: 800,
                    background: agreed ? 'var(--dark)' : '#aaa',
                    color: '#F6F0D7',
                    border: 'none', borderRadius: 10,
                    cursor: submitting ? 'wait' : (agreed ? 'pointer' : 'not-allowed'),
                    opacity: submitting ? .7 : 1,
                  }}
                >
                  {submitting ? '...جارٍ التحويل للدفع' : `الدفع ${totalPrice.toLocaleString('ar-SA')} ريال`}
                </button>
              </div>
            </div>
          )}

        </div>
      </section>

      <style>{`
        @media (max-width: 800px) {
          .b-hero, .b-wrap { padding-left: 20px !important; padding-right: 20px !important; }
          .cust-grid, .b-row { grid-template-columns: 1fr !important; }
          .skills-grid { grid-template-columns: 1fr !important; }
          .pkg-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <Footer />
      <WhatsApp />
    </>
  )

  // helper
  function updateChild(idx: number, child: ChildForm) {
    setChildren(prev => prev.map((c, i) => i === idx ? child : c))
  }
}

// ════════════════════════════════════════════
// مكوّن مساعد
// ════════════════════════════════════════════

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '.7rem', color: 'var(--muted)', marginBottom: 3, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--dark)' }}>{value}</div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(95,97,87,.08)' }}>
      <div style={{ fontSize: '.85rem', color: 'var(--muted)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '.9rem', fontWeight: 700, color: 'var(--dark)' }}>{value}</div>
    </div>
  )
}

// ════════════════════════════════════════════
// التصدير
// ════════════════════════════════════════════

export default function Page() {
  return (
    <Suspense fallback={null}>
      <BookingPage />
    </Suspense>
  )
}
