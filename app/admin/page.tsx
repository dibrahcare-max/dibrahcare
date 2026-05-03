'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const PIN = '123456dibrah'

const PKG_LABELS: Record<string, string> = {
  daily: 'الباقة اليومية',
  weekly: 'الباقة الأسبوعية',
  monthly: 'الباقة الشهرية',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: 'جديد',          color: '#3b82f6' },
  pending:   { label: 'قيد المراجعة', color: '#f59e0b' },
  confirmed: { label: 'مؤكد',         color: '#22c55e' },
  cancelled: { label: 'ملغي',         color: '#ef4444' },
}

type Booking = {
  id: string
  customer_id: string
  beneficiary_name: string
  beneficiary_age: string
  beneficiary_relation: string
  emergency_phone: string
  package: string
  start_date: string
  start_time: string
  price: number
  status: string
  track_id: string
  created_at: string
  customers?: { name: string; phone: string; national_id: string; address: string }
}

const emptyForm = {
  subscriber_name: '', subscriber_phone: '', subscriber_id: '',
  subscriber_nationality: 'سعودي', subscriber_address: '',
  beneficiary_name: '', beneficiary_age: '', beneficiary_relation: '',
  emergency_phone: '', package: 'daily', start_date: '', start_time: '08:00',
  price: 350, status: 'confirmed',
}

