'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SUPPORT_TYPE_LABELS, toDrivePreviewUrl } from '@/lib/supports'

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
  distribution_date?: string
  distribution_time?: string
  report_url?: string
  received_at: string
  scheduled_at?: string
  disbursed_at?: string
}

function formatDate(d?: string) {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric', calendar: 'gregory',
    })
  } catch { return d }
}

function formatTime(t?: string) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  const period = hour >= 12 ? 'م' : 'ص'
  const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${displayHour}:${m} ${period}`
}

export default function JourneyPage({ params }: { params: { support_number: string } }) {
  const router = useRouter()
  const [support, setSupport] = useState<Support | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const phone = sessionStorage.getItem('supporter_phone')
    if (!phone) {
      router.replace('/supporters')
      return
    }
    fetch('/api/supports/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, support_number: params.support_number }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setSupport(data.support)
        else setError(data.error || 'تعذر التحميل')
      })
      .catch(e => setError(e?.message || 'خطأ'))
      .finally(() => setLoading(false))
  }, [params.support_number, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2D4A1E', fontSize: '1.1rem' }}>جاري تحميل رحلة الدعم...</div>
      </div>
    )
  }

  if (error || !support) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{
          background: 'white', borderRadius: 16, padding: 32, maxWidth: 420, textAlign: 'center',
          boxShadow: '0 10px 40px rgba(45, 74, 30, 0.08)',
        }}>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
            {error || 'لم يتم العثور على الدعم'}
          </div>
          <button onClick={() => router.push('/supporters')}
            style={{ marginTop: 12, padding: '12px 24px', background: '#2D4A1E', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            رجوع
          </button>
        </div>
      </div>
    )
  }

  const stages = [
    { key: 'received',  done: true, dateField: support.received_at },
    { key: 'scheduled', done: support.status === 'scheduled' || support.status === 'disbursed', dateField: support.scheduled_at },
    { key: 'disbursed', done: support.status === 'disbursed', dateField: support.disbursed_at },
  ]

  const previewUrl = support.report_url ? toDrivePreviewUrl(support.report_url) : null

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 20px' }}>

      {/* رأس */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <img src="/images/dibrah-logo.png" alt="دِبرة" style={{ height: 48, marginBottom: 16 }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#2D4A1E', margin: 0, marginBottom: 6 }}>
          رحلة دعمك الكريم
        </h1>
        <div style={{ fontSize: '.88rem', color: 'rgba(45, 74, 30, .6)', letterSpacing: '.05em', direction: 'ltr' }}>
          {support.support_number}
        </div>
      </div>

      {/* بطاقة معلومات الداعم */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 20, marginBottom: 28,
        boxShadow: '0 4px 20px rgba(45, 74, 30, 0.04)',
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12,
      }}>
        <InfoCell label="الداعم" value={support.donor_name} />
        <InfoCell label="المبلغ" value={`${support.amount} ر.س`} />
        <InfoCell label="نوع الدعم" value={SUPPORT_TYPE_LABELS[support.support_type] || 'دعم عام'} />
      </div>

      {/* الخط الزمني */}
      <div style={{ position: 'relative', paddingRight: 28 }}>
        {/* الخط العمودي */}
        <div style={{
          position: 'absolute', right: 12, top: 12, bottom: 12, width: 2,
          background: 'linear-gradient(180deg, #2D4A1E 0%, #9CB58A 100%)',
        }} />

        {stages.map((stage, idx) => (
          <TimelineStage
            key={stage.key}
            stage={stage.key}
            done={stage.done}
            date={stage.dateField}
            support={support}
            isLast={idx === stages.length - 1}
          />
        ))}
      </div>

      {/* معاينة التقرير لو الحالة موزّعة */}
      {support.status === 'disbursed' && support.report_url && (
        <div style={{ marginTop: 36 }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#2D4A1E', marginBottom: 12 }}>
            📄 تقرير الصرف
          </h3>
          {previewUrl && previewUrl.includes('drive.google.com') ? (
            <div style={{
              background: 'white', borderRadius: 12, overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(45, 74, 30, 0.08)',
            }}>
              <iframe
                src={previewUrl}
                style={{ width: '100%', height: 560, border: 'none' }}
                allow="autoplay"
                title="تقرير الصرف"
              />
            </div>
          ) : (
            <div style={{
              background: 'white', borderRadius: 12, padding: 20, textAlign: 'center',
              boxShadow: '0 4px 20px rgba(45, 74, 30, 0.04)',
            }}>
              <p style={{ marginBottom: 12, color: 'rgba(45, 74, 30, .7)' }}>
                التقرير متاح للتحميل عبر الرابط أدناه
              </p>
            </div>
          )}
          <a
            href={support.report_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block', marginTop: 14, padding: '12px 28px',
              background: '#2D4A1E', color: 'white', textDecoration: 'none',
              borderRadius: 10, fontWeight: 700, fontSize: '.95rem',
            }}
          >
            📥 تحميل التقرير
          </a>
        </div>
      )}

      {/* رجوع */}
      <div style={{ textAlign: 'center', marginTop: 40 }}>
        <button
          onClick={() => { sessionStorage.removeItem('supporter_phone'); router.push('/supporters') }}
          style={{
            background: 'transparent', border: '1.5px solid rgba(45, 74, 30, .2)',
            color: '#2D4A1E', padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: '.9rem', fontWeight: 600,
          }}
        >
          خروج
        </button>
      </div>
    </div>
  )
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: '.75rem', color: 'rgba(45, 74, 30, .55)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '.95rem', fontWeight: 700, color: '#2D4A1E' }}>{value}</div>
    </div>
  )
}

function TimelineStage({ stage, done, date, support, isLast }: {
  stage: string; done: boolean; date?: string; support: Support; isLast: boolean
}) {
  return (
    <div style={{ position: 'relative', paddingBottom: isLast ? 0 : 32 }}>
      {/* النقطة */}
      <div style={{
        position: 'absolute', right: -22, top: 4,
        width: 24, height: 24, borderRadius: '50%',
        background: done ? '#2D4A1E' : '#E5E7DE',
        border: `3px solid ${done ? '#2D4A1E' : '#E5E7DE'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'white', fontSize: '.7rem', fontWeight: 700,
      }}>
        {done ? '✓' : ''}
      </div>

      {/* المحتوى */}
      <div style={{
        background: done ? 'white' : 'rgba(255, 255, 255, .5)',
        borderRadius: 14, padding: 18, marginRight: 12,
        boxShadow: done ? '0 4px 20px rgba(45, 74, 30, 0.05)' : 'none',
        opacity: done ? 1 : 0.5,
      }}>
        <StageContent stage={stage} support={support} done={done} />
        {done && date && (
          <div style={{ fontSize: '.78rem', color: 'rgba(45, 74, 30, .55)', marginTop: 8 }}>
            {formatDate(date)}
          </div>
        )}
      </div>
    </div>
  )
}

