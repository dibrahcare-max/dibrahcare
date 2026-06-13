'use client'
import { useState, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import MobileMenuTab from '@/components/MobileMenuTab'

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
  service_type?: string
  service_details?: any
  package: string
  package_id?: string
  amount?: number
  start_date: string
  start_time: string
  end_time?: string
  price: number
  status: string
  payment_status?: string
  track_id: string
  payment_id?: string
  notes: string
  created_at: string
  customers?: { full_name: string; phone: string; national_id: string; email: string; nationality: string; city?: string; district: string; street: string; emergency_phone: string; short_address: string; vat_number?: string }
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
  const [tab, setTab]             = useState<'bookings'|'add'|'edit'|'stats'|'users'|'customers'|'custom'>('bookings')
  const [customRequests, setCustomRequests] = useState<any[]>([])
  const [customLoading, setCustomLoading]   = useState(false)
  const [pricingModal, setPricingModal]     = useState<{id:string; name:string} | null>(null)
  const [pricingAmount, setPricingAmount]   = useState('')
  const [pricingSending, setPricingSending] = useState(false)
  const [pricingError, setPricingError]     = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
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
  
  // ═══ العملاء المسجّلون ═══
  type Customer = {
    id: string
    full_name: string
    phone: string
    national_id: string
    email: string
    nationality: string
    district: string
    street: string
    short_address: string
    emergency_phone: string
    referral_source?: string
    created_at: string
    last_messaged_at?: string
  }
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customersLoading, setCustomersLoading] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  
  // ═══ إرسال واتساب جماعي ═══
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkMessage, setBulkMessage] = useState('')
  const [bulkSending, setBulkSending] = useState(false)
  const [bulkResults, setBulkResults] = useState<any>(null)
  const [showUserModal, setShowUserModal] = useState<'create' | { mode: 'edit' | 'password'; user: AdminUser } | null>(null)
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '' })
  const [userMsg, setUserMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [userSaving, setUserSaving] = useState(false)

  // نمط البالونة الحمراء للتنبيهات
  const badgeStyle: React.CSSProperties = {
    marginRight: 'auto',
    minWidth: 20, height: 20, padding: '0 6px',
    background: '#dc2626', color: '#fff',
    borderRadius: 999, fontSize: '.72rem', fontWeight: 900,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1, boxShadow: '0 0 0 2px rgba(220,38,38,.25)',
    animation: 'dibrahPulse 1.6s ease-in-out infinite',
  }

  // ═══ تنبيهات الجديد (Badges) — الرعاية الطبية / التقييمات / العملاء ═══
  const [newCounts, setNewCounts] = useState<{ medical: number; feedback: number; customers: number }>({ medical: 0, feedback: 0, customers: 0 })
  const prevTotalRef = useRef(0)
  const audioCtxRef = useRef<any>(null)

  // مفاتيح آخر زيارة في المتصفح
  const seenKey = (k: string) => `dibrah_seen_${k}`
  const getSeen = (k: string): string | null => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(seenKey(k))
  }
  const markSeen = (k: string) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(seenKey(k), new Date().toISOString())
    setNewCounts(prev => ({ ...prev, [k]: 0 }))
  }

  // صوت تنبيه لطيف (Web Audio — بدون ملفات)
  const playDing = () => {
    try {
      if (!audioCtxRef.current) {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
        if (!Ctx) return
        audioCtxRef.current = new Ctx()
      }
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.36)
    } catch {}
  }

  // أول تحميل: لو ما فيه وقت زيارة سابق، نضع "الآن" كخط أساس (فلا يظهر القديم كجديد)
  useEffect(() => {
    if (!auth) return
    ;['medical', 'feedback', 'customers'].forEach(k => {
      if (!getSeen(k)) localStorage.setItem(seenKey(k), new Date().toISOString())
    })
  }, [auth])

  // قراءة التبويب من الرابط (?tab=) — للتنقّل من الصفحات المنفصلة
  useEffect(() => {
    if (!auth) return
    const t = new URLSearchParams(window.location.search).get('tab')
    if (t && ['bookings', 'add', 'stats', 'users', 'customers'].includes(t)) {
      setTab(t as any)
    }
  }, [auth])

  // الفحص الدوري كل ٤٥ ثانية
  useEffect(() => {
    if (!auth) return
    let active = true
    const check = async () => {
      try {
        const res = await fetch('/api/admin/new-counts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            since: {
              medical: getSeen('medical'),
              feedback: getSeen('feedback'),
              customers: getSeen('customers'),
            },
          }),
        })
        const d = await res.json()
        if (!active || !d?.success) return
        const counts = { medical: d.medical || 0, feedback: d.feedback || 0, customers: d.customers || 0 }
        const total = counts.medical + counts.feedback + counts.customers
        if (total > prevTotalRef.current) playDing() // صوت عند وصول جديد
        prevTotalRef.current = total
        setNewCounts(counts)
      } catch {}
    }
    check() // فوراً
    const iv = setInterval(check, 45000)
    return () => { active = false; clearInterval(iv) }
  }, [auth])

  useEffect(() => {
    if (auth) fetchBookings()
  }, [auth])

  useEffect(() => {
    if (auth && tab === 'stats' && !stats) loadStats()
    // الإحصائيات تحتاج بيانات العملاء لرسم قنوات الاكتساب
    if (auth && tab === 'stats' && customers.length === 0) loadCustomers()
  }, [auth, tab])

  useEffect(() => {
    if (auth && tab === 'users') loadAdminUsers()
    if (auth && tab === 'customers') { loadCustomers(); markSeen('customers') }
    if (auth && tab === 'custom') loadCustomRequests()
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

  // ═══ تحميل العملاء المسجّلين ═══
  const loadCustomers = async () => {
    setCustomersLoading(true)
    try {
      const res = await fetch('/api/admin/list?resource=customers')
      const json = await res.json()
      if (!res.ok) console.error('loadCustomers:', json.error)
      setCustomers(json.data || [])
    } catch (e: any) {
      console.error('loadCustomers exception:', e?.message)
    }
    setCustomersLoading(false)
  }

  // ═══ إرسال واتساب جماعي ═══
  const toggleCustomer = (id: string) => {
    setSelectedCustomers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const toggleAllCustomers = (filteredIds: string[]) => {
    setSelectedCustomers(prev => {
      const allSelected = filteredIds.every(id => prev.has(id))
      const next = new Set(prev)
      if (allSelected) {
        filteredIds.forEach(id => next.delete(id))
      } else {
        filteredIds.forEach(id => next.add(id))
      }
      return next
    })
  }

  const openBulkModal = () => {
    setBulkMessage('')
    setBulkResults(null)
    setShowBulkModal(true)
  }

  const sendBulkWhatsApp = async () => {
    if (!bulkMessage.trim() || bulkMessage.trim().length < 2) {
      alert('الرجاء كتابة رسالة')
      return
    }
    if (selectedCustomers.size === 0) {
      alert('الرجاء اختيار مستلمين')
      return
    }

    setBulkSending(true)
    setBulkResults(null)

    try {
      const recipients = customers
        .filter(c => selectedCustomers.has(c.id) && c.phone)
        .map(c => ({ id: c.id, phone: c.phone, name: c.full_name }))

      const res = await fetch('/api/admin/whatsapp-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, message: bulkMessage }),
      })
      const data = await res.json()
      setBulkResults(data)

      if (data.success) {
        // أعد تحميل العملاء لتحديث last_messaged_at
        await loadCustomers()
      }
    } catch (e: any) {
      setBulkResults({ success: false, message: e?.message || 'خطأ في الإرسال' })
    }
    setBulkSending(false)
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
    try {
      const res = await fetch('/api/admin/list?resource=bookings')
      const json = await res.json()
      if (!res.ok) console.error('fetchBookings error:', json.error)
      setBookings(json.data || [])
    } catch (e: any) {
      console.error('fetchBookings exception:', e?.message)
    }
    setLoading(false)
  }

  // ─── إرسال طلب التقييم عبر UltraMSG (يُستدعى عند انتقال الحجز لـ "منفذ") ───
  const sendFeedbackRequest = async (booking: any) => {
    try {
      const phone = booking?.customers?.phone || booking?.subscriber_phone || ''
      const name  = booking?.customers?.full_name || booking?.subscriber_name || 'عميلنا'
      if (!phone || !booking?.id) return
      const link = `${window.location.origin}/feedback?bookingId=${booking.id}`
      await fetch('/api/twilio-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: phone,
          template: 'feedbackRequest',
          params: [name, link],
        }),
      })
    } catch (e) {
      console.warn('[feedback whatsapp] send failed:', e)
      // لا نوقف الـ flow حتى لو فشل الإرسال
    }
  }

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/bookings/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setBookings(b => b.map(x => x.id === id ? { ...x, status } : x))
    // ملاحظة: طلب التقييم يُرسل تلقائياً عبر scheduler بعد انتهاء الموعد بـ ١٥ دقيقة
    // الزر اليدوي أدناه يظل متاحاً كاحتياط
  }

  const saveNote = async (id: string) => {
    setSavingNote(id)
    await fetch(`/api/admin/bookings/${id}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editNotes[id] }),
    })
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
  // الأسبوع = اليوم + 6 أيام قادمة (٧ أيام شاملة)
  const weekEnd = new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  // الشهر = من أول يوم في الشهر الحالي إلى آخر يوم
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  // مساعد: استخراج start_date من حقل notes (مخزّن كـ JSON string)
  const getStartDate = (b: any): string => {
    try {
      if (!b.notes) return ''
      const parsed = typeof b.notes === 'string' ? JSON.parse(b.notes) : b.notes
      return parsed?.start_date || ''
    } catch {
      return ''
    }
  }

  const filtered = bookings.filter(b => {
    const startDate = getStartDate(b)
    const matchPeriod = period === 'all' ||
      (period === 'today' && startDate === today) ||
      (period === 'week'  && startDate >= today      && startDate <= weekEnd) ||
      (period === 'month' && startDate >= monthStart && startDate <= monthEnd)
    if (!matchPeriod) return false
    const matchStatus = filter === 'all' || b.status === filter
    const matchSearch = !search ||
      b.customers?.full_name?.includes(search) ||
      b.customers?.phone?.includes(search) ||
      b.beneficiary_name?.includes(search)
    return matchStatus && matchSearch
  })

  // ═══ تجهيز بيانات التصدير من الحجوزات المفلترة (كاملة) ═══
  const buildExportRows = () => filtered.map(b => {
    // فك الـ notes لاستخراج تفاصيل الخصم والإهداء والتواريخ
    let meta: any = {}
    try {
      if (b.notes && typeof b.notes === 'string' && b.notes.trim().startsWith('{')) {
        meta = JSON.parse(b.notes)
      }
    } catch {}
    const subtotal       = meta.subtotal
    const discountAmount = meta.discount_amount
    const discountCode   = meta.discount_code
    const discountPct    = meta.discount_percent
    const finalAmount    = (b as any).amount ?? b.price ?? ''
    const trackId        = meta.trackId || meta.track_id || (b as any).track_id || ''
    const paymentId      = meta.paymentId || meta.payment_id || (b as any).payment_id || ''

    // ─── استخراج بيانات المستفيدين من service_details ───
    let beneficiaryNames = ''
    let beneficiaryAges = ''
    let beneficiaryDetails = ''
    try {
      const sd = typeof b.service_details === 'string' ? JSON.parse(b.service_details) : b.service_details
      if (sd?.type === 'multi' && Array.isArray(sd.beneficiaries)) {
        beneficiaryNames = sd.beneficiaries.map((x: any) => x.name).filter(Boolean).join(' | ')
        beneficiaryAges = sd.beneficiaries.map((x: any) => x.age).filter(Boolean).join(' | ')
        beneficiaryDetails = sd.beneficiaries.map((x: any, i: number) =>
          `[${i + 1}] ${x.name || ''} - عمر: ${x.age || ''} - هوية: ${x.national_id || ''} - جوال: ${x.phone || ''}${x.recommendations ? ' - توصيات: ' + x.recommendations : ''}`
        ).join(' || ')
      } else if (sd?.type === 'child' && Array.isArray(sd.children)) {
        beneficiaryNames = sd.children.map((x: any) => x.name).filter(Boolean).join(' | ')
        beneficiaryAges = sd.children.map((x: any) => x.age).filter(Boolean).join(' | ')
        beneficiaryDetails = sd.children.map((x: any, i: number) =>
          `[${i + 1}] ${x.name || ''} - عمر: ${x.age || ''}`
        ).join(' || ')
      } else if (sd?.type === 'elderly' && sd.elderly) {
        beneficiaryNames = sd.elderly.name || ''
        beneficiaryAges = sd.elderly.age || ''
      }
    } catch {}
    // fallback لأعمدة الحجز اليدوي
    if (!beneficiaryNames) beneficiaryNames = b.beneficiary_name || ''
    if (!beneficiaryAges) beneficiaryAges = b.beneficiary_age || ''

    return {
    // ─── معلومات الحجز ───
    'رقم الحجز':          b.id || '',
    'تاريخ الإنشاء':      b.created_at ? new Date(b.created_at).toLocaleString('ar-SA') : '',
    'الحالة':             STATUS_LABELS[b.status]?.label || b.status,

    // ─── بيانات العميل (المشترك) ───
    'اسم المشترك':        b.customers?.full_name || '',
    'جوال المشترك':       b.customers?.phone || '',
    'رقم الهوية':         b.customers?.national_id || '',
    'البريد الإلكتروني':  b.customers?.email || '',
    'الجنسية':            b.customers?.nationality || '',
    'المدينة':            b.customers?.city || 'الرياض',
    'الحي':               b.customers?.district || '',
    'الشارع':             b.customers?.street || '',
    'العنوان الوطني':     b.customers?.short_address || '',
    'جوال الطوارئ':       b.customers?.emergency_phone || '',

    // ─── بيانات المستفيد (من service_details) ───
    'اسم المستفيد':       beneficiaryNames,
    'عمر المستفيد':       beneficiaryAges,
    'صلة القرابة':        b.beneficiary_relation || '',
    'تفاصيل المستفيدين':  beneficiaryDetails,

    // ─── تفاصيل الخدمة (من meta للدقة) ───
    'الخدمة':             meta.service_key || b.service || '',
    'الباقة':             meta.package_label || PKG_LABELS[b.package] || b.package || '',
    'تاريخ البداية':      meta.start_date || b.start_date || '',
    'وقت البداية':        meta.start_time || b.start_time || '',
    'وقت النهاية':        meta.end_time || b.end_time || '',

    // ─── الدفع (مع تفصيل الخصم — مهم للضرائب والفوترة) ───
    'المبلغ الأصلي':       subtotal ?? finalAmount,
    'كود الخصم':           discountCode || '',
    'نسبة الخصم':          discountPct ? `${discountPct}%` : '',
    'مبلغ الخصم':          discountAmount ?? '',
    'المبلغ المدفوع':      finalAmount,
    'رقم التتبع':         trackId,
    'الرقم المرجعي':      paymentId,
    }
  })

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

  // ═══ تصدير PDF (تخطيط بطاقات — يفتح نافذة طباعة جاهزة Save as PDF) ═══
  const exportPDF = () => {
    const rows = buildExportRows()
    if (rows.length === 0) { alert('لا توجد حجوزات للتصدير'); return }
    const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const filterLabel = filter === 'all' ? 'جميع الحجوزات' : (STATUS_LABELS[filter]?.label || filter)
    const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

    const renderCard = (r: any) => `
<div class="card">
  <div class="card-bar">
    <span class="id">حجز رقم: ${esc(r['رقم الحجز'])}</span>
    <span class="status">${esc(r['الحالة'])}</span>
    <span class="date">${esc(r['تاريخ الإنشاء'])}</span>
  </div>

  <div class="section">
    <div class="section-title">👤 بيانات المشترك</div>
    <div class="fields">
      <div class="field"><span class="lbl">الاسم:</span><span class="val">${esc(r['اسم المشترك'])}</span></div>
      <div class="field"><span class="lbl">الجوال:</span><span class="val">${esc(r['جوال المشترك'])}</span></div>
      <div class="field"><span class="lbl">رقم الهوية:</span><span class="val">${esc(r['رقم الهوية'])}</span></div>
      <div class="field"><span class="lbl">البريد الإلكتروني:</span><span class="val">${esc(r['البريد الإلكتروني'])}</span></div>
      <div class="field"><span class="lbl">الجنسية:</span><span class="val">${esc(r['الجنسية'])}</span></div>
      <div class="field"><span class="lbl">المدينة:</span><span class="val">${esc(r['المدينة'])}</span></div>
      <div class="field"><span class="lbl">جوال الطوارئ:</span><span class="val">${esc(r['جوال الطوارئ'])}</span></div>
      <div class="field full"><span class="lbl">الحي:</span><span class="val">${esc(r['الحي'])}</span></div>
      <div class="field full"><span class="lbl">الشارع:</span><span class="val">${esc(r['الشارع'])}</span></div>
      <div class="field full"><span class="lbl">العنوان الوطني:</span><span class="val">${esc(r['العنوان الوطني'])}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">🏥 بيانات المستفيد</div>
    <div class="fields">
      <div class="field"><span class="lbl">الاسم:</span><span class="val">${esc(r['اسم المستفيد'])}</span></div>
      <div class="field"><span class="lbl">العمر:</span><span class="val">${esc(r['عمر المستفيد'])}</span></div>
      <div class="field"><span class="lbl">صلة القرابة:</span><span class="val">${esc(r['صلة القرابة'])}</span></div>
    </div>
    ${r['تفاصيل المستفيدين'] ? `<div style="margin-top:8px;font-size:.82rem;line-height:1.7;color:#444">${esc(r['تفاصيل المستفيدين'])}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">📦 تفاصيل الخدمة</div>
    <div class="fields">
      <div class="field"><span class="lbl">الخدمة:</span><span class="val">${esc(r['الخدمة'])}</span></div>
      <div class="field"><span class="lbl">الباقة:</span><span class="val">${esc(r['الباقة'])}</span></div>
      <div class="field"><span class="lbl">تاريخ البداية:</span><span class="val">${esc(r['تاريخ البداية'])}</span></div>
      <div class="field"><span class="lbl">وقت البداية:</span><span class="val">${esc(r['وقت البداية'])}</span></div>
      <div class="field"><span class="lbl">وقت النهاية:</span><span class="val">${esc(r['وقت النهاية'])}</span></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">💰 الدفع</div>
    <div class="fields">
      ${r['كود الخصم'] ? `
      <div class="field"><span class="lbl">المبلغ الأصلي:</span><span class="val">${esc(r['المبلغ الأصلي'])} ريال</span></div>
      <div class="field"><span class="lbl">كود الخصم:</span><span class="val">${esc(r['كود الخصم'])} (${esc(r['نسبة الخصم'])})</span></div>
      <div class="field"><span class="lbl">مبلغ الخصم:</span><span class="val" style="color:#16a34a;">− ${esc(r['مبلغ الخصم'])} ريال</span></div>
      <div class="field"><span class="lbl">المبلغ المدفوع:</span><span class="val" style="font-weight:800;">${esc(r['المبلغ المدفوع'])} ريال</span></div>
      ` : `
      <div class="field"><span class="lbl">المبلغ المدفوع:</span><span class="val">${esc(r['المبلغ المدفوع'])} ${r['المبلغ المدفوع'] !== '' ? 'ريال' : ''}</span></div>
      `}
      <div class="field"><span class="lbl">رقم التتبع:</span><span class="val">${esc(r['رقم التتبع'])}</span></div>
      <div class="field full"><span class="lbl">الرقم المرجعي:</span><span class="val">${esc(r['الرقم المرجعي'])}</span></div>
    </div>
  </div>

  ${r['ملاحظات'] ? `
  <div class="section">
    <div class="section-title">📝 ملاحظات</div>
    <div class="notes">${esc(r['ملاحظات'])}</div>
  </div>` : ''}
</div>`

    const html = `
<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>دِبرة - تقرير الحجوزات</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Tahoma', 'Arial', sans-serif; padding: 0; color: #2d3a1e; direction: rtl; }
  .page-header { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #2d3a1e; padding-bottom: 8px; margin-bottom: 16px; }
  .page-header h1 { margin: 0; font-size: 14pt; color: #2d3a1e; }
  .page-header .meta { font-size: 9pt; color: #666; text-align: left; line-height: 1.5; }
  .card { border: 1.5px solid #c9a84c; border-radius: 6px; margin-bottom: 14px; background: white; page-break-inside: avoid; }
  .card-bar { background: #f6f0d7; padding: 7px 12px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #c9a84c; border-radius: 5px 5px 0 0; font-size: 10pt; gap: 12px; flex-wrap: wrap; }
  .card-bar .id { font-weight: bold; color: #2d3a1e; }
  .card-bar .status { background: #2d3a1e; color: white; padding: 2px 12px; border-radius: 12px; font-size: 9pt; font-weight: bold; white-space: nowrap; }
  .card-bar .date { color: #555; font-size: 9pt; }
  .section { padding: 9px 14px; border-bottom: 1px dashed #e6dfc3; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 10pt; font-weight: bold; color: #c9a84c; margin: 0 0 7px 0; padding-bottom: 3px; border-bottom: 1px solid #f0e9d3; }
  .fields { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; }
  .field { display: flex; gap: 6px; font-size: 9.5pt; line-height: 1.5; align-items: baseline; }
  .field.full { grid-column: 1 / -1; }
  .field .lbl { color: #777; min-width: 110px; flex-shrink: 0; }
  .field .val { color: #2d3a1e; font-weight: 600; word-break: break-word; }
  .notes { font-size: 9.5pt; color: #444; line-height: 1.6; padding: 4px 0; word-break: break-word; }
  .page-footer { margin-top: 18px; font-size: 8pt; color: #888; text-align: center; border-top: 1px solid #ddd; padding-top: 6px; }
  @media print { body { padding: 0; } }
</style></head>
<body>
  <div class="page-header">
    <h1>📋 تقرير الحجوزات — دِبرة للرعاية</h1>
    <div class="meta">${date}<br>الفلتر: ${filterLabel} · ${rows.length} حجز</div>
  </div>
  ${rows.map(renderCard).join('')}
  <div class="page-footer">dibrahcare.com — تم التوليد تلقائياً</div>
  <script>window.addEventListener('load', () => setTimeout(() => window.print(), 300))</script>
</body></html>`
    const w = window.open('', '_blank')
    if (!w) { alert('السماح بالنوافذ المنبثقة مطلوب'); return }
    w.document.open(); w.document.write(html); w.document.close()
  }

  // ═══ تصدير Word (تخطيط بطاقات — يولّد ملف .doc يفتح في Word تلقائياً) ═══
  const exportWord = () => {
    const rows = buildExportRows()
    if (rows.length === 0) { alert('لا توجد حجوزات للتصدير'); return }
    const date = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const filterLabel = filter === 'all' ? 'جميع الحجوزات' : (STATUS_LABELS[filter]?.label || filter)
    const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

    const renderCard = (r: any) => `
<div class="card">
  <div class="card-bar">
    <span class="id">حجز رقم: ${esc(r['رقم الحجز'])}</span>
    <span class="status">${esc(r['الحالة'])}</span>
    <span class="date">${esc(r['تاريخ الإنشاء'])}</span>
  </div>

  <div class="section">
    <div class="section-title">👤 بيانات المشترك</div>
    <table class="fields"><tr>
      <td><b>الاسم:</b> ${esc(r['اسم المشترك'])}</td>
      <td><b>الجوال:</b> ${esc(r['جوال المشترك'])}</td>
    </tr><tr>
      <td><b>رقم الهوية:</b> ${esc(r['رقم الهوية'])}</td>
      <td><b>البريد الإلكتروني:</b> ${esc(r['البريد الإلكتروني'])}</td>
    </tr><tr>
      <td><b>الجنسية:</b> ${esc(r['الجنسية'])}</td>
      <td><b>جوال الطوارئ:</b> ${esc(r['جوال الطوارئ'])}</td>
    </tr><tr>
      <td colspan="2"><b>المدينة:</b> ${esc(r['المدينة'])}</td>
    </tr><tr>
      <td colspan="2"><b>الحي:</b> ${esc(r['الحي'])}</td>
    </tr><tr>
      <td colspan="2"><b>الشارع:</b> ${esc(r['الشارع'])}</td>
    </tr><tr>
      <td colspan="2"><b>العنوان الوطني:</b> ${esc(r['العنوان الوطني'])}</td>
    </tr></table>
  </div>

  <div class="section">
    <div class="section-title">🏥 بيانات المستفيد</div>
    <table class="fields"><tr>
      <td><b>الاسم:</b> ${esc(r['اسم المستفيد'])}</td>
      <td><b>العمر:</b> ${esc(r['عمر المستفيد'])}</td>
    </tr><tr>
      <td colspan="2"><b>صلة القرابة:</b> ${esc(r['صلة القرابة'])}</td>
    </tr></table>
    ${r['تفاصيل المستفيدين'] ? `<div style="margin-top:6px;font-size:.85rem;line-height:1.7">${esc(r['تفاصيل المستفيدين'])}</div>` : ''}
  </div>

  <div class="section">
    <div class="section-title">📦 تفاصيل الخدمة</div>
    <table class="fields"><tr>
      <td><b>الخدمة:</b> ${esc(r['الخدمة'])}</td>
      <td><b>الباقة:</b> ${esc(r['الباقة'])}</td>
    </tr><tr>
      <td><b>تاريخ البداية:</b> ${esc(r['تاريخ البداية'])}</td>
      <td><b>وقت البداية:</b> ${esc(r['وقت البداية'])}</td>
    </tr><tr>
      <td colspan="2"><b>وقت النهاية:</b> ${esc(r['وقت النهاية'])}</td>
    </tr></table>
  </div>

  <div class="section">
    <div class="section-title">💰 الدفع</div>
    <table class="fields">
      ${r['كود الخصم'] ? `
      <tr>
        <td><b>المبلغ الأصلي:</b> ${esc(r['المبلغ الأصلي'])} ريال</td>
        <td><b>كود الخصم:</b> ${esc(r['كود الخصم'])} (${esc(r['نسبة الخصم'])})</td>
      </tr>
      <tr>
        <td><b>مبلغ الخصم:</b> <span style="color:#16a34a">− ${esc(r['مبلغ الخصم'])} ريال</span></td>
        <td><b>المبلغ المدفوع:</b> <b>${esc(r['المبلغ المدفوع'])} ريال</b></td>
      </tr>
      ` : `
      <tr>
        <td colspan="2"><b>المبلغ المدفوع:</b> ${esc(r['المبلغ المدفوع'])} ${r['المبلغ المدفوع'] !== '' ? 'ريال' : ''}</td>
      </tr>
      `}
      <tr>
        <td><b>رقم التتبع:</b> ${esc(r['رقم التتبع'])}</td>
        <td><b>الرقم المرجعي:</b> ${esc(r['الرقم المرجعي'])}</td>
      </tr>
    </table>
  </div>

  ${r['ملاحظات'] ? `
  <div class="section">
    <div class="section-title">📝 ملاحظات</div>
    <div class="notes">${esc(r['ملاحظات'])}</div>
  </div>` : ''}
</div>`

    // ملف Word متوافق (HTML داخل غلاف Word) — A4 عمودي للقراءة الطبيعية
    const html = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'>
<title>دِبرة - تقرير الحجوزات</title>
<!--[if gte mso 9]>
<xml>
  <w:WordDocument>
    <w:View>Print</w:View>
    <w:Zoom>100</w:Zoom>
    <w:DoNotOptimizeForBrowser/>
  </w:WordDocument>
</xml>
<style>
  @page WordSection1 {
    size: 21cm 29.7cm;
    mso-page-orientation: portrait;
    margin: 1.4cm 1.4cm 1.4cm 1.4cm;
    mso-header-margin: 0.5cm;
    mso-footer-margin: 0.5cm;
    mso-paper-source: 0;
  }
  div.WordSection1 { page: WordSection1; }
</style>
<![endif]-->
<style>
  @page { size: A4; margin: 1.4cm; }
  body { font-family: 'Tahoma', 'Arial', sans-serif; direction: rtl; color: #2d3a1e; }
  h1 { font-size: 14pt; color: #2d3a1e; border-bottom: 2pt solid #2d3a1e; padding-bottom: 5pt; margin: 0 0 6pt 0; }
  .meta { font-size: 9pt; color: #666; margin-bottom: 14pt; }
  .card { border: 1pt solid #c9a84c; margin-bottom: 12pt; page-break-inside: avoid; }
  .card-bar { background: #f6f0d7; padding: 6pt 10pt; border-bottom: 0.75pt solid #c9a84c; font-size: 10pt; }
  .card-bar .id { font-weight: bold; }
  .card-bar .status { background: #2d3a1e; color: white; padding: 1pt 8pt; margin: 0 8pt; font-size: 9pt; font-weight: bold; }
  .card-bar .date { color: #555; font-size: 9pt; float: left; }
  .section { padding: 7pt 12pt; border-bottom: 0.5pt dashed #e6dfc3; }
  .section:last-child { border-bottom: none; }
  .section-title { font-size: 10pt; font-weight: bold; color: #c9a84c; margin: 0 0 5pt 0; padding-bottom: 2pt; border-bottom: 0.5pt solid #f0e9d3; }
  table.fields { width: 100%; border-collapse: collapse; font-size: 10pt; }
  table.fields td { padding: 3pt 5pt; vertical-align: top; width: 50%; }
  .notes { font-size: 10pt; color: #444; line-height: 1.6; }
  .footer { margin-top: 14pt; font-size: 8pt; color: #888; text-align: center; border-top: 0.5pt solid #ddd; padding-top: 6pt; }
</style>
</head>
<body>
<div class="WordSection1">
  <h1>📋 تقرير الحجوزات — دِبرة للرعاية</h1>
  <div class="meta">${date} · الفلتر: ${filterLabel} · ${rows.length} حجز</div>
  ${rows.map(renderCard).join('')}
  <div class="footer">dibrahcare.com — تم التوليد تلقائياً</div>
</div>
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
        @keyframes dibrahPulse { 0%,100%{ transform:scale(1); box-shadow:0 0 0 2px rgba(220,38,38,.25) } 50%{ transform:scale(1.12); box-shadow:0 0 0 4px rgba(220,38,38,.12) } }
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
            placeholder="username"
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
      <MobileMenuTab open={mobileMenuOpen} setOpen={setMobileMenuOpen} />

      <div style={{ background: 'var(--bg)', minHeight: '100vh', direction: 'rtl', display: 'flex', maxWidth: '100vw' }}>

        {/* ═══ SIDEBAR ═══ */}
        <aside style={{
          width: 240,
          background: 'white',
          borderLeft: '1px solid rgba(95,97,87,.1)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          alignSelf: 'flex-start',
          overflowY: 'auto',
          padding: '24px 16px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
        }} className={`admin-sidebar ${mobileMenuOpen ? 'admin-sidebar-open' : ''}`}>

          {/* Logo + زر الإغلاق على الجوال (يضع الـ RTL: الإغلاق في اليسار) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 32, padding: '0 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 44, height: 'auto', borderRadius: 8 }} />
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 900, color: '#777C6D', fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة</div>
                <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>لوحة التحكم</div>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="إغلاق القائمة"
              className="admin-sidebar-close"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { id: 'bookings' as const, label: 'الحجوزات', icon: '📋' },
              { id: 'stats' as const, label: 'الإحصائيات', icon: '📊' },
              { id: 'add' as const, label: 'حجز يدوي', icon: '➕' },
              { id: 'users' as const, label: 'الموظفون', icon: '👥' },
              { id: 'customers' as const, label: 'العملاء المسجلين', icon: '🧑‍💼' },
              { id: 'custom' as const, label: 'حسب الطلب', icon: '✨' },
            ].map(item => {
              const active = tab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
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
                  {item.id === 'customers' && newCounts.customers > 0 && (
                    <span style={badgeStyle}>{newCounts.customers}</span>
                  )}
                </button>
              )
            })}

            <div style={{ height: 1, background: 'rgba(95,97,87,.1)', margin: '12px 0' }} />

            <a href="/admindibrah/medical" onClick={() => markSeen('medical')} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🩺</span>
              حجوزات الرعاية الطبية
              {newCounts.medical > 0 && <span style={badgeStyle}>{newCounts.medical}</span>}
            </a>

            <a href="/admindibrah/feedback" onClick={() => markSeen('feedback')} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⭐</span>
              التقييمات
              {newCounts.feedback > 0 && <span style={badgeStyle}>{newCounts.feedback}</span>}
            </a>

            <a href="/admindibrah/broadcast" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path fill="#25D366" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.84 9.84 0 0 0 12.04 2zm0 18.15a8.23 8.23 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.23 8.23 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.41a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.24 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23a7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.16-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43-.14 0-.31-.02-.48-.02-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.07.14-1.18-.06-.1-.23-.16-.48-.29z"/>
              </svg>
              رسالة جماعية
            </a>

            <a href="/supporters/admin" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>💚</span>
              لوحة الداعمين
            </a>

            <a href="/admindibrah/discount-codes" style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', borderRadius: 8,
              color: 'var(--dark)', textDecoration: 'none',
              fontWeight: 700, fontSize: '.9rem',
            }}>
              <span style={{ fontSize: '1.1rem' }}>🎟️</span>
              أكواد الخصم
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
              {tab === 'customers' && '🧑‍💼 العملاء المسجلين'}
              {tab === 'edit' && '✏️ تعديل حجز'}
              {tab === 'custom' && '✨ الطلبات المخصصة'}
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

                  {/* 📡 إحصائية قنوات الاكتساب — كيف تعرفوا علينا */}
                  {(() => {
                    const withSource = customers.filter(c => c.referral_source)
                    if (withSource.length === 0) {
                      return (
                        <div style={{ marginBottom: 24, padding: 20, background: 'white', borderRadius: 16, border: '1px solid rgba(95,97,87,.1)' }}>
                          <div style={{ fontWeight: 900, color: 'var(--dark)', fontSize: '.95rem', marginBottom: 8, fontFamily: 'PNU, Tajawal, sans-serif' }}>
                            📡 كيف تعرفوا علينا؟
                          </div>
                          <p style={{ fontSize: '.83rem', color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                            ستظهر الإحصائية هنا بعد تسجيل عملاء جدد يجيبون على سؤال &quot;كيف تعرفت علينا&quot; في صفحة التسجيل.
                          </p>
                        </div>
                      )
                    }
                    const counts: Record<string, number> = {}
                    withSource.forEach(c => {
                      const s = c.referral_source as string
                      counts[s] = (counts[s] || 0) + 1
                    })
                    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
                    const total = withSource.length
                    const max = sorted[0][1]
                    const ICONS: Record<string, string> = {
                      'منصة X (تويتر)': '🐦', 'إنستقرام': '📸', 'سناب شات': '👻',
                      'تيك توك': '🎵', 'فيسبوك': '👤', 'بحث قوقل': '🔍',
                      'واتساب': '💬', 'توصية صديق أو قريب': '👥', 'جهة أو منشأة': '🏢', 'أخرى': '✨',
                    }
                    return (
                      <div style={{ marginBottom: 24, padding: 20, background: 'white', borderRadius: 16, border: '1px solid rgba(95,97,87,.1)' }}>
                        <div style={{ fontWeight: 900, color: 'var(--dark)', fontSize: '.95rem', marginBottom: 16, fontFamily: 'PNU, Tajawal, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
                          📡 كيف تعرفوا علينا؟ <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--muted)' }}>({total} عميل)</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {sorted.map(([source, count]) => {
                            const pct = Math.round((count / total) * 100)
                            const barPct = Math.round((count / max) * 100)
                            return (
                              <div key={source} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{ minWidth: 150, fontSize: '.83rem', fontWeight: 700, color: 'var(--dark)' }}>
                                  {ICONS[source] || '•'} {source}
                                </div>
                                <div style={{ flex: 1, background: 'rgba(95,97,87,.08)', borderRadius: 99, height: 22, position: 'relative', overflow: 'hidden' }}>
                                  <div style={{ width: `${barPct}%`, height: '100%', background: 'linear-gradient(90deg, var(--dark), #6B8E47)', borderRadius: 99, transition: 'width .4s ease' }} />
                                </div>
                                <div style={{ minWidth: 70, fontSize: '.82rem', fontWeight: 800, color: 'var(--dark)', textAlign: 'left' }}>
                                  {count} <span style={{ color: 'var(--muted)', fontWeight: 600 }}>({pct}%)</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })()}

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
                            <div style={{ fontWeight: 900, color: 'var(--dark)', fontSize: '.92rem' }}>{b.customers?.full_name || '—'}</div>
                            <div style={{ fontSize: '.8rem', color: 'var(--muted)', marginTop: 2 }}>{b.customers?.phone || '—'}</div>
                            <div style={{ fontSize: '.78rem', color: 'rgba(95,97,87,.5)', marginTop: 2 }}>المستفيد: {b.beneficiary_name}</div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '.8rem' }}>
                            {(() => {
                              // فك بيانات الحجز من notes (JSON)
                              let meta: any = {}
                              try {
                                if (b.notes && b.notes.trim().startsWith('{')) {
                                  meta = JSON.parse(b.notes)
                                }
                              } catch {}
                              const startDate = meta.start_date || b.start_date || '—'
                              const startTime = meta.start_time || b.start_time || '—'
                              const pkgLabel = meta.package_label || meta.package_id || b.package || '—'
                              const amount = (b as any).amount ?? b.price
                              const trackId = meta.trackId || meta.track_id || b.track_id || ''
                              const paymentId = meta.paymentId || meta.payment_id || (b as any).payment_id || ''
                              // ─── معلومات الخصم ───
                              const subtotal       = meta.subtotal
                              const discountAmount = meta.discount_amount
                              const discountCode   = meta.discount_code
                              const discountPct    = meta.discount_percent
                              const hasDiscount    = !!(discountCode && discountAmount > 0)
                              return (
                                <>
                                  <div><span style={{ color: 'var(--muted)' }}>📅 </span><span style={{ fontWeight: 700 }}>{startDate}</span></div>
                                  <div><span style={{ color: 'var(--muted)' }}>🕐 </span><span style={{ fontWeight: 700 }}>{startTime}</span></div>
                                  {hasDiscount ? (
                                    <div style={{ gridColumn: 'span 2', display: 'grid', gap: 2, padding: '6px 8px', background: '#fef3c7', borderRadius: 6, marginTop: 2 }}>
                                      <div style={{ fontSize: '.72rem', color: '#92400e', fontWeight: 700 }}>
                                        💰 المبلغ الأصلي: <span style={{ textDecoration: 'line-through', color: '#888' }}>{subtotal?.toLocaleString('ar-SA')} ر</span>
                                      </div>
                                      <div style={{ fontSize: '.72rem', color: '#16a34a', fontWeight: 700 }}>
                                        🎟️ خصم {discountPct}% (<span style={{ fontFamily: 'monospace' }}>{discountCode}</span>): − {discountAmount?.toLocaleString('ar-SA')} ر
                                      </div>
                                      <div style={{ fontSize: '.78rem', color: 'var(--dark)', fontWeight: 800 }}>
                                        ✅ المدفوع: {amount?.toLocaleString('ar-SA')} ر
                                      </div>
                                    </div>
                                  ) : (
                                    <div><span style={{ color: 'var(--muted)' }}>💰 </span><span style={{ fontWeight: 700 }}>{amount?.toLocaleString('ar-SA')} ر</span></div>
                                  )}
                                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--muted)' }}>📦 </span><span style={{ fontWeight: 700, fontSize: '.78rem' }}>{pkgLabel}</span></div>
                                  <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--muted)' }}>🗓 </span><span style={{ fontSize: '.74rem', color: 'var(--muted)' }}>أنشئ: {new Date(b.created_at).toLocaleDateString('ar-SA')}</span></div>
                                  {trackId && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--muted)' }}>🔖 </span><span style={{ fontSize: '.7rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{trackId}</span></div>}
                                  {paymentId && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--muted)' }}>🏦 </span><span style={{ fontSize: '.7rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{paymentId}</span></div>}
                                </>
                              )
                            })()}
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
                          ) : (() => {
                            // إذا notes فيه JSON (بيانات الحجز التلقائية)، اعرضه كـ "اضغط لإضافة"
                            const isAutoMeta = b.notes && b.notes.trim().startsWith('{')
                            const userNote = isAutoMeta ? '' : (b.notes || '')
                            return (
                              <div onClick={() => setEditNotes(n => ({ ...n, [b.id]: userNote }))} style={{ fontSize: '.8rem', color: userNote ? 'var(--dark)' : 'var(--muted)', cursor: 'pointer', padding: '7px 10px', borderRadius: 8, border: '1.5px dashed rgba(95,97,87,.2)', minHeight: 34, display: 'flex', alignItems: 'center' }}>
                                {userNote || 'اضغط لإضافة ملاحظة...'}
                              </div>
                            )
                          })()}
                        </div>
                        {/* Card Footer - Action Buttons */}
                        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(95,97,87,.08)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                          <button onClick={() => openDetails(b.id)}
                            style={{ padding: '9px', background: '#6b5ca5', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                            📋 التفاصيل
                          </button>
                          <button onClick={() => whatsapp(b.customers?.phone || '', b.customers?.full_name || '', b.package, b.start_date)}
                            style={{ padding: '9px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                            💬 واتساب
                          </button>
                          <button onClick={() => { setEditData(b); setTab('edit') }}
                            style={{ padding: '9px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 800, fontSize: '.8rem', cursor: 'pointer' }}>
                            ✏️ تعديل
                          </button>
                          <button onClick={async () => {
                            if (!confirm(`إرسال رابط التقييم لـ ${b.customers?.full_name || 'العميل'} عبر واتساب؟`)) return
                            await sendFeedbackRequest(b)
                            alert('✅ تم إرسال طلب التقييم')
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
                const original = bookings.find(b => b.id === editData.id)
                const wasNotExecuted = original?.status !== 'executed'
                const res = await fetch(`/api/admin/bookings/${editData.id}/update`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    beneficiary_name: editData.beneficiary_name,
                    beneficiary_age: editData.beneficiary_age,
                    beneficiary_relation: editData.beneficiary_relation,
                    package: editData.package,
                    start_date: editData.start_date,
                    start_time: editData.start_time,
                    price: editData.price,
                    status: editData.status,
                  }),
                })
                const data = await res.json()
                const error = res.ok ? null : { message: data.error || 'فشل التعديل' }
                setSaving(false)
                if (error) setSaveMsg('❌ ' + error.message)
                else {
                  // ─── نُفّذ الحجز لأول مرة عبر التعديل → أرسل طلب التقييم ───
                  if (editData.status === 'executed' && wasNotExecuted && original) {
                    sendFeedbackRequest(original)
                  }
                  setSaveMsg('✅ تم التعديل'); fetchBookings(); setTimeout(() => { setTab('bookings'); setSaveMsg('') }, 1200)
                }
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

          {/* ═══ tab: العملاء المسجّلين ═══ */}
          {tab === 'customers' && (() => {
            // العملاء بعد البحث
            const filtered = customers.filter(c => {
              if (!customerSearch.trim()) return true
              const q = customerSearch.trim().toLowerCase()
              return (
                c.full_name?.toLowerCase().includes(q) ||
                c.phone?.includes(q) ||
                c.national_id?.includes(q) ||
                c.email?.toLowerCase().includes(q)
              )
            })
            const filteredIds = filtered.map(c => c.id)
            const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedCustomers.has(id))
            const selectedCount = selectedCustomers.size

            // تنزيل بيانات العملاء (حسب البحث الحالي) كملف CSV يفتح بالإكسل
            const downloadCustomersCSV = () => {
              if (filtered.length === 0) return
              const rows = filtered.map(c => ({
                'الاسم': c.full_name || '',
                'الجوال': c.phone || '',
                'الهوية': c.national_id || '',
                'الإيميل': c.email || '',
                'الجنسية': c.nationality || '',
                'المدينة': (c as any).city || 'الرياض',
                'كيف تعرّف علينا': c.referral_source || '',
                'الحي': c.district || '',
                'الشارع': c.street || '',
                'العنوان الوطني': c.short_address || '',
                'جوال الطوارئ': c.emergency_phone || '',
                'تاريخ التسجيل': c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SA') : '',
              }))
              const headers = Object.keys(rows[0])
              const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`
              const csv = [
                headers.join(','),
                ...rows.map(r => headers.map(h => esc((r as any)[h])).join(',')),
              ].join('\r\n')
              // UTF-8 BOM لضمان عرض العربية صح في Excel
              const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `العملاء-${new Date().toISOString().slice(0, 10)}.csv`
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              URL.revokeObjectURL(url)
            }

            return (
            <div style={{ background: 'white', borderRadius: 20, padding: '32px', border: '1px solid rgba(95,97,87,.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <h2 style={{ fontWeight: 900, color: 'var(--dark)', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>
                  🧑‍💼 العملاء المسجلين
                  <span style={{ marginRight: 10, fontSize: '.85rem', fontWeight: 700, color: 'var(--muted)' }}>({customers.length})</span>
                </h2>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedCount > 0 && (
                    <button onClick={openBulkModal} style={{ padding: '10px 18px', background: '#25D366', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      💬 إرسال واتساب ({selectedCount})
                    </button>
                  )}
                  <button onClick={downloadCustomersCSV} disabled={filtered.length === 0}
                    style={{ padding: '10px 18px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: filtered.length === 0 ? 'not-allowed' : 'pointer', opacity: filtered.length === 0 ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    📥 تنزيل Excel ({filtered.length})
                  </button>
                  <button onClick={loadCustomers} style={{ padding: '10px 18px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>
                    🔄 تحديث
                  </button>
                </div>
              </div>

              {/* بحث + تحديد الكل */}
              <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={customerSearch}
                  onChange={e => setCustomerSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الجوال أو الهوية أو الإيميل..."
                  style={{ ...inp, fontSize: '.9rem', flex: 1, minWidth: 240 }}
                />
                {filtered.length > 0 && (
                  <button onClick={() => toggleAllCustomers(filteredIds)} style={{ padding: '10px 16px', background: allFilteredSelected ? '#B91C1C' : 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 8, fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {allFilteredSelected ? '✕ إلغاء التحديد' : `☑ تحديد الكل (${filtered.length})`}
                  </button>
                )}
                {selectedCount > 0 && (
                  <button onClick={() => setSelectedCustomers(new Set())} style={{ padding: '10px 16px', background: 'transparent', color: 'var(--muted)', border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 8, fontFamily: 'inherit', fontWeight: 600, fontSize: '.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    مسح ({selectedCount})
                  </button>
                )}
              </div>

              {/* إحصائية قنوات الاكتساب نُقلت إلى تبويب الإحصائيات */}

              {customersLoading ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>جارٍ التحميل...</div>
              ) : customers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>لا يوجد عملاء مسجلين بعد</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid rgba(95,97,87,.15)' }}>
                        <th style={{ padding: 12, textAlign: 'center', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700, width: 40 }}>
                          <input
                            type="checkbox"
                            checked={allFilteredSelected}
                            onChange={() => toggleAllCustomers(filteredIds)}
                            style={{ cursor: 'pointer', width: 18, height: 18 }}
                          />
                        </th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>الاسم</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>الجوال</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>الهوية</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>الإيميل</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>الجنسية</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>كيف تعرّف علينا</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>العنوان</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>طوارئ</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>سُجِّل في</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>آخر مراسلة</th>
                        <th style={{ padding: 12, textAlign: 'right', fontSize: '.82rem', color: 'var(--muted)', fontWeight: 700 }}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => {
                        const isSelected = selectedCustomers.has(c.id)
                        return (
                          <tr key={c.id} style={{ borderBottom: '1px solid rgba(95,97,87,.08)', background: isSelected ? 'rgba(37, 211, 102, 0.06)' : 'transparent' }}>
                            <td style={{ padding: 14, textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCustomer(c.id)}
                                style={{ cursor: 'pointer', width: 18, height: 18 }}
                              />
                            </td>
                            <td style={{ padding: 14, fontWeight: 800, color: 'var(--dark)', fontSize: '.88rem' }}>{c.full_name || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.85rem', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{c.phone || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.85rem', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{c.national_id || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.82rem', direction: 'ltr', textAlign: 'right' }}>{c.email || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.85rem' }}>{c.nationality || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.82rem', color: 'var(--dark)' }}>{c.referral_source || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.82rem', color: 'var(--muted)' }}>
                              {[c.district, c.street].filter(Boolean).join(' - ') || '—'}
                              {c.short_address && <div style={{ fontSize: '.74rem', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{c.short_address}</div>}
                            </td>
                            <td style={{ padding: 14, fontSize: '.85rem', direction: 'ltr', textAlign: 'right', fontFamily: 'monospace' }}>{c.emergency_phone || '—'}</td>
                            <td style={{ padding: 14, fontSize: '.78rem', color: 'var(--muted)' }}>
                              {c.created_at ? new Date(c.created_at).toLocaleDateString('ar-SA') : '—'}
                            </td>
                            <td style={{ padding: 14, fontSize: '.78rem', color: c.last_messaged_at ? '#5A6F3A' : 'var(--muted)' }}>
                              {c.last_messaged_at 
                                ? new Date(c.last_messaged_at).toLocaleDateString('ar-SA')
                                : '—'}
                            </td>
                            <td style={{ padding: 14 }}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {c.phone && (
                                  <a
                                    href={`https://wa.me/966${c.phone.replace(/^0/, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ ...btnIcon, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="واتساب"
                                  >💬</a>
                                )}
                                {c.phone && (
                                  <a
                                    href={`tel:${c.phone}`}
                                    style={{ ...btnIcon, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                    title="اتصال"
                                  >📞</a>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>

                  {filtered.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                      لا توجد نتائج تطابق البحث
                    </div>
                  )}
                </div>
              )}
            </div>
            )
          })()}

          {/* === User Modal === */}
          {showBulkModal && (
            <div onClick={() => !bulkSending && setShowBulkModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: 'white', borderRadius: 20, padding: 28, maxWidth: 600, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💬</div>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--dark)', fontWeight: 900, fontFamily: 'PNU, Tajawal, sans-serif' }}>إرسال واتساب جماعي</h3>
                    <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 2 }}>
                      عدد المستلمين: <strong style={{ color: 'var(--dark)' }}>{selectedCustomers.size}</strong>
                    </div>
                  </div>
                </div>

                {!bulkResults ? (
                  <>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontWeight: 700, color: 'var(--dark)', fontSize: '.9rem' }}>
                        نص الرسالة
                      </label>
                      <textarea
                        value={bulkMessage}
                        onChange={e => setBulkMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا...&#10;&#10;💡 يمكنك استخدام {name} ليُستبدل تلقائياً باسم العميل"
                        rows={6}
                        maxLength={4000}
                        disabled={bulkSending}
                        style={{ width: '100%', padding: 12, border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10, fontFamily: 'inherit', fontSize: '.92rem', resize: 'vertical', direction: 'rtl' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '.75rem', color: 'var(--muted)' }}>
                        <span>💡 {`{name}`} = اسم العميل</span>
                        <span>{bulkMessage.length} / 4000</span>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(200,160,66,.08)', border: '1px solid rgba(200,160,66,.3)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: '.82rem', color: 'var(--dark)' }}>
                      ⚠️ سيتم الإرسال بفاصل ثانية واحدة بين الرسائل (لتجنّب الحظر). إرسال {selectedCustomers.size} رسالة سيستغرق ~{selectedCustomers.size} ثانية.
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={sendBulkWhatsApp}
                        disabled={bulkSending || !bulkMessage.trim()}
                        style={{ flex: 1, padding: '12px 20px', background: bulkSending ? 'var(--muted)' : '#25D366', color: 'white', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: '.95rem', cursor: bulkSending ? 'not-allowed' : 'pointer', opacity: bulkMessage.trim() ? 1 : 0.5 }}
                      >
                        {bulkSending ? `⏳ جارٍ الإرسال...` : `💬 إرسال إلى ${selectedCustomers.size} مستلم`}
                      </button>
                      <button
                        onClick={() => setShowBulkModal(false)}
                        disabled={bulkSending}
                        style={{ padding: '12px 20px', background: 'transparent', color: 'var(--muted)', border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: '.9rem', cursor: bulkSending ? 'not-allowed' : 'pointer' }}
                      >
                        إلغاء
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ background: bulkResults.success ? 'rgba(90,111,58,.1)' : 'rgba(185,28,28,.1)', border: `1.5px solid ${bulkResults.success ? '#5A6F3A' : '#B91C1C'}`, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      {bulkResults.success ? (
                        <>
                          <div style={{ fontWeight: 900, color: '#5A6F3A', fontSize: '1.05rem', marginBottom: 8 }}>
                            ✅ تم الإرسال
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
                            <div style={{ background: 'white', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--dark)' }}>{bulkResults.total}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>الإجمالي</div>
                            </div>
                            <div style={{ background: 'white', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#5A6F3A' }}>{bulkResults.successCount}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>نجح</div>
                            </div>
                            <div style={{ background: 'white', padding: 10, borderRadius: 8, textAlign: 'center' }}>
                              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: bulkResults.failCount > 0 ? '#B91C1C' : 'var(--muted)' }}>{bulkResults.failCount}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--muted)' }}>فشل</div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontWeight: 900, color: '#B91C1C', fontSize: '1.05rem', marginBottom: 4 }}>
                            ❌ فشل الإرسال
                          </div>
                          <div style={{ fontSize: '.85rem', color: 'var(--dark)' }}>{bulkResults.message}</div>
                        </>
                      )}
                    </div>

                    {bulkResults.results && bulkResults.failCount > 0 && (
                      <div style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto', border: '1px solid rgba(95,97,87,.1)', borderRadius: 8 }}>
                        <div style={{ padding: '8px 12px', background: 'var(--bg)', fontSize: '.78rem', fontWeight: 700, color: 'var(--dark)', borderBottom: '1px solid rgba(95,97,87,.1)' }}>
                          الأرقام الفاشلة:
                        </div>
                        {bulkResults.results.filter((r: any) => !r.success).map((r: any, i: number) => (
                          <div key={i} style={{ padding: '8px 12px', borderBottom: '1px solid rgba(95,97,87,.05)', fontSize: '.8rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{r.name || '—'}</span>
                            <span style={{ color: 'var(--muted)', marginRight: 8, direction: 'ltr', display: 'inline-block', fontFamily: 'monospace' }}>{r.phone}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => {
                          setShowBulkModal(false)
                          setSelectedCustomers(new Set())
                        }}
                        style={{ flex: 1, padding: '12px 20px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontWeight: 700, fontSize: '.95rem', cursor: 'pointer' }}
                      >
                        إغلاق
                      </button>
                    </div>
                  </>
                )}
              </div>
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
        body { overflow-x: hidden; }
        @media (max-width: 1024px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
          .admin-cards { grid-template-columns: repeat(2,1fr) !important; }
          .add-grid { grid-template-columns: 1fr !important; }
          .stats-summary { grid-template-columns: 1fr 1fr !important; }
        }
        /* ═══════ ستايل القائمة (مخفي افتراضياً) ═══════ */
        .admin-sidebar-close {
          display: none;
        }

        @media (max-width: 768px) {
          html, body { overflow-x: hidden !important; max-width: 100vw !important; }
          .admin-main {
            padding: 20px !important;
            max-width: 100vw !important;
            overflow-x: hidden !important;
            min-width: 0 !important;
          }
          /* زر الإغلاق ✕ */
          .admin-sidebar-close {
            display: flex !important;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 10px;
            background: rgba(95,97,87,0.08);
            color: var(--dark);
            border: none;
            cursor: pointer;
            font-size: 18px;
            font-weight: 700;
            flex-shrink: 0;
          }

          /* القائمة الجانبية */
          .admin-sidebar {
            position: fixed !important;
            top: 0 !important;
            right: 0;
            height: 100vh !important;
            min-height: 100vh !important;
            z-index: 999998;
            box-shadow: -4px 0 20px rgba(0,0,0,.15);
            transform: translateX(100%);
            transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
            overflow-y: auto;
          }
          .admin-sidebar.admin-sidebar-open {
            transform: translateX(0);
          }
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

      {/* ═══ تبويب الطلبات المخصصة ═══ */}
      {tab === 'custom' && (
        <div style={{ padding: '24px 20px', maxWidth: 800, margin: '0 auto' }}>
          {customLoading ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>جاري التحميل...</div>
          ) : customRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#888', padding: 40 }}>لا توجد طلبات مخصصة حالياً</div>
          ) : (
            customRequests.map((r: any) => {
              const notes = typeof r.notes === 'string' ? JSON.parse(r.notes || '{}') : r.notes || {}
              const isPriced = r.amount > 0
              const isPaid = r.payment_status === 'paid'
              return (
                <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 20px', marginBottom: 14, boxShadow: '0 1px 6px rgba(95,97,87,.08)', border: isPaid ? '1.5px solid #5f6157' : '1px solid #e8ede3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#5f6157', fontSize: '1rem', marginBottom: 4 }}>{notes.service_title || 'خدمة مخصصة'}</div>
                      <div style={{ fontSize: '.83rem', color: '#888' }}>DBR-{r.id.split('-')[0].toUpperCase()}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      {isPaid && <span style={{ background: '#e2ecd3', color: '#5f6157', fontWeight: 700, fontSize: '.75rem', padding: '3px 10px', borderRadius: 20 }}>مدفوع ✅</span>}
                      {!isPaid && isPriced && <span style={{ background: '#fff3cd', color: '#856404', fontWeight: 700, fontSize: '.75rem', padding: '3px 10px', borderRadius: 20 }}>بانتظار الدفع</span>}
                      {!isPaid && !isPriced && <span style={{ background: '#f8d7da', color: '#842029', fontWeight: 700, fontSize: '.75rem', padding: '3px 10px', borderRadius: 20 }}>بانتظار التسعير</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: '.88rem', color: '#444', lineHeight: 1.7, marginBottom: 12 }}>
                    <div><span style={{ color: '#888' }}>الاسم:</span> {notes.full_name || r.customers?.full_name || '—'}</div>
                    <div><span style={{ color: '#888' }}>الجوال:</span> {notes.phone || r.customers?.phone || '—'}</div>
                    {notes.description && <div><span style={{ color: '#888' }}>الوصف:</span> {notes.description}</div>}
                    {notes.requested_date && <div><span style={{ color: '#888' }}>التاريخ:</span> {notes.requested_date}</div>}
                    {isPriced && <div><span style={{ color: '#888' }}>المبلغ:</span> <strong>{parseFloat(r.amount).toFixed(2)} ر.س</strong></div>}
                  </div>
                  {!isPaid && (
                    <button
                      onClick={() => { setPricingModal({ id: r.id, name: notes.full_name || r.customers?.full_name || '' }); setPricingAmount(isPriced ? String(r.amount) : ''); setPricingError('') }}
                      style={{ background: '#5f6157', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 18px', fontSize: '.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {isPriced ? '✏️ تعديل السعر وإعادة الإرسال' : '💰 تسعير وإرسال رابط الدفع'}
                    </button>
                  )}
                </div>
              )
            })
          )}

          {/* Modal التسعير */}
          {pricingModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', maxWidth: 400, width: '100%', direction: 'rtl' }}>
                <h3 style={{ fontWeight: 800, color: '#5f6157', marginBottom: 8 }}>تسعير الطلب</h3>
                <p style={{ fontSize: '.88rem', color: '#666', marginBottom: 20 }}>سيُرسل رابط الدفع تلقائياً للعميل عبر واتساب</p>
                <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 700, color: '#5f6157', marginBottom: 6 }}>المبلغ (ر.س) *</label>
                <input
                  type="number"
                  min="1"
                  value={pricingAmount}
                  onChange={e => setPricingAmount(e.target.value)}
                  placeholder="مثال: 350"
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid rgba(95,97,87,.25)', borderRadius: 10, fontSize: '1rem', fontFamily: 'inherit', direction: 'ltr', marginBottom: 8 }}
                />
                {pricingError && <div style={{ color: '#c0392b', fontSize: '.82rem', marginBottom: 8, fontWeight: 700 }}>{pricingError}</div>}
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={sendPaymentLink} disabled={pricingSending} style={{ flex: 1, background: pricingSending ? '#aaa' : '#5f6157', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: pricingSending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: '.9rem' }}>
                    {pricingSending ? 'جاري الإرسال...' : '📤 إرسال رابط الدفع'}
                  </button>
                  <button onClick={() => { setPricingModal(null); setPricingAmount('') }} style={{ flex: 1, background: '#f0f0f0', color: '#333', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', fontSize: '.9rem' }}>
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

// ═══ مكوّن عرض التفاصيل ═══

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
  // ─── فك notes JSON لاستخراج الباقة والتواريخ والخدمة ───
  let meta: any = {}
  try {
    if (booking.notes && typeof booking.notes === 'string' && booking.notes.trim().startsWith('{')) {
      meta = JSON.parse(booking.notes)
    }
  } catch {}

  // نوع الخدمة: من service_type أو service_key
  const SERVICE_TYPE_LABELS: Record<string, string> = {
    medical: '🏥 رعاية طبية', child: '👶 رعاية أطفال', elderly: '👴 رعاية كبار السن',
    multi: '👥 رعاية متعددة', other: '📋 خدمة أخرى',
  }
  const typeLabel = SERVICE_TYPE_LABELS[booking.service_type as string]
                  || (regType === 'child' ? '👶 رعاية أطفال'
                  : regType === 'elderly' ? '👴 رعاية كبار السن'
                  : regType === 'medical' ? '🏥 رعاية طبية'
                  : meta.service_key || '—')

  // الباقة / التواريخ / السعر — من meta و amount
  const pkgLabel  = meta.package_label || PKG_LABELS[booking.package] || booking.package || ''
  const startDate = meta.start_date || booking.start_date || ''
  const startTime = meta.start_time || booking.start_time || ''
  const endTime   = meta.end_time || ''
  const priceVal  = (typeof booking.amount === 'number' ? booking.amount : (meta.subtotal ?? null))
  const priceStr  = (typeof priceVal === 'number' && priceVal > 0) ? `${priceVal.toLocaleString('ar-SA')} ر.س` : '—'

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
        <Row label="الباقة" value={pkgLabel} />
        <Row label="التاريخ" value={startDate} />
        <Row label="الوقت" value={endTime ? `${startTime} — ${endTime}` : startTime} />
        <Row label="السعر" value={priceStr} />
        <Row label="الحالة" value={booking.status} />
        <Row label="نوع الخدمة" value={typeLabel} />
        {(() => {
          const trackId = meta.trackId || meta.track_id || booking.track_id || ''
          const paymentId = meta.paymentId || meta.payment_id || booking.payment_id || ''
          return (
            <>
              {trackId && <Row label="رقم العملية" value={trackId} />}
              {paymentId && <Row label="الرقم المرجعي (البنك)" value={paymentId} />}
            </>
          )
        })()}
      </Section>

      {/* بيانات المشترك */}
      <Section title="بيانات المشترك" icon="👤">
        <Row label="الاسم" value={customer?.full_name} />
        <Row label="الجوال" value={customer?.phone} />
        <Row label="رقم الهوية" value={customer?.national_id} />
        <Row label="الجنسية" value={customer?.nationality} />
        <Row label="البريد الإلكتروني" value={customer?.email} />
        <Row label="المدينة" value={customer?.city || 'الرياض'} />
        <Row label="الحي" value={customer?.district} />
        <Row label="الشارع" value={customer?.street} />
        <Row label="الرمز البريدي" value={customer?.short_address} />
        <Row label="جوال الطوارئ" value={customer?.emergency_phone} />
        {registration?.subscriber_job && <Row label="الوظيفة" value={registration.subscriber_job} />}
        {(customer as any)?.vat_number && <Row label="الرقم الضريبي" value={(customer as any).vat_number} />}
      </Section>

      {/* بيانات المستفيد — تُقرأ من service_details */}
      {(() => {
        const sd = booking.service_details
        const parsed = typeof sd === 'string' ? (() => { try { return JSON.parse(sd) } catch { return null } })() : sd

        // multi-beneficiary (نفاس، حج، عمرة، مستشفى، عروس، إلخ)
        if (parsed?.type === 'multi' && Array.isArray(parsed.beneficiaries) && parsed.beneficiaries.length) {
          return (
            <Section title={`المستفيدون (${parsed.beneficiaries.length})`} icon="👥">
              {parsed.beneficiaries.map((b: any, i: number) => (
                <div key={i} style={{ marginBottom: i < parsed.beneficiaries.length - 1 ? 14 : 0, paddingBottom: i < parsed.beneficiaries.length - 1 ? 14 : 0, borderBottom: i < parsed.beneficiaries.length - 1 ? '1px solid rgba(95,97,87,.12)' : 'none' }}>
                  <div style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '.85rem', marginBottom: 6 }}>المستفيد {i + 1}</div>
                  <Row label="الاسم" value={b.name} />
                  <Row label="العمر" value={b.age} />
                  <Row label="رقم الهوية" value={b.national_id} />
                  <Row label="الجوال" value={b.phone} />
                  {b.recommendations && <Row label="توصيات خاصة" value={b.recommendations} />}
                </div>
              ))}
            </Section>
          )
        }

        // child (رعاية أطفال)
        if (parsed?.type === 'child' && Array.isArray(parsed.children) && parsed.children.length) {
          const yn = (v: any) => (v === 'yes' ? 'نعم' : v === 'no' ? 'لا' : '')
          const ans = (o: any) => {
            if (!o || typeof o !== 'object') return ''
            if (o.answer === 'yes') return o.note ? `نعم — ${o.note}` : 'نعم'
            if (o.answer === 'no') return 'لا'
            return o.note || ''
          }
          const skillsList = (s: any) => {
            if (!s || typeof s !== 'object') return ''
            const map: Record<string, string> = { letters: 'الحروف', numbers: 'الأرقام', colors: 'الألوان', shapes: 'الأشكال' }
            const picked = Object.keys(map).filter(k => s[k]).map(k => map[k])
            return picked.length ? picked.join('، ') : ''
          }
          return (
            <Section title={`الأطفال (${parsed.children.length})`} icon="👶">
              {parsed.children.map((c: any, i: number) => (
                <div key={i} style={{ marginBottom: i < parsed.children.length - 1 ? 14 : 0, paddingBottom: i < parsed.children.length - 1 ? 14 : 0, borderBottom: i < parsed.children.length - 1 ? '1px solid rgba(95,97,87,.12)' : 'none' }}>
                  <div style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '.85rem', marginBottom: 6 }}>الطفل {i + 1}</div>
                  <Row label="الاسم" value={c.name} />
                  <Row label="العمر" value={c.age} />
                  {ans(c.health) && <Row label="الحالة الصحية" value={ans(c.health)} />}
                  {ans(c.medications) && <Row label="الأدوية" value={ans(c.medications)} />}
                  {c.siblings_count && <Row label="عدد الإخوة" value={String(c.siblings_count)} />}
                  {c.lives_with && <Row label="يعيش مع" value={c.lives_with} />}
                  {c.education_level && <Row label="المستوى الدراسي" value={c.education_level} />}
                  {skillsList(c.skills) && <Row label="المهارات" value={skillsList(c.skills)} />}
                  {yn(c.language_full_sentences) && <Row label="يتكلم بجمل كاملة" value={yn(c.language_full_sentences)} />}
                  {yn(c.language_words_only) && <Row label="يتكلم بكلمات فقط" value={yn(c.language_words_only)} />}
                  {yn(c.independence) && <Row label="الاستقلالية" value={yn(c.independence)} />}
                  {c.emotions && <Row label="المشاعر/الطباع" value={c.emotions} />}
                  {c.hobbies && <Row label="الهوايات" value={c.hobbies} />}
                  {c.fears && <Row label="المخاوف" value={c.fears} />}
                  {c.instructions && <Row label="تعليمات التعامل" value={c.instructions} />}
                  {c.notes && <Row label="ملاحظات" value={c.notes} />}
                </div>
              ))}
            </Section>
          )
        }

        // elderly (رعاية كبار السن)
        if (parsed?.type === 'elderly' && parsed.elderly && typeof parsed.elderly === 'object') {
          const e = parsed.elderly
          const L: Record<string, string> = {
            diseases: 'الأمراض المزمنة',
            medications: 'الأدوية',
            diet: 'نظام غذائي خاص',
            daily_meds: 'أدوية يومية',
            sleep_pattern: 'نمط النوم',
            hearing_vision: 'مشاكل السمع/البصر',
            breathing_wheelchair: 'أجهزة تنفس/كرسي متحرك',
            walks_alone: 'يمشي بمفرده',
            accepts_strangers: 'التعامل مع الغرباء',
            recognizes_family: 'يتعرّف على العائلة',
            reassurance: 'ما يطمئنه',
            preferred_treatment: 'المعاملة المفضّلة',
          }
          const fmtVal = (v: any): string => {
            if (v == null || v === '') return ''
            if (typeof v === 'object') {
              if ('answer' in v) {
                if (v.answer === 'yes') return v.note ? `نعم — ${v.note}` : 'نعم'
                if (v.answer === 'no') return 'لا'
                return v.note || ''
              }
              return Object.values(v).filter(Boolean).join('، ')
            }
            const m: Record<string, string> = { yes: 'نعم', no: 'لا', normal: 'طبيعي', anxious: 'لديه قلق' }
            return m[String(v)] || String(v)
          }
          const order = ['diseases', 'medications', 'diet', 'daily_meds', 'sleep_pattern', 'hearing_vision', 'breathing_wheelchair', 'walks_alone', 'accepts_strangers', 'recognizes_family', 'reassurance', 'preferred_treatment']
          return (
            <Section title="بيانات كبير السن" icon="👴">
              {e.name && <Row label="الاسم" value={e.name} />}
              {e.age && <Row label="العمر" value={String(e.age)} />}
              {order.map(k => {
                const val = fmtVal(e[k])
                return val ? <Row key={k} label={L[k] || k} value={val} /> : null
              })}
            </Section>
          )
        }

        // fallback: أعمدة مباشرة (للحجوزات اليدوية من /admin)
        if (booking.beneficiary_name) {
          return (
            <Section title="بيانات المستفيد" icon="👶">
              <Row label="الاسم" value={booking.beneficiary_name} />
              <Row label="العمر" value={booking.beneficiary_age} />
              <Row label="صلة القرابة" value={booking.beneficiary_relation} />
              <Row label="جوال الطوارئ" value={booking.emergency_phone} />
            </Section>
          )
        }

        return null
      })()}

      {/* الاستبانة */}
      {renderDetail()}

      {/* الملاحظات الداخلية — نعرض فقط الملاحظات الحقيقية، لا الـ JSON التقني */}
      {(() => {
        if (!booking.notes) return null
        // لو الملاحظات JSON تقني (يبدأ بـ {) لا نعرضه — هذي بيانات داخلية للنظام
        if (typeof booking.notes === 'string' && booking.notes.trim().startsWith('{')) {
          return null
        }
        // ملاحظة حقيقية كتبها الأدمن
        return (
          <Section title="ملاحظات داخلية" icon="📌">
            <div style={{ fontSize: '.88rem', lineHeight: 1.8, color: 'var(--dark)' }}>
              {booking.notes}
            </div>
          </Section>
        )
      })()}

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
