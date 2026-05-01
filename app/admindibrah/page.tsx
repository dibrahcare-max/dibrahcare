'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

const PKG_LABELS: Record<string, string> = {
  daily: 'الباقة اليومية',
  weekly: 'الباقة الأسبوعية',
  monthly: 'الباقة الشهرية',
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new:       { label: 'جديد',          color: '#3b82f6' },
  pending:   { label: 'قيد المراجعة', color: '#f59e0b' },
  confirmed: { label: 'مؤكد',         color: '#22c55e' },
  executed:  { label: 'منفذ',          color: '#8b5cf6' },
  cancelled: { label: 'ملغي',         color: '#ef4444' },
}

type Booking = {
  id: string
  customer_id: string
  beneficiary_name: string
  beneficiary_age: string
  beneficiary_relation: string
  emergency_phone: string
  service?: string
  package: string
  start_date: string
  start_time: string
  end_time?: string
  price: number
  status: string
  track_id: string
  payment_id?: string
  notes: string
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
  const [splash, setSplash]         = useState(false)
  const [authChecking, setAuthChecking] = useState(true)
  const [currentUser, setCurrentUser] = useState<{ name: string; username: string } | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [bookings, setBookings]   = useState<Booking[]>([])
  const [loading, setLoading]     = useState(false)
  const [filter, setFilter]       = useState('all')
  const [search, setSearch]       = useState('')
  const [tab, setTab]             = useState<'bookings'|'add'|'edit'|'stats'|'users'>('bookings')
  const [period, setPeriod]         = useState('all')
  const [editData, setEditData]     = useState<Booking | null>(null)
  const [form, setForm]           = useState(emptyForm)
  const [saving, setSaving]       = useState(false)
  const [saveMsg, setSaveMsg]     = useState('')
  const [editNotes, setEditNotes]   = useState<Record<string, string>>({})
  const [savingNote, setSavingNote] = useState<string | null>(null)
  const [stats, setStats]           = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(false)
  const [detailsFor, setDetailsFor]     = useState<string | null>(null)
  const [detailsData, setDetailsData]   = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  // ═══ Admin Users Management ═══
  type AdminUser = { id: string; username: string; name: string; active: boolean; last_login: string | null; created_at: string }
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [showUserModal, setShowUserModal] = useState<'create' | { mode: 'edit' | 'password'; user: AdminUser } | null>(null)
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '' })
  const [userMsg, setUserMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [userSaving, setUserSaving] = useState(false)

  useEffect(() => {
    if (auth) fetchBookings()
  }, [auth])

  useEffect(() => {
    if (auth && tab === 'stats' && !stats) loadStats()
  }, [auth, tab])

  useEffect(() => {
    if (auth && tab === 'users') loadAdminUsers()
  }, [auth, tab])

  // ═══ Admin users functions ═══
  const loadAdminUsers = async () => {
    setUsersLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      const d = await res.json()
      if (d.success) setAdminUsers(d.users)
    } catch {}
    setUsersLoading(false)
  }

  const openCreateUser = () => {
    setUserForm({ name: '', username: '', password: '' })
    setUserMsg(null)
    setShowUserModal('create')
  }

  const openEditUser = (u: AdminUser) => {
    setUserForm({ name: u.name, username: u.username, password: '' })
    setUserMsg(null)
    setShowUserModal({ mode: 'edit', user: u })
  }

  const openChangePassword = (u: AdminUser) => {
    setUserForm({ name: u.name, username: u.username, password: '' })
    setUserMsg(null)
    setShowUserModal({ mode: 'password', user: u })
  }

  const submitUserForm = async () => {
    setUserMsg(null)
    setUserSaving(true)
    try {
      let res: Response
      if (showUserModal === 'create') {
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(userForm),
        })
      } else if (showUserModal && typeof showUserModal === 'object') {
        const body: any = {}
        if (showUserModal.mode === 'edit') {
          body.name = userForm.name
          body.username = userForm.username
        } else {
          body.password = userForm.password
        }
        res = await fetch(`/api/admin/users/${showUserModal.user.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        setUserSaving(false); return
      }
      const d = await res.json()
      if (d.success) {
        setUserMsg({ type: 'ok', text: '✅ تم الحفظ' })
        await loadAdminUsers()
        setTimeout(() => { setShowUserModal(null); setUserMsg(null) }, 800)
      } else {
        setUserMsg({ type: 'err', text: d.error || 'فشل الحفظ' })
      }
    } catch (e: any) {
      setUserMsg({ type: 'err', text: e?.message || 'خطأ' })
    }
    setUserSaving(false)
  }

  const toggleUserActive = async (u: AdminUser) => {
    await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !u.active }),
    })
    loadAdminUsers()
  }

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`حذف الموظف ${u.name}؟ لا يمكن التراجع.`)) return
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    const d = await res.json()
    if (d.success) loadAdminUsers()
    else alert(d.error || 'فشل الحذف')
  }

  const loadStats = async () => {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (data.success) setStats(data)
    } catch {}
    setStatsLoading(false)
  }

  const openDetails = async (bookingId: string) => {
    setDetailsFor(bookingId)
    setDetailsLoading(true)
    setDetailsData(null)
    try {
      const res = await fetch(`/api/admin/booking-details?id=${encodeURIComponent(bookingId)}`)
      const data = await res.json()
      if (data.success) setDetailsData(data)
    } catch (e) {
      console.error('details error:', e)
    }
    setDetailsLoading(false)
  }

  // التحقق من الجلسة عند تحميل الصفحة
  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setAuth(true)
          setCurrentUser({ name: d.user.name, username: d.user.username })
        }
      })
      .catch(() => {})
      .finally(() => setAuthChecking(false))
  }, [])

  const login = async () => {
    setLoginError('')
    if (!loginUsername || !loginPassword) {
      setLoginError('الرجاء إدخال اسم المستخدم وكلمة المرور')
      return
    }
    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setSplash(true)
        setCurrentUser({ name: data.user.name, username: data.user.username })
        setTimeout(() => {
          setSplash(false)
          setAuth(true)
        }, 2000)
      } else {
        setLoginError(data.error || 'فشل تسجيل الدخول')
      }
    } catch {
      setLoginError('خطأ في الاتصال')
    }
    setLoginLoading(false)
  }

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    setAuth(false)
    setCurrentUser(null)
    setLoginUsername('')
    setLoginPassword('')
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

  const saveNote = async (id: string) => {
    setSavingNote(id)
    await supabase.from('bookings').update({ notes: editNotes[id] }).eq('id', id)
    setBookings(b => b.map(x => x.id === id ? { ...x, notes: editNotes[id] } : x))
    setSavingNote(null)
    setEditNotes(n => { const r = { ...n }; delete r[id]; return r })
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

  // ═══ تجهيز بيانات التصدير من الحجوزات المفلترة ═══
  const buildExportRows = () => filtered.map(b => ({
    'رقم الحجز':         b.id?.slice(0, 8) || '',
    'اسم المشترك':       b.customers?.name || '',
    'جوال المشترك':      b.customers?.phone || '',
    'اسم المستفيد':      b.beneficiary_name || '',
    'صلة القرابة':       b.beneficiary_relation || '',
    'الخدمة':            b.service || '',
    'الباقة':            PKG_LABELS[b.package] || b.package || '',
    'تاريخ البداية':     b.start_date || '',
    'وقت البداية':       b.start_time || '',
    'وقت النهاية':       b.end_time || '',
    'السعر':             b.price ?? '',
    'الحالة':            STATUS_LABELS[b.status]?.label || b.status,
    'الرقم المرجعي':     b.payment_id || '',
    'تاريخ الإنشاء':     b.created_at ? new Date(b.created_at).toLocaleString('ar-SA') : '',
    'ملاحظات':          (b.notes || '').replace(/\n/g, ' ').slice(0, 500),
  }))

  const exportFilename = (ext: string) => {
    const today = new Date().toISOString().split('T')[0]
    const filterPart = filter === 'all' ? '' : `-${filter}`
    return `dibrah-bookings-${today}${filterPart}.${ext}`
  }

  // ═══ تصدير CSV (UTF-8 BOM للتوافق مع Excel العربي) ═══
  const exportCsv = () => {
    const rows = buildExportRows()
    if (rows.length === 0) { alert('لا توجد حجوزات للتصدير'); return }
    const headers = Object.keys(rows[0])
    const escape = (v: any) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv = [
      headers.join(','),
      ...rows.map(r => headers.map(h => escape((r as any)[h])).join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = exportFilename('csv')
    a.click()
    URL.revokeObjectURL(url)
  }

  // ═══ تصدير Excel (XLSX) ═══
  const exportExcel = async () => {
    const rows = buildExportRows()
    if (rows.length === 0) { alert('لا توجد حجوزات للتصدير'); return }
    try {
      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(rows)
      // RTL + عرض الأعمدة
      ws['!cols'] = Object.keys(rows[0]).map(() => ({ wch: 18 }))
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'الحجوزات')
      XLSX.writeFile(wb, exportFilename('xlsx'))
    } catch (e) {
      console.error('xlsx export failed', e)
      alert('فشل التصدير. تأكد من تثبيت مكتبة xlsx أو استخدم CSV.')
    }
  }

  // ═══ تصدير PDF (يفتح نافذة طباعة جاهزة Save as PDF) ═══
  const exportPDF = () => {
    const rows = buildExportRows()
    if (rows.length === 0) { alert('لا توجد حجوزات للتصدير'); return }
    const headers = Object.keys(rows[0])
    const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const filterLabel = filter === 'all' ? 'جميع الحجوزات' : (STATUS_LABELS[filter]?.label || filter)
    const html = `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>دِبرة - تقرير الحجوزات</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Tahoma', 'Arial', sans-serif; padding: 20px; color: #2d3a1e; direction: rtl; }
  .header { display:flex; justify-content:space-between; align-items:center; border-bottom: 2px solid #2d3a1e; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { margin:0; font-size: 1.4rem; color:#2d3a1e; }
  .meta { font-size: .82rem; color:#666; }
  table { width: 100%; border-collapse: collapse; font-size: .72rem; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
  th { background: #f6f0d7; font-weight: 700; color: #2d3a1e; }
  tr:nth-child(even) td { background: #fafaf9; }
  .footer { margin-top: 16px; font-size: .72rem; color:#888; text-align:center; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <div class="header">
    <h1>📋 تقرير الحجوزات — دِبرة للرعاية</h1>
    <div class="meta">${date}<br>الفلتر: ${filterLabel} · ${rows.length} حجز</div>
  </div>
  <table>
    <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>
      ${rows.map(r => `<tr>${headers.map(h => `<td>${String((r as any)[h] ?? '').replace(/</g, '&lt;')}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">dibrahcare.com — تم التوليد تلقائياً</div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300))</script>
</body></html>`
    const w = window.open('', '_blank')
    if (!w) { alert('السماح بالنوافذ المنبثقة مطلوب'); return }
    w.document.open(); w.document.write(html); w.document.close()
  }

  // ═══ تصدير Word (يولّد ملف .doc يفتح في Word تلقائياً) ═══
  const exportWord = () => {
    const rows = buildExportRows()
    if (rows.length === 0) { alert('لا توجد حجوزات للتصدير'); return }
    const headers = Object.keys(rows[0])
    const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const filterLabel = filter === 'all' ? 'جميع الحجوزات' : (STATUS_LABELS[filter]?.label || filter)
    const escapeHtml = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    // ملف Word متوافق (HTML داخل غلاف Word)
    const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'>
<title>دِبرة - تقرير الحجوزات</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>90</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  body { font-family: 'Tahoma', 'Arial', sans-serif; direction: rtl; color: #2d3a1e; }
  h1 { font-size: 16pt; color: #2d3a1e; border-bottom: 2pt solid #2d3a1e; padding-bottom: 6pt; }
  .meta { font-size: 9pt; color: #666; margin-bottom: 12pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; }
  th, td { border: 1pt solid #ccc; padding: 4pt 6pt; text-align: right; }
  th { background: #f6f0d7; font-weight: bold; color: #2d3a1e; }
  .footer { margin-top: 14pt; font-size: 8pt; color: #888; text-align: center; }
</style>
</head>
<body>
  <h1>📋 تقرير الحجوزات — دِبرة للرعاية</h1>
  <div class="meta">${date} · الفلتر: ${filterLabel} · ${rows.length} حجز</div>
  <table>
    <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>
      ${rows.map(r => `<tr>${headers.map(h => `<td>${escapeHtml((r as any)[h])}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
  <div class="footer">dibrahcare.com — تم التوليد تلقائياً</div>
</body></html>`

    const blob = new Blob(['\uFEFF' + html], { type: 'application/msword' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = exportFilename('doc')
    a.click()
    URL.revokeObjectURL(url)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', border: '1.5px solid rgba(95,97,87,.2)',
    borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem',
    color: 'var(--dark)', background: '#fafaf9', outline: 'none', direction: 'rtl',
    boxSizing: 'border-box',
  }

  const btnIcon: React.CSSProperties = {
    padding: '6px 10px', background: 'white', border: '1.5px solid rgba(95,97,87,.2)',
    borderRadius: 6, fontSize: '.95rem', cursor: 'pointer', fontFamily: 'inherit',
  }

  // ===== SPLASH =====
  if (splash) return (
    <div style={{ background: 'rgba(95,97,87,.70)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'rtl', backdropFilter: 'blur(2px)' }}>
      <div style={{ textAlign: 'center', padding: '48px 32px', maxWidth: 680, width: '100%' }}>

        {/* Logo */}
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <img src="/images/dibrah-logo.png" alt="دِبرة" style={{ height: 72, width: 'auto', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div style={{ fontSize: '1.1rem', color: 'rgba(246,240,215,.5)', marginBottom: 40, letterSpacing: '.15em' }}>✦ ✦ ✦</div>

        {/* Quranic verse */}
        <div style={{ background: 'rgba(246,240,215,.1)', borderRadius: 24, padding: '32px 40px', marginBottom: 32, border: '1px solid rgba(246,240,215,.2)' }}>
          <div style={{ fontSize: '.8rem', color: 'rgba(246,240,215,.4)', marginBottom: 16, letterSpacing: '.1em' }}>═══ أعوذ بالله من الشيطان الرجيم ═══</div>
          <p style={{ fontSize: '1.3rem', color: '#F6F0D7', lineHeight: 2.2, marginBottom: 12, fontFamily: 'PNU, Tajawal, sans-serif', fontWeight: 700 }}>
            ﴿هُوَ الَّذِي جَعَلَ لَكُمُ الْأَرْضَ ذَلُولًا فَامْشُوا فِي مَنَاكِبِهَا وَكُلُوا مِن رِّزْقِهِ ۖ وَإِلَيْهِ النُّشُورُ﴾
          </p>
          <div style={{ fontSize: '.85rem', color: 'rgba(246,240,215,.45)', fontWeight: 600 }}>📖 سورة الملك — الآية ١٥</div>
        </div>

        {/* Duaa + Shafi side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }} className="splash-grid">
          <div style={{ background: 'rgba(246,240,215,.07)', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(246,240,215,.12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>🤲</div>
            <p style={{ fontSize: '1.05rem', color: 'rgba(246,240,215,.9)', lineHeight: 2, fontFamily: 'PNU, Tajawal, sans-serif', fontWeight: 700, margin: 0 }}>
              اللهم بارك لنا فيما رزقتنا
              <br/>وافتح لنا أبواب فضلك
              <br/>واجعلنا من الشاكرين 🌿
            </p>
          </div>
          <div style={{ background: 'rgba(246,240,215,.07)', borderRadius: 16, padding: '24px 20px', border: '1px solid rgba(246,240,215,.12)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: 12 }}>✍️</div>
            <p style={{ fontSize: '1.05rem', color: 'rgba(246,240,215,.8)', lineHeight: 2, fontFamily: 'PNU, Tajawal, sans-serif', fontWeight: 600, margin: 0 }}>
              وَمَا يَكُ مِنْ رِزْقِي فَلَيْسَ يَفُوتُنِي
              <br/>وَلَوْ كَانَ فِي قَاعِ الْبِحَارِ الْعَوَامِقِ
            </p>
            <div style={{ marginTop: 12, fontSize: '.85rem', color: 'rgba(246,240,215,.4)' }}>— الإمام الشافعي رحمه الله 🕊️</div>
          </div>
        </div>

        {/* Welcome */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>🌟</div>
          <p style={{ fontSize: '1.35rem', fontWeight: 900, color: '#F6F0D7', fontFamily: 'PNU, Tajawal, sans-serif', margin: 0 }}>
            أهلاً وسهلاً بك في لوحة تحكم دِبرة
          </p>
          <p style={{ fontSize: '.9rem', color: 'rgba(246,240,215,.45)', marginTop: 8 }}>جاري التحميل...</p>
        </div>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: '50%', background: 'rgba(246,240,215,.35)', animation: `pulse 1.2s ${i*0.25}s infinite` }} />
          ))}
        </div>
      </div>
      <style jsx global>{`
        @keyframes pulse { 0%,100%{opacity:.2} 50%{opacity:1} }
        @media (max-width: 600px) { .splash-grid { grid-template-columns: 1fr !important; } }
        :root { --muted: #8a8e80; }
      `}</style>
    </div>
  )

  // ===== LOADING (checking session) =====
  if (authChecking) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>جارٍ التحقق...</div>
    </div>
  )

  // ===== LOGIN =====
  if (!auth) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(95,97,87,.1)', border: '1px solid rgba(95,97,87,.12)' }}>
        <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 90, height: 'auto', borderRadius: 14, marginBottom: 18 }} />
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#777C6D', marginBottom: 8, fontFamily: 'PNU, Tajawal, sans-serif' }}>لوحة التحكم</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 28 }}>سجّل دخولك بحسابك</p>

        <div style={{ textAlign: 'right', marginBottom: 14 }}>
          <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6, display: 'block' }}>اسم المستخدم</label>
          <input
            style={{ ...inp, fontSize: '.95rem' }}
            type="text"
            placeholder="khaled"
            value={loginUsername}
            onChange={e => setLoginUsername(e.target.value)}
            autoComplete="username"
            dir="ltr"
            autoFocus
          />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6, display: 'block' }}>كلمة المرور</label>
          <input
            style={{ ...inp, fontSize: '.95rem' }}
            type="password"
            placeholder="••••••••"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()}
            autoComplete="current-password"
          />
        </div>

        {loginError && <div style={{ color: '#b91c1c', fontSize: '.85rem', marginBottom: 12, textAlign: 'center' }}>⚠️ {loginError}</div>}

        <button
          onClick={login}
          disabled={loginLoading}
          style={{ width: '100%', padding: '13px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.6 : 1 }}
        >
          {loginLoading ? '...جارٍ الدخول' : 'دخول'}
        </button>
      </div>
      <style jsx global>{`:root { --muted: #8a8e80; }`}</style>
    </div>
  )

  // ===== DASHBOARD =====
  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', direction: 'rtl', display: 'flex' }}>

        {/* ═══ SIDEBAR ═══ */}
        <aside style={{
          width: 240,
          background: 'white',
          borderLeft: '1px solid rgba(95,97,87,.1)',
          minHeight: '100vh',
          position: 'sticky',
          top: 0,
          padding: '24px 16px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }} className="admin-sidebar">

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, padding: '0 8px' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 44, height: 'auto', borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#777C6D', fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة</div>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>لوحة التحكم</div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'bookings' as const, label: 'الحجوزات', icon: '📋' },
              { id: 'stats' as const, label: 'الإحصائيات', icon: '📊' },
              { id: 'add' as const, label: 'حجز يدوي', icon: '➕' },
              { id: 'users' as const, label: 'الموظفون', icon: '👥' },
            ].map(item => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px',
                    background: active ? 'var(--dark)' : 'transparent',
                    color: active ? '#F6F0D7' : 'var(--dark)',
                    border: 'none', borderRadius: 8,
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '.9rem',
                    cursor: 'pointer', textAlign: 'right', width: '100%',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                  {item.label}
                </button>
              )
            })}

            <div style={{ height: 1, background: 'rgba(95,97,87,.1)', margin: '12px 0' }} />

            <a href="/admindibrah/medical" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🩺</span>
              حجوزات الرعاية الطبية
            </a>

            <a href="/admindibrah/feedback" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⭐</span>
              التقييمات
            </a>
          </nav>

          {/* User & Logout */}
          <div style={{ borderTop: '1px solid rgba(95,97,87,.1)', paddingTop: 14, marginTop: 14 }}>
            {currentUser && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 8,
                background: '#F6F0D7', borderRadius: 8,
              }}>
                <span style={{ fontSize: '1.2rem' }}>👤</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: 800, fontSize: '.85rem', color: 'var(--dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {currentUser.name.split(/\s+/)[0]}
                  </div>
                  <div style={{ fontSize: '.7rem', color: 'var(--muted)', direction: 'ltr', textAlign: 'right' }}>
                    @{currentUser.username}
                  </div>
                </div>
              </div>
            )}
            <button onClick={logout} style={{
              width: '100%', padding: '10px',
              background: 'none', border: '1.5px solid rgba(95,97,87,.2)',
              color: '#c0392b', borderRadius: 8,
              fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem',
              cursor: 'pointer',
            }}>
              🚪 خروج
            </button>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <div style={{ flex: 1, padding: '32px', minWidth: 0 }} className="admin-main">

          {/* Page Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#777C6D', margin: 0 }}>
              {tab === 'bookings' && '📋 الحجوزات'}
              {tab === 'stats' && '📊 الإحصائيات'}
              {tab === 'add' && '➕ حجز يدوي جديد'}
              {tab === 'users' && '👥 إدارة الموظفين'}
              {tab === 'edit' && '✏️ تعديل حجز'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '.88rem', marginTop: 4 }}>
              📅 {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              {tab === 'bookings' && ` · ${bookings.length} حجز إجمالي`}
            </p>
            {tab === 'edit' && (
              <button onClick={() => setTab('bookings')} style={{ marginTop: 8, padding: '6px 14px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>← رجوع للحجوزات</button>
            )}
          </div>

          <div style={{ maxWidth: 1200 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 16, marginBottom: 32 }} className="admin-stats">
            {[
              { label: 'إجمالي الحجوزات', val: bookings.length, color: '#5f6157' },
              { label: 'جديد', val: bookings.filter(b => b.status === 'new').length, color: '#3b82f6' },
              { label: 'مؤكدة', val: bookings.filter(b => b.status === 'confirmed').length, color: '#22c55e' },
              { label: 'قيد المراجعة', val: bookings.filter(b => b.status === 'pending').length, color: '#f59e0b' },
              { label: 'منفذة', val: bookings.filter(b => b.status === 'executed').length, color: '#8b5cf6' },
              { label: 'ملغية', val: bookings.filter(b => b.status === 'cancelled').length, color: '#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(95,97,87,.1)', boxShadow: '0 2px 8px rgba(95,97,87,.05)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {tab === 'stats' && (
            <div>
              {statsLoading ? (
                <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>جاري التحميل...</div>
              ) : stats ? (
                <>
                  {/* ملخص سريع */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }} className="stats-summary">
                    <div style={{ background: 'var(--dark)', color: '#F6F0D7', borderRadius: 16, padding: '22px 24px' }}>
                      <div style={{ fontSize: '.8rem', opacity: .8, marginBottom: 6 }}>عدد المسجّلين</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.registered}</div>
                      <div style={{ fontSize: '.78rem', opacity: .75, marginTop: 6 }}>+{stats.registered_today} اليوم</div>
                    </div>
                    <div style={{ background: '#8b5a2b', color: '#F6F0D7', borderRadius: 16, padding: '22px 24px' }}>
                      <div style={{ fontSize: '.8rem', opacity: .85, marginBottom: 6 }}>عدد الذين طلبوا الخدمة</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stats.bookings}</div>
                      <div style={{ fontSize: '.78rem', opacity: .8, marginTop: 6 }}>+{stats.bookings_today} اليوم</div>
                    </div>
                    <div style={{ background: 'white', border: '1.5px solid rgba(95,97,87,.12)', borderRadius: 16, padding: '22px 24px' }}>
                      <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 6 }}>نسبة التحويل</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark)' }}>
                        {stats.registered > 0 ? Math.round((stats.bookings / stats.registered) * 100) : 0}%
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6 }}>مسجّل → حاجز</div>
                    </div>
                    <div style={{ background: 'white', border: '1.5px solid rgba(95,97,87,.12)', borderRadius: 16, padding: '22px 24px' }}>
                      <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginBottom: 6 }}>إجمالي الزيارات اليوم</div>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark)' }}>
                        {(stats.visits.home?.today || 0) + (stats.visits.services?.today || 0) + (stats.visits.register?.today || 0)}
                      </div>
                      <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginTop: 6 }}>عبر كل الصفحات</div>
                    </div>
                  </div>

                  {/* جدول زيارات الصفحات */}
                  <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(95,97,87,.1)', marginBottom: 24 }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(95,97,87,.08)', background: '#fafaf7' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>زيارات الصفحات الرئيسية</h3>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
                        <thead>
                          <tr style={{ background: 'var(--dark)', color: '#F6F0D7' }}>
                            {['الصفحة','اليوم','الأسبوع','الشهر','الإجمالي','زوار فريدون'].map(h => (
                              <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 800, fontSize: '.85rem' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { key: 'home',     label: 'الرئيسية' },
                            { key: 'services', label: 'الخدمات' },
                            { key: 'register', label: 'التسجيل' },
                          ].map((p, i) => {
                            const v = stats.visits[p.key] || {}
                            return (
                              <tr key={p.key} style={{ borderTop: '1px solid rgba(95,97,87,.08)', background: i % 2 ? '#fafaf7' : 'white' }}>
                                <td style={{ padding: '14px 16px', fontSize: '.92rem', fontWeight: 700, color: 'var(--dark)' }}>{p.label}</td>
                                <td style={{ padding: '14px 16px', fontSize: '.92rem', color: '#22c55e', fontWeight: 700 }}>{v.today || 0}</td>
                                <td style={{ padding: '14px 16px', fontSize: '.92rem', color: 'var(--muted)' }}>{v.week || 0}</td>
                                <td style={{ padding: '14px 16px', fontSize: '.92rem', color: 'var(--muted)' }}>{v.month || 0}</td>
                                <td style={{ padding: '14px 16px', fontSize: '.92rem', fontWeight: 700, color: 'var(--dark)' }}>{v.total || 0}</td>
                                <td style={{ padding: '14px 16px', fontSize: '.85rem', color: 'var(--muted)' }}>{v.unique_total || 0}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <button onClick={loadStats} style={{ padding: '10px 20px', background: 'white', border: '1.5px solid var(--dark)', color: 'var(--dark)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>
                    🔄 تحديث الأرقام
                  </button>
                </>
              ) : (
                <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
                  اضغط تحديث لتحميل الإحصائيات
                  <br />
                  <button onClick={loadStats} style={{ marginTop: 12, padding: '10px 24px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer' }}>
                    تحميل
                  </button>
                </div>
              )}
            </div>
          )}

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
                  {['all', 'new', 'confirmed', 'pending', 'executed', 'cancelled'].map(f => (
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

                {/* أزرار التصدير */}
                <div style={{ display: 'flex', gap: 6, marginRight: 'auto' }}>
                  <button onClick={exportExcel} title="تصدير Excel" style={{ padding: '10px 14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                    📊 Excel
                  </button>
                  <button onClick={exportWord} title="تصدير Word" style={{ padding: '10px 14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                    📄 Word
                  </button>
                  <button onClick={exportPDF} title="تصدير PDF" style={{ padding: '10px 14px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.82rem', cursor: 'pointer' }}>
                    🖨️ PDF
                  </button>
                </div>
              </div>

              {/* Table */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>جاري التحميل...</div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)', background: 'white', borderRadius: 20 }}>لا توجد حجوزات</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="admin-cards">
                  {filtered.map(b => {
                    const st = STATUS_LABELS[b.status] || STATUS_LABELS.pending
                    return (
                      <div key={b.id} style={{ background: 'white', borderRadius: 20, border: '1px solid rgba(95,97,87,.1)', boxShadow: '0 2px 12px rgba(95,97,87,.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {/* Card Header */}
                        <div style={{ background: 'var(--dark)', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 900, color: '#F6F0D7', fontSize: '.9rem' }}>{PKG_LABELS[b.package] || b.package}</div>
                          <span style={{ fontSize: '.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20, background: st.color + '25', color: st.color, border: `1px solid ${st.color}40` }}>{st.label}</span>
                        </div>
                        {/* Card Body */}
                        <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div>
                            <div style={{ fontWeight: 900, color: 'var(--dark)', fontSize: '.92rem' }}>{b.customers?.name || '—'}</div>
                            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 2 }}>{b.customers?.phone || '—'}</div>
                            <div style={{ fontSize: '.78rem', color: 'rgba(95,97,87,.5)', marginTop: 2 }}>المستفيد: {b.beneficiary_name}</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '.8rem' }}>
                            <div><span style={{ color: 'var(--muted)' }}>📅 </span><span style={{ fontWeight: 700 }}>{b.start_date}</span></div>
                            <div><span style={{ color: 'var(--muted)' }}>🕐 </span><span style={{ fontWeight: 700 }}>{b.start_time}</span></div>
                            <div><span style={{ color: 'var(--muted)' }}>💰 </span><span style={{ fontWeight: 700 }}>{b.price?.toLocaleString('ar-SA')} ر</span></div>
                            <div><span style={{ color: 'var(--muted)' }}>🗓 </span><span style={{ fontWeight: 700 }}>{new Date(b.created_at).toLocaleDateString('ar-SA')}</span></div>
                          </div>
                          {/* Status select */}
                          <select value={b.status} onChange={e => updateStatus(b.id, e.target.value)} style={{ ...inp, fontSize: '.8rem', padding: '7px 10px', marginTop: 4 }}>
                            <option value="new">جديد</option>
                            <option value="pending">قيد المراجعة</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="executed">منفذ</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </div>
                        {/* Notes */}
                        <div style={{ padding: '0 18px 12px' }}>
                          <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginBottom: 6 }}>📝 ملاحظات</div>
                          {b.id in editNotes ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <textarea
                                value={editNotes[b.id]}
                                onChange={e => setEditNotes(n => ({ ...n, [b.id]: e.target.value }))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1.5px solid rgba(95,97,87,.2)', fontFamily: 'inherit', fontSize: '.8rem', resize: 'none', minHeight: 56, direction: 'rtl', boxSizing: 'border-box' }}
                              />
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button onClick={() => saveNote(b.id)} disabled={savingNote === b.id} style={{ flex: 1, padding: '6px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 6, fontFamily: 'inherit', fontWeight: 700, fontSize: '.76rem', cursor: 'pointer' }}>
                                  {savingNote === b.id ? 'جاري...' : 'حفظ'}
                                </button>
                                <button onClick={() => setEditNotes(n => { const r = { ...n }; delete r[b.id]; return r })} style={{ padding: '6px 10px', background: 'none', border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 6, fontFamily: 'inherit', fontSize: '.76rem', cursor: 'pointer', color: 'var(--muted)' }}>
                                  إلغاء
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={() => setEditNotes(n => ({ ...n, [b.id]: b.notes || '' }))} style={{ fontSize: '.8rem', color: b.notes ? 'var(--dark)' : 'var(--muted)', cursor: 'pointer', padding: '7px 10px', borderRadius: 8, border: '1.5px dashed rgba(95,97,87,.2)', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                              {b.notes || 'اضغط لإضافة ملاحظة...'}
                            </div>
                          )}
                        </div>
                        {/* Card Footer - Action Buttons */}
                        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(95,97,87,.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <button onClick={() => openDetails(b.id)}
                            style={{ padding: '9px', background: '#6b5ca5', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                            📋 التفاصيل
                          </button>
                          <button onClick={() => whatsapp(b.customers?.phone || '', b.customers?.name || '', b.package, b.start_date)}
                            style={{ padding: '9px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                            💬 واتساب
                          </button>
                          <button onClick={() => { setEditData(b); setTab('edit') }}
                            style={{ padding: '9px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                            ✏️ تعديل
                          </button>
                          <button onClick={() => {
                            const link = `${window.location.origin}/feedback?bookingId=${b.id}`
                            const phone = (b.customers?.phone || '').replace(/^0/, '966').replace(/\D/g, '')
                            const name = b.customers?.name || ''
                            const msg = `مرحباً ${name} 💚%0Aنشكرك على ثقتك بدِبرة. نتمنى أن تشاركنا تقييمك للخدمة من خلال هذا الرابط:%0A${link}`
                            window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
                          }}
                            style={{ padding: '9px', background: '#f5b800', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer', gridColumn: 'span 3' }}>
                            ⭐ إرسال رابط التقييم
                          </button>
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
                    <option value="executed">منفذ</option>
                    <option value="executed">منفذ</option>
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

          {tab === 'users' && (
            <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid rgba(95,97,87,.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontWeight: 900, color: 'var(--dark)', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>👥 إدارة الموظفين</h2>
                <button onClick={openCreateUser} style={{ padding: '10px 20px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>+ موظف جديد</button>
              </div>

              {usersLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>جارٍ التحميل...</div>
              ) : adminUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>لا يوجد موظفون</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(95,97,87,.15)' }}>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.85rem', color: 'var(--muted)', fontWeight: 700 }}>الاسم</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.85rem', color: 'var(--muted)', fontWeight: 700 }}>اسم المستخدم</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.85rem', color: 'var(--muted)', fontWeight: 700 }}>الحالة</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.85rem', color: 'var(--muted)', fontWeight: 700 }}>آخر دخول</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.85rem', color: 'var(--muted)', fontWeight: 700 }}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adminUsers.map(u => (
                        <tr key={u.id} style={{ borderBottom: '1px solid rgba(95,97,87,.08)' }}>
                          <td style={{ padding: 14, fontWeight: 800, color: 'var(--dark)' }}>
                            {u.name}
                            {u.username === currentUser?.username && <span style={{ marginRight: 6, fontSize: '.75rem', color: 'var(--muted)' }}>(أنت)</span>}
                          </td>
                          <td style={{ padding: 14, fontSize: '.88rem', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{u.username}</td>
                          <td style={{ padding: 14 }}>
                            <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: '.78rem', fontWeight: 700, background: u.active ? '#dcfce7' : '#fee2e2', color: u.active ? '#15803d' : '#b91c1c' }}>
                              {u.active ? 'نشط' : 'معطّل'}
                            </span>
                          </td>
                          <td style={{ padding: 14, fontSize: '.82rem', color: 'var(--muted)' }}>
                            {u.last_login ? new Date(u.last_login).toLocaleDateString('ar-SA') : '—'}
                          </td>
                          <td style={{ padding: 14 }}>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button onClick={() => openEditUser(u)} style={btnIcon} title="تعديل">✏️</button>
                              <button onClick={() => openChangePassword(u)} style={btnIcon} title="كلمة المرور">🔑</button>
                              <button onClick={() => toggleUserActive(u)} style={btnIcon} title={u.active ? 'تعطيل' : 'تفعيل'}>
                                {u.active ? '🚫' : '✅'}
                              </button>
                              {u.username !== currentUser?.username && (
                                <button onClick={() => deleteUser(u)} style={{ ...btnIcon, color: '#b91c1c' }} title="حذف">🗑️</button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* === User Modal === */}
          {showUserModal && (
            <div onClick={() => !userSaving && setShowUserModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 32, maxWidth: 460, width: '100%' }}>
                <h3 style={{ margin: 0, marginBottom: 20, color: 'var(--dark)', fontWeight: 900 }}>
                  {showUserModal === 'create' ? '+ إضافة موظف جديد'
                    : showUserModal.mode === 'edit' ? '✏️ تعديل بيانات الموظف'
                    : '🔑 تغيير كلمة المرور'}
                </h3>

                {(showUserModal === 'create' || (typeof showUserModal === 'object' && showUserModal.mode === 'edit')) && <>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>الاسم الكامل</label>
                    <input style={inp} value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="مثال: سارة محمد" />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>اسم المستخدم</label>
                    <input style={{ ...inp, direction: 'ltr', textAlign: 'left', fontFamily: 'monospace' }} type="text" value={userForm.username} onChange={e => setUserForm(f => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))} placeholder="sara" maxLength={20} />
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: 4 }}>إنجليزي/أرقام/_ فقط (3-20 حرف)</div>
                  </div>
                </>}

                {(showUserModal === 'create' || (typeof showUserModal === 'object' && showUserModal.mode === 'password')) && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>كلمة المرور (8 أحرف فأكثر)</label>
                    <input style={inp} type="text" value={userForm.password} onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" />
                    <div style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 6 }}>📝 احفظها وسلّمها للموظف بطريقة آمنة</div>
                  </div>
                )}

                {userMsg && (
                  <div style={{ padding: 10, borderRadius: 8, marginBottom: 14, fontSize: '.85rem', background: userMsg.type === 'ok' ? '#dcfce7' : '#fee2e2', color: userMsg.type === 'ok' ? '#15803d' : '#b91c1c' }}>{userMsg.text}</div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                  <button onClick={() => setShowUserModal(null)} disabled={userSaving} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: 'pointer' }}>إلغاء</button>
                  <button onClick={submitUserForm} disabled={userSaving} style={{ padding: '10px 20px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.88rem', cursor: userSaving ? 'wait' : 'pointer', opacity: userSaving ? 0.6 : 1 }}>
                    {userSaving ? '...جارٍ الحفظ' : 'حفظ'}
                  </button>
                </div>
              </div>
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
                    <option value="executed">منفذ</option>
                    <option value="executed">منفذ</option>
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
      </div>

      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-cards { grid-template-columns: repeat(2,1fr) !important; }
          .add-grid { grid-template-columns: 1fr !important; }
          .stats-summary { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            top: 70px !important;
            right: 0;
            z-index: 100;
            box-shadow: -4px 0 16px rgba(0,0,0,.08);
            transform: translateX(100%);
          }
          .admin-main { padding: 20px !important; }
        }
        @media (max-width: 600px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-cards { grid-template-columns: 1fr !important; }
          .stats-summary { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══ Booking Details Modal ═══ */}
      {detailsFor && (
        <div onClick={() => setDetailsFor(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          padding: '40px 20px', zIndex: 9999, overflowY: 'auto',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'white', borderRadius: 20, maxWidth: 780, width: '100%',
            maxHeight: 'calc(100vh - 80px)', overflowY: 'auto',
            boxShadow: '0 20px 80px rgba(0,0,0,.2)',
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'var(--dark)', padding: '20px 28px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              position: 'sticky', top: 0, zIndex: 10,
            }}>
              <div style={{ color: '#F6F0D7', fontWeight: 900, fontSize: '1.1rem', fontFamily: 'PNU, Tajawal, sans-serif' }}>
                📋 تفاصيل الحجز الكاملة
              </div>
              <button onClick={() => setDetailsFor(null)} style={{
                background: 'rgba(255,255,255,.15)', color: '#F6F0D7',
                border: 'none', width: 34, height: 34, borderRadius: '50%',
                fontSize: '1.2rem', cursor: 'pointer', fontWeight: 700,
              }}>✕</button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '28px' }}>
              {detailsLoading && (
                <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                  جاري التحميل...
                </div>
              )}

              {!detailsLoading && detailsData && (
                <DetailsContent data={detailsData} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ═══ مكوّن عرض التفاصيل ═══
function DetailsContent({ data }: { data: any }) {
  const { booking, customer, registration, detail } = data

  const Section = ({ title, icon, children }: any) => (
    <div style={{
      background: '#fafaf7', borderRadius: 12, padding: '18px 20px',
      marginBottom: 14, border: '1px solid rgba(95,97,87,.1)',
    }}>
      <div style={{
        fontWeight: 900, color: 'var(--dark)', fontSize: '.95rem',
        marginBottom: 12, fontFamily: 'PNU, Tajawal, sans-serif',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{icon}</span>{title}
      </div>
      {children}
    </div>
  )

  const Row = ({ label, value }: any) => (
    <div style={{ display: 'flex', gap: 10, marginBottom: 6, fontSize: '.85rem' }}>
      <span style={{ color: 'var(--muted)', minWidth: 120 }}>{label}:</span>
      <span style={{ color: 'var(--dark)', fontWeight: 600 }}>{value || '—'}</span>
    </div>
  )

  const regType = registration?.type
  const typeLabel = regType === 'child' ? '👶 رعاية أطفال'
                  : regType === 'elderly' ? '👴 رعاية كبار السن'
                  : regType === 'medical' ? '🏥 رعاية طبية'
                  : '—'

  // تجميع الاستبانة في مجموعات منطقية
  const renderDetail = () => {
    if (!detail || typeof detail !== 'object') return null
    const entries = Object.entries(detail).filter(([_, v]) => v && v !== '')
    if (!entries.length) return null

    return (
      <Section title="نتائج الاستبانة" icon="📝">
        {entries.map(([k, v]) => (
          <Row key={k} label={k} value={String(v)} />
        ))}
      </Section>
    )
  }

  return (
    <>
      {/* تفاصيل الحجز */}
      <Section title="تفاصيل الحجز" icon="📦">
        <Row label="رقم الحجز" value={booking.id?.slice(0, 8)} />
        <Row label="الباقة" value={booking.package} />
        <Row label="التاريخ" value={booking.start_date} />
        <Row label="الوقت" value={booking.start_time} />
        <Row label="السعر" value={`${booking.price?.toLocaleString('ar-SA')} ر.س`} />
        <Row label="الحالة" value={booking.status} />
        <Row label="نوع الخدمة" value={typeLabel} />
        {booking.track_id && <Row label="رقم العملية" value={booking.track_id} />}
        {booking.payment_id && <Row label="الرقم المرجعي (البنك)" value={booking.payment_id} />}
      </Section>

      {/* بيانات المشترك */}
      <Section title="بيانات المشترك" icon="👤">
        <Row label="الاسم" value={customer?.name} />
        <Row label="الجوال" value={customer?.phone} />
        <Row label="رقم الهوية" value={customer?.national_id} />
        <Row label="الجنسية" value={customer?.nationality} />
        <Row label="العنوان" value={customer?.address} />
        {registration?.subscriber_job && <Row label="الوظيفة" value={registration.subscriber_job} />}
      </Section>

      {/* بيانات المستفيد */}
      <Section title="بيانات المستفيد" icon={regType === 'elderly' ? '👴' : '👶'}>
        <Row label="الاسم" value={booking.beneficiary_name} />
        <Row label="العمر" value={booking.beneficiary_age} />
        <Row label="صلة القرابة" value={booking.beneficiary_relation} />
        <Row label="جوال الطوارئ" value={booking.emergency_phone} />
      </Section>

      {/* الاستبانة */}
      {renderDetail()}

      {/* الملاحظات الداخلية */}
      {booking.notes && (
        <Section title="ملاحظات داخلية" icon="📌">
          <div style={{ fontSize: '.88rem', lineHeight: 1.8, color: 'var(--dark)' }}>
            {booking.notes}
          </div>
        </Section>
      )}

      {/* زر واتساب + طباعة */}
      <div style={{ marginTop: 20, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <a href={`https://wa.me/${(customer?.phone || '').replace(/^0/, '966').replace(/\D/g, '')}`}
          target="_blank" rel="noreferrer" style={{
          flex: 1, minWidth: 180, padding: '12px', background: '#25D366', color: 'white',
          borderRadius: 10, textAlign: 'center', fontWeight: 800, fontSize: '.9rem',
          textDecoration: 'none',
        }}>
          💬 تواصل عبر واتساب
        </a>
        <a href={`/print/${booking.id}`} target="_blank" rel="noreferrer" style={{
          flex: 1, minWidth: 180, padding: '12px', background: 'var(--dark)', color: '#F6F0D7',
          borderRadius: 10, textAlign: 'center', fontWeight: 800, fontSize: '.9rem',
          textDecoration: 'none',
        }}>
          🖨️ طباعة ملف العميل
        </a>
      </div>
    </>
  )
}
