'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

const dark = '#5f6157'
const green = '#e2ecd3'

const inputStyle = (disabled = false, error = false): React.CSSProperties => ({
  width: '100%',
  padding: '12px 14px',
  border: `1.5px solid ${error ? '#c0392b' : disabled ? '#e0e0e0' : 'rgba(95,97,87,.25)'}`,
  borderRadius: 10,
  fontSize: '.95rem',
  fontFamily: 'inherit',
  color: disabled ? '#aaa' : dark,
  background: disabled ? '#f5f5f5' : '#fff',
  outline: 'none',
  direction: 'rtl',
  cursor: disabled ? 'not-allowed' : 'text',
})

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.82rem',
  fontWeight: 700,
  color: dark,
  marginBottom: 6,
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 14,
  padding: '24px 20px',
  marginBottom: 16,
  boxShadow: '0 1px 6px rgba(95,97,87,.08)',
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    emergency_phone: '',
    short_address: '',
    nationality: '',
    district: '',
    street: '',
    city: '',
    vat_number: '',
    // readonly
    phone: '',
    national_id: '',
  })

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (!d.authenticated) { router.replace('/auth?next=/profile'); return }
        if (!d.customer) { router.replace('/register'); return }
        const c = d.customer
        setForm({
          full_name: c.full_name || '',
          email: c.email || '',
          emergency_phone: c.emergency_phone || '',
          short_address: c.short_address || '',
          nationality: c.nationality || '',
          district: c.district || '',
          street: c.street || '',
          city: c.city || '',
          vat_number: c.vat_number || '',
          phone: c.phone || '',
          national_id: c.national_id || '',
        })
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.full_name.trim()) e.full_name = 'الاسم مطلوب'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'بريد إلكتروني غير صالح'
    if (form.emergency_phone && !/^05\d{8}$/.test(form.emergency_phone)) e.emergency_phone = 'رقم طوارئ غير صالح'
    if (form.short_address && !/^[A-Z]{4}[0-9]{4}$/.test(form.short_address)) e.short_address = 'صيغة العنوان القصير غير صحيحة (مثال: AAAA1234)'
    return e
  }

  async function handleSave() {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length > 0) return

    setSaving(true)
    setError('')
    setSuccess(false)

    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          email: form.email.trim() || null,
          emergency_phone: form.emergency_phone.trim() || null,
          short_address: form.short_address.trim() || null,
          nationality: form.nationality.trim() || null,
          district: form.district.trim() || null,
          street: form.street.trim() || null,
          city: form.city.trim() || null,
          vat_number: form.vat_number.trim() || null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(data.message || 'فشل الحفظ')
      }
    } catch {
      setError('حدث خطأ، حاول مجدداً')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <>
      <Nav />
      <main style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: dark }}>جاري التحميل...</div>
      </main>
      <Footer />
    </>
  )

  return (
    <>
      <Nav />
      <main style={{ direction: 'rtl', fontFamily: 'inherit', background: '#f8f9f6', minHeight: '80vh', padding: '40px 16px' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>

          <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: dark, marginBottom: 24, textAlign: 'center' }}>بياناتي</h1>

          {/* البيانات الثابتة */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 800, color: dark, marginBottom: 16 }}>بيانات لا يمكن تعديلها</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>رقم الجوال</label>
                <input style={inputStyle(true)} value={form.phone} disabled />
              </div>
              <div>
                <label style={labelStyle}>رقم الهوية</label>
                <input style={inputStyle(true)} value={form.national_id} disabled />
              </div>
            </div>
          </div>

          {/* البيانات الشخصية */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 800, color: dark, marginBottom: 16 }}>البيانات الشخصية</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>الاسم الكامل *</label>
              <input
                style={inputStyle(false, !!errors.full_name)}
                value={form.full_name}
                onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              />
              {errors.full_name && <div style={{ color: '#c0392b', fontSize: '.78rem', marginTop: 4, fontWeight: 700 }}>{errors.full_name}</div>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>البريد الإلكتروني</label>
              <input
                style={inputStyle(false, !!errors.email)}
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="example@email.com"
                dir="ltr"
              />
              {errors.email && <div style={{ color: '#c0392b', fontSize: '.78rem', marginTop: 4, fontWeight: 700 }}>{errors.email}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>رقم الطوارئ</label>
                <input
                  style={inputStyle(false, !!errors.emergency_phone)}
                  value={form.emergency_phone}
                  onChange={e => setForm(f => ({ ...f, emergency_phone: e.target.value }))}
                  placeholder="05XXXXXXXX"
                />
                {errors.emergency_phone && <div style={{ color: '#c0392b', fontSize: '.78rem', marginTop: 4, fontWeight: 700 }}>{errors.emergency_phone}</div>}
              </div>
              <div>
                <label style={labelStyle}>الجنسية</label>
                <input
                  style={inputStyle()}
                  value={form.nationality}
                  onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))}
                  placeholder="سعودي"
                />
              </div>
            </div>
          </div>

          {/* بيانات العنوان */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 800, color: dark, marginBottom: 16 }}>العنوان</h3>

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>العنوان القصير</label>
              <input
                style={inputStyle(false, !!errors.short_address)}
                value={form.short_address}
                onChange={e => setForm(f => ({ ...f, short_address: e.target.value.toUpperCase() }))}
                placeholder="AAAA1234"
                dir="ltr"
              />
              {errors.short_address && <div style={{ color: '#c0392b', fontSize: '.78rem', marginTop: 4, fontWeight: 700 }}>{errors.short_address}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>الحي</label>
                <input style={inputStyle()} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
              </div>
              <div>
                <label style={labelStyle}>الشارع</label>
                <input style={inputStyle()} value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>المدينة</label>
              <input style={inputStyle(true)} value={form.city || 'الرياض'} disabled />
            </div>
          </div>

          {/* الرقم الضريبي */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: '.95rem', fontWeight: 800, color: dark, marginBottom: 16 }}>بيانات ضريبية <span style={{ fontWeight: 400, color: '#888', fontSize: '.8rem' }}>(اختياري)</span></h3>
            <div>
              <label style={labelStyle}>الرقم الضريبي</label>
              <input
                style={inputStyle()}
                value={form.vat_number}
                onChange={e => setForm(f => ({ ...f, vat_number: e.target.value }))}
                placeholder="3XXXXXXXXXXX0003"
                dir="ltr"
              />
            </div>
          </div>

          {/* زر الحفظ */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#c0392b', fontSize: '.85rem', fontWeight: 600 }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#16a34a', fontSize: '.85rem', fontWeight: 700 }}>
              ✅ تم حفظ البيانات بنجاح
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              background: saving ? '#aaa' : dark,
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px',
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              marginBottom: 40,
            }}
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>

        </div>
      </main>
      <WhatsApp />
      <Footer />
    </>
  )
}
