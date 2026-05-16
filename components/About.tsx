export default function About() {
  return (
    <section id="about" style={{ padding: '96px 64px', background: 'var(--bg)' }} className="sec-about">
      {/* من نحن */}
      <div style={{
        background: 'white', borderRadius: 24, padding: 28, border: '1px solid var(--border)',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'center', marginBottom: 20,
      }} className="rv about-box">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {['svc-kids2','svc-hospital','svc-elderly','svc-postnatal'].map(img => (
            <img key={img} src={`/images/${img}.png`} loading="lazy" alt=""
              style={{ borderRadius: 12, width: '100%', aspectRatio: '1', objectFit: 'cover' }} />
          ))}
        </div>
        <div>
          <span style={{ fontSize: '3rem', fontWeight: 900, color: '#777C6D', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>من نحن</span>
          <h2 style={{ fontFamily: 'PNU, Tajawal, sans-serif', fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1, marginBottom: 16 }}>دبرة العائلة</h2>
          <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 2 }}>
            شركة سعودية تُعنى بتقديم خدمات الرعاية المنزلية للأطفال وكبار السن، بروحٍ من المسؤولية والاهتمام. كوادر سعودية مؤهلة تجمع بين الخبرة والإنسانية، نوفر خدمات راقية بأيدي كوادر سعودية مدربة، تفهمُ احتياجات الأسرة، وتحملُ القيم الأصيلة التي تزرع الأمان في كل بيت.
          </p>
          <div style={{ textAlign: 'right', marginTop: 28 }}>
            <a href="#packages" style={{ display: 'inline-block', background: 'var(--dark)', color: '#F6F0D7', fontSize: '.9rem', fontWeight: 700, padding: '13px 36px', borderRadius: 8 }}>
              ابدأ مع دِبرة
            </a>
          </div>
        </div>
      </div>

      {/* الرؤية والرسالة */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="rv vision-box">
        {[
          { title: 'الرؤية', text: 'أن نكون الوجهة السعودية الرائدة والموثوقة في صناعة الرعاية المنزلية الحديثة' },
          { title: 'الرسالة', text: 'توفير رعاية منزلية بلمسة إنسانية، تمكّن الكفاءات الوطنية وترتقي بجودة حياة الأسرة السعودية' },
        ].map(v => (
          <div key={v.title} style={{ background: 'white', borderRadius: 20, padding: 36, border: '1px solid var(--border)' }}>
            <h3 style={{ fontFamily: 'PNU, Tajawal, sans-serif', fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 14 }}>{v.title}</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--muted)', lineHeight: 1.9 }}>{v.text}</p>
          </div>
        ))}
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .about-box { grid-template-columns: 1fr !important; }
          .vision-box { grid-template-columns: 1fr !important; }
          .sec-about { padding: 64px 24px !important; }
        }
      `}</style>
    </section>
  )
}
