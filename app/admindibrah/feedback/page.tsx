'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Nav from '@/components/Nav'

type FB = {
  id: number
  booking_id: string
  customer_name: string
  customer_phone: string
  rating_overall: number
  rating_caregiver: number
  rating_punctuality: number
  rating_professionalism: number
  rating_cleanliness: number
  rating_communication: number
  would_recommend: string
  would_rebook: string
  positive_feedback: string
  improvement_feedback: string
  additional_comments: string
  created_at: string
}

const stars = (n: number) => '★'.repeat(n || 0) + '☆'.repeat(5 - (n || 0))

const labelRecommend: Record<string, string> = { yes: 'نعم بكل تأكيد', maybe: 'ربما', no: 'لا' }

export default function AdminFeedbackPage() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authed, setAuthed] = useState(false)
  const [items, setItems] = useState<FB[]>([])
  const [loading, setLoading] = useState(false)

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
      .from('feedback').select('*').order('created_at', { ascending: false })
    setItems((data as any) || [])
    setLoading(false)
  }

  if (!authChecked) return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>جاري التحقق...</div>

  if (!authed) {
    return (
      <>
        <Nav />
        <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: '48px 36px', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid rgba(95,97,87,.15)' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 80, height: 'auto', borderRadius: 12, marginBottom: 18 }} />
            <div style={{ fontSize: '3rem', marginBottom: 10 }}>🔒</div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 10 }}>الوصول مقيَّد</h2>
            <p style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.8, marginBottom: 24 }}>سجّل الدخول من لوحة التحكم الرئيسية أولاً.</p>
            <a href="/admindibrah" style={{ display: 'inline-block', padding: '13px 36px', background: 'var(--dark)', color: '#F6F0D7', borderRadius: 10, fontWeight: 700, textDecoration: 'none', fontSize: '.9rem' }}>
              الذهاب إلى لوحة التحكم ←
            </a>
          </div>
        </div>
      </>
    )
  }

  // متوسط التقييم العام
  const avgOverall = items.length
    ? (items.reduce((sum, x) => sum + (x.rating_overall || 0), 0) / items.length).toFixed(1)
    : '0.0'
  const recommendRate = items.length
    ? Math.round((items.filter(x => x.would_recommend === 'yes').length / items.length) * 100)
    : 0

  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '48px 24px 80px', direction: 'rtl' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, flexWrap: 'wrap' }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 56, height: 'auto', borderRadius: 10 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 900, color: '#777C6D', margin: 0, fontFamily: 'PNU, Tajawal, sans-serif' }}>تقييمات العملاء</h1>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginTop: 4 }}>{items.length} تقييم</p>
            </div>
            <a href="/admindibrah" style={{ padding: '10px 20px', background: 'white', color: 'var(--dark)', border: '1.5px solid var(--dark)', borderRadius: 8, fontWeight: 700, fontSize: '.85rem', textDecoration: 'none' }}>← اللوحة الرئيسية</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 28 }} className="fb-stats">
            <div style={{ background: 'var(--dark)', color: '#F6F0D7', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: '.85rem', opacity: .8, marginBottom: 6 }}>متوسط التقييم</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900 }}>{avgOverall} <span style={{ fontSize: '1.2rem', color: '#f5b800' }}>★</span></div>
            </div>
            <div style={{ background: 'white', border: '1.5px solid rgba(95,97,87,.12)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 6 }}>نسبة من ينصحون بنا</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#22c55e' }}>{recommendRate}%</div>
            </div>
            <div style={{ background: 'white', border: '1.5px solid rgba(95,97,87,.12)', borderRadius: 16, padding: '22px 24px' }}>
              <div style={{ fontSize: '.85rem', color: 'var(--muted)', marginBottom: 6 }}>إجمالي التقييمات</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--dark)' }}>{items.length}</div>
            </div>
          </div>

          {loading ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)' }}>جاري التحميل...</div>
          ) : items.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, padding: 60, textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 10 }}>📝</div>
              لا توجد تقييمات بعد
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {items.map(it => (
                <div key={it.id} style={{ background: 'white', borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(95,97,87,.1)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                    <div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)' }}>{it.customer_name || 'عميل غير معرّف'}</div>
                      <div style={{ fontSize: '.82rem', color: 'var(--muted)', marginTop: 2 }}>
                        {it.customer_phone || ''} {it.booking_id ? `· حجز #${it.booking_id.slice(0, 8)}` : ''}
                      </div>
                    </div>
                    <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                      {new Date(it.created_at).toLocaleString('ar-SA')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f0f0eb' }}>
                    <div style={{ fontSize: '1.4rem', color: '#f5b800', letterSpacing: 2 }}>{stars(it.rating_overall)}</div>
                    <div style={{ fontSize: '.9rem', color: 'var(--dark)', fontWeight: 700 }}>{it.rating_overall}/5</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 10, marginBottom: 14 }}>
                    {[
                      { l: 'مقدمة الرعاية', v: it.rating_caregiver },
                      { l: 'الالتزام بالمواعيد', v: it.rating_punctuality },
                      { l: 'الاحترافية', v: it.rating_professionalism },
                      { l: 'النظافة', v: it.rating_cleanliness },
                      { l: 'التواصل', v: it.rating_communication },
                    ].filter(x => x.v).map(x => (
                      <div key={x.l} style={{ fontSize: '.82rem', color: 'var(--muted)' }}>
                        <span style={{ color: '#f5b800', marginLeft: 6 }}>{stars(x.v)}</span>
                        {x.l}
                      </div>
                    ))}
                  </div>

                  {(it.would_recommend || it.would_rebook) && (
                    <div style={{ display: 'flex', gap: 16, fontSize: '.85rem', marginBottom: 12, flexWrap: 'wrap' }}>
                      {it.would_recommend && (
                        <span style={{ color: 'var(--dark)' }}>
                          <strong>ينصح بنا:</strong> {labelRecommend[it.would_recommend] || it.would_recommend}
                        </span>
                      )}
                      {it.would_rebook && (
                        <span style={{ color: 'var(--dark)' }}>
                          <strong>سيعيد الحجز:</strong> {labelRecommend[it.would_rebook] || it.would_rebook}
                        </span>
                      )}
                    </div>
                  )}

                  {it.positive_feedback && (
                    <div style={{ background: '#f0fdf4', borderRight: '3px solid #22c55e', padding: '10px 14px', borderRadius: 8, fontSize: '.88rem', marginBottom: 8, color: 'var(--dark)' }}>
                      <strong style={{ color: '#22c55e' }}>👍 أعجبه:</strong> {it.positive_feedback}
                    </div>
                  )}
                  {it.improvement_feedback && (
                    <div style={{ background: '#fef9e7', borderRight: '3px solid #f5b800', padding: '10px 14px', borderRadius: 8, fontSize: '.88rem', marginBottom: 8, color: 'var(--dark)' }}>
                      <strong style={{ color: '#b8860b' }}>💡 يقترح تحسين:</strong> {it.improvement_feedback}
                    </div>
                  )}
                  {it.additional_comments && (
                    <div style={{ background: '#f5f5f5', borderRight: '3px solid #888', padding: '10px 14px', borderRadius: 8, fontSize: '.88rem', color: 'var(--dark)' }}>
                      <strong>💬 ملاحظة:</strong> {it.additional_comments}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <style jsx global>{`
          @media (max-width: 768px) {
            .fb-stats { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </div>
    </>
  )
}