export default function AdminPage() {
  const [auth, setAuth]           = useState(false)
  const [pin, setPin]             = useState('')
  const [pinError, setPinError]   = useState('')
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<'bookings'|'add'|'edit'>('bookings')
  const [period, setPeriod]         = useState('all')
  const [editData, setEditData]     = useState<Booking | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')

  useEffect(() => {
    if (auth) fetchBookings()
  }, [auth])

  const login = () => {
    if (pin === PIN) { setAuth(true); setPinError('') }
    else setPinError('الرقم السري غير صحيح')
  }

  const fetchBookings = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, customers(name, phone, national_id, address)')
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id)
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x))
  }

  const saveManual = async () => {
    if (!form.subscriber_name || !form.subscriber_phone || !form.beneficiary_name || !form.start_date) {
      setSaveMsg('❌ يرجى تعبئة الحقول المطلوبة')
      return
    }
    setSaving(true); setSaveMsg('')
    const res = await fetch('/api/save-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscriber_name: form.subscriber_name,
        subscriber_phone: form.subscriber_phone,
        subscriber_id: form.subscriber_id,
        subscriber_nationality: form.subscriber_nationality,
        subscriber_address: form.subscriber_address,
        beneficiary_name: form.beneficiary_name,
        beneficiary_age: form.beneficiary_age,
        beneficiary_relation: form.beneficiary_relation,
        emergency_phone: form.emergency_phone,
        package: form.package,
        start_date: form.start_date,
        start_time: form.start_time,
        totalPrice: form.price,
        trackId: 'MANUAL-' + Date.now(),
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.success) {
      setSaveMsg('✅ تم حفظ الحجز بنجاح')
      setForm(emptyForm)
      fetchBookings()
      setTimeout(() => setTab('bookings'), 1500)
    } else {
      setSaveMsg('❌ ' + (data.message || 'حدث خطأ'))
    }
  }

  const whatsapp = (phone: string, name: string, pkg: string, date: string) => {
    const msg = encodeURIComponent(`مرحباً ${name}،\n\nبخصوص حجزك في دِبرة للرعاية:\n📦 ${PKG_LABELS[pkg] || pkg}\n📅 ${date}\n\nكيف يمكننا مساعدتك؟`)
    const num = phone.startsWith('966') ? phone : phone.startsWith('0') ? '966' + phone.slice(1) : '966' + phone
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank')
  }

  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const filtered = bookings.filter(b => {
    const matchPeriod = period === 'all' ||
      (period === 'today' && b.start_date === today) ||
      (period === 'week' && b.start_date >= weekStart) ||
      (period === 'month' && b.start_date >= monthStart)
    if (!matchPeriod) return false
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.customers?.name?.includes(search) ||
      b.customers?.phone?.includes(search) ||
      b.beneficiary_name?.includes(search)
    return matchStatus && matchSearch
  })

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid rgba(95,97,87,.2)',
    borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem',
    color: 'var(--dark)', background: '#fafaf9', outline: 'none', direction: 'rtl',
    boxSizing: 'border-box',
  }

  // ===== LOGIN =====
  if (!auth) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 380, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(95,97,87,.1)', border: '1px solid rgba(95,97,87,.12)' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#777C6D', marginBottom: 8 }}>لوحة التحكم</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 28 }}>أدخل الرقم السري للدخول</p>
        <input style={{ ...inp, textAlign: 'center', fontSize: '1.2rem', letterSpacing: '.1em', marginBottom: 12 }}
          type="password" placeholder="••••••••••"
          value={pin} onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        {pinError && <div style={{ color: '#b91c1c', fontSize: '.85rem', marginBottom: 12 }}>{pinError}</div>}
        <button onClick={login} style={{ width: '100%', padding: '13px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: 'pointer' }}>دخول</button>
      </div>
      <style jsx global>{`:root { --muted: #8a8e80; }`}</style>
    </div>
  )

  // ===== DASHBOARD =====
  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '48px 32px 80px', direction: 'rtl' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#777C6D', margin: 0 }}>لوحة التحكم</h1>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 4 }}>{bookings.length} حجز إجمالي</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setTab('bookings')} style={{ padding: '10px 20px', background: tab === 'bookings' ? 'var(--dark)' : 'white', color: tab === 'bookings' ? '#F6F0D7' : 'var(--dark)', border: '1.5px solid var(--dark)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>الحجوزات</button>
              <button onClick={() => setTab('add')} style={{ padding: '10px 20px', background: tab === 'add' ? 'var(--dark)' : 'white', color: tab === 'add' ? '#F6F0D7' : 'var(--dark)', border: '1.5px solid var(--dark)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>+ حجز يدوي</button>
              {tab === 'edit' && <button onClick={() => setTab('bookings')} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>← رجوع</button>}
              <button onClick={() => { setAuth(false); setPin('') }} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>خروج</button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 32 }} className="admin-stats">
            {[
              { label: 'إجمالي الحجوزات', val: bookings.length, color: '#5f6157' },
              { label: 'جديد', val: bookings.filter(b => b.status === 'new').length, color: '#3b82f6' },
              { label: 'مؤكدة', val: bookings.filter(b => b.status === 'confirmed').length, color: '#22c55e' },
              { label: 'قيد المراجعة', val: bookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
              { label: 'ملغية', val: bookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(95,97,87,.1)', boxShadow: '0 2px 8px rgba(95,97,87,.05)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {tab === 'bookings' && (
            <>
              {/* Period Filter */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                {[
                  { key: 'all', label: 'كل الفترات' },
                  { key: 'today', label: 'اليوم' },
                  { key: 'week', label: 'هذا الأسبوع' },
                  { key: 'month', label: 'هذا الشهر' },
                ].map(p => (
                  <button key={p.key} onClick={() => setPeriod(p.key)} style={{
                    padding: '8px 16px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', border: '1.5px solid',
                    background: period === p.key ? '#5f6157' : 'white',
                    color: period === p.key ? '#F6F0D7' : '#5f6157',
                    borderColor: period === p.key ? '#5f6157' : 'rgba(95,97,87,.2)',
                  }}>{p.label}</button>
                ))}
              </div>
              {/* Filters */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input style={{ ...inp, maxWidth: 260 }} placeholder="بحث بالاسم أو الجوال..." value={search} onChange={e => setSearch(e.target.value)} />
                <div style={{ display: 'flex', gap: 8 }}>
                  {['all', 'new', 'confirmed', 'pending', 'cancelled'].map(f => (
                    <button key={f} onClick={() => setFilter(f)} style={{
                      padding: '10px 16px', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', border: '1.5px solid',
                      background: filter === f ? 'var(--dark)' : 'white',
                      color: filter === f ? '#F6F0D7' : 'var(--dark)',
                      borderColor: filter === f ? 'var(--dark)' : 'rgba(95,97,87,.2)',
                    }}>
                      {f === 'all' ? 'الكل' : STATUS_LABELS[f]?.label || f}
                    </button>
                  ))}
                </div>
                <button onClick={fetchBookings} style={{ padding: '10px 16px', background: 'white', border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer', color: 'var(--muted)' }}>🔄 تحديث</button>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>جاري التحميل...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', background: 'white', borderRadius: 20 }}>لا توجد حجوزات</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {filtered.map(b => {
                    const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending
                    return (
                      <div key={b.id} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(95,97,87,.1)', boxShadow: '0 2px 8px rgba(95,97,87,.04)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 16, alignItems: 'center' }} className="admin-row">
                          {/* العميل */}
                          <div>
                            <div style={{ fontWeight: 900, color: 'var(--dark)', fontSize: '.95rem' }}>{b.customers?.name || '—'}</div>
                            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 3 }}>{b.customers?.phone || '—'}</div>
                            <div style={{ fontSize: '.78rem', color: 'rgba(95,97,87,.4)', marginTop: 2 }}>المستفيد: {b.beneficiary_name}</div>
                          </div>
                          {/* الباقة */}
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '.88rem' }}>{PKG_LABELS[b.package] || b.package}</div>
                            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 3 }}>📅 {b.start_date} — {b.start_time}</div>
                            <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 2 }}>💰 {b.price?.toLocaleString('ar-SA')} ريال</div>
                          </div>
                          {/* الحالة */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <span style={{ fontSize: '.75rem', fontWeight: 800, padding: '4px 12px', borderRadius: 20, background: st.color + '20', color: st.color, display: 'inline-block', width: 'fit-content' }}>{st.label}</span>
                            <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)} style={{ ...inp, fontSize: '.8rem', padding: '6px 10px', width: 'auto' }}>
                              <option value="pending">قيد المراجعة</option>
                              <option value="confirmed">مؤكد</option>
                              <option value="cancelled">ملغي</option>
                            </select>
                          </div>
                          {/* واتساب */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <button onClick={() => whatsapp(b.customers?.phone || '', b.customers?.name || '', b.package, b.start_date)}
                              style={{ padding: '8px 14px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              💬 واتساب
                            </button>
                            <button onClick={() => { setEditData(b); setTab('edit') }}
                              style={{ padding: '8px 14px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              ✏️ تعديل
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {tab === 'edit' && editData && (
            <div style={{ background: 'white', borderRadius: 20, padding: '36px 40px', border: '1px solid rgba(95,97,87,.1)' }}>
              <h2 style={{ fontWeight: 900, color: 'var(--dark)', marginBottom: 28, fontFamily: 'PNU, Tajawal, sans-serif' }}>تعديل الحجز</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="add-grid">
                {[
                  { label: 'اسم المستفيد', key: 'beneficiary_name' },
                  { label: 'عمر المستفيد', key: 'beneficiary_age' },
                  { label: 'صلة القرابة', key: 'beneficiary_relation' },
                  { label: 'تاريخ البدء', key: 'start_date', type: 'date' },
                  { label: 'وقت البدء', key: 'start_time', type: 'time' },
                  { label: 'السعر', key: 'price', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>{f.label}</label>
                    <input style={inp} type={f.type || 'text'} value={(editData as any)[f.key] || ''} onChange={e => setEditData(x => x ? ({ ...x, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }) : x)} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>الباقة</label>
                  <select style={inp} value={editData.package} onChange={e => setEditData(x => x ? ({ ...x, package: e.target.value }) : x)}>
                    <option value="daily">الباقة اليومية</option>
                    <option value="weekly">الباقة الأسبوعية</option>
                    <option value="monthly">الباقة الشهرية</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>الحالة</label>
                  <select style={inp} value={editData.status} onChange={e => setEditData(x => x ? ({ ...x, status: e.target.value }) : x)}>
                    <option value="new">جديد</option>
                    <option value="new">جديد</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>
              {saveMsg && <div style={{ marginTop: 20, fontSize: '.9rem', fontWeight: 700, color: saveMsg.startsWith('✅') ? '#22c55e' : '#b91c1c' }}>{saveMsg}</div>}
              <button onClick={async () => {
                if (!editData) return
                setSaving(true); setSaveMsg('')
                const { error } = await supabase.from('bookings').update({
                  beneficiary_name: editData.beneficiary_name,
                  beneficiary_age: editData.beneficiary_age,
                  beneficiary_relation: editData.beneficiary_relation,
                  package: editData.package,
                  start_date: editData.start_date,
                  start_time: editData.start_time,
                  price: editData.price,
                  status: editData.status,
                }).eq('id', editData.id)
                setSaving(false)
                if (error) setSaveMsg('❌ ' + error.message)
                else { setSaveMsg('✅ تم التعديل'); fetchBookings(); setTimeout(() => { setTab('bookings'); setSaveMsg('') }, 1200) }
              }} disabled={saving} style={{ marginTop: 28, padding: '14px 40px', background: saving ? '#9ca3af' : 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 800, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>
          )}

          {tab === 'add' && (
            <div style={{ background: 'white', borderRadius: 20, padding: '36px 40px', border: '1px solid rgba(95,97,87,.1)' }}>
              <h2 style={{ fontWeight: 900, color: 'var(--dark)', marginBottom: 28, fontFamily: 'PNU, Tajawal, sans-serif' }}>إضافة حجز يدوي</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="add-grid">
                {[
                  { label: 'اسم المشترك *', key: 'subscriber_name', type: 'text' },
                  { label: 'رقم الجوال *', key: 'subscriber_phone', type: 'tel' },
                  { label: 'رقم الهوية', key: 'subscriber_id', type: 'text' },
                  { label: 'الجنسية', key: 'subscriber_nationality', type: 'text' },
                  { label: 'العنوان', key: 'subscriber_address', type: 'text' },
                  { label: 'رقم الطوارئ', key: 'emergency_phone', type: 'tel' },
                  { label: 'اسم المستفيد *', key: 'beneficiary_name', type: 'text' },
                  { label: 'عمر المستفيد', key: 'beneficiary_age', type: 'text' },
                  { label: 'صلة القرابة', key: 'beneficiary_relation', type: 'text' },
                  { label: 'تاريخ البدء *', key: 'start_date', type: 'date' },
                  { label: 'وقت البدء', key: 'start_time', type: 'time' },
                  { label: 'السعر (ريال)', key: 'price', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>{f.label}</label>
                    <input style={inp} type={f.type} value={(form as any)[f.key]} onChange={e => setForm(x => ({ ...x, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>الباقة</label>
                  <select style={inp} value={form.package} onChange={e => setForm(x => ({ ...x, package: e.target.value }))}>
                    <option value="daily">الباقة اليومية</option>
                    <option value="weekly">الباقة الأسبوعية</option>
                    <option value="monthly">الباقة الشهرية</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>الحالة</label>
                  <select style={inp} value={form.status} onChange={e => setForm(x => ({ ...x, status: e.target.value }))}>
                    <option value="new">جديد</option>
                    <option value="confirmed">مؤكد</option>
                    <option value="pending">قيد المراجعة</option>
                    <option value="cancelled">ملغي</option>
                  </select>
                </div>
              </div>
              {saveMsg && <div style={{ marginTop: 20, fontSize: '.9rem', fontWeight: 700, color: saveMsg.startsWith('✅') ? '#22c55e' : '#b91c1c' }}>{saveMsg}</div>}
              <button onClick={saveManual} disabled={saving} style={{ marginTop: 28, padding: '14px 40px', background: saving ? '#9ca3af' : 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 800, fontSize: '1rem', cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'جاري الحفظ...' : 'حفظ الحجز'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-row { grid-template-columns: 1fr 1fr !important; }
          .add-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-row { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  )
}
