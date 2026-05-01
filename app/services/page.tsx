'use client'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'
import VisitTracker from '@/components/VisitTracker'
import Image from 'next/image'

const services = [
  {
    id: 'medical', cat: 'طبي', img: 'svc-medical.png', isNew: true, partnerLogo: true,
    title: 'طلب التواصل مع مزوّد الرعاية الطبية المنزلية المرخّص',
    desc: 'نُتيح لك طلب التواصل مباشرة مع منشآت صحية معتمدة من وزارة الصحة للحصول على خدمات الرعاية الطبية المنزلية، بما يشمل زيارات الأطباء، جلسات العلاج الطبيعي والوظيفي والتخاطب، وخدمات التحاليل المنزلية المقدمة من مزوّدين مرخّصين بالكامل.',
    features: ['التحويل يتم مباشرة إلى صفحة المزوّد الطبي','لا يوجد أي تنسيق طبي أو تدخل علاجي من دِبرة','المزودون مرخصون من وزارة الصحة','دورنا يقتصر على الربط فقط'],
  },
  {
    id: 'childcare', cat: 'أطفال', img: 'svc-childcare.png',
    title: 'حضانة الأطفال داخل المنزل',
    desc: 'تقديم رعاية متكاملة للأطفال داخل المنزل أو خارجه، مع الالتزام الكامل بمعايير السلامة والاهتمام بصحة الطفل وضمان بيئة مستقرة وآمنة تلبّي احتياجاته اليومية بعناية ومسؤولية.',
    features: ['الإشراف والمتابعة اليومية للطفل','رعاية شاملة تشمل التغذية والنوم والنظافة','مرونة في الأوقات والمناسبات','أنشطة ترفيهية وتربوية مناسبة للعمر'],
  },
  {
    id: 'child-travel', cat: 'سفر', img: 'svc-child-travel.png',
    title: 'مرافقة الأطفال في السفر',
    desc: 'مرافقة متخصصة للأطفال أثناء الرحلات سواء داخل المملكة أو خارجها، مع رعاية كاملة من لحظة المغادرة حتى العودة وطمأنينة تامة للأهل.',
    features: ['الرعاية الكاملة خلال جميع مراحل الرحلة','تهيئة جو هادئ للطفل وتأمين احتياجاته','أنشطة وألعاب تناسب أجواء السفر','تغطية لحظية وتحديثات مستمرة للأهل'],
  },
  {
    id: 'elderly', cat: 'كبار السن', img: 'svc-elderly-care.png',
    title: 'رعاية كبار السن',
    desc: 'مرافقة يومية دافئة ومساعدة شخصية محترمة تهتم بتنظيم الأدوية والمواعيد وتضمن التقدير والاحترام لكبير السن في كل لحظة.',
    features: ['مرافقة دافئة طوال اليوم وحضور حقيقي','تقديم المساعدة الشخصية بتقدير واحترافية','المساعدة في متابعة الأدوية والمواعيد الطبية','أنشطة خفيفة مناسبة: قراءة وجلسات حوار'],
  },
  {
    id: 'elderly-travel', cat: 'سفر كبار السن', img: 'svc-elderly-travel.png',
    title: 'مرافقة كبار السن في السفر',
    desc: 'مرافقة متخصصة لكبار السن خلال الرحلات داخل المملكة وخارجها، مع الاهتمام الكامل براحتهم وصحتهم والحرص على سلامتهم في كل مرحلة.',
    features: ['المرافقة الكاملة من المنزل وحتى العودة','مساعدة في تذكّر العلاج والأدوية دون أي متابعة صحية','التعامل مع المواقف الطارئة بهدوء واحترافية','التواصل المستمر مع ذوي كبير السن'],
  },
  {
    id: 'hospital', cat: 'مستشفى', img: 'svc-hospital2.png',
    title: 'مرافقة المرضى في المستشفى',
    desc: 'مرافقة إنسانية تهدف إلى تسهيل تنقّل المريض بين الأقسام، وتقديم الدعم النفسي والمساعدة في الحركة، إضافة إلى تذكيره بمواعيد الفحوصات والعلاج دون أي تدخل طبي، مع إفادة الأسرة بالمستجدات التي يقدّمها المستشفى كما هي، بما يخفف العبء عنهم.',
    features: ['مرافقة التنقل بين أقسام المستشفى','تذكير بمواعيد الفحوصات والعلاج دون أي متابعة طبية','دعم نفسي ومساعدة في الحركة','إفادة الأسرة بالمستجدات التي يقدّمها المستشفى كما هي دون أي تفسير طبي'],
  },
  {
    id: 'postnatal', cat: 'ما بعد الولادة', img: 'svc-postnatal2.png',
    title: 'رعاية مابعد الولادة للأم والمولود',
    desc: 'رعاية الأم وتقديم المساعدة البدنية اللازمة بعد الولادة مع العناية الأولية بالمولود، لمنح الأم وقتاً للراحة والاستشفاء.',
    features: ['رعاية الأم والمساعدة البدنية','عناية أولية بالمولود: استحمام وتغيير ورضاعة','مرافقة في المستشفى لتخفيف العبء','دعم نفسي وعاطفي في هذه المرحلة الحساسة'],
  },
  {
    id: 'bride', cat: 'مناسبات', img: 'svc-bride2.png',
    title: 'وصيفة العروس',
    desc: 'في يوم تُصنع فيه أجمل الذكريات، تأتي وصيفة العروس لتكون الرفيقة التي تهتم بأدق التفاصيل وتمنح العروس راحة وطمأنينة تستحقها.',
    features: ['لتكوني الملكة في ليلتك ونحن نهتم بكل التفاصيل','ترتيب الفستان وتفاصيل الإطلالة طوال الحفل','التنسيق مع المصورة ومنظمي الحفل','تلبية احتياجات العروس الخاصة','ضمان راحة العروس وتألقها طوال الليلة'],
  },
  {
    id: 'wedding', cat: 'أعراس', img: 'svc-wedding.png',
    title: 'مرافقة الأعراس والمناسبات',
    desc: 'فريق متخصص لمرافقة وتنظيم حفلات الأعراس والمناسبات الكبرى، يضمن سير كل شيء بسلاسة وأناقة ويصنع ذكريات لا تُنسى.',
    features: ['مرافقة متخصصة طوال فترة الحفل','التنسيق مع جميع أطراف المناسبة','الاهتمام بضيوف العائلة وراحتهم','إدارة التفاصيل بكفاءة واحترافية'],
  },
  {
    id: 'teen', cat: 'مراهقون', img: 'svc-teen.png',
    title: 'المرافقة الآمنة للمراهقين',
    desc: 'نُدرك رغبة المراهقين في استكشاف استقلاليتهم، لذلك وفّرنا المرافقة الآمنة التي تمنحهم الحرية مع طمأنينةٍ تامةٍ للأهل.',
    features: ['مرافقة آمنة للتسوق واللقاءات الاجتماعية','رعاية موثوقة تحترم خصوصية المراهق','طمأنينة تامة للأهل في جميع الأوقات','متابعة لحظية وإحاطة مستمرة للأهل'],
  },
  {
    id: 'religious', cat: 'مناسبات دينية', img: 'svc-religious.png',
    title: 'مرافقة المناسبات الدينية والأعياد',
    desc: 'مرافقة متخصصة في المناسبات الدينية والأعياد والاحتفالات الإسلامية، مع الحرص على الروح الدينية الأصيلة وإحياء القيم الجميلة.',
    features: ['مرافقة في مناسبات رمضان والأعياد','الاهتمام بالأطفال في الاحتفالات الدينية','تنظيم الفعاليات الدينية الأسرية','إحياء التراث والقيم الإسلامية بفرح حقيقي'],
  },
]

