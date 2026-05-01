'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

type Booking = {
  id: string
  package: string
  start_date: string
  start_time: string
  end_time: string
  price: number
  status: string
  beneficiary_name: string
  beneficiary_relation: string
  notes: string
  address: string
  created_at: string
}

const STATUS: Record<string, { label: string; color: string }> = {
  new:       { label: 'جديد',          color: '#3b82f6' },
  pending:   { label: 'قيد المراجعة', color: '#f59e0b' },
  confirmed: { label: 'مؤكد',          color: '#22c55e' },
  executed:  { label: 'منفذ',          color: '#8b5cf6' },
  cancelled: { label: 'ملغي',          color: '#ef4444' },
}

const PKG: Record<string, string> = {
  test_1:    'باقة اختبار',
  daily_4:   'يومي 4 ساعات',
  daily_8:   'يومي 8 ساعات',
  weekly_4:  'أسبوعي 4 ساعات',
  weekly_8:  'أسبوعي 8 ساعات',
  monthly_4: 'شهري 4 ساعات',
  monthly_8: 'شهري 16 ساعة',
  ramadan_2: 'باقة رمضان',
  daily:     'الباقة اليومية',
  weekly:    'الباقة الأسبوعية',
  monthly:   'الباقة الشهرية',
}

const PKG_ICON: Record<string, string> = {
  daily: '☀️', weekly: '📅', monthly: '🗓️',
}

