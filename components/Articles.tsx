const articles = [
  { img: 'art1', date: '25/04/2026', title: 'كيف تختار المرافق المناسب لمرافقة مريضك؟' },
  { img: 'art2', date: '25/04/2026', title: '10 أسئلة يجب أن تسأليها قبل توظيف جليسة أطفال' },
  { img: 'art3', date: '25/04/2026', title: 'رعاية كبار السن: أمانٌ وكرامة' },
]

export default function Articles() {
  return (
    <section id="articles" style={{ padding: '96px 64px', background: 'var(--bg)' }} className="sec-art">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }} className="rv">
        <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold)', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>مقالات</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>أحدث المقالات</h2>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="art-grid">
        {articles.map(a => (
          <div key={a.img} className="rv art-card" style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)', transition: 'all .3s' }}>
            <img src={`/images/${a.img}.png`} loading="lazy" alt={a.title} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover' }} />
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginBottom: 8 }}>{a.date}</div>
              <div style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--dark)', lineHeight: 1.5, marginBottom: 12 }}>{a.title}</div>
              <span style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--gold)' }}>اقرأ المزيد ←</span>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .art-card:hover { box-shadow: 0 8px 32px rgba(45,58,30,.1); transform: translateY(-3px); }
        @media (max-width: 1024px) { .art-grid { grid-template-columns: 1fr 1fr !important; } .sec-art { padding: 64px 24px !important; } }
        @media (max-width: 600px) { .art-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
