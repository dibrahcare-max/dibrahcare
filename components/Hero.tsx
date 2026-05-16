export default function Hero() {
  return (
    <section id="home" style={{
      minHeight: '92vh',
      position: 'relative',
      display: 'flex',
      alignItems: 'flex-end',
      overflow: 'hidden',
      borderRadius: 24,
      margin: 12, marginTop: 48,
    }} className="hero-section">
      {/* BG */}
      <div style={{ position: 'absolute', inset: 0 }}>
        <img
          src="/images/hero-cover.png"
          alt="دِبرة"
          className="hero-img"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top' }}
        />
      </div>

      {/* overlay على الجوال */}
      <div className="hero-overlay" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.6) 0%, rgba(0,0,0,.2) 50%, transparent 100%)', display: 'none' }} />

      {/* TEXT */}
      <div style={{
        position: 'relative', zIndex: 2,
        padding: '120px 64px 80px',
        width: '55%',
        marginLeft: 'auto',
      }} className="hero-text-wrap">
        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 5.5rem)',
          fontWeight: 900,
          color: 'white',
          fontFamily: 'PNU, Tajawal, sans-serif',
          lineHeight: 1.05,
        }} className="anim-2">
          دِبرة تدبّرك
          <em style={{ color: 'var(--gold)', fontStyle: 'normal', display: 'block', fontSize: 'clamp(2rem, 4vw, 3.8rem)', fontWeight: 700, marginBottom: 20, fontFamily: 'PNU, sans-serif' }}>
            معنى جديد للرعاية
          </em>
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,.85)', lineHeight: 1.8, maxWidth: 520, marginBottom: 40 }} className="anim-3">
          نمنح الأمان، ونصنع الثقة، بأيدي سعودية
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }} className="anim-4">
          <a href="/auth" style={{
            background: 'var(--gold)', color: 'var(--dark)',
            fontSize: '.92rem', fontWeight: 800, padding: '14px 36px', borderRadius: 8,
            display: 'inline-block', transition: 'all .2s', fontFamily: 'PNU, sans-serif',
          }}>احجز خدمتك الآن</a>
          <a href="/about" style={{
            background: 'rgba(255,255,255,.12)', color: 'white',
            fontSize: '.92rem', fontWeight: 800, padding: '14px 36px', borderRadius: 8,
            border: '1.5px solid rgba(255,255,255,.35)', display: 'inline-block', transition: 'all .2s', fontFamily: 'PNU, sans-serif',
          }}>تعرف علينا</a>
        </div>

        {/* BADGES */}
        <div style={{ marginTop: 64, display: 'flex', gap: 16, flexWrap: 'wrap' }} className="anim-5 hero-badges">
          {[
            { v: '500+', l: 'عائلة راضية' },
            { v: '100%', l: 'كوادر وطنية' },
            { v: '24/7', l: 'خدمة متواصلة' },
          ].map(b => (
            <div key={b.l} className="hero-badge" style={{
              background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)',
              borderRadius: 12, padding: '14px 20px', textAlign: 'center', backdropFilter: 'blur(8px)',
              flex: '1 1 auto', minWidth: 80,
            }}>
              <div style={{ fontSize: 'clamp(1.4rem, 4vw, 2rem)', fontWeight: 900, color: 'white', fontFamily: 'PNU, Tajawal, sans-serif' }}>{b.v}</div>
              <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.7)', marginTop: 4 }}>{b.l}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .hero-section { margin: 8px !important; border-radius: 16px !important; min-height: 88vh !important; }
          .hero-overlay { display: block !important; }
          .hero-img { object-position: 30% top !important; }
          .hero-text-wrap { width: 100% !important; padding: 48px 24px 40px !important; margin: 0 !important; }
          .hero-badges { margin-top: 32px !important; gap: 8px !important; }
          .hero-badge { padding: 10px 12px !important; }
        }
      `}</style>
    </section>
  )
}
