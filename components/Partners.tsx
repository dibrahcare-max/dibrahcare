export default function Partners() {
  // الشركاء — fullBleed: شعار يملأ الكارت بدون إطار أبيض
  const partners: { name: string; logo?: string; fullBleed?: boolean }[] = [
    { name: 'مستشفى رعاية الطبية', logo: '/images/care-medical-logo.webp' },
    { name: 'جمعية أيامى',         logo: '/images/ayama-logo.svg', fullBleed: true },
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
        gap: 28,
        maxWidth: 900,
        margin: '0 auto',
      }} className="partners-grid">
        {placeholders.map((_, i) => {
          const hasLogo = partners[i]?.logo
          const fullBleed = partners[i]?.fullBleed
          return (
          <div key={i} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              background: fullBleed ? 'transparent' : 'white',
              border: fullBleed ? 'none' : '1.5px dashed var(--border)',
              borderRadius: 16,
              height: 110,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: fullBleed ? 0 : 12,
              overflow: 'hidden',
            }}>
              {partners[i] ? (
                partners[i].logo
                  ? <img
                      src={partners[i].logo}
                      alt={partners[i].name}
                      style={fullBleed
                        ? { width: '100%', height: '100%', objectFit: 'cover', borderRadius: 16 }
                        : { maxHeight: 80, maxWidth: '90%', objectFit: 'contain' }
                      }
                    />
                  : <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>{partners[i].name}</span>
              ) : (
                <span style={{ fontSize: '.75rem', color: 'rgba(45,74,30,.2)', letterSpacing: '.1em' }}>قريباً</span>
              )}
            </div>

            {partners[i] && (
              <div style={{
                fontSize: '.85rem',
                fontWeight: 700,
                color: 'var(--dark)',
                textAlign: 'center',
                fontFamily: 'PNU, Tajawal, sans-serif',
                lineHeight: 1.5,
              }}>
                {partners[i].name}
              </div>
            )}
          </div>
          )
        })}
      </div>

      <style>{`
        @media (max-width: 768px) { .partners-grid { grid-template-columns: 1fr 1fr !important; } .sec-partners { padding: 64px 24px !important; } }
        @media (max-width: 480px) { .partners-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
