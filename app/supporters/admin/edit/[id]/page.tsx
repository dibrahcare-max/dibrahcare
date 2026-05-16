'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORT_STATUS_LABELS, SUPPORT_TYPE_LABELS } from '@/lib/supports'

type Support = {
  id: string
  support_number: string
  donor_name: string
  donor_phone: string
  amount: number
  received_by: string
  support_type: string
  status: string
  distribution_place?: string
  distribution_date?: string
  distribution_time?: string
  report_url?: string
  notes?: string
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid rgba(95, 97, 87, .15)',
  fontFamily: 'inherit', fontSize: '.95rem', outline: 'none', background: 'white',
}
const primaryBtnStyle: React.CSSProperties = {
  padding: '12px 28px', background: 'var(--dark)', color: 'white', border: 'none',
  borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem',
}

export default function EditSupportPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [support, setSupport] = useState<Support | null>(null)
  const [loading, setLoading] = useState(true)

  // المربع ٢
  const [place, setPlace] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)

  // المربع ٣
  const [reportUrl, setReportUrl] = useState('')
  const [savingDisburse, setSavingDisburse] = useState(false)

  const [msg, setMsg] = useState<{ kind: 'ok'|'err'; text: string } | null>(null)

  useEffect(() => { loadSupport() }, [params.id])

  const loadSupport = async () => {
    try {
      const res = await fetch(`/api/supports/${params.id}`)
      const data = await res.json()
      if (!res.ok || !data.support) {
        setMsg({ kind: 'err', text: data.error || 'الدعم غير موجود' })
        return
      }
      const s = data.support
      setSupport(s)
      setPlace(s.distribution_place || '')
      setDate(s.distribution_date || '')
      setTime(s.distribution_time || '')
      setReportUrl(s.report_url || '')
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'خطأ في التحميل' })
    } finally {
      setLoading(false)
    }
  }

  const saveSchedule = async () => {
    if (!place || !date) {
      setMsg({ kind: 'err', text: 'مكان وتاريخ التوزيع مطلوبان' })
      return
    }
    setSavingSchedule(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/supports/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'schedule',
          distribution_place: place,
          distribution_date: date,
          distribution_time: time || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error || 'تعذر الحفظ' })
      } else {
        setSupport(data.support)
        setMsg({ kind: 'ok', text: '✓ تم حفظ خطة التوزيع وإرسال إشعار للداعم' })
      }
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'خطأ في الاتصال' })
    } finally {
      setSavingSchedule(false)
    }
  }

  const saveDisburse = async () => {
    if (!reportUrl) {
      setMsg({ kind: 'err', text: 'رابط التقرير مطلوب' })
      return
    }
    setSavingDisburse(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/supports/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'disburse',
          report_url: reportUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error || 'تعذر الحفظ' })
      } else {
        setSupport(data.support)
        setMsg({ kind: 'ok', text: '✓ تم رفع التقرير وإكمال الرحلة، أُرسل إشعار التوزيع للداعم' })
      }
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'خطأ في الاتصال' })
    } finally {
      setSavingDisburse(false)
    }
  }

  if (loading) return <div style={{ color: 'var(--dark)' }}>جاري التحميل...</div>
  if (!support) return <div style={{ color: '#dc2626' }}>الدعم غير موجود</div>

  const scheduleActive = support.status !== 'cancelled'
  const disburseActive = support.status === 'scheduled' || support.status === 'disbursed'

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <a href="/supporters/admin/donors" style={{ color: 'rgba(95, 97, 87, .6)', fontSize: '.88rem' }}>
          ← العودة لقائمة الداعمين
        </a>
      </div>

      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 4 }}>
        تعديل الدعم
      </h1>
      <div style={{ fontSize: '.95rem', color: 'rgba(95, 97, 87, .6)', marginBottom: 24, direction: 'ltr', textAlign: 'right' }}>
        {support.support_number}
      </div>

      {msg && (
        <div style={{
          padding: 14, borderRadius: 10, marginBottom: 18, fontWeight: 600, fontSize: '.92rem',
          background: msg.kind === 'ok' ? 'rgba(34, 197, 94, .1)' : 'rgba(220, 38, 38, .08)',
          color: msg.kind === 'ok' ? '#15803d' : '#dc2626',
        }}>
          {msg.text}
        </div>
      )}

      {/* المربع ١ — مكتمل دائماً */}
      <Box title={`١. بيانات الداعم — ${SUPPORT_STATUS_LABELS[support.status]?.label || support.status}`} done>
        <Grid>
          <ReadOnly label="الاسم" value={support.donor_name} />
          <ReadOnly label="الجوال" value={support.donor_phone} dir="ltr" />
          <ReadOnly label="المبلغ" value={`${support.amount} ر.س`} />
          <ReadOnly label="مستلم الدعم" value={support.received_by} />
          <ReadOnly label="نوع الدعم" value={SUPPORT_TYPE_LABELS[support.support_type] || 'دعم عام'} />
          {support.notes && <ReadOnly label="ملاحظات" value={support.notes} />}
        </Grid>
      </Box>

      {/* المربع ٢ — خطة التوزيع */}
      <Box title="٢. خطة توزيع الدعم" done={support.status === 'scheduled' || support.status === 'disbursed'} active={scheduleActive}>
        <Field label="مكان التوزيع *">
          <input value={place} onChange={e => setPlace(e.target.value)}
            placeholder="مثال: حي العزيزية - شارع الأمير سلطان"
            style={inputStyle} disabled={!scheduleActive} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
          <Field label="تاريخ التوزيع *">
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ ...inputStyle, direction: 'ltr' }} disabled={!scheduleActive} />
          </Field>
          <Field label="الوقت">
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              style={{ ...inputStyle, direction: 'ltr' }} disabled={!scheduleActive} />
          </Field>
        </div>
        {scheduleActive && (
          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <button onClick={saveSchedule} disabled={savingSchedule} style={primaryBtnStyle}>
              {savingSchedule ? 'جاري الحفظ...' : (support.status === 'received' ? 'حفظ وإرسال إشعار الجدولة' : 'تحديث')}
            </button>
          </div>
        )}
      </Box>

      {/* المربع ٣ — التقرير */}
      <Box title="٣. تقرير الصرف" done={support.status === 'disbursed'} active={disburseActive}>
        {!disburseActive ? (
          <p style={{ color: 'rgba(95, 97, 87, .55)', fontSize: '.9rem', textAlign: 'center', padding: '10px 0' }}>
            يُفتح بعد جدولة التوزيع
          </p>
        ) : (
          <>
            <Field label="رابط تقرير الصرف (Google Drive أو OneDrive) *">
              <input value={reportUrl} onChange={e => setReportUrl(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
                style={{ ...inputStyle, direction: 'ltr', textAlign: 'left' }} />
            </Field>
            <p style={{ fontSize: '.82rem', color: 'rgba(95, 97, 87, .6)', marginTop: 8 }}>
              💡 تأكد من إعداد ملف Drive كـ "أي شخص لديه الرابط يستطيع المشاهدة"
            </p>
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <button onClick={saveDisburse} disabled={savingDisburse} style={primaryBtnStyle}>
                {savingDisburse ? 'جاري الحفظ...' : (support.status === 'scheduled' ? 'حفظ وإرسال إشعار التوزيع' : 'تحديث الرابط')}
              </button>
            </div>
          </>
        )}
      </Box>
    </div>
  )
}

function Box({ title, done, active = true, children }: { title: string; done?: boolean; active?: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 24, marginBottom: 20,
      boxShadow: active ? '0 4px 20px rgba(95, 97, 87, 0.06)' : 'none',
      border: done ? '2px solid var(--dark)' : (active ? '1px solid rgba(95, 97, 87, .08)' : '1px dashed rgba(95, 97, 87, .2)'),
      opacity: active ? 1 : 0.6,
    }}>
      <h3 style={{
        fontSize: '1.05rem', fontWeight: 800, color: 'var(--dark)',
        marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {done && <span style={{ color: '#22c55e' }}>✓</span>}
        {title}
      </h3>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>{children}</div>
}

function ReadOnly({ label, value, dir }: { label: string; value: string; dir?: string }) {
  return (
    <div>
      <div style={{ fontSize: '.75rem', color: 'rgba(95, 97, 87, .55)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '.95rem', fontWeight: 700, color: 'var(--dark)', direction: dir as any }}>{value}</div>
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