export default function ServicesPage() {
  return (
    <>
      <VisitTracker page="services" />
      <Nav />

      {/* Hero - نفس تصميم من نحن */}
      <section style={{ padding: '48px 64px', background: 'var(--bg)' }} className="sec-svc-hero">

        {/* Main Box */}
        <div style={{
          background: 'white', borderRadius: 24, padding: 28,
          border: '1px solid rgba(95,97,87,.15)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
          alignItems: 'center', marginBottom: 20,
        }} className="about-box">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['svc-childcare.png','svc-elderly-care.png','svc-bride2.png','svc-hospital2.png'].map((img) => (
              <div key={img} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
                <Image src={`/images/${img}`} alt="" fill style={{ objectFit: 'cover' }} loading="lazy" />
              </div>
            ))}
          </div>
          <div>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 12, fontFamily: 'PNU, Tajawal, sans-serif' }}>خدماتنا</span>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1, marginBottom: 16, fontFamily: 'PNU, Tajawal, sans-serif' }}>راحة بالك تبدأ من هنا</h2>
            <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 2 }}>
              نُقدّم خدمات رعاية متكاملة بأيدٍ سعودية مؤهلة وموثوقة. من رعاية الأطفال إلى مرافقة كبار السن، ومن المناسبات إلى السفر — دِبرة حاضرة متى احتجتنا.
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
              <a href="/auth" style={{
                display: 'inline-block', background: 'var(--dark)', color: '#F6F0D7',
                fontSize: '.9rem', fontWeight: 700, padding: '13px 36px',
                borderRadius: 8, textDecoration: 'none',
              }}>احجز الآن</a>
              <a href="/contact" style={{
                display: 'inline-block', background: 'transparent', color: 'var(--dark)',
                fontSize: '.9rem', fontWeight: 700, padding: '13px 28px',
                borderRadius: 8, textDecoration: 'none', border: '1.5px solid var(--dark)',
              }}>تواصل معنا</a>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }} className="stats-grid">
          {[
            { n: '١١+', label: 'خدمة متخصصة' },
            { n: '٢٤/٧', label: 'خدمة متاحة' },
            { n: '١٠٠٪', label: 'كوادر سعودية' },
          ].map((s) => (
            <div key={s.n} style={{ background: 'white', borderRadius: 20, padding: '28px 20px', textAlign: 'center', border: '1px solid rgba(95,97,87,.15)' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: 6 }}>{s.n}</div>
              <div style={{ fontSize: '.82rem', color: 'var(--muted)', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Service Cards */}
      <section style={{ padding: '0 64px 96px', background: 'var(--bg)' }} className="sec-svc-cards">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {services.map((s, i) => (
            <div key={s.id} id={s.id} style={{
              background: 'white', borderRadius: 24, overflow: 'hidden',
              border: s.isNew ? '1.5px solid var(--dark)' : '1px solid rgba(95,97,87,.15)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              direction: i % 2 === 0 ? 'rtl' : 'ltr',
              position: 'relative',
              scrollMarginTop: 100,
            }} className="svc-card-detail">
              {s.isNew && (
                <div style={{
                  position: 'absolute', top: 16, zIndex: 10,
                  right: i % 2 === 0 ? 16 : 'auto', left: i % 2 !== 0 ? 16 : 'auto',
                  background: 'var(--dark)', color: '#F6F0D7',
                  fontSize: '.68rem', fontWeight: 800, padding: '4px 12px',
                  borderRadius: 20,
                }}>✨ جديد</div>
              )}

              {/* Image */}
              <div style={{ position: 'relative', minHeight: 360, overflow: 'hidden' }}>
                <Image src={`/images/${s.img}`} alt={s.title} fill style={{ objectFit: 'cover' }} loading="lazy" />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(95,97,87,.4) 0%, transparent 50%)',
                }} />
                <div style={{
                  position: 'absolute', bottom: 20, right: 20, left: 20,
                  direction: 'rtl',
                }}>
                  <span style={{
                    background: 'rgba(255,255,255,.9)', color: 'var(--dark)',
                    fontSize: '.68rem', fontWeight: 800, padding: '4px 12px',
                    borderRadius: 20, letterSpacing: '.08em',
                  }}>{s.cat}</span>
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: '44px 40px', direction: 'rtl', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <h2 style={{
                    fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 900,
                    color: 'var(--dark)', margin: 0,
                    fontFamily: 'PNU, Tajawal, sans-serif', lineHeight: 1.2, flex: 1,
                  }}>{s.title}</h2>
                  {(s as any).partnerLogo && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '.7rem', color: 'var(--muted)', fontWeight: 600 }}>بالتعاون مع</span>
                      <img src="/images/care-medical-logo.webp" alt="رعاية الطبية" style={{ height: 52, width: 'auto', objectFit: 'contain' }} />
                    </div>
                  )}
                </div>
                <p style={{ fontSize: '.92rem', color: 'var(--muted)', lineHeight: 2, marginBottom: 20 }}>{s.desc}</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                  {s.features.map((f, j) => (
                    <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '.88rem', color: 'var(--dark)' }}>
                      <span style={{ color: '#777C6D', fontWeight: 900, flexShrink: 0, fontSize: '1.1rem', lineHeight: 1.4 }}>✓</span>
                      <span style={{ lineHeight: 1.7 }}>{f}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: 'var(--dark)', padding: '80px 64px', textAlign: 'center', direction: 'rtl' }} className="sec-svc-cta">
        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 12, fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة تدبّرك</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#F6F0D7', marginBottom: 16, fontFamily: 'PNU, Tajawal, sans-serif' }}>
          ابدأ تجربتك مع دِبرة اليوم
        </h2>
        <p style={{ color: 'rgba(227,238,213,.55)', fontSize: '1rem', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.9 }}>
          آلاف الأسر السعودية وثقت بنا — انضم إليهم واختبر فرق الرعاية الحقيقية
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/auth" style={{
            display: 'inline-block', background: '#F6F0D7', color: 'var(--dark)',
            fontSize: '1rem', fontWeight: 800, padding: '15px 40px',
            borderRadius: 10, textDecoration: 'none',
          }}>احجز الآن</a>
          <a href="/contact" style={{
            display: 'inline-block', background: 'transparent', color: '#F6F0D7',
            fontSize: '1rem', fontWeight: 700, padding: '15px 32px',
            borderRadius: 10, textDecoration: 'none', border: '1.5px solid rgba(227,238,213,.3)',
          }}>تواصل معنا</a>
        </div>
      </section>

      <Footer />
      <WhatsApp />

      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) {
          .sec-svc-hero { padding: 64px 24px !important; }
          .sec-svc-cards { padding: 0 24px 64px !important; }
          .sec-svc-cta { padding: 56px 24px !important; }
          .about-box { grid-template-columns: 1fr !important; }
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
          .svc-card-detail { grid-template-columns: 1fr !important; direction: rtl !important; }
        }
        @media (max-width: 600px) {
          .stats-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </>
  )
}
