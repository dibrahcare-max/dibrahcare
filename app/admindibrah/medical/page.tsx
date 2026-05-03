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

export default function MedicalAdminPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [regs, setRegs] = useState<MedicalReg[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

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
    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('type', 'medical')
      .order('created_at', { ascending: false })
    setRegs((data as any) || [])
    setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('registrations').update({ status }).eq('id', id)
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

  const filtered = regs.filter(r =>
    !search ||
    r.subscriber_name?.includes(search) ||
    r.subscriber_phone?.includes(search) ||
    r.subscriber_id?.includes(search)
  )

  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '48px 32px 80px', direction: 'rtl' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 56, height: 'auto', borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#777C6D', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>حجوزات الرعاية الطبية</h1>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 4 }}>{regs.length} طلب تسجيل · تُقدَّم من قبل مستشفى الرعاية الطبية</p>
            </div>
            <a href="/admindibrah" style={{ padding: '10px 20px', background: 'white', color: 'var(--dark)', border: '1.5px solid var(--dark)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>← لوحة دِبرة الرئيسية</a>
            <button onClick={logout} style={{ padding: '10px 20px', background: 'none', border: '1.5px solid rgba(95,97,87,.3)', color: 'var(--muted)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', cursor: 'pointer' }}>خروج</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'إجمالي الطلبات', val: regs.length, color: '#5f6157' },
              { label: 'قيد المراجعة',   val: regs.filter(r => r.status === 'pending').length, color: '#f59e0b' },
              { label: 'تم التواصل',     val: regs.filter(r => r.status === 'contacted').length, color: '#3b82f6' },
              { label: 'منفذ',          val: regs.filter(r => r.status === 'done').length, color: '#22c55e' },
            ].map(s => (
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

          {loading ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>جاري التحميل...</div>
          ) : filtered.length === 0 ? (
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
                    {filtered.map((r, i) => (
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
          )}
        </div>
      </div>
    </>
  )
}
