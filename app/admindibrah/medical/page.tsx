'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

type MedicalReg = {
  id: string
  subscriber_name: string
  subscriber_id: string
  subscriber_phone: string
  subscriber_nationality: string
  subscriber_job: string
  subscriber_job_location: string
  subscriber_address: string
  emergency_phone: string
  status: string
  created_at: string
}

type MedicalBooking = {
  id: string
  customer_id: string
  service_type: string
  package_id: string | null
  amount: number | null
  status: string
  payment_status: string
  notes: string | null
  created_at: string
  customers?: {
    full_name?: string
    phone?: string
    national_id?: string
    email?: string
    district?: string
    street?: string
  }
}

type TabType = 'bookings' | 'registrations'

export default function MedicalAdminPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [regs, setRegs] = useState<MedicalReg[]>([])
  const [bookings, setBookings] = useState<MedicalBooking[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabType>('bookings')

  // التحقق من تسجيل الدخول من اللوحة الرئيسية
  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => {
        const ok = !!d.authenticated
        setAuthed(ok)
        if (ok) load()
      })
      .catch(() => setAuthed(false))
      .finally(() => setAuthChecked(true))
  }, [])

  const load = async () => {
    setLoading(true)
    const [regsRes, bookingsRes] = await Promise.all([
      supabase
        .from('registrations')
        .select('*')
        .eq('type', 'medical')
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('*, customers(full_name, phone, national_id, email, district, street)')
        .eq('service_type', 'medical')
        .order('created_at', { ascending: false }),
    ])
    setRegs((regsRes.data as any) || [])
    setBookings((bookingsRes.data as any) || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('registrations').update({ status }).eq('id', id)
    load()
  }

  const updateBookingStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    load()
  }

  const updateBookingPaymentStatus = async (id: string, payment_status: string) => {
    await supabase.from('bookings').update({ payment_status }).eq('id', id)
    load()
  }

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    window.location.href = '/admindibrah'
  }

  if (!authChecked) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>جاري التحقق...</div>
      </div>
    )
  }

  if (!authed) {
    return (
      <>
        <Nav />
        <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '48px 36px', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid rgba(95,97,87,.15)' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 80, height: 'auto', borderRadius: 12, marginBottom: 18 }} />
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>🔒</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 10 }}>الوصول مقيَّد</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 24 }}>
              للدخول إلى لوحة الرعاية الطبية، يرجى تسجيل الدخول من لوحة التحكم الرئيسية أولاً.
            </p>
            <a href="/admindibrah" style={{ display: 'inline-block', padding: '13px 36px', background: 'var(--dark)', color: '#F6F0D7', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '.9rem' }}>
              الذهاب إلى لوحة التحكم ←
            </a>
          </div>
        </div>
      </>
    )
  }

  const filteredRegs = regs.filter(r =>
    !search ||
    r.subscriber_name?.includes(search) ||
    r.subscriber_phone?.includes(search) ||
    r.subscriber_id?.includes(search)
  )

  const filteredBookings = bookings.filter(b =>
    !search ||
    b.customers?.full_name?.includes(search) ||
    b.customers?.phone?.includes(search) ||
    b.customers?.national_id?.includes(search) ||
    b.id?.includes(search)
  )

  // ─── Helpers ────────────────────────────────────────────────────
  function parseBookingNotes(notes: string | null): { start_date?: string; start_time?: string; package_label?: string; service_key?: string } {
    if (!notes) return {}
    try { return JSON.parse(notes) } catch { return {} }
  }

  const PAYMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
    paid:           { label: 'مدفوع',           color: '#22c55e' },
    awaiting_quote: { label: 'بانتظار التسعير', color: '#f59e0b' },
    pending:        { label: 'قيد الانتظار',    color: '#f59e0b' },
    refunded:       { label: 'مُسترَد',          color: '#6b7280' },
    failed:         { label: 'فشل',             color: '#ef4444' },
  }

  // ═══ مساعدات التاريخ للإحصائيات الزمنية ═══
  const todayIso  = new Date().toISOString().split('T')[0]
  const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  const datePart = (d?: string) => (d || '').split('T')[0]
  const inToday = (d?: string) => datePart(d) === todayIso
  const inWeek  = (d?: string) => datePart(d) >= weekStart
  const inMonth = (d?: string) => datePart(d) >= monthStart

  // إحصائيات حسب التبويب النشط
  const stats = tab === 'bookings'
    ? [
        // ─── زمنية ───
        { label: 'الإجمالي',         val: bookings.length, color: '#5f6157' },
        { label: 'اليوم',            val: bookings.filter(b => inToday(b.created_at)).length, color: '#0891b2' },
        { label: 'هذا الأسبوع',       val: bookings.filter(b => inWeek(b.created_at)).length,  color: '#0891b2' },
        { label: 'هذا الشهر',        val: bookings.filter(b => inMonth(b.created_at)).length, color: '#0891b2' },
        // ─── حالة ───
        { label: 'بانتظار التسعير', val: bookings.filter(b => b.payment_status === 'awaiting_quote').length, color: '#f59e0b' },
        { label: 'جديدة',            val: bookings.filter(b => b.status === 'new').length,        color: '#3b82f6' },
        { label: 'مؤكدة',            val: bookings.filter(b => b.status === 'confirmed').length,  color: '#8b5cf6' },
        { label: 'منفذة',            val: bookings.filter(b => b.status === 'done').length,       color: '#22c55e' },
      ]
    : [
        // ─── زمنية ───
        { label: 'الإجمالي',     val: regs.length, color: '#5f6157' },
        { label: 'اليوم',        val: regs.filter(r => inToday(r.created_at)).length, color: '#0891b2' },
        { label: 'هذا الأسبوع',   val: regs.filter(r => inWeek(r.created_at)).length,  color: '#0891b2' },
        { label: 'هذا الشهر',    val: regs.filter(r => inMonth(r.created_at)).length, color: '#0891b2' },
        // ─── حالة ───
        { label: 'قيد المراجعة', val: regs.filter(r => r.status === 'pending').length,   color: '#f59e0b' },
        { label: 'تم التواصل',   val: regs.filter(r => r.status === 'contacted').length, color: '#3b82f6' },
        { label: 'منفذة',        val: regs.filter(r => r.status === 'done').length,      color: '#22c55e' },
        { label: 'ملغاة',        val: regs.filter(r => r.status === 'cancelled').length, color: '#6b7280' },
      ]

  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '48px 32px 80px', direction: 'rtl' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 56, height: 'auto', borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#777C6D', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>الرعاية الطبية المنزلية</h1>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 4 }}>
                {bookings.length} حجز · {regs.length} طلب تسجيل · تُقدَّم من قبل مستشفى الرعاية الطبية
              </p>
            </div>
            <a href="/admindibrah" style={{ padding: '10px 20px', background: 'white', color: 'var(--dark)', border: '1.5px solid var(--dark)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>← لوحة دِبرة الرئيسية</a>
            <button onClick={logout} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>خروج</button>
          </div>

          {/* ═══ التبويبات ═══ */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid rgba(95,97,87,.12)' }}>
            {[
              { id: 'bookings' as const,      label: '🏥 الحجوزات',     count: bookings.length },
              { id: 'registrations' as const, label: '📝 التسجيلات',    count: regs.length },
            ].map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '12px 24px',
                    background: 'none',
                    border: 'none',
                    borderBottom: active ? '3px solid var(--dark)' : '3px solid transparent',
                    color: active ? 'var(--dark)' : 'var(--muted)',
                    fontWeight: active ? 800 : 600,
                    fontSize: '.95rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    marginBottom: -2,
                    transition: 'all .15s',
                  }}
                >
                  {t.label}
                  <span style={{ marginInlineStart: 8, padding: '2px 10px', background: active ? 'var(--dark)' : 'rgba(95,97,87,.15)', color: active ? '#F6F0D7' : 'var(--muted)', borderRadius: 999, fontSize: '.78rem', fontWeight: 700 }}>
                    {t.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {stats.map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(95,97,87,.1)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 24 }}>
            <input type="text" placeholder="بحث (اسم، جوال، هوية)..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', padding: '12px 18px', fontSize: '.95rem', border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10, fontFamily: 'inherit', outline: 'none', background: 'white' }} />
          </div>

          {/* ═══ تبويب الحجوزات ═══ */}
          {tab === 'bookings' && (
            loading ? (
              <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>جاري التحميل...</div>
            ) : filteredBookings.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>لا توجد حجوزات حالياً</div>
            ) : (
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(95,97,87,.1)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                    <thead>
                      <tr style={{ background: 'var(--dark)', color: '#F6F0D7' }}>
                        {['رقم الحجز','العميل','الجوال','التاريخ المطلوب','الوقت','حالة الدفع','حالة الحجز','إجراء'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: '.85rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBookings.map((b, i) => {
                        const meta = parseBookingNotes(b.notes)
                        const psLabel = PAYMENT_STATUS_LABELS[b.payment_status] || { label: b.payment_status, color: '#6b7280' }
                        return (
                          <tr key={b.id} style={{ borderTop: '1px solid rgba(95,97,87,.08)', background: i % 2 ? '#fafaf7' : 'white' }}>
                            <td style={{ padding: '14px 16px', fontSize: '.82rem', color: 'var(--muted)', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>{b.id.slice(0, 8).toUpperCase()}</td>
                            <td style={{ padding: '14px 16px', fontSize: '.9rem', fontWeight: 700, color: 'var(--dark)' }}>{b.customers?.full_name || '—'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '.88rem', color: 'var(--muted)', direction: 'ltr', textAlign: 'right' }}>{b.customers?.phone || '—'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '.85rem', color: 'var(--muted)' }}>{meta.start_date || '—'}</td>
                            <td style={{ padding: '14px 16px', fontSize: '.85rem', color: 'var(--muted)' }}>{meta.start_time || '—'}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <select value={b.payment_status || 'pending'} onChange={e => updateBookingPaymentStatus(b.id, e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 6, border: `1.5px solid ${psLabel.color}40`, fontSize: '.78rem', fontFamily: 'inherit', background: `${psLabel.color}15`, color: psLabel.color, fontWeight: 700, cursor: 'pointer' }}>
                                <option value="awaiting_quote">بانتظار التسعير</option>
                                <option value="paid">مدفوع</option>
                                <option value="pending">قيد الانتظار</option>
                                <option value="refunded">مُسترَد</option>
                                <option value="failed">فشل</option>
                              </select>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <select value={b.status || 'confirmed'} onChange={e => updateBookingStatus(b.id, e.target.value)}
                                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(95,97,87,.2)', fontSize: '.82rem', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
                                <option value="new">جديد</option>
                                <option value="confirmed">مؤكد</option>
                                <option value="contacted">تم التواصل</option>
                                <option value="in_progress">قيد التنفيذ</option>
                                <option value="done">منفذ</option>
                                <option value="cancelled">ملغي</option>
                              </select>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <a
                                href={`https://wa.me/${(b.customers?.phone || '').replace(/\D/g, '').replace(/^0/, '966')}`}
                                target="_blank" rel="noreferrer"
                                title="إرسال واتساب"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#25D366', color: 'white', borderRadius: 6, fontSize: '.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                💬 واتساب
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

          {/* ═══ تبويب التسجيلات (التدفق القديم) ═══ */}
          {tab === 'registrations' && (
            loading ? (
              <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>جاري التحميل...</div>
            ) : filteredRegs.length === 0 ? (
              <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>لا توجد طلبات حالياً</div>
            ) : (
              <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(95,97,87,.1)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: 'var(--dark)', color: '#F6F0D7' }}>
                        {['الاسم','الجوال','الهوية','الجنسية','العنوان','التاريخ','الحالة','إجراء'].map(h => (
                          <th key={h} style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 800, fontSize: '.85rem', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredRegs.map((r, i) => (
                        <tr key={r.id} style={{ borderTop: '1px solid rgba(95,97,87,.08)', background: i % 2 ? '#fafaf7' : 'white' }}>
                          <td style={{ padding: '14px 16px', fontSize: '.9rem', fontWeight: 700, color: 'var(--dark)' }}>{r.subscriber_name}</td>
                          <td style={{ padding: '14px 16px', fontSize: '.88rem', color: 'var(--muted)', direction: 'ltr', textAlign: 'right' }}>{r.subscriber_phone}</td>
                          <td style={{ padding: '14px 16px', fontSize: '.88rem', color: 'var(--muted)' }}>{r.subscriber_id}</td>
                          <td style={{ padding: '14px 16px', fontSize: '.88rem', color: 'var(--muted)' }}>{r.subscriber_nationality || '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '.85rem', color: 'var(--muted)' }}>{r.subscriber_address || '—'}</td>
                          <td style={{ padding: '14px 16px', fontSize: '.82rem', color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString('ar-SA')}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <select value={r.status || 'pending'} onChange={e => updateStatus(r.id, e.target.value)}
                              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(95,97,87,.2)', fontSize: '.82rem', fontFamily: 'inherit', background: 'white', cursor: 'pointer' }}>
                              <option value="pending">قيد المراجعة</option>
                              <option value="contacted">تم التواصل</option>
                              <option value="done">منفذ</option>
                              <option value="cancelled">ملغي</option>
                            </select>
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <a
                                href={`https://wa.me/${(r.subscriber_phone || '').replace(/\D/g, '').replace(/^0/, '966')}`}
                                target="_blank" rel="noreferrer"
                                title="إرسال واتساب"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: '#25D366', color: 'white', borderRadius: 6, fontSize: '.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                💬 واتساب
                              </a>
                              <a
                                href={`/print/medical/${r.id}`}
                                target="_blank" rel="noreferrer"
                                title="طباعة الملف"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'var(--dark)', color: '#F6F0D7', borderRadius: 6, fontSize: '.78rem', fontWeight: 700, textDecoration: 'none' }}>
                                🖨️ طباعة
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </>
  )
}
