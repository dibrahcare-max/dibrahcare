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

  // المربع ٣ — ملفات التقرير (حتى ٣)
  type ReportFile = { url: string; path?: string; name?: string; uploaded_at?: string }
  const [reportFiles, setReportFiles] = useState<ReportFile[]>([])
  const [hasUnsaved, setHasUnsaved] = useState(false)  // ملفات مرفوعة لم تُحفظ بعد
  const [savingDisburse, setSavingDisburse] = useState(false)
  const [uploading, setUploading] = useState(false)
  const MAX_FILES = 3

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
      // تحميل ملفات التقرير (الجديد report_files، أو القديم report_url للتوافق)
      if (Array.isArray(s.report_files) && s.report_files.length > 0) {
        setReportFiles(s.report_files)
      } else if (s.report_url) {
        setReportFiles([{ url: s.report_url, name: 'تقرير' }])
      } else {
        setReportFiles([])
      }
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

  // حفظ قائمة الملفات في قاعدة البيانات (notify=true يرسل إشعار الداعم)
  const persistFiles = async (files: ReportFile[], notify: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`/api/supports/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stage: 'disburse',
          report_url: files[0]?.url || null,
          report_files: files,
          silent: !notify,
        }),
      })
      const data = await res.json()
      if (res.ok && data.support) setSupport(data.support)
      return res.ok
    } catch {
      return false
    }
  }

  const handleUpload = async (file: File) => {
    if (!file) return
    if (reportFiles.length >= MAX_FILES) {
      setMsg({ kind: 'err', text: `الحد الأقصى ${MAX_FILES} ملفات` })
      return
    }
    if (file.type !== 'application/pdf') {
      setMsg({ kind: 'err', text: 'يُسمح بملفات PDF فقط' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setMsg({ kind: 'err', text: 'حجم الملف يتجاوز ١٠ ميجابايت' })
      return
    }
    setUploading(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('supportId', String(params.id))
      const res = await fetch('/api/supporters/upload-report', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setMsg({ kind: 'err', text: data.error || 'تعذّر رفع الملف' })
      } else {
        const newFiles = [...reportFiles, data.file]
        setReportFiles(newFiles)
        // أول توزيع (الحالة مجدول) يُبلّغ الداعم؛ الملفات التالية تُحفظ بصمت
        const notify = support?.status === 'scheduled'
        const ok = await persistFiles(newFiles, notify)
        if (ok) {
          setMsg({
            kind: 'ok',
            text: notify ? '✓ تم الحفظ تلقائياً وإبلاغ الداعم' : '✓ تم حفظ الملف تلقائياً',
          })
        } else {
          setMsg({ kind: 'err', text: 'رُفع الملف لكن تعذّر حفظه — حدّثي الصفحة وأعيدي المحاولة' })
        }
      }
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'خطأ في الاتصال' })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteFile = async (f: { url: string; path?: string }, idx: number) => {
    // حذف من التخزين
    if (f.path) {
      try {
        await fetch('/api/supporters/delete-report-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: f.path }),
        })
      } catch {}
    }
    const newFiles = reportFiles.filter((_, i) => i !== idx)
    setReportFiles(newFiles)
    const ok = await persistFiles(newFiles, false) // حفظ صامت (بدون إشعار)
    setMsg(ok
      ? { kind: 'ok', text: 'تم حذف الملف وحفظ التغيير تلقائياً' }
      : { kind: 'err', text: 'تعذّر حفظ التغيير — حدّثي الصفحة' })
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
            {/* قائمة الملفات المرفوعة — معاينة + حذف */}
            {reportFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
                {reportFiles.map((f, idx) => (
                  <div key={idx} style={{ border: '1px solid rgba(95,97,87,.15)', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fafaf7', borderBottom: '1px solid rgba(95,97,87,.1)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '.88rem' }}>📄 التقرير {idx + 1}</span>
                      {f.name && <span style={{ fontSize: '.8rem', color: 'rgba(95,97,87,.6)' }}>{f.name}</span>}
                      <a href={f.url} target="_blank" rel="noreferrer" style={{ marginRight: 'auto', color: 'var(--dark)', fontWeight: 700, fontSize: '.82rem', textDecoration: 'underline' }}>تحميل</a>
                      <button onClick={() => handleDeleteFile(f, idx)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', fontFamily: 'inherit' }}>
                        🗑️ حذف
                      </button>
                    </div>
                    {/* معاينة PDF مدمجة */}
                    <iframe src={f.url} style={{ width: '100%', height: 360, border: 'none' }} title={`التقرير ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}

            {/* زر إضافة ملف (يختفي عند بلوغ الحد) */}
            {reportFiles.length < MAX_FILES && (
              <Field label={`إضافة تقرير PDF (${reportFiles.length} / ${MAX_FILES})`}>
                <input
                  type="file"
                  accept="application/pdf"
                  id="report-file-input"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = '' }}
                />
                <label
                  htmlFor="report-file-input"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '14px 20px', borderRadius: 12,
                    border: '2px dashed rgba(95,97,87,.3)',
                    background: uploading ? 'rgba(95,97,87,.05)' : '#fafaf7',
                    cursor: uploading ? 'wait' : 'pointer',
                    fontWeight: 700, color: 'var(--dark)', fontSize: '.92rem',
                  }}
                >
                  {uploading ? '⏳ جاري الرفع...' : '📎 اختر ملف PDF من جهازك'}
                </label>
              </Field>
            )}

            <div style={{ marginTop: 12, padding: '12px 16px', background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, fontSize: '.86rem', color: '#166534', lineHeight: 1.7, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>✅</span>
              <span><strong>الحفظ تلقائي:</strong> كل ملف يُحفظ فور رفعه — لا حاجة للضغط على أي زر. أول ملف يُرسل إشعاراً للداعم، والباقي يُحفظ بصمت.</span>
            </div>

            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(201,168,76,.1)', borderRadius: 10, fontSize: '.8rem', color: 'rgba(95,97,87,.85)', lineHeight: 1.7 }}>
              💡 حتى ٣ ملفات PDF، الحد الأقصى ١٠ ميجابايت للملف.
              <br />
              📅 يُحتفظ بالتقارير لمدة ٣ أشهر من تاريخ الرفع، ثم تُحذف تلقائياً لتوفير المساحة.
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
