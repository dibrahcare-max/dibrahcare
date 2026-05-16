'use client'
import { useState, useEffect } from 'react'
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
  created_at: string
}

export default function DonorsListPage() {
  const [supports, setSupports] = useState<Support[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/supports/list')
      const data = await res.json()
      setSupports(data.supports || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = supports.filter(s => {
    if (filter !== 'all' && s.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        s.donor_name.toLowerCase().includes(q) ||
        s.donor_phone.includes(q) ||
        s.support_number.toLowerCase().includes(q)
      )
    }
    return true
  })

  const stats = {
    total: supports.length,
    received: supports.filter(s => s.status === 'received').length,
    scheduled: supports.filter(s => s.status === 'scheduled').length,
    disbursed: supports.filter(s => s.status === 'disbursed').length,
    totalAmount: supports.filter(s => s.status !== 'cancelled').reduce((sum, s) => sum + Number(s.amount), 0),
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 24 }}>
        الداعمين
      </h1>

      {/* الإحصائيات */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 28,
      }}>
        <Stat label="الإجمالي" value={stats.total} />
        <Stat label="قيد الاستلام" value={stats.received} color="#3b82f6" />
        <Stat label="مجدول" value={stats.scheduled} color="#f59e0b" />
        <Stat label="موزّع" value={stats.disbursed} color="#22c55e" />
        <Stat label="مجموع الدعم" value={`${stats.totalAmount.toLocaleString()} ر.س`} color="var(--dark)" />
      </div>

      {/* الفلاتر */}
      <div style={{
        background: 'white', borderRadius: 14, padding: 16, marginBottom: 20,
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input
          placeholder="🔍 بحث بالاسم، الجوال، أو رقم الدعم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 240, padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid rgba(95, 97, 87, .12)', fontFamily: 'inherit', fontSize: '.92rem', outline: 'none',
          }}
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            padding: '10px 14px', borderRadius: 10,
            border: '1.5px solid rgba(95, 97, 87, .12)', fontFamily: 'inherit', fontSize: '.92rem', outline: 'none',
          }}
        >
          <option value="all">كل الحالات</option>
          <option value="received">قيد الاستلام</option>
          <option value="scheduled">مجدول</option>
          <option value="disbursed">موزّع</option>
          <option value="cancelled">ملغي</option>
        </select>
        <a href="/supporters/admin/new"
          style={{
            padding: '10px 20px', background: 'var(--dark)', color: 'white', textDecoration: 'none',
            borderRadius: 10, fontWeight: 700, fontSize: '.92rem',
          }}>
          ➕ دعم جديد
        </a>
      </div>

      {/* الجدول */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'rgba(95, 97, 87, .6)' }}>جاري التحميل...</div>
      ) : filtered.length === 0 ? (
        <div style={{
          background: 'white', borderRadius: 14, padding: 48, textAlign: 'center',
          color: 'rgba(95, 97, 87, .55)',
        }}>
          {supports.length === 0 ? 'لا يوجد داعمين بعد. أنشئ أول دعم لتبدأ 🌿' : 'لا توجد نتائج تطابق البحث'}
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(95, 97, 87, .04)', textAlign: 'right' }}>
                  <Th>رقم الدعم</Th>
                  <Th>الداعم</Th>
                  <Th>الجوال</Th>
                  <Th>المبلغ</Th>
                  <Th>النوع</Th>
                  <Th>الحالة</Th>
                  <Th>التاريخ</Th>
                  <Th>إجراء</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const status = SUPPORT_STATUS_LABELS[s.status] || { label: s.status, color: '#888' }
                  return (
                    <tr key={s.id} style={{ borderTop: '1px solid rgba(95, 97, 87, .06)' }}>
                      <Td><span style={{ direction: 'ltr', fontWeight: 600 }}>{s.support_number}</span></Td>
                      <Td>{s.donor_name}</Td>
                      <Td><span style={{ direction: 'ltr' }}>{s.donor_phone}</span></Td>
                      <Td>{s.amount.toLocaleString()} ر.س</Td>
                      <Td>{SUPPORT_TYPE_LABELS[s.support_type] || '—'}</Td>
                      <Td>
                        <span style={{
                          fontSize: '.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                          background: `${status.color}1a`, color: status.color,
                        }}>
                          {status.label}
                        </span>
                      </Td>
                      <Td>{new Date(s.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', calendar: 'gregory' })}</Td>
                      <Td>
                        <a href={`/supporters/admin/edit/${s.id}`}
                          style={{ color: 'var(--dark)', fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>
                          عرض / تعديل
                        </a>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: any; color?: string }) {
  return (
    <div style={{
      background: 'white', borderRadius: 14, padding: 16,
      boxShadow: '0 2px 12px rgba(95, 97, 87, .04)',
    }}>
      <div style={{ fontSize: '.75rem', color: 'rgba(95, 97, 87, .55)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: color || 'var(--dark)' }}>{value}</div>
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{
      padding: '12px 14px', fontWeight: 700, fontSize: '.82rem', color: 'rgba(95, 97, 87, .65)',
      letterSpacing: '.02em',
    }}>
      {children}
    </th>
  )
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: '14px', color: 'var(--dark)' }}>{children}</td>
}
