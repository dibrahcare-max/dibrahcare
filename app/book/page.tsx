'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

const PACKAGES = {
  daily_4:   { type: 'daily',   name: 'يومي',    hours: 4,  price: 350   },
  daily_8:   { type: 'daily',   name: 'يومي',    hours: 8,  price: 700   },
  weekly_4:  { type: 'weekly',  name: 'أسبوعي',  hours: 4,  price: 1750  },
  weekly_8:  { type: 'weekly',  name: 'أسبوعي',  hours: 8,  price: 3500  },
  monthly_4: { type: 'monthly', name: 'شهري',    hours: 4,  price: 8000  },
  monthly_8: { type: 'monthly', name: 'شهري',    hours: 8,  price: 16000 },
}
type PackageKey = keyof typeof PACKAGES
const TYPE_LABELS: Record<string,string> = { daily:'يومي', weekly:'أسبوعي', monthly:'شهري' }
const HOURS_BY_TYPE: Record<string,PackageKey[]> = {
  daily:['daily_4','daily_8'], weekly:['weekly_4','weekly_8'], monthly:['monthly_4','monthly_8']
}

const RELATIONS = ['أب','أم','أخ','أخت','ابن','ابنة','جد','جدة','عم','عمة','خال','خالة','أخرى']

const inp: React.CSSProperties = {
  width:'100%', padding:'11px 14px', border:'1.5px solid rgba(95,97,87,.2)',
  borderRadius:10, fontFamily:'inherit', fontSize:'.95rem', color:'var(--dark)',
  background:'var(--bg)', outline:'none', direction:'rtl',
}
const row: React.CSSProperties = { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:4 }
const card: React.CSSProperties = {
  background:'white', borderRadius:20, padding:'28px 32px',
  border:'1px solid rgba(95,97,87,.15)', marginBottom:20,
}
const cardTitle: React.CSSProperties = {
  fontSize:'1rem', fontWeight:800, color:'var(--dark)',
  borderBottom:'2px solid var(--dark)', paddingBottom:12, marginBottom:24,
}

function Field({ label, children, error }: { label:string, children:React.ReactNode, error?:string }) {
  return (
    <div style={{ marginBottom:16 }}>
      <label style={{ display:'block', fontSize:'.85rem', fontWeight:700, color:'var(--dark)', marginBottom:6 }}>
        {label} <span style={{ color:'#e53935' }}>*</span>
      </label>
      {children}
      {error && <div style={{ color:'#e53935', fontSize:'.78rem', marginTop:4 }}>{error}</div>}
    </div>
  )
}

