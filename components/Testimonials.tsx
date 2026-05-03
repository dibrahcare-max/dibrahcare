const testis = [
  { text: 'تجربة مريحة جدًا، الحاضنة كانت لطيفة واهتمت بأطفالي بكل حب واحترافية. أكيد راح أكرر التجربة.', name: 'أم محمد' },
  { text: 'طلبت مرافقة لبنتي في مشوار، وكانت تجربة آمنة ومطمئنة جدًا.', name: 'أم سارة' },
  { text: 'تعاملهم راقي جدًا، واهتمامهم بكبار السن كان إنساني قبل يكون مهني. شكرًا دبرة.', name: 'أبو عبدالعزيز' },
]

export default function Testimonials() {
  return (
    <section style={{ padding: '96px 64px', background: 'var(--bg)' }} className="sec-testi">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }} className="rv">
        <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold)', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>ماذا يقولون</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>آراء عائلاتنا</h2>
        <p style={{ fontSize: '.95rem', color: 'white', lineHeight: 1.8, marginTop: 10 }}>أكثر من 500 عائلة سعودية وثقت بدِبرة</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="testi-grid">
        {testis.map(t => (
          <div key={t.name} className="rv testi-card" style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', transition: 'all .3s' }}>
            <div style={{ color: '#777C6D', fontSize: '1rem', marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
            <p style={{ fontSize: '.92rem', color: 'var(--muted)', lineHeight: 1.75, marginBottom: 20 }}>"{t.text}"</p>
            <div style={{ fontWeight: 800, fontSize: '.88rem', color: 'var(--dark)' }}>{t.name}</div>
          </div>
        ))}
      </div>
      <style>{`
        .testi-card:hover { box-shadow: 0 8px 32px rgba(45,58,30,.08); transform: translateY(-3px); }
        @media (max-width: 1024px) { .testi-grid { grid-template-columns: 1fr !important; } .sec-testi { padding: 64px 24px !important; } }
      `}</style>
    </section>
  )
}