export default function MyBookings() {
  const router = useRouter()
  const [loading, setLoading]       = useState(true)
  const [bookings, setBookings]     = useState<Booking[]>([])
  const [phone, setPhone]           = useState('')
  const [name, setName]             = useState('')
  const [address, setAddress]       = useState('')
  const [filter, setFilter]         = useState('all')
  const [showArchive, setShowArchive] = useState(false)
  const [editNotes, setEditNotes]   = useState<Record<string, string>>({})
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState('')

  useEffect(() => {
    // تحقق من الجلسة واجلب الحجوزات عبر API محمي
    fetch('/api/my-bookings')
      .then(r => {
        if (r.status === 401) {
          router.push('/auth?next=/my-bookings')
          return null
        }
        return r.json()
      })
      .then(d => {
        if (!d) return
        if (d.success) {
          if (d.customer) {
            setName(d.customer.name || '')
            setAddress(d.customer.address || '')
            setPhone(d.customer.phone || '')
            setCustomerId(d.customer.id || '')
          }
          setBookings(d.bookings || [])
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const saveNote = async (id: string) => {
    setSavingNote(id)
    try {
      await fetch('/api/my-bookings/note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notes: editNotes[id] }),
      })
      setBookings(b => b.map(x => x.id === id ? { ...x, notes: editNotes[id] } : x))
      setEditNotes(n => { const r = { ...n }; delete r[id]; return r })
    } catch {}
    setSavingNote(null)
  }

  const exportExcel = () => {
    const rows = [
      ['الباقة', 'المستفيد', 'تاريخ البدء', 'وقت البدء', 'وقت النهاية', 'المبلغ', 'الحالة', 'ملاحظات'],
      ...filtered.map(b => [
        PKG[b.package] || b.package,
        b.beneficiary_name,
        b.start_date,
        b.start_time,
        b.end_time || '—',
        b.price + ' ريال',
        STATUS[b.status]?.label || b.status,
        b.notes || '',
      ])
    ]
    const csv = '\uFEFF' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `حجوزات-دبرة-${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.csv`
    a.click()
  }

  const exportWord = () => {
    const rows = filtered.map(b => `
      <tr>
        <td>${PKG[b.package] || b.package}</td>
        <td>${b.beneficiary_name}</td>
        <td>${b.start_date}</td>
        <td>${b.start_time} — ${b.end_time || '—'}</td>
        <td>${b.price?.toLocaleString('ar-SA')} ريال</td>
        <td style="color:${STATUS[b.status]?.color}">${STATUS[b.status]?.label || b.status}</td>
        <td>${b.notes || '—'}</td>
      </tr>`).join('')

    const html = `
      <html dir="rtl"><head><meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; padding: 32px; }
        h1 { color: #5f6157; margin-bottom: 8px; }
        p { color: #8a8e80; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th { background: #5f6157; color: #F6F0D7; padding: 10px 12px; text-align: right; }
        td { padding: 10px 12px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background: #f9f9f7; }
      </style></head>
      <body>
        <h1>حجوزات دِبرة للرعاية</h1>
        <p>${name} — ${phone} — تاريخ التصدير: ${new Date().toLocaleDateString('ar-SA')}</p>
        <table>
          <tr><th>الباقة</th><th>المستفيد</th><th>التاريخ</th><th>الوقت</th><th>المبلغ</th><th>الحالة</th><th>ملاحظات</th></tr>
          ${rows}
        </table>
      </body></html>`

    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `حجوزات-دبرة-${new Date().toLocaleDateString('ar-SA').replace(/\//g, '-')}.doc`
    a.click()
  }

  const logout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }) } catch {}
    router.push('/')
  }

  // ═══ منطق الأرشفة ═══
  // الحجز في الأرشيف إذا:
  //   - تاريخ البدء فات (قبل اليوم)
  //   - أو الحالة executed / cancelled
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const isArchived = (b: Booking): boolean => {
    if (b.status === 'executed' || b.status === 'cancelled') return true
    if (b.start_date) {
      const d = new Date(b.start_date)
      d.setHours(0, 0, 0, 0)
      if (d < today) return true
    }
    return false
  }

  const activeBookings   = bookings.filter(b => !isArchived(b))
  const archivedBookings = bookings.filter(b =>  isArchived(b))

  const visibleBookings = showArchive ? archivedBookings : activeBookings
  const filtered = filter === 'all' ? visibleBookings : visibleBookings.filter(b => b.status === filter)

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: 'PNU, Tajawal, sans-serif', color: 'var(--dark)', fontSize: '1.1rem' }}>جاري التحميل...</div>
    </div>
  )

  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '48px 24px 80px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '2.8rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 4 }}>حجوزاتي</span>
              <p style={{ fontSize: '.9rem', color: 'var(--muted)' }}>{name || phone} {address ? `— ${address}` : ''}</p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {archivedBookings.length > 0 && (
                <button onClick={() => setShowArchive(v => !v)} style={{
                  padding: '10px 20px',
                  background: showArchive ? '#777C6D' : 'white',
                  color: showArchive ? '#F6F0D7' : 'var(--dark)',
                  border: '1.5px solid #777C6D', borderRadius: 8,
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer',
                }}>
                  {showArchive ? '← الرجوع للحالية' : `🗂️ الأرشيف (${archivedBookings.length})`}
                </button>
              )}
              {bookings.length > 0 && <>
                <button onClick={exportExcel} style={{ padding: '10px 16px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>📊 Excel</button>
                <button onClick={exportWord} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>📄 Word</button>
              </>}
              <button onClick={logout} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid var(--dark)', color: 'var(--dark)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>خروج</button>
            </div>
          </div>

          {/* Filter */}
          {bookings.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {['all', 'new', 'confirmed', 'pending', 'executed', 'cancelled'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: '7px 16px', borderRadius: 20, fontFamily: 'inherit', fontWeight: 700,
                  fontSize: '.8rem', cursor: 'pointer', border: '1.5px solid',
                  background: filter === f ? 'var(--dark)' : 'white',
                  color: filter === f ? '#F6F0D7' : 'var(--dark)',
                  borderColor: filter === f ? 'var(--dark)' : 'rgba(95,97,87,.2)',
                }}>
                  {f === 'all' ? `الكل (${bookings.length})` : `${STATUS[f]?.label} (${bookings.filter(b => b.status === f).length})`}
                </button>
              ))}
            </div>
          )}

          {/* Bookings */}
          {filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 20, padding: '56px 24px', textAlign: 'center', border: '1px solid rgba(95,97,87,.15)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
              <p style={{ fontWeight: 900, color: 'var(--dark)', fontSize: '1.1rem', marginBottom: 8 }}>
                {filter === 'all' ? 'ما عندك حجوزات بعد' : 'لا توجد حجوزات بهذه الحالة'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="bookings-grid">
              {filtered.map(b => {
                const st = STATUS[b.status] || STATUS.pending
                const isEditingNote = b.id in editNotes
                return (
                  <div key={b.id} style={{
                    background: 'white', borderRadius: 20,
                    border: '1px solid rgba(95,97,87,.12)',
                    boxShadow: '0 2px 12px rgba(95,97,87,.06)',
                    overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  }}>
                    {/* Card Header */}
                    <div style={{ background: 'var(--dark)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 900, color: '#F6F0D7', fontSize: '.95rem' }}>
                        {PKG_ICON[b.package]} {PKG[b.package] || b.package}
                      </div>
                      <span style={{ fontSize: '.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: st.color + '25', color: st.color, border: `1px solid ${st.color}40` }}>
                        {st.label}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: '18px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[
                          ['👤 المستفيد', b.beneficiary_name],
                          ['🔗 الصلة', b.beneficiary_relation || '—'],
                          ['📅 تاريخ البدء', b.start_date],
                          ['🕐 وقت البدء', b.start_time],
                          ['🕔 وقت النهاية', b.end_time || '—'],
                          ['💰 المبلغ', b.price?.toLocaleString('ar-SA') + ' ريال'],
                        ].map(([k, v]) => (
                          <div key={String(k)} style={{ fontSize: '.82rem' }}>
                            <div style={{ color: 'var(--muted)', marginBottom: 2 }}>{k}</div>
                            <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Address */}
                      {address && (
                        <div style={{ fontSize: '.82rem', borderTop: '1px solid rgba(95,97,87,.08)', paddingTop: 10 }}>
                          <div style={{ color: 'var(--muted)', marginBottom: 2 }}>📍 العنوان</div>
                          <div style={{ fontWeight: 700, color: 'var(--dark)' }}>{address}</div>
                        </div>
                      )}

                      {/* Notes */}
                      <div style={{ borderTop: '1px solid rgba(95,97,87,.08)', paddingTop: 10, marginTop: 'auto' }}>
                        <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 6 }}>📝 ملاحظات</div>
                        {isEditingNote ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <textarea
                              value={editNotes[b.id]}
                              onChange={e => setEditNotes(n => ({ ...n, [b.id]: e.target.value }))}
                              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid rgba(95,97,87,.2)', fontFamily: 'inherit', fontSize: '.82rem', resize: 'none', minHeight: 60, direction: 'rtl', boxSizing: 'border-box' }}
                            />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => saveNote(b.id)} disabled={savingNote === b.id} style={{ flex: 1, padding: '7px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontWeight: 700, fontSize: '.78rem', cursor: 'pointer' }}>
                                {savingNote === b.id ? 'جاري...' : 'حفظ'}
                              </button>
                              <button onClick={() => setEditNotes(n => { const r = { ...n }; delete r[b.id]; return r })} style={{ padding: '7px 12px', background: 'none', border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 6, fontFamily: 'inherit', fontSize: '.78rem', cursor: 'pointer', color: 'var(--muted)' }}>
                                إلغاء
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div onClick={() => setEditNotes(n => ({ ...n, [b.id]: b.notes || '' }))} style={{ fontSize: '.82rem', color: b.notes ? 'var(--dark)' : 'var(--muted)', cursor: 'pointer', padding: '8px 10px', borderRadius: 8, border: '1.5px dashed rgba(95,97,87,.2)', minHeight: 36, display: 'flex', alignItems: 'center' }}>
                            {b.notes || 'اضغط لإضافة ملاحظة...'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
      <WhatsApp />
      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) { .bookings-grid { grid-template-columns: repeat(2,1fr) !important; } }
        @media (max-width: 640px) { .bookings-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  )
}
