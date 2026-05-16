'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

type DiscountCode = {
  id: string
  code: string
  discount_percent: number
  valid_from: string
  valid_until: string
  used: boolean
  used_at: string | null
  used_by_customer_id: string | null
  used_for_booking_id: string | null
  batch_label: string | null
  is_void: boolean
  is_public: boolean
  use_count: number
  created_at: string
}

type FilterType = 'all' | 'available' | 'used' | 'expired' | 'void'

export default function DiscountCodesAdminPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [percentFilter, setPercentFilter] = useState<string>('all')
  const [batchFilter, setBatchFilter] = useState<string>('all')

  // ── نموذج التوليد ──
  const [genPercent, setGenPercent] = useState<number>(20)
  const [genCount, setGenCount] = useState<number>(100)
  const [genMonths, setGenMonths] = useState<number>(6)
  const [genBatch, setGenBatch] = useState<string>('')
  const [genIsPublic, setGenIsPublic] = useState<boolean>(false)
  const [genCustomCode, setGenCustomCode] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [genMessage, setGenMessage] = useState('')

  // ─── التحقق من تسجيل الدخول ───
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
    const { data } = await supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false })
    setCodes((data as any) || [])
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (generating) return
    setGenerating(true)
    setGenMessage('')
    try {
      const res = await fetch('/api/admin/discount-codes/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          percentage: genPercent,
          count: genCount,
          validityMonths: genMonths,
          batchLabel: genBatch.trim() || null,
          isPublic: genIsPublic,
          customCode: genCustomCode.trim() || null,
        }),
      })
      const d = await res.json()
      if (d.success) {
        setGenMessage(`✅ تم توليد ${d.inserted} كود بنجاح`)
        setGenBatch('')
        setGenCustomCode('')
        load()
      } else {
        setGenMessage(`❌ ${d.message || 'فشل التوليد'}`)
      }
    } catch (err: any) {
      setGenMessage(`❌ خطأ: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  // ─── حذف/إلغاء كود ───
  const handleDelete = async (c: DiscountCode) => {
    const willVoid = c.use_count > 0
    const msg = willVoid
      ? `هذا الكود "${c.code}" استُخدم سابقاً.\nسيُعلَّم كـ "ملغى" مع الاحتفاظ بسجل المحاسبة.\n\nالاستمرار؟`
      : `هل تريد حذف الكود "${c.code}" نهائياً؟`
    if (!confirm(msg)) return
    try {
      const res = await fetch(`/api/admin/discount-codes/${c.id}`, { method: 'DELETE' })
      const d = await res.json()
      if (d.success) {
        load()
      } else {
        alert(`❌ ${d.message || 'فشل التنفيذ'}`)
      }
    } catch (err: any) {
      alert(`❌ خطأ: ${err.message}`)
    }
  }

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    window.location.href = '/admindibrah'
  }

  // ─── helper: هل الكود "مستخدم/مستهلك"؟ ───
  // خاص: مستهلك إذا use_count >= 1
  // عام: لا يُعتبر مستهلك أبداً (متاح طوال فترة الصلاحية)
  const isConsumed = (c: DiscountCode) => !c.is_public && c.use_count >= 1

  // ─── فلترة وبحث ───
  const now = new Date()
  const filtered = codes.filter(c => {
    // الحالة
    const isExpired = new Date(c.valid_until) < now
    const consumed = isConsumed(c)
    if (filter === 'available' && (consumed || c.is_void || isExpired)) return false
    if (filter === 'used' && !consumed) return false
    if (filter === 'expired' && (!isExpired || consumed)) return false
    if (filter === 'void' && !c.is_void) return false
    // النسبة
    if (percentFilter !== 'all' && String(c.discount_percent) !== percentFilter) return false
    // الدفعة
    if (batchFilter !== 'all' && c.batch_label !== batchFilter) return false
    // البحث
    if (search.trim()) {
      const q = search.trim().toUpperCase()
      if (!c.code.includes(q) && !(c.batch_label || '').toUpperCase().includes(q)) return false
    }
    return true
  })

  // ─── إحصائيات ───
  const stats = {
    total:     codes.length,
    available: codes.filter(c => !isConsumed(c) && !c.is_void && new Date(c.valid_until) >= now).length,
    used:      codes.filter(c =>  isConsumed(c)).length,
    expired:   codes.filter(c => !isConsumed(c) && new Date(c.valid_until) <  now).length,
    void:      codes.filter(c =>  c.is_void).length,
  }

  // ─── قائمة الدفعات الفريدة (للفلتر) ───
  const batches = Array.from(new Set(codes.map(c => c.batch_label).filter(Boolean))) as string[]

  // ─── حالة الكود (للعرض) ───
  const codeStatus = (c: DiscountCode) => {
    if (c.is_void) return { label: 'ملغى', color: '#6b7280', bg: '#f3f4f6' }
    if (isConsumed(c)) return { label: 'مستخدم', color: '#22c55e', bg: '#dcfce7' }
    if (new Date(c.valid_until) < now) return { label: 'منتهي', color: '#ef4444', bg: '#fee2e2' }
    return { label: 'متاح', color: '#0891b2', bg: '#cffafe' }
  }

  if (!authChecked) {
    return (
      <>
        <Nav />
        <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 60, textAlign: 'center', direction: 'rtl' }}>
          <div style={{ color: 'var(--muted)' }}>جاري التحقق...</div>
        </div>
      </>
    )
  }

  if (!authed) {
    return (
      <>
        <Nav />
        <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 60, textAlign: 'center', direction: 'rtl' }}>
          <h2 style={{ color: 'var(--dark)', marginBottom: 16 }}>غير مصرّح</h2>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>سجّل الدخول من لوحة الأدمن أولاً</p>
          <a href="/admindibrah" style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--dark)', color: '#F6F0D7', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>
            ← لوحة دِبرة
          </a>
        </div>
      </>
    )
  }

  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '48px 32px 80px', direction: 'rtl' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* ═══ Header ═══ */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 56, height: 'auto', borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#777C6D', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>
                🎟️ أكواد الخصم
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 4 }}>
                {stats.total} كود · {stats.available} متاح · {stats.used} مستخدم
              </p>
            </div>
            <a href="/admindibrah" style={{ padding: '10px 20px', background: 'white', color: 'var(--dark)', border: '1.5px solid var(--dark)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>← لوحة دِبرة الرئيسية</a>
            <button onClick={logout} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>خروج</button>
          </div>

          {/* ═══ إحصائيات ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'الإجمالي', val: stats.total,     color: '#5f6157' },
              { label: 'متاح',     val: stats.available, color: '#0891b2' },
              { label: 'مستخدم',   val: stats.used,      color: '#22c55e' },
              { label: 'منتهي',    val: stats.expired,   color: '#ef4444' },
              { label: 'ملغى',     val: stats.void,      color: '#6b7280' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(95,97,87,.1)' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.val}</div>
                <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* ═══ نموذج التوليد ═══ */}
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid rgba(95,97,87,.1)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚡ توليد دفعة جديدة
            </div>

            {/* Toggle نوع الاستخدام */}
            <div style={{ marginBottom: 16 }}>
              <label style={lblStyle}>نوع الاستخدام</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setGenIsPublic(false)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid',
                    borderColor: !genIsPublic ? 'var(--dark)' : 'rgba(95,97,87,.2)',
                    background: !genIsPublic ? 'var(--dark)' : 'white',
                    color: !genIsPublic ? '#F6F0D7' : 'var(--dark)',
                    fontWeight: 800,
                    fontSize: '.9rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  🔒 خاص (مرة واحدة لعميل واحد)
                </button>
                <button
                  type="button"
                  onClick={() => setGenIsPublic(true)}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 10,
                    border: '1.5px solid',
                    borderColor: genIsPublic ? 'var(--dark)' : 'rgba(95,97,87,.2)',
                    background: genIsPublic ? 'var(--dark)' : 'white',
                    color: genIsPublic ? '#F6F0D7' : 'var(--dark)',
                    fontWeight: 800,
                    fontSize: '.9rem',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}>
                  👥 عام (بلا حد طوال فترة الصلاحية)
                </button>
              </div>
            </div>

            {/* الكود المخصّص (اختياري) */}
            <div style={{ marginBottom: 16 }}>
              <label style={lblStyle}>كود مخصّص <span style={{ color: 'var(--muted)', fontWeight: 500 }}>(اختياري)</span></label>
              <input
                type="text"
                value={genCustomCode}
                onChange={e => setGenCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9\-]/g, ''))}
                maxLength={20}
                placeholder="مثل: HAJJ20 — اتركه فارغاً للتوليد العشوائي"
                style={{ ...inpStyle, fontFamily: 'monospace', fontWeight: 700, direction: 'ltr', textAlign: 'left' }}
              />
              {genCustomCode && (
                <div style={{ marginTop: 6, padding: '6px 10px', background: '#fef3c7', borderRadius: 6, fontSize: '.78rem', color: '#92400e', fontWeight: 600 }}>
                  💡 سيُولَّد كود واحد فقط بهذا الاسم (يتجاهل العدد المحدد أسفل)
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: 12, alignItems: 'flex-end' }}>
              <div>
                <label style={lblStyle}>نسبة الخصم</label>
                <select value={genPercent} onChange={e => setGenPercent(parseInt(e.target.value, 10))} style={selStyle}>
                  {[10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 95, 99, 100].map(p => (
                    <option key={p} value={p}>{p}%</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lblStyle}>{genIsPublic ? 'عدد الأكواد' : 'عدد الأكواد'}</label>
                <input type="number" min={1} max={500} value={genCount} onChange={e => setGenCount(parseInt(e.target.value, 10) || 0)} style={inpStyle} />
              </div>
              <div>
                <label style={lblStyle}>المدة (شهور)</label>
                <select value={genMonths} onChange={e => setGenMonths(parseInt(e.target.value, 10))} style={selStyle}>
                  {[1, 3, 6, 12, 24].map(m => (
                    <option key={m} value={m}>{m} شهر</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lblStyle}>وسم الدفعة (اختياري)</label>
                <input type="text" value={genBatch} onChange={e => setGenBatch(e.target.value)} placeholder="مثال: مايو 2026" style={inpStyle} />
              </div>
              <button onClick={handleGenerate} disabled={generating} style={{
                padding: '12px 28px',
                background: generating ? 'rgba(95,97,87,.3)' : 'var(--dark)',
                color: '#F6F0D7',
                border: 'none',
                borderRadius: 10,
                fontWeight: 800,
                fontSize: '.95rem',
                cursor: generating ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
              }}>
                {generating ? 'جارٍ التوليد...' : '⚡ توليد'}
              </button>
            </div>

            {genIsPublic && (
              <div style={{ marginTop: 12, padding: '8px 12px', background: '#fef3c7', borderRadius: 8, fontSize: '.82rem', color: '#92400e' }}>
                💡 الكود العام يستخدمه أي عميل عدد غير محدود من المرات حتى تاريخ الانتهاء
              </div>
            )}

            {genMessage && (
              <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: genMessage.startsWith('✅') ? '#dcfce7' : '#fee2e2', color: genMessage.startsWith('✅') ? '#166534' : '#991b1b', fontSize: '.9rem', fontWeight: 600 }}>
                {genMessage}
              </div>
            )}
          </div>

          {/* ═══ فلاتر ═══ */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12, marginBottom: 18 }}>
            <input type="text" placeholder="بحث في الكود أو الدفعة..." value={search} onChange={e => setSearch(e.target.value)} style={inpStyle} />
            <select value={filter} onChange={e => setFilter(e.target.value as FilterType)} style={selStyle}>
              <option value="all">الحالة: الكل</option>
              <option value="available">متاح</option>
              <option value="used">مستخدم</option>
              <option value="expired">منتهي</option>
              <option value="void">ملغى</option>
            </select>
            <select value={percentFilter} onChange={e => setPercentFilter(e.target.value)} style={selStyle}>
              <option value="all">النسبة: الكل</option>
              {[10, 15, 20, 25, 30, 35, 40, 45, 50].map(p => <option key={p} value={p}>{p}%</option>)}
            </select>
            <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)} style={selStyle}>
              <option value="all">الدفعة: الكل</option>
              {batches.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* ═══ جدول الأكواد ═══ */}
          {loading ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>جاري التحميل...</div>
          ) : filtered.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>
              {codes.length === 0 ? 'لا توجد أكواد بعد — ولّد دفعة جديدة من الأعلى' : 'لا توجد أكواد مطابقة للفلتر'}
            </div>
          ) : (
            <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(95,97,87,.1)' }}>
              <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(95,97,87,.1)', fontSize: '.85rem', color: 'var(--muted)', fontWeight: 600 }}>
                عرض {filtered.length} من {codes.length}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                  <thead>
                    <tr style={{ background: '#f6f0d7' }}>
                      <th style={thStyle}>الكود</th>
                      <th style={thStyle}>الخصم</th>
                      <th style={thStyle}>النوع</th>
                      <th style={thStyle}>الحالة</th>
                      <th style={thStyle}>الاستخدامات</th>
                      <th style={thStyle}>الدفعة</th>
                      <th style={thStyle}>صالح حتى</th>
                      <th style={thStyle}>أُنشئ في</th>
                      <th style={thStyle}>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      const st = codeStatus(c)
                      return (
                        <tr key={c.id} style={{ borderTop: '1px solid rgba(95,97,87,.08)' }}>
                          <td style={tdStyle}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--dark)' }}>{c.code}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: '#fef3c7', color: '#92400e', padding: '3px 10px', borderRadius: 999, fontWeight: 800, fontSize: '.82rem' }}>
                              {c.discount_percent}%
                            </span>
                          </td>
                          <td style={tdStyle}>
                            {c.is_public ? (
                              <span style={{ background: '#ddd6fe', color: '#5b21b6', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '.78rem' }}>
                                👥 عام
                              </span>
                            ) : (
                              <span style={{ background: '#e0f2fe', color: '#0c4a6e', padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '.78rem' }}>
                                🔒 خاص
                              </span>
                            )}
                          </td>
                          <td style={tdStyle}>
                            <span style={{ background: st.bg, color: st.color, padding: '3px 10px', borderRadius: 999, fontWeight: 700, fontSize: '.78rem' }}>
                              {st.label}
                            </span>
                          </td>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 700, color: c.use_count > 0 ? '#22c55e' : 'var(--muted)' }}>
                              {c.is_public ? `${c.use_count} مرّة` : `${c.use_count} / 1`}
                            </span>
                          </td>
                          <td style={tdStyle}>{c.batch_label || '—'}</td>
                          <td style={tdStyle} dir="ltr">{new Date(c.valid_until).toLocaleDateString('ar-SA')}</td>
                          <td style={tdStyle} dir="ltr">{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                          <td style={tdStyle}>
                            {c.is_void ? (
                              <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>—</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleDelete(c)}
                                title={c.use_count > 0 ? 'إلغاء (مع الاحتفاظ بالسجل)' : 'حذف نهائي'}
                                style={{
                                  padding: '5px 12px',
                                  background: 'none',
                                  color: '#991b1b',
                                  border: '1px solid #fca5a5',
                                  borderRadius: 6,
                                  fontWeight: 700,
                                  fontSize: '.78rem',
                                  cursor: 'pointer',
                                  fontFamily: 'inherit',
                                }}
                              >
                                {c.use_count > 0 ? '⊘ إلغاء' : '🗑 حذف'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

// ─── أنماط مكررة ───
const lblStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '.78rem',
  fontWeight: 700,
  color: 'var(--muted)',
  marginBottom: 6,
}
const inpStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid rgba(95,97,87,.2)',
  borderRadius: 8,
  fontFamily: 'inherit',
  fontSize: '.9rem',
  background: '#fafaf9',
  color: 'var(--dark)',
  outline: 'none',
  boxSizing: 'border-box',
}
const selStyle: React.CSSProperties = {
  ...inpStyle,
  cursor: 'pointer',
  background: 'white',
}
const thStyle: React.CSSProperties = {
  padding: '12px 14px',
  textAlign: 'right',
  fontWeight: 800,
  color: 'var(--dark)',
  fontSize: '.82rem',
}
const tdStyle: React.CSSProperties = {
  padding: '14px',
  textAlign: 'right',
  color: 'var(--dark)',
  verticalAlign: 'middle',
}