// حساب وقت الانتهاء
function to12h(h: number, m: number): string {
  const period = h >= 12 ? 'مساءً' : 'صباحاً'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2,'0')} ${period}`
}

function calcEndTime(startTime: string, hours: number): string {
  if (!startTime) return ''
  const [h, m] = startTime.split(':').map(Number)
  const total = h * 60 + m + hours * 60
  const eh = Math.floor(total / 60) % 24
  const em = total % 60
  return to12h(eh, em)
}

function displayTime(time: string): string {
  if (!time) return ''
  const [h, m] = time.split(':').map(Number)
  return to12h(h, m)
}

// تاريخ الغد كحد أدنى
function getTomorrow(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

function BookingContent() {
  const searchParams = useSearchParams()
  const serviceFromUrl = searchParams.get('service') || ''
  const phoneFromUrl = searchParams.get('phone') || ''

  const [step, setStep] = useState('form')
  const [otpPhone, setOtpPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpToken, setOtpToken] = useState('')
  const [otpTs, setOtpTs] = useState<number>(0)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError]     = useState('')
  const [selectedService, setSelectedService] = useState(serviceFromUrl)

  useEffect(() => {
    // WhatsApp OTP - no Supabase session needed
  }, [])

  useEffect(() => { if (serviceFromUrl) setSelectedService(serviceFromUrl) }, [serviceFromUrl])

  const sendOtp = () => {
    if (!otpPhone) { setOtpError('أدخل رقم جوالك'); return }
    if (!/^05\d{8}$/.test(otpPhone)) { setOtpError('رقم الجوال غير صحيح'); return }
    localStorage.setItem('dibrah_verified_phone', otpPhone)
    setStep('form')
    setForm(f => ({ ...f, subscriber_phone: otpPhone }))
  }



  const [beneficiaryCount, setBeneficiaryCount] = useState(1)
  const [beneficiaries, setBeneficiaries] = useState<{name:string,age:string}[]>([{name:'',age:''}])
  const [agreed, setAgreed] = useState(false)
  const [form, setForm] = useState({
    subscriber_name:'', subscriber_id:'', subscriber_nationality:'',
    subscriber_phone: phoneFromUrl, subscriber_email:'', subscriber_address:'',
    beneficiary_name:'', beneficiary_age:'', beneficiary_relation:'',
    emergency_phone:'', start_date:'', start_time:'',
  })

  // جلب بيانات العميل المسجّل
  // إذا phone من URL موجود → نستخدمه.
  // إذا لا → نجلبه من الـ session (auto-redirect من /auth)
  useEffect(() => {
    const loadCustomerData = async () => {
      // 1. حدد الرقم: من URL أو من session
      let phone = phoneFromUrl
      if (!phone) {
        try {
          const meRes = await fetch('/api/auth/me')
          const meData = await meRes.json()
          if (meData.authenticated && meData.phone) phone = meData.phone
        } catch {}
      }
      if (!phone) return

      // 2. حوّل الرقم من 966XXXXXXXXX إلى 05XXXXXXXX للعرض في الحقول
      const displayPhone = phone.startsWith('966') ? '0' + phone.slice(3) : phone

      // 3. اعبّي الرقم فوراً (حتى قبل ما يوصل الريجستريشن)
      setForm(f => ({ ...f, subscriber_phone: displayPhone }))

      // 4. اجلب بقية البيانات من registrations
      try {
        const res = await fetch('/api/get-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        })
        const j = await res.json()
        if (j.success && j.data) {
          const d = j.data
          // طبّع أرقام الهاتف القادمة من DB للعرض
          const normForDisplay = (p: string) =>
            p?.startsWith('966') ? '0' + p.slice(3) : (p || '')

          setForm(f => ({
            ...f,
            subscriber_name:        d.subscriber_name || '',
            subscriber_id:          d.subscriber_id || '',
            subscriber_phone:       normForDisplay(d.subscriber_phone) || displayPhone,
            subscriber_nationality: d.subscriber_nationality || '',
            subscriber_address:     d.subscriber_address || '',
            emergency_phone:        normForDisplay(d.emergency_phone),
          }))
        }
      } catch {}
    }
    loadCustomerData()
  }, [phoneFromUrl])

  const updateBeneficiary = (i: number, field: 'name'|'age', val: string) => {
    setBeneficiaries(prev => {
      const arr = [...prev]
      arr[i] = { ...arr[i], [field]: val }
      return arr
    })
    if (i === 0) {
      if (field === 'name') setForm(f => ({ ...f, beneficiary_name: val }))
      if (field === 'age') setForm(f => ({ ...f, beneficiary_age: val }))
    }
  }

  const handleCountChange = (count: number) => {
    setBeneficiaryCount(count)
    setBeneficiaries(prev => {
      const arr = [...prev]
      while (arr.length < count) arr.push({ name: '', age: '' })
      return arr.slice(0, count)
    })
  }

  // حساب السعر الإجمالي مع الأطفال الإضافيين
  const priceMult = beneficiaryCount <= 2 ? 1 : beneficiaryCount - 1
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({})
  const [packageType, setPackageType] = useState('')
  const [selectedPkg, setSelectedPkg] = useState<PackageKey|''>('')
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k:string, v:string) => {
    setForm(f => ({ ...f, [k]: v }))
    setFieldErrors(e => ({ ...e, [k]: '' }))
  }

  const availableHours = packageType ? HOURS_BY_TYPE[packageType]||[] : []
  const selectedPrice  = selectedPkg ? PACKAGES[selectedPkg].price * priceMult : 0
  const selectedHours  = selectedPkg ? PACKAGES[selectedPkg].hours : 0
  const endTime        = calcEndTime(form.start_time, selectedHours)

  // تحديد الموقع تلقائياً
  const detectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude, longitude } = pos.coords
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ar`)
        const data = await res.json()
        const addr = data.display_name || `${latitude}, ${longitude}`
        set('subscriber_address', addr)
      } catch {
        set('subscriber_address', `${latitude}, ${longitude}`)
      }
    })
  }

  // التحقق من الحقول
  const validateField = (k: string, v: string): string => {
    switch(k) {
      case 'subscriber_name':
      case 'beneficiary_name':
        return v.trim().split(/\s+/).filter(Boolean).length < 4 ? 'يجب إدخال 4 أسماء على الأقل' : ''
      case 'subscriber_id':
        return !/^\d{10}$/.test(v) ? 'رقم الهوية يجب أن يكون 10 أرقام' : ''
      case 'subscriber_nationality':
        return v.trim().length < 3 ? 'الجنسية يجب أن تكون 3 أحرف على الأقل' : ''
      case 'subscriber_phone':
      case 'emergency_phone':
        return !/^05\d{8}$/.test(v) ? 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام' : ''
      case 'subscriber_email':
        return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'صيغة البريد الإلكتروني غير صحيحة' : ''
      case 'beneficiary_age':
        return !/^\d+$/.test(v) || Number(v) < 1 ? 'أدخل عمراً صحيحاً' : ''
      default:
        return v.trim() ? '' : 'هذا الحقل مطلوب'
    }
  }

  const validate = () => {
    const isMedical = selectedService === 'الرعاية الطبية المنزلية ورعاية المرضى'

    // الحقول الأساسية (المشترك) - دائماً مطلوبة
    const baseFields = [
      'subscriber_name','subscriber_id','subscriber_nationality','subscriber_phone',
      'subscriber_email','subscriber_address','emergency_phone','start_date','start_time'
    ]

    // حقول المستفيد - تُطلب فقط لغير الخدمات الطبية
    const beneficiaryFields = isMedical
      ? []
      : ['beneficiary_name','beneficiary_age','beneficiary_relation']

    const fields = [...baseFields, ...beneficiaryFields]
    const errs: Record<string,string> = {}
    let valid = true
    fields.forEach(k => {
      const e = validateField(k, form[k as keyof typeof form])
      if (e) { errs[k] = e; valid = false }
    })
    setFieldErrors(errs)

    // التحقق من اختيار الخدمة
    if (!selectedService) {
      setError('الرجاء اختيار نوع الخدمة')
      valid = false
    }
    // التحقق من اختيار الباقة
    if (!selectedPkg) {
      setError('الرجاء اختيار نوع الاشتراك وعدد الساعات')
      valid = false
    }
    return valid
  }

  const submit = async () => {
    setError('')
    if (!agreed) { setError('يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية'); return }
    if (!validate()) {
      if (!error) setError('يرجى تعبئة جميع الحقول بالصيغة الصحيحة')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/payment', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ package:selectedPkg, service: selectedService, ...form }),
      })
      const data = await res.json()
      if (data.success && data.url) {
        sessionStorage.setItem('dibrah_booking', JSON.stringify({ package: selectedPkg, service: selectedService, ...form, beneficiaries, beneficiaryCount, totalPrice: selectedPrice }))
        window.location.href = data.url
      } else setError(data.message||'حدث خطأ، حاول مرة أخرى')
    } catch { setError('حدث خطأ في الاتصال') }
    finally { setLoading(false) }
  }

  return (
    <>
      <Nav />
      <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
        <div style={{ maxWidth:720, margin:'0 auto', padding:'48px 24px 80px' }}>

          <div style={{ textAlign:'center', marginBottom:40 }}>
            <span style={{ fontSize:'3rem', fontWeight:900, color:'#777C6D', display:'block', marginBottom:8 }}>دِبرة تدبرك</span>
            <h1 style={{ fontSize:'clamp(1.8rem,3.5vw,2.8rem)', fontWeight:900, color:'var(--dark)' }}>احجز الآن</h1>
          </div>

          {/* خطوة الإيميل */}
          {step === 'phone' && (
            <div style={{ ...card, maxWidth:480, margin:'0 auto 40px', textAlign:'center' }}>
              <h2 style={cardTitle}>التحقق عبر واتساب</h2>
              <p style={{ fontSize:'.9rem', color:'var(--muted)', marginBottom:24 }}>أدخل رقم جوالك وسنرسل كود التحقق عبر واتساب</p>
              <Field label="رقم الجوال">
                <input style={inp} type="tel" placeholder="05XXXXXXXX" value={otpPhone} onChange={e=>setOtpPhone(e.target.value)} onKeyDown={e=>e.key==='Enter'&&sendOtp()}/>
              </Field>
              {otpError && <div style={{ color:'#b91c1c', fontSize:'.88rem', marginBottom:12 }}>{otpError}</div>}
              <button onClick={sendOtp} disabled={otpLoading} style={{ width:'100%', padding:'14px', background:otpLoading?'#9ca3af':'var(--dark)', color:'white', border:'none', borderRadius:10, fontFamily:'inherit', fontSize:'1rem', fontWeight:800, cursor:otpLoading?'not-allowed':'pointer' }}>
                {otpLoading ? 'جاري الإرسال...' : 'أرسل كود التحقق'}
              </button>
              <p style={{ marginTop:16, fontSize:'.82rem', color:'var(--muted)' }}>ما عندك حساب؟ سيُنشأ تلقائياً 🙂</p>
            </div>
          )}


          {step === 'form' && (<>

          {/* اختيار الخدمة */}
          <div style={card}>
            <h2 style={cardTitle}>اختر الخدمة</h2>
            <Field label="نوع الخدمة">
              <select style={inp} value={selectedService} onChange={e => setSelectedService(e.target.value)}>
                <option value="">— اختر الخدمة —</option>
                {[
                  'الرعاية الطبية المنزلية ورعاية المرضى',
                  'حضانة الأطفال داخل المنزل',
                  'رعاية كبار السن',
                  'خدمة المرافقة الآمنة',
                  'خدماتنا بالسفر',
                  'خدماتنا المميزة للعروس',
                  'برامج وأنشطة خارجية',
                  'ربعيات / مدبرة منزل',
                  'مرافقات',
                ].map(svc => <option key={svc} value={svc}>{svc}</option>)}
              </select>
            </Field>

            {/* تنبيه الرعاية الطبية المنزلية */}
            {selectedService === 'الرعاية الطبية المنزلية ورعاية المرضى' && (
              <div style={{
                marginTop: 14,
                padding: '14px 16px',
                background: '#F0FDF4',
                border: '1.5px solid #22c55e',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}>
                <img
                  src="/images/care-medical-logo.webp"
                  alt="مستشفى الرعاية الطبية"
                  style={{ height: 52, width: 'auto', objectFit: 'contain', flexShrink: 0 }}
                />
                <div style={{ flex: 1, lineHeight: 1.7 }}>
                  <div style={{ fontWeight: 800, color: '#0F5132', fontSize: '.95rem', marginBottom: 4 }}>
                    مزوّد الرعاية الطبية المنزلية
                  </div>
                  <div style={{ fontSize: '.82rem', color: '#155724' }}>
                    سيتم التواصل معك من قبل <strong>مستشفى الرعاية الطبية</strong> — مقدّم هذه الخدمة.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* معلومات المشترك */}
          <div style={card}>
            <h2 style={cardTitle}>معلومات المشترك</h2>
            <div style={row}>
              <Field label="الاسم الرباعي" error={fieldErrors.subscriber_name}>
                <input style={inp} type="text" placeholder="الاسم الأول الثاني الثالث الرابع" value={form.subscriber_name} onChange={e=>set('subscriber_name',e.target.value)} onBlur={e=>setFieldErrors(f=>({...f,subscriber_name:validateField('subscriber_name',e.target.value)}))}/>
              </Field>
              <Field label="رقم الهوية الوطنية" error={fieldErrors.subscriber_id}>
                <input style={inp} type="text" placeholder="10 أرقام" maxLength={10} value={form.subscriber_id} onChange={e=>set('subscriber_id',e.target.value.replace(/\D/g,''))} onBlur={e=>setFieldErrors(f=>({...f,subscriber_id:validateField('subscriber_id',e.target.value)}))}/>
              </Field>
            </div>
            <div style={row}>
              <Field label="الجنسية" error={fieldErrors.subscriber_nationality}>
                <input style={inp} type="text" placeholder="مثال: سعودي" value={form.subscriber_nationality} onChange={e=>set('subscriber_nationality',e.target.value)} onBlur={e=>setFieldErrors(f=>({...f,subscriber_nationality:validateField('subscriber_nationality',e.target.value)}))}/>
              </Field>
              <Field label="رقم الجوال" error={fieldErrors.subscriber_phone}>
                <input
                  style={inp} type="tel" placeholder="05XXXXXXXX" maxLength={10}
                  value={form.subscriber_phone}
                  onChange={e=>set('subscriber_phone',e.target.value.replace(/\D/g,''))}
                  onBlur={async e => {
                    const phoneVal = e.target.value.trim()
                    setFieldErrors(f=>({...f, subscriber_phone: validateField('subscriber_phone', phoneVal)}))

                    // لو رقم صالح، جرّب تجلب بياناته من السيرفر
                    if (/^05\d{8}$/.test(phoneVal)) {
                      try {
                        const res = await fetch('/api/get-registration', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ phone: phoneVal }),
                        })
                        const j = await res.json()
                        if (j.success && j.data) {
                          const d = j.data
                          const normForDisplay = (p: string) =>
                            p?.startsWith('966') ? '0' + p.slice(3) : (p || '')

                          setForm(f => ({
                            ...f,
                            subscriber_name:        d.subscriber_name || f.subscriber_name,
                            subscriber_id:          d.subscriber_id || f.subscriber_id,
                            subscriber_nationality: d.subscriber_nationality || f.subscriber_nationality,
                            subscriber_address:     d.subscriber_address || f.subscriber_address,
                            emergency_phone:        normForDisplay(d.emergency_phone) || f.emergency_phone,
                          }))
                        }
                      } catch {}
                    }
                  }}
                />
              </Field>
            </div>
            <div style={row}>
              <Field label="البريد الإلكتروني" error={fieldErrors.subscriber_email}>
                <input style={inp} type="email" placeholder="example@email.com" value={form.subscriber_email} onChange={e=>set('subscriber_email',e.target.value)} onBlur={e=>setFieldErrors(f=>({...f,subscriber_email:validateField('subscriber_email',e.target.value)}))}/>
              </Field>
              <Field label="العنوان" error={fieldErrors.subscriber_address}>
                <div style={{ display:'flex', gap:8 }}>
                  <input style={{ ...inp, flex:1 }} type="text" placeholder="الحي، الشارع، المدينة" value={form.subscriber_address} onChange={e=>set('subscriber_address',e.target.value)} onBlur={e=>setFieldErrors(f=>({...f,subscriber_address:validateField('subscriber_address',e.target.value)}))}/>
                  <button onClick={detectLocation} title="تحديد الموقع تلقائياً" style={{ padding:'0 12px', background:'var(--dark)', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontSize:'1rem', flexShrink:0 }}>📍</button>
                </div>
              </Field>
            </div>
          </div>

          {/* معلومات المستفيد - تخفى لو اختار الرعاية الطبية */}
          {selectedService !== 'الرعاية الطبية المنزلية ورعاية المرضى' && (
          <div style={card}>
            <h2 style={cardTitle}>معلومات المستفيد</h2>

            {/* عدد المستفيدين */}
            <Field label="عدد المستفيدين">
              <select style={inp} value={beneficiaryCount} onChange={e=>handleCountChange(Number(e.target.value))}>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>



            {/* بيانات كل مستفيد */}
            {beneficiaries.map((b, i) => (
              <div key={i}>
                {i === 1 && beneficiaries.length === 2 && (
                  <div style={{ background:'#f0fdf4', border:'1px solid #86efac', borderRadius:8, padding:'8px 14px', marginBottom:8, fontSize:'.85rem', color:'#16a34a', fontWeight:700 }}>
                    🎁 الطفل الثاني مجاني
                  </div>
                )}
              <div style={{ border:'1px solid rgba(95,97,87,.12)', borderRadius:12, padding:'16px 20px', marginBottom:12, background: i === 0 ? 'white' : '#fafafa' }}>
                <div style={{ fontSize:'.78rem', fontWeight:800, color:'#777C6D', marginBottom:12, letterSpacing:'.05em' }}>
                  المستفيد {i+1}
                </div>
                <div style={row}>
                  <Field label="الاسم الرباعي" error={i===0 ? fieldErrors.beneficiary_name : undefined}>
                    <input style={inp} type="text" placeholder="الاسم الأول الثاني الثالث الرابع"
                      value={b.name}
                      onChange={e=>updateBeneficiary(i,'name',e.target.value)}
                      onBlur={e=>{ if(i===0) setFieldErrors(f=>({...f,beneficiary_name:validateField('beneficiary_name',e.target.value)})) }}
                    />
                  </Field>
                  <Field label="العمر">
                    <input style={inp} type="text" placeholder="مثال: 5" maxLength={3}
                      value={b.age}
                      onChange={e=>updateBeneficiary(i,'age',e.target.value.replace(/\D/g,''))}
                    />
                  </Field>
                </div>
              </div>
              </div>
            ))}

            <div style={row}>
              <Field label="صلة القرابة" error={fieldErrors.beneficiary_relation}>
                <select style={inp} value={form.beneficiary_relation} onChange={e=>set('beneficiary_relation',e.target.value)}>
                  <option value="">-- اختر صلة القرابة --</option>
                  {RELATIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="رقم الطوارئ" error={fieldErrors.emergency_phone}>
                <input style={inp} type="tel" placeholder="05XXXXXXXX" maxLength={10} value={form.emergency_phone} onChange={e=>set('emergency_phone',e.target.value.replace(/\D/g,''))} onBlur={e=>setFieldErrors(f=>({...f,emergency_phone:validateField('emergency_phone',e.target.value)}))}/>
              </Field>
            </div>
          </div>
          )}

          {/* الباقة */}
          <div style={card}>
            <h2 style={cardTitle}>اختر الباقة</h2>
            <div style={row}>
              <Field label="نوع الاشتراك">
                <select style={inp} value={packageType} onChange={e=>{ setPackageType(e.target.value); setSelectedPkg('') }}>
                  <option value="">-- اختر نوع الاشتراك --</option>
                  {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="عدد الساعات">
                <select style={{ ...inp, opacity:!packageType ? .5 : 1 }} value={selectedPkg} onChange={e=>setSelectedPkg(e.target.value as PackageKey)} disabled={!packageType}>
                  <option value="">-- اختر عدد الساعات --</option>
                  {availableHours.map(key=>(
                    <option key={key} value={key}>{PACKAGES[key].hours} ساعات — {PACKAGES[key].price.toLocaleString('ar-SA')} ﷼</option>
                  ))}
                </select>
              </Field>
            </div>
            <div style={row}>
              <Field label="تاريخ بدء الاشتراك" error={fieldErrors.start_date}>
                <input style={inp} type="date" min={getTomorrow()} value={form.start_date} onChange={e => {
                  const picked = e.target.value
                  const tomorrow = getTomorrow()
                  if (picked && picked < tomorrow) {
                    alert('عذراً — لا يمكن اختيار اليوم الحالي أو تاريخ سابق. الرجاء اختيار يوم الغد فأبعد.')
                    set('start_date', '')
                    return
                  }
                  set('start_date', picked)
                }}/>
              </Field>
              <div>
                <Field label="ساعة البدء" error={fieldErrors.start_time}>
                  <input style={inp} type="time" value={form.start_time} onChange={e=>set('start_time',e.target.value)}/>
                </Field>
                {endTime && (
                  <div style={{ fontSize:'.82rem', color:'var(--muted)', marginTop:-8, marginBottom:16 }}>
                    ⏰ {form.start_time && displayTime(form.start_time)} ← {endTime}
                  </div>
                )}
              </div>
            </div>

            {selectedPkg && (
              <div style={{ background:'var(--dark)', color:'white', borderRadius:12, padding:'18px 24px', textAlign:'center', margin:'20px 0 4px' }}>
                <div style={{ fontSize:'.85rem', opacity:.7, marginBottom:4 }}>المبلغ الإجمالي</div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap: 8, direction:'ltr' }}>
                  <img src="/images/sar.webp" alt="ر.س" style={{ width: 18, height: 18, objectFit: "contain", filter: "brightness(10)", opacity: 0.85, flexShrink: 0 }} />
                  <span style={{ fontSize:'2rem', fontWeight:900, color:'#F6F0D7' }}>{selectedPrice.toLocaleString('ar-SA')}</span>
                </div>
                {priceMult > 1 && (
                  <div style={{ fontSize:'.8rem', opacity:.65, borderTop:'1px solid rgba(255,255,255,.15)', paddingTop:8, marginTop:4 }}>
                    {selectedPkg && `${PACKAGES[selectedPkg].price.toLocaleString('ar-SA')} × ${priceMult}`} ر.س
                  </div>
                )}
              </div>
            )}

            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.88rem', marginTop:20 }}>
              <thead>
                <tr style={{ background:'var(--dark)', color:'white' }}>
                  <th style={{ padding:'10px 14px', textAlign:'right' }}>نوع الاشتراك</th>
                  <th style={{ padding:'10px 14px', textAlign:'center' }}>الساعات</th>
                  <th style={{ padding:'10px 14px', textAlign:'center' }}>المبلغ</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(PACKAGES).map(([key,p],i)=>(
                  <tr key={key} style={{ background: i%2===0 ? 'white' : 'var(--bg)' }}>
                    <td style={{ padding:'10px 14px' }}>{p.name}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>{p.hours}</td>
                    <td style={{ padding:'10px 14px', textAlign:'center' }}>
                    <span style={{ display:'inline-flex', alignItems:'center', gap:4, direction:'ltr' }}>
                      <img src="/images/sar.webp" alt="ر.س" style={{ width:14, height:14, objectFit:'contain' }} />
                      {p.price.toLocaleString('ar-SA')}
                    </span>
                  </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <div style={{ background:'#fff5f5', border:'1.5px solid #fca5a5', borderRadius:10, padding:'14px 18px', color:'#b91c1c', fontSize:'.9rem', marginBottom:16 }}>
              {error}
            </div>
          )}

          {/* ملخص الطلب */}
          {selectedPkg && form.start_date && (
            <div style={{
              background:'var(--dark)', borderRadius:16, padding:'24px 28px',
              marginBottom:16, border:'1px solid rgba(95,97,87,.2)',
            }}>
              <div style={{ fontSize:'.78rem', fontWeight:800, letterSpacing:'.15em', color:'rgba(227,238,213,.5)', textTransform:'uppercase', marginBottom:16 }}>ملخص الطلب</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { label:'الخدمة', val: `${TYPE_LABELS[packageType]} — ${PACKAGES[selectedPkg].hours} ساعات` },
                  { label:'عدد المستفيدين', val: `${beneficiaryCount} ${beneficiaryCount===1?'مستفيد':'مستفيدين'}${beneficiaryCount===2?' (الثاني مجاني 🎁)':''}` },
                  { label:'تاريخ البدء', val: form.start_date },
                  { label:'وقت البدء', val: form.start_time ? displayTime(form.start_time) : '—' },
                  { label:'وقت الانتهاء', val: endTime || '—' },
                ].map(row => (
                  <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(227,238,213,.08)', paddingBottom:8 }}>
                    <span style={{ fontSize:'.85rem', color:'rgba(227,238,213,.5)' }}>{row.label}</span>
                    <span style={{ fontSize:'.88rem', fontWeight:700, color:'rgba(227,238,213,.9)' }}>{row.val}</span>
                  </div>
                ))}
                {priceMult > 1 && selectedPkg && (
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(227,238,213,.08)', paddingBottom:8 }}>
                    <span style={{ fontSize:'.85rem', color:'rgba(227,238,213,.5)' }}>معادلة السعر</span>
                    <span style={{ fontSize:'.88rem', fontWeight:700, color:'rgba(227,238,213,.7)' }}>{PACKAGES[selectedPkg].price.toLocaleString('ar-SA')} × {priceMult} ﷼</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:4 }}>
                  <span style={{ fontSize:'1rem', fontWeight:800, color:'#F6F0D7' }}>الإجمالي</span>
                  <span style={{ display:'inline-flex', alignItems:'center', gap:6, direction:'ltr' }}>
                    <img src="/images/sar.webp" alt="ر.س" style={{ width:20, height:20, objectFit:'contain', filter:'brightness(10)', opacity:0.85 }} />
                    <span style={{ fontSize:'1.4rem', fontWeight:900, color:'#F6F0D7' }}>{selectedPrice.toLocaleString('ar-SA')}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* الإقرار */}
          <label style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', marginBottom:16, padding:'14px 16px', background:'white', borderRadius:12, border:'1px solid rgba(95,97,87,.15)' }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              style={{ width:20, height:20, accentColor:'var(--dark)', marginTop:2, flexShrink:0, cursor:'pointer' }} />
            <span style={{ fontSize:'.88rem', color:'var(--dark)', lineHeight:1.7 }}>
              أوافق على صحة البيانات وأقر بدقتها ومشاركتها، واطلعت على <a href="/terms" target="_blank" style={{ color:'var(--dark)', fontWeight:800, textDecoration:'underline' }}>الشروط والأحكام</a> و
              <a href="/privacy" target="_blank" style={{ color:'var(--dark)', fontWeight:800, textDecoration:'underline' }}> سياسة الخصوصية</a> وأوافق عليها.
            </span>
          </label>

          {/* أزرار الدفع */}
          <div style={{ marginBottom: 16 }}>

            {/* زر الدفع الرئيسي */}
            <button onClick={submit} disabled={loading} style={{
              width:'100%', padding:16, background: loading ? '#9ca3af' : 'var(--dark)',
              color:'white', border:'none', borderRadius:12, fontFamily:'inherit',
              fontSize:'1.05rem', fontWeight:800, cursor: loading ? 'not-allowed' : 'pointer',
              marginBottom:10, display:'flex', alignItems:'center', justifyContent:'center', gap:12,
            }}>
              {loading ? 'جاري المعالجة...' : (
                <span style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span>ادفع الآن</span>
                  <span style={{ display:'flex', gap:5, alignItems:'center' }}>
                    <img src="/images/mada.svg"       alt="mada"        style={{ height:22, width:'auto', background:'white', borderRadius:4, padding:'2px 4px' }} />
                    <img src="/images/visa.png"       alt="Visa"        style={{ height:22, width:'auto', background:'white', borderRadius:4, padding:'2px 4px' }} />
                    <img src="/images/mastercard.png" alt="Mastercard"  style={{ height:22, width:'auto', background:'white', borderRadius:4, padding:'2px 4px' }} />
                    <img src="/images/applepay.png"   alt="Apple Pay"   style={{ height:22, width:'auto', background:'white', borderRadius:4, padding:'2px 4px' }} />
                  </span>
                </span>
              )}
            </button>

            {/* تابي */}
            <button disabled style={{
              width:'100%', padding:10, background:'#f7f7f7',
              border:'1.5px solid #e0e0e0', borderRadius:12, fontFamily:'inherit',
              cursor:'not-allowed', marginBottom:8,
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}>
              <img src="/images/tabby.webp" alt="tabby" style={{ height:36, width:'auto', opacity:.5, borderRadius:6 }} />
              <span style={{ fontSize:'.78rem', background:'#e8e8e8', color:'#999', padding:'3px 10px', borderRadius:20, fontWeight:700 }}>قريباً</span>
            </button>

            {/* تمارا */}
            <button disabled style={{
              width:'100%', padding:10, background:'#f7f7f7',
              border:'1.5px solid #e0e0e0', borderRadius:12, fontFamily:'inherit',
              cursor:'not-allowed',
              display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            }}>
              <img src="/images/tamara.jpeg" alt="tamara" style={{ height:36, width:'auto', opacity:.5, borderRadius:6 }} />
              <span style={{ fontSize:'.78rem', background:'#e8e8e8', color:'#999', padding:'3px 10px', borderRadius:20, fontWeight:700 }}>قريباً</span>
            </button>
          </div>
          </>)}
        </div>
      </div>
      <Footer />
      <WhatsApp />
      <style>{`
        input::placeholder { color: var(--dark) !important; opacity: 0.5; }
        select option { color: var(--dark); }
        @media (max-width: 600px) {
          .book-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}

export default function BookingPage() {
  return (
    <Suspense>
      <BookingContent />
    </Suspense>
  )
}
