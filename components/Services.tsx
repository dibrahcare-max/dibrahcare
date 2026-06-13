const icons: Record<string, string> = {
  '00': 'M22 12h-4l-3 9L9 3l-3 9H2',
  '01': 'M12 2C8 2 5 5 5 9c0 3 2 5.5 4 7l3 3 3-3c2-1.5 4-4 4-7 0-4-3-7-7-7zm0 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4z',
  '02': 'M22 12h-4l-3 9L9 3l-3 9H2',
  '03': 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm13 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
  '04': 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  '05': 'M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z',
  '06': 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  '07': 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 6v4l3 3',
  '08': 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10',
  '09': 'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
}

const services = [
  { num: '00', slug: 'medical',   cat: 'طبي', title: 'طلب التواصل مع مزوّد الرعاية الطبية المنزلية', desc: 'نُتيح لك طلب التواصل مباشرة مع منشآت صحية معتمدة من وزارة الصحة. دورنا يقتصر على الربط فقط دون أي تدخل طبي.', isNew: true, partnerLogo: true },
  { num: '01', slug: 'child-home',     cat: 'أطفال', title: 'حضانة الأطفال داخل المنزل', desc: 'تقديم رعاية متكاملة للأطفال داخل المنزل أو خارجه، مع الالتزام الكامل بمعايير السلامة والاهتمام بصحة الطفل.' },
  { num: '02', slug: 'hospital',       cat: 'مستشفى', title: 'مرافقة المرضى في المستشفى', desc: 'مرافقة إنسانية تسهّل تنقّل المريض بين الأقسام وتذكّره بالمواعيد وتقدّم دعمًا نفسيًا دون أي تدخل طبي.' },
  { num: '03', slug: 'elderly',        cat: 'رعاية', title: 'رعاية كبار السن', desc: 'مرافقة يومية دافئة ومساعدة شخصية مع المساعدة في متابعة الأدوية والمواعيد وتقديم التقدير والاحترام لكبير السن.' },
  { num: '04', slug: 'child-escort',   cat: 'أطفال', title: 'خدمة المرافقة الآمنة', desc: 'استقلالية آمنة لابنتكِ، وطمأنينة لقلبكِ. مرافقة احترافية في جولاتها الخارجية' },
  { num: '05', slug: 'travel',         cat: 'سفر', title: 'خدماتنا بالسفر', desc: 'مرافقة للأطفال أثناء الرحلات والسفر، سواء داخل المملكة أو خارجها.' },
  { num: '06', slug: 'bride',          cat: 'مناسبات', title: 'خدماتنا المميزة للعروس', desc: 'وصيفة العروس تهتم بأدق التفاصيل، وتمنح العروس راحة وطمأنينة في أهم لحظات حياتها.' },
  { num: '07', slug: 'child-programs', cat: 'أطفال', title: 'برامج وأنشطة خارجية', desc: 'برامج ترفيهية وتعليمية خارجية للأطفال بإشراف كوادر مؤهلة، تنمّي مهاراتهم وتصنع ذكريات جميلة.' },
  { num: '08', slug: 'housekeeper',    cat: 'منزل', title: 'ربعيات / مدبرة منزل', desc: 'خدمة إدارة المنزل بأيدٍ سعودية موثوقة، تضمن نظافة وترتيباً وراحة كاملة لعائلتك.' },
]

export default function Services() {
  return (
    <section id="services" style={{ padding: '96px 64px', background: 'white' }} className="sec-services">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }} className="rv">
        <span style={{ fontSize: '4rem', fontWeight: 900, color: '#777C6D', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>خدماتنا</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>راحة بالك تبدأ من هنا</h2>
        <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 1.8, marginTop: 10 }}>نوفر لك حاضنات ومرافقات مؤهلات بعناية، وخدمات مرنة تناسب احتياجك اليومي.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }} className="svc-grid">
        {services.map(s => (
          <a key={s.num} href={`/services#${s.slug}`} className="rv svc-card" style={{
            borderRadius: 20, padding: '36px 28px', background: '#EEEEEE',
            border: (s as any).isNew ? '1.5px solid #777C6D' : '1.5px solid var(--border)',
            cursor: 'pointer', transition: 'all .3s',
            display: 'flex', flexDirection: 'column', gap: 16,
            position: 'relative', overflow: 'hidden',
            textDecoration: 'none', color: 'inherit',
          }}>
            {(s as any).isNew && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'var(--dark)', color: '#F6F0D7',
                fontSize: '.65rem', fontWeight: 800, padding: '3px 10px',
                borderRadius: 20, letterSpacing: '.1em',
              }}>✨ جديد</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#777C6D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32, flexShrink: 0 }}>
                <path d={icons[s.num]} />
              </svg>
              <div style={{ fontSize: '.65rem', fontWeight: 700, letterSpacing: '.2em', textTransform: 'uppercase', color: '#777C6D' }}>{s.cat}</div>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', lineHeight: 1.3 }}>{s.title}</div>
            {(s as any).partnerLogo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'white', borderRadius: 8, border: '1px solid rgba(95,97,87,.1)' }}>
                <span style={{ fontSize: '.65rem', color: 'var(--muted)', fontWeight: 600 }}>بالتعاون مع</span>
                <img src="/images/care-medical-logo.webp" alt="رعاية الطبية" style={{ height: 26, width: 'auto', objectFit: 'contain' }} />
              </div>
            )}
            <div style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--muted)', lineHeight: 1.6 }}>{s.desc}</div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4,
              fontSize: '.78rem', fontWeight: 700, color: '#F6F0D7',
              background: '#777C6D', padding: '8px 16px', borderRadius: 6,
              transition: 'all .3s', width: 'fit-content',
            }}>اعرف أكثر ←</div>
          </a>
        ))}
      </div>

      <style>{`
        .svc-card:hover { background: #CBCBCB !important; transform: translateY(-4px); box-shadow: 0 16px 48px rgba(45,58,30,.1); }
        @media (max-width: 1024px) { .svc-grid { grid-template-columns: 1fr 1fr !important; } .sec-services { padding: 64px 24px !important; } }
        @media (max-width: 600px) { .svc-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </section>
  )
}
