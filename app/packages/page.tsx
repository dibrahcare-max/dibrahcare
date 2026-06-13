'use client'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

const packages = [
  {
    id: 'daily',
    label: 'الباقة اليومية',
    subtitle: 'يوم واحد',
    color: 'var(--dark)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:56,height:56}}>
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    options: [
      { hours: 4, price: 350 },
      { hours: 8, price: 700 },
    ],
    features: ['رعاية كاملة طوال مدة الباقة','كوادر سعودية مؤهلة','مرونة في تحديد الوقت','مناسبة للمناسبات والأعراس'],
  },
  {
    id: 'weekly',
    label: 'الباقة الأسبوعية',
    subtitle: 'خمسة أيام',
    color: 'var(--dark)',
    featured: true,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:56,height:56}}>
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>
      </svg>
    ),
    options: [
      { hours: 4, price: 1750 },
      { hours: 8, price: 3500 },
    ],
    features: ['خدمة متواصلة لمدة أسبوع','استمرارية ذات الكادر طوال الأسبوع','تقرير يومي للأهل','سعر تنافسي مقارنةً بالباقة اليومية'],
  },
  {
    id: 'monthly',
    label: 'الباقة الشهرية',
    subtitle: 'ستة وعشرون يوماً',
    color: 'var(--dark)',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{width:56,height:56}}>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
    options: [
      { hours: 4, price: 8000 },
      { hours: 8, price: 16000 },
    ],
    features: ['الخيار الأوفر والأكثر استقراراً لعائلتك','استمرارية وانسجام مع الأسرة','أولوية في الجدولة والحجز','دعم مستمر على مدار الشهر'],
  },
]

export default function PackagesPage() {
  return (
    <>
      <Nav />
      {/* Hero */}
      <div style={{ margin: '48px 12px 0', borderRadius: 24, overflow: 'hidden', lineHeight: 0 }}>
        <img src="/images/packages-hero.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <section style={{ padding: '80px 64px', background: 'var(--bg)' }} className="sec-pkg">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, maxWidth: 1100, margin: '0 auto', alignItems: 'start' }} className="pkg-grid">
          {packages.map((pkg) => (
            <div key={pkg.id} style={{
              background: 'var(--dark)',
              borderRadius: 24, overflow: 'hidden',
              border: 'none',
              boxShadow: '0 8px 32px rgba(95,97,87,.18)',
              position: 'relative',
              transform: pkg.featured ? 'scale(1.04)' : 'none',
            }}>
              {pkg.featured && (
                <div style={{
                  background: '#F6F0D7', color: 'var(--dark)',
                  textAlign: 'center', padding: '10px', fontSize: '.82rem',
                  fontWeight: 900, letterSpacing: '.1em',
                }}>⭐ الأكثر طلباً</div>
              )}

              <div style={{ padding: '36px 32px 28px', direction: 'rtl' }}>
                {/* Icon */}
                <div style={{
                  color: '#F6F0D7',
                  marginBottom: 20,
                }}>
                  {pkg.icon}
                </div>

                {/* Title */}
                <h2 style={{
                  fontSize: '1.5rem', fontWeight: 900,
                  color: '#F6F0D7',
                  marginBottom: 6, fontFamily: 'PNU, Tajawal, sans-serif',
                }}>{pkg.label}</h2>
                <p style={{
                  fontSize: '.95rem', fontWeight: 600,
                  color: 'rgba(246,240,215,.55)',
                  marginBottom: 28,
                }}>"{pkg.subtitle}"</p>

                {/* Prices */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {pkg.options.map((opt) => (
                    <div key={opt.hours} style={{
                      background: 'rgba(246,240,215,.08)',
                      borderRadius: 12, padding: '16px 20px',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      border: '1px solid rgba(246,240,215,.12)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          style={{ width: 18, height: 18, color: '#F6F0D7', flexShrink: 0 }}>
                          <circle cx="12" cy="12" r="10"/>
                          <polyline points="12 6 12 12 16 14"/>
                        </svg>
                        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#F6F0D7' }}>
                          {opt.hours} ساعات
                        </span>
                      </div>
                      <div style={{ textAlign: 'left', direction: 'ltr', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <img src="/images/sar.webp" alt="ر.س" style={{ width: 22, height: 22, objectFit: 'contain', filter: 'brightness(10)', opacity: 0.85 }} />
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#F6F0D7' }}>
                          {opt.price.toLocaleString('ar-SA')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ borderTop: '1px solid rgba(246,240,215,.12)', marginBottom: 20 }} />

                {/* Features */}
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {pkg.features.map((f, j) => (
                    <li key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '.95rem', color: 'rgba(246,240,215,.8)', lineHeight: 1.7 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        style={{ width: 17, height: 17, flexShrink: 0, marginTop: 3, color: '#F6F0D7' }}>
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <a href="/auth" style={{
                  display: 'block', textAlign: 'center',
                  padding: '14px 20px', borderRadius: 12,
                  background: '#F6F0D7',
                  color: 'var(--dark)',
                  fontWeight: 800, fontSize: '1rem',
                  textDecoration: 'none', fontFamily: 'PNU, Tajawal, sans-serif',
                  transition: 'opacity .2s',
                }}>احجز الباقة</a>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        <div style={{ textAlign: 'center', marginTop: 48, maxWidth: 600, margin: '48px auto 0', direction: 'rtl' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px 32px', border: '1px solid rgba(95,97,87,.12)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              style={{ width: 22, height: 22, color: 'var(--dark)', flexShrink: 0, marginTop: 2 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 1.9, margin: 0 }}>
              الطفل الأول والثاني بنفس سعر الباقة — من الطفل الثالث فصاعداً يُضاف <strong style={{ color: 'var(--dark)' }}>رسم الباقة الأساسي</strong> لكل مستفيد ثالث فصاعداً
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'var(--dark)', padding: '72px 64px', textAlign: 'center', direction: 'rtl' }} className="sec-pkg-cta">
        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 12, fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة تدبّرك</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#F6F0D7', marginBottom: 16, fontFamily: 'PNU, Tajawal, sans-serif' }}>مو متأكد من الباقة المناسبة؟</h2>
        <p style={{ color: 'rgba(227,238,213,.5)', fontSize: '1rem', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.9 }}>تواصل معنا وسيساعدك فريقنا في اختيار الباقة الأنسب لاحتياجات عائلتك</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/auth" style={{ display: 'inline-block', background: '#F6F0D7', color: 'var(--dark)', fontSize: '1rem', fontWeight: 800, padding: '15px 40px', borderRadius: 10, textDecoration: 'none' }}>احجز الآن</a>
          <a href="/contact" style={{ display: 'inline-block', background: 'transparent', color: '#F6F0D7', fontSize: '1rem', fontWeight: 700, padding: '15px 32px', borderRadius: 10, textDecoration: 'none', border: '1.5px solid rgba(227,238,213,.3)' }}>تواصل معنا</a>
        </div>
      </section>

      <Footer />
      <WhatsApp />
      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) {
          .hero-pkg { margin: 8px !important; border-radius: 16px !important; } .hero-subtitle { font-size: clamp(.65rem,3vw,1.05rem) !important; max-width: 50% !important; } .hero-title { font-size: clamp(.9rem,4vw,3.6rem) !important; }
          .hero-legal { padding: 60px 24px 48px !important; }
          .sec-pkg { padding: 56px 20px !important; }
          .sec-pkg-cta { padding: 56px 24px !important; }
          .pkg-grid { grid-template-columns: 1fr !important; }
          .pkg-grid > div { transform: none !important; }
        }
      `}</style>
    </>
  )
}
