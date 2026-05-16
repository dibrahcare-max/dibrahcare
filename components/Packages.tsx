const packages = [
  { name: 'الباقة اليومية', sub: 'يوم واحد', featured: false, rows: [{ h: '4 ساعات', v: '350 ﷼' }, { h: '8 ساعات', v: '700 ﷼' }] },
  { name: 'الباقة الأسبوعية', sub: 'خمسة أيام', featured: true, rows: [{ h: '4 ساعات', v: '1,750 ﷼' }, { h: '8 ساعات', v: '3,500 ﷼' }] },
  { name: 'الباقة الشهرية', sub: 'ستة وعشرون يوماً', featured: false, rows: [{ h: '4 ساعات', v: '8,000 ﷼' }, { h: '8 ساعات', v: '16,000 ﷼' }] },
]

export default function Packages() {
  return (
    <section id="packages" style={{ padding: '96px 64px', background: 'var(--bg)' }} className="sec-pkg">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }} className="rv">
        <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold)', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>الباقات</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>اختر الباقة المناسبة</h2>
        <p style={{ fontSize: '.95rem', color: 'white', lineHeight: 1.8, marginTop: 10 }}>أسعار شفافة بدون رسوم خفية، مع ضمان استمرارية الكادر المناسب لعائلتك.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="pkg-grid">
        {packages.map(p => (
          <div key={p.name} className="rv pkg-card" style={{
            background: '#EEEEEE', borderRadius: 16, padding: '32px 28px', position: 'relative',
            border: p.featured ? '2px solid var(--gold)' : '1.5px solid var(--border)',
            transition: 'all .3s',
          }}>
            {p.featured && (
              <div style={{ position: 'absolute', top: -13, right: 24, background: 'var(--gold)', color: '#777C6D', fontSize: '.65rem', fontWeight: 800, letterSpacing: '.1em', padding: '4px 14px', borderRadius: 20, whiteSpace: 'nowrap' }}>
                الأكثر طلباً
              </div>
            )}
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 4 }}>{p.name}</div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 20 }}>{p.sub}</div>
            <div style={{ height: 1, background: 'var(--border)', marginBottom: 18 }} />
            {p.rows.map(r => (
              <div key={r.h} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(45,58,30,.05)' }}>
                <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}>{r.h}</span>
                <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', display: 'inline-flex', alignItems: 'center', gap: 5, direction: 'ltr' }}>
                  <img src="/images/sar.webp" alt="ر.س" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                  {r.v.replace(' ﷼', '')}
                </span>
              </div>
            ))}
            <a href="/auth" style={{
              display: 'block', width: '100%', marginTop: 20,
              background: '#777C6D',
              color: '#F6F0D7',
              fontSize: '.85rem', fontWeight: 800, padding: 12, borderRadius: 8, textAlign: 'center', transition: 'background .2s',
            }}>احجز الآن</a>
          </div>
        ))}
      </div>

      <style>{`
        .pkg-card:hover { box-shadow: 0 12px 40px rgba(45,58,30,.1); transform: translateY(-4px); }
        @media (max-width: 1024px) {
          .pkg-grid { grid-template-columns: 1fr !important; max-width: 420px; margin: 0 auto; }
          .sec-pkg { padding: 64px 24px !important; }
        }
      `}</style>
    </section>
  )
}
