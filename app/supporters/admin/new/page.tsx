'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSupportPage() {
  const router = useRouter()
  const [donorName, setDonorName] = useState('')
  const [donorPhone, setDonorPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [receivedBy, setReceivedBy] = useState('')
  const [supportType, setSupportType] = useState('general')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    if (!donorName || !donorPhone || !amount || !receivedBy) {
      setError('املأ جميع الحقول المطلوبة')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/supports/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          donor_name: donorName,
          donor_phone: donorPhone,
          amount: Number(amount),
          received_by: receivedBy,
          support_type: supportType,
          notes: notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'تعذر الحفظ')
        setSaving(false)
        return
      }
      // ننتقل لصفحة التعديل لإكمال المربعات التالية
      router.push(`/supporters/admin/edit/${data.support.id}`)
    } catch (e: any) {
      setError(e?.message || 'خطأ في الاتصال')
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>
        تعبئة دعم جديد
      </h1>
      <p style={{ color: 'rgba(95, 97, 87, .6)', marginBottom: 28, fontSize: '.95rem' }}>
        ابدأ بإدخال بيانات الداعم، وستظهر بقية الخطوات بعد الحفظ.
      </p>

      {/* المربع ١ */}
      <Box title="١. بيانات الداعم" active>
        <Row>
          <Field label="اسم الداعم *">
            <input value={donorName} onChange={e => setDonorName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="رقم الجوال *">
            <input value={donorPhone} onChange={e => setDonorPhone(e.target.value)}
              placeholder="05XXXXXXXX" style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
          </Field>
        </Row>
        <Row>
          <Field label="مبلغ الدعم (ر.س) *">
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
          </Field>
          <Field label="الموظف مستلم الدعم *">
            <input value={receivedBy} onChange={e => setReceivedBy(e.target.value)} style={inputStyle} />
          </Field>
        </Row>
        <Row>
          <Field label="نوع الدعم">
            <select value={supportType} onChange={e => setSupportType(e.target.value)} style={inputStyle}>
              <option value="general">دعم عام</option>
              <option value="sadaqa">صدقة</option>
              <option value="zakat">زكاة</option>
              <option value="kaffara">كفارة</option>
            </select>
          </Field>
          <Field label="ملاحظات (اختياري)">
            <input value={notes} onChange={e => setNotes(e.target.value)} style={inputStyle} />
          </Field>
        </Row>

        {error && (
          <div style={{ color: '#dc2626', fontSize: '.9rem', marginTop: 12, fontWeight: 600 }}>{error}</div>
        )}

        <div style={{ marginTop: 20, textAlign: 'left' }}>
          <button onClick={handleSave} disabled={saving} style={primaryBtnStyle}>
            {saving ? 'جاري الحفظ...' : 'حفظ وإرسال إشعار الاستلام'}
          </button>
        </div>
      </Box>

      {/* مربع ٢ و ٣ معطّلين حتى الحفظ */}
      <Box title="٢. خطة توزيع الدعم" active={false}>
        <p style={{ color: 'rgba(95, 97, 87, .45)', fontSize: '.9rem', textAlign: 'center', padding: '20px 0' }}>
          متاحة بعد حفظ بيانات الداعم
        </p>
      </Box>

      <Box title="٣. تقرير الصرف" active={false}>
        <p style={{ color: 'rgba(95, 97, 87, .45)', fontSize: '.9rem', textAlign: 'center', padding: '20px 0' }}>
          متاحة بعد توزيع الدعم
        </p>
      </Box>
    </div>
  )
}

// ═══ مكونات تساعد ═══
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid rgba(95, 97, 87, .15)',
  fontFamily: 'inherit', fontSize: '.95rem', outline: 'none', background: 'white',
}
const primaryBtnStyle: React.CSSProperties = {
  padding: '12px 28px', background: 'var(--dark)', color: 'white', border: 'none',
  borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem',
}

function Box({ title, active, children }: { title: string; active: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 24, marginBottom: 20,
      boxShadow: active ? '0 4px 20px rgba(95, 97, 87, 0.06)' : 'none',
      border: active ? '1px solid rgba(95, 97, 87, .08)' : '1px dashed rgba(95, 97, 87, .2)',
      opacity: active ? 1 : 0.55,
    }}>
      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 18 }}>{title}</h3>
      {children}
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }} className="sup-row">
      {children}
      <style>{`@media(max-width:600px){.sup-row{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--dark)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}
