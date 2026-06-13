'use client'
import { useState, useEffect, useRef } from 'react'

type Recipient = { name: string; phone: string }
type Progress = { total: number; sent: number; failed: number; done: boolean }

export default function BroadcastPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const [text, setText] = useState('')
  const [personalize, setPersonalize] = useState(true)
  const [city, setCity] = useState('')
  const [media, setMedia] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)

  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [progress, setProgress] = useState<Progress | null>(null)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const cancelRef = useRef(false)

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => setAuthed(!!d.authenticated))
      .catch(() => setAuthed(false))
      .finally(() => setAuthChecked(true))
  }, [])

  const loadRecipients = async (targetCity: string): Promise<Recipient[]> => {
    const res = await fetch(`/api/admin/broadcast/recipients${targetCity ? `?city=${encodeURIComponent(targetCity)}` : ''}`, { cache: 'no-store' })
    const d = await res.json()
    return d.success ? d.recipients : []
  }

  useEffect(() => {
    if (!authed) return
    loadRecipients(city).then(setRecipients).catch(() => setRecipients([]))
  }, [authed, city])

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    window.location.href = '/admindibrah'
  }

  const handleUploadMedia = async (file: File) => {
    setUploading(true)
    setMsg(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/broadcast/upload-media', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) setMsg({ kind: 'err', text: d.error || 'تعذّر رفع الوسائط' })
      else setMedia({ url: d.url, type: d.type, name: file.name })
    } catch (e: any) {
      setMsg({ kind: 'err', text: e?.message || 'خطأ' })
    } finally {
      setUploading(false)
    }
  }

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

  const startSend = async () => {
    if (!text.trim() && !media) {
      setMsg({ kind: 'err', text: 'اكتب رسالة أو أضف وسائط أولاً' })
      return
    }
    const list = await loadRecipients(city)
    if (list.length === 0) {
      setMsg({ kind: 'err', text: 'لا يوجد مستلمون' })
      return
    }
    if (!confirm(`سيتم الإرسال إلى ${list.length} عميل. متابعة؟`)) return

    setSending(true)
    cancelRef.current = false
    setMsg(null)
    const prog: Progress = { total: list.length, sent: 0, failed: 0, done: false }
    setProgress({ ...prog })

    for (const r of list) {
      if (cancelRef.current) break
      try {
        const res = await fetch('/api/admin/broadcast/send-one', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: r.phone, name: r.name, text: text.trim(),
            mediaUrl: media?.url || null, mediaType: media?.type || null, personalize,
          }),
        })
        const d = await res.json()
        if (d.success) prog.sent++; else prog.failed++
      } catch { prog.failed++ }
      setProgress({ ...prog })
      await sleep(2000)
    }

    prog.done = true
    setProgress({ ...prog })
    setSending(false)
    setMsg({ kind: 'ok', text: `اكتمل الإرسال: ${prog.sent} نجحت، ${prog.failed} فشلت` })
  }

  const card: React.CSSProperties = {
    background: 'white', borderRadius: 16, padding: 24, marginBottom: 20,
    boxShadow: '0 2px 12px rgba(95,97,87,.06)', border: '1px solid rgba(95,97,87,.08)',
  }
  const label: React.CSSProperties = { display: 'block', fontWeight: 700, color: 'var(--dark)', marginBottom: 8, fontSize: '.92rem' }
  const linkStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    borderRadius: 8, color: 'var(--dark)', textDecoration: 'none', fontWeight: 700, fontSize: '.9rem',
  }

  if (!authChecked) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--dark)' }}>جاري التحميل...</div>
  if (!authed) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 }}>
      <p style={{ color: '#c0392b', fontWeight: 700 }}>غير مصرح — سجّل الدخول من لوحة التحكم أولاً</p>
      <a href="/admindibrah" style={{ padding: '10px 20px', background: 'var(--dark)', color: '#F6F0D7', borderRadius: 8, fontWeight: 700, textDecoration: 'none' }}>الذهاب إلى لوحة التحكم ←</a>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#faf9f6', direction: 'rtl' }}>
      <aside style={{
        width: 240, background: 'white', borderLeft: '1px solid rgba(95,97,87,.1)',
        height: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start',
        overflowY: 'auto', padding: '24px 16px', flexShrink: 0,
        display: 'flex', flexDirection: 'column',
      }} className={`admin-sidebar ${mobileMenuOpen ? 'admin-sidebar-open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 32, padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 44, height: 'auto', borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#777C6D', fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة</div>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>لوحة التحكم</div>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق القائمة" className="admin-sidebar-close">✕</button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { tab: 'bookings', label: 'الحجوزات', icon: '📋' },
            { tab: 'stats', label: 'الإحصائيات', icon: '📊' },
            { tab: 'add', label: 'حجز يدوي', icon: '➕' },
            { tab: 'users', label: 'الموظفون', icon: '👥' },
            { tab: 'customers', label: 'العملاء المسجلين', icon: '🧑‍💼' },
          ].map(it => (
            <a key={it.tab} href={`/admindibrah?tab=${it.tab}`} style={linkStyle}>
              <span style={{ fontSize: '1.1rem' }}>{it.icon}</span>{it.label}
            </a>
          ))}

          <div style={{ height: 1, background: 'rgba(95,97,87,.1)', margin: '12px 0' }} />

          <a href="/admindibrah/medical" style={linkStyle}><span style={{ fontSize: '1.1rem' }}>🩺</span>حجوزات الرعاية الطبية</a>
          <a href="/admindibrah/feedback" style={linkStyle}><span style={{ fontSize: '1.1rem' }}>⭐</span>التقييمات</a>
          <a href="/admindibrah/broadcast" style={{ ...linkStyle, background: 'var(--dark)', color: '#F6F0D7' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
              <path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2zm0 18.15a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.41a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43-.14 0-.31-.02-.48-.02-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.29z"/>
            </svg>
            رسالة جماعية
          </a>
          <a href="/supporters/admin" style={linkStyle}><span style={{ fontSize: '1.1rem' }}>💚</span>لوحة الداعمين</a>
          <a href="/admindibrah/discount-codes" style={linkStyle}><span style={{ fontSize: '1.1rem' }}>🎟️</span>أكواد الخصم</a>
        </nav>

        <div style={{ borderTop: '1px solid rgba(95,97,87,.1)', paddingTop: 14, marginTop: 14 }}>
          <button onClick={logout} style={{
            width: '100%', padding: '10px', background: 'none',
            border: '1.5px solid rgba(95,97,87,.2)', color: '#c0392b', borderRadius: 8,
            fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer',
          }}>🚪 خروج</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '24px 20px', maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <button onClick={() => setMobileMenuOpen(true)} className="admin-burger" aria-label="القائمة"
          style={{ display: 'none', background: 'white', border: '1px solid rgba(95,97,87,.2)', borderRadius: 8, padding: '8px 12px', fontSize: '1.2rem', cursor: 'pointer', marginBottom: 16 }}>
          ☰
        </button>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="26" height="26" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
            <path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2zm0 18.15a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.41a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43-.14 0-.31-.02-.48-.02-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.29z"/>
          </svg>
          رسالة جماعية
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 24 }}>
          إرسال رسالة واتساب لجميع العملاء — تُرسل تدريجياً (كل ٢ ثانية) لحماية الرقم من الحظر.
        </p>

        <div style={card}>
          <label style={label}>نص الرسالة</label>
          <textarea value={text} onChange={e => setText(e.target.value)} rows={6} placeholder="اكتب رسالتك هنا..."
            style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1.5px solid rgba(95,97,87,.25)', fontSize: '.95rem', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.8 }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, cursor: 'pointer', fontSize: '.88rem', color: 'var(--dark)' }}>
            <input type="checkbox" checked={personalize} onChange={e => setPersonalize(e.target.checked)} />
            إضافة اسم العميل في بداية الرسالة (يقلّل احتمال الحظر) ✅
          </label>
        </div>

        <div style={card}>
          <label style={label}>وسائط (اختياري — صورة أو فيديو)</label>
          {media ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: '#fafaf7', borderRadius: 10 }}>
              <span style={{ fontSize: '1.4rem' }}>{media.type === 'video' ? '🎬' : '🖼️'}</span>
              <span style={{ flex: 1, fontSize: '.85rem', color: 'var(--dark)' }}>{media.name}</span>
              <button onClick={() => setMedia(null)} style={{ background: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 8, padding: '6px 12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>إزالة</button>
            </div>
          ) : (
            <>
              <input type="file" accept="image/*,video/*" id="media-input" style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUploadMedia(f); e.target.value = '' }} />
              <label htmlFor="media-input" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', borderRadius: 12, border: '2px dashed rgba(95,97,87,.3)', background: '#fafaf7', cursor: uploading ? 'wait' : 'pointer', fontWeight: 700, color: 'var(--dark)', fontSize: '.9rem' }}>
                {uploading ? '⏳ جاري الرفع...' : '📎 اختر صورة أو فيديو'}
              </label>
              <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 8 }}>الحد الأقصى ١٦ ميجابايت. يتطلب إنشاء bucket عام باسم broadcast-media في Supabase.</p>
            </>
          )}
        </div>

        <div style={card}>
          <label style={label}>المستهدفون</label>
          <select value={city} onChange={e => setCity(e.target.value)}
            style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1.5px solid rgba(95,97,87,.25)', fontSize: '.95rem', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
            <option value="">جميع العملاء</option>
            <option value="الرياض">الرياض فقط</option>
          </select>
          <p style={{ marginTop: 10, fontSize: '.9rem', color: 'var(--dark)', fontWeight: 700 }}>📊 عدد المستلمين: {recipients.length}</p>
        </div>

        {progress && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.88rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 10 }}>
              <span>التقدّم: {progress.sent + progress.failed} / {progress.total}</span>
              <span>✅ {progress.sent} &nbsp; ❌ {progress.failed}</span>
            </div>
            <div style={{ height: 10, background: 'rgba(95,97,87,.12)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${((progress.sent + progress.failed) / progress.total) * 100}%`, background: progress.done ? '#16a34a' : '#c9a84c', transition: 'width .3s' }} />
            </div>
          </div>
        )}

        {msg && (
          <div style={{ ...card, background: msg.kind === 'ok' ? '#dcfce7' : '#fee2e2', color: msg.kind === 'ok' ? '#166534' : '#b91c1c', fontWeight: 700, textAlign: 'center' }}>{msg.text}</div>
        )}

        <div style={{ display: 'flex', gap: 12 }}>
          {!sending ? (
            <button onClick={startSend} disabled={recipients.length === 0}
              style={{ flex: 1, padding: '15px', borderRadius: 12, border: 'none', background: 'var(--dark)', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit', opacity: recipients.length === 0 ? 0.6 : 1 }}>
              🚀 إرسال إلى {recipients.length} عميل
            </button>
          ) : (
            <button onClick={() => { cancelRef.current = true }}
              style={{ flex: 1, padding: '15px', borderRadius: 12, border: 'none', background: '#c0392b', color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer', fontFamily: 'inherit' }}>
              ⏹️ إيقاف الإرسال
            </button>
          )}
        </div>

        <div style={{ marginTop: 20, padding: '12px 16px', background: 'rgba(201,168,76,.1)', borderRadius: 10, fontSize: '.8rem', color: 'rgba(95,97,87,.85)', lineHeight: 1.8 }}>
          ⚠️ لا تغلق الصفحة أثناء الإرسال. الرسائل تُرسل تدريجياً لحماية رقم الواتساب من الحظر.
        </div>
      </main>

      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 40 }} className="admin-overlay" />}

      <style jsx global>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important; right: 0; top: 0; z-index: 50;
            transform: translateX(100%); transition: transform .25s;
          }
          .admin-sidebar-open { transform: translateX(0) !important; }
          .admin-burger { display: inline-block !important; }
        }
        @media (min-width: 769px) {
          .admin-sidebar-close, .admin-overlay { display: none !important; }
        }
      `}</style>
    </div>
  )
}