function StageContent({ stage, support, done }: { stage: string; support: Support; done: boolean }) {
  if (stage === 'received') {
    return (
      <>
        <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#2D4A1E', marginBottom: 6 }}>
          الخطوة ١ — تم الاستلام
        </div>
        <div style={{ fontSize: '.95rem', color: '#3F5732', lineHeight: 1.7 }}>
          كتب الله أجركم 🌿، تم استلام دعمكم بمبلغ <b>{support.amount} ريال</b> وتم تسجيله لدينا برقم{' '}
          <span style={{ direction: 'ltr', display: 'inline-block', fontWeight: 700 }}>{support.support_number}</span>.
        </div>
      </>
    )
  }
  if (stage === 'scheduled') {
    return (
      <>
        <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#2D4A1E', marginBottom: 6 }}>
          الخطوة ٢ — جدولة التوزيع
        </div>
        {done ? (
          <div style={{ fontSize: '.95rem', color: '#3F5732', lineHeight: 1.7 }}>
            تم توجيه دعمكم الكريم لصرفه وتوزيعه في <b>"{support.distribution_place}"</b>{' '}
            بتاريخ <b>{formatDate(support.distribution_date)}</b>
            {support.distribution_time && <> الساعة <b>{formatTime(support.distribution_time)}</b></>}.
          </div>
        ) : (
          <div style={{ fontSize: '.92rem', color: 'rgba(45, 74, 30, .5)' }}>
            في انتظار تحديد خطة التوزيع...
          </div>
        )}
      </>
    )
  }
  // disbursed
  return (
    <>
      <div style={{ fontSize: '.85rem', fontWeight: 800, color: '#2D4A1E', marginBottom: 6 }}>
        الخطوة ٣ — تم التوزيع
      </div>
      {done ? (
        <div style={{ fontSize: '.95rem', color: '#3F5732', lineHeight: 1.7 }}>
          بفضل من الله ثم بدعمكم الكريم، تم توزيع دعمكم في <b>"{support.distribution_place}"</b>{' '}
          بتاريخ <b>{formatDate(support.distribution_date)}</b>
          {support.distribution_time && <> الساعة <b>{formatTime(support.distribution_time)}</b></>}.
          وبين أيديكم تقرير الصرف.
        </div>
      ) : (
        <div style={{ fontSize: '.92rem', color: 'rgba(45, 74, 30, .5)' }}>
          في انتظار إتمام التوزيع ورفع التقرير...
        </div>
      )}
    </>
  )
}
