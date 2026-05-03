export default function Partners() {
  // الشركاء — أضف اللوقوهم هنا لاحقاً
  const partners: { name: string; logo?: string }[] = [
    // { name: 'اسم الشريك', logo: '/images/partner-1.png' },
  ]

  const placeholders = Array.from({ length: 6 })

  return (
    <section id="partners" style={{ padding: '96px 64px', background: 'var(--bg)' }} className="sec-partners">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }} className="rv">
        <span style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--gold)', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>شركاؤنا</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>نفتخر بشراكاتنا</h2>
        <p style={{ fontSize: '.95rem', color: 'white', lineHeight: 1.8, marginTop: 10 }}>نعمل مع شركاء موثوقين لتقديم أفضل خدمات الرعاية.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 20,
        maxWidth: 900,
        margin: '0 auto',
      }} className="partners-grid">
        {placeholders.map((_, i) => (
          <div key={i} style={{
            background: 'white',
            border: '1.5px dashed var(--border)',
            borderRadius: 16,
            height: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {partners[i] ? (
              partners[i].logo
                ? <img src={partners[i].logo} alt={partners[i].name} style={{ maxHeight: 60, maxWidth: '80%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>{partners[i].name}</span>
            ) : (
              <span style={{ fontSize: '.75rem', color: 'rgba(45,74,30,.2)', letterSpacing: '.1em' }}>قريباً</span>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) { .partners-grid { grid-template-columns: 1fr 1fr !important; } .sec-partners { padding: 64px 24px !important; } }
        @media (max-width: 480px) { .partners-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
