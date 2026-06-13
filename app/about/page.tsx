'use client'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'
import Image from 'next/image'

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* ABOUT */}
      <section style={{ padding: '48px 64px', background: 'var(--bg)' }}>

        {/* Main Box */}
        <div style={{
          background: 'white', borderRadius: 24, padding: 28,
          border: '1px solid rgba(95,97,87,.15)',
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32,
          alignItems: 'center', marginBottom: 20
        }} className="about-box">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {['svc-kids2','svc-hospital','svc-elderly','svc-postnatal'].map((img) => (
              <div key={img} style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
                <Image src={`/images/${img}.png`} alt="" fill style={{ objectFit: 'cover' }} loading="lazy" />
              </div>
            ))}
          </div>
          <div>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 12 }}>من نحن</span>
            <h2 style={{ fontSize: 'clamp(2rem,4vw,3.2rem)', fontWeight: 900, color: 'var(--dark)', lineHeight: 1.1, marginBottom: 16 }}>دبرة العائلة</h2>
            <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 2 }}>
              شركة سعودية تُعنى بتقديم خدمات الرعاية المنزلية للأطفال وكبار السن، بروحٍ من المسؤولية والاهتمام. كوادر سعودية مؤهلة تجمع بين الخبرة والإنسانية، نوفر خدمات راقية بأيدي كوادر سعودية مدربة، تفهمُ احتياجات الأسرة، وتحملُ القيم الأصيلة التي تزرع الأمان في كل بيت.
            </p>
            <a href="/auth" style={{
              display: 'inline-block', background: 'var(--dark)', color: '#F6F0D7',
              fontSize: '.9rem', fontWeight: 700, padding: '13px 36px',
              borderRadius: 8, marginTop: 28, textDecoration: 'none'
            }}>ابدأ مع دِبرة</a>
          </div>
        </div>

        {/* Vision & Mission */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="vision-box">
          {[
            { title: 'الرؤية', text: 'أن نكون الوجهة السعودية الرائدة والموثوقة في صناعة الرعاية المنزلية الحديثة' },
            { title: 'الرسالة', text: 'توفير رعاية منزلية بلمسة إنسانية، تمكّن الكفاءات الوطنية وترتقي بجودة حياة الأسرة السعودية' },
          ].map((c) => (
            <div key={c.title} style={{ background: 'white', borderRadius: 20, padding: 36, border: '1px solid rgba(95,97,87,.15)' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 14 }}>{c.title}</h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--muted)', lineHeight: 1.9 }}>{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* WHY DIBRAH */}
      <section style={{ padding: '48px 64px', background: 'white' }} className="why-section">
        <div style={{ maxWidth: 800, margin: '0 auto 56px', textAlign: 'center' }}>
          <span style={{ fontSize: '3rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 8 }}>لماذا دِبرة؟</span>
          <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: '#777C6D', marginBottom: 20 }}>أكثر من مجرد خدمة</h2>
          <p style={{ fontSize: '1.05rem', color: 'var(--muted)', lineHeight: 2.1 }}>
            لأننا لا نُقدّم خدمة فقط؛ نُقدّم <strong style={{ color: 'var(--dark)', fontWeight: 800 }}>سَكينة بيتٍ</strong>، وطمأنينة قلبٍ، وامتدادًا لأيدي الأمهات حين يحتجنَ مَن يرعاهنَّ ويرعى صغارهنَّ. في كل بيتٍ تدخل إليه دِبرة، نغرس الأمان كما تُغرس الرحمة في القلوب — ولسنا مجرد شركة رعاية، بل <strong style={{ color: 'var(--dark)', fontWeight: 800 }}>حضور أنثوي سعودي</strong> يحمل معنى الحنان وعمق المسؤولية ونقاء النية.
          </p>
        </div>

        {/* Quote */}
        <div style={{
          background: 'var(--bg)', borderRadius: 24, padding: '48px 56px',
          borderRight: '5px solid var(--dark)', margin: '40px 0', position: 'relative'
        }}>
          <div style={{ fontSize: '5rem', fontWeight: 900, color: 'rgba(95,97,87,.12)', lineHeight: 1, position: 'absolute', top: 16, right: 32, fontFamily: 'Georgia, serif' }}>"</div>
          <p style={{ fontSize: '1.15rem', color: 'var(--dark)', lineHeight: 2, fontWeight: 500, position: 'relative', zIndex: 1 }}>
            دِبرة ليست جلوسًا مع طفل، بل <strong style={{ fontWeight: 800 }}>احتواءٌ لحياته الصغيرة</strong> بكل تفاصيلها. وليست مساعدة لكبيرة سن، بل <strong style={{ fontWeight: 800 }}>تقدير لعمرٍ</strong> أمضى حياته بالعطاء. هي مزيج من الرحمة والاحتراف والهوية السعودية الأصيلة.
          </p>
          <p style={{ fontSize: '.85rem', color: 'var(--muted)', marginTop: 16, fontWeight: 700 }}>دِبرة.. رعاية تنبض بالثقة</p>
        </div>

        {/* Pillars */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginTop: 48 }} className="pillars-grid">
          {[
            { n: '01', title: 'سَكينة البيت', text: 'حين تغادر المنزل، نضمن لك أن كل شيء يسير كما لو كنت موجود — بل أفضل. راحة بالك تبدأ من اللحظة التي تختار فيها دِبرة.' },
            { n: '02', title: 'هوية سعودية أصيلة', text: 'كوادرنا سعوديات تحملُ قيم مجتمعنا وتفهمُ تفاصيل الأسرة السعودية، مما يجعل التواصل طبيعيًا والثقة سريعة البناء.' },
            { n: '03', title: 'احترافية متجذّرة بالرحمة', text: 'ندرّب كوادرنا على أعلى معايير الرعاية، لكننا نختارهن أولاً بناءً على ما في قلوبهن — لأن الرعاية الحقيقية تنبع من الداخل.' },
            { n: '04', title: 'تقدير الأعمار', text: 'من الطفل الرضيع إلى الجدة التي أمضت عمرها في العطاء — كل من نرعاه يستحق أن يُعامَل بكرامة كاملة وقلب حاضر.' },
            { n: '05', title: 'شفافية لا مساومة فيها', text: 'أسعارنا واضحة، إجراءاتنا شفافة، ولا تفاجئك رسوم مخفية. نؤمن أن الثقة تبدأ من الوضوح التام منذ اللحظة الأولى.' },
            { n: '06', title: 'استمرارية الكادر', text: 'نحرص على أن تتعامل عائلتك مع نفس الكادر باستمرار، لأننا نؤمن أن الألفة هي أساس الرعاية، وبناء علاقة حقيقية بين المرافقة ومن ترعاه هو جوهر ما نقدمه.' },
          ].map((p) => (
            <div key={p.n} style={{
              background: 'var(--dark)', borderRadius: 20, padding: '36px 28px',
              border: '1.5px solid rgba(95,97,87,.15)',
              display: 'flex', flexDirection: 'column', gap: 14
            }}>
              <div style={{ fontSize: '.72rem', color: 'rgba(238,238,238,.35)', letterSpacing: '.08em', fontWeight: 700 }}>{p.n}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#F6F0D7', lineHeight: 1.3 }}>{p.title}</div>
              <p style={{ fontSize: '.88rem', color: '#EEEEEE', lineHeight: 1.8 }}>{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* STORY */}
      <section style={{ padding: '48px 64px', background: 'var(--dark)' }} className="story-section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="story-grid">
          <div>
            <span style={{ fontSize: '3rem', fontWeight: 900, color: 'rgba(238,238,238,.35)', display: 'block', marginBottom: 8 }}>قصتنا</span>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: '#F6F0D7', lineHeight: 1.1, marginBottom: 20 }}>كيف بدأت دِبرة؟</h2>
            {[
              'وُلدت دِبرة من رحم حاجة حقيقية عاشتها الأسر السعودية — الحاجة إلى وجه مؤتمن، يحمل قيم هذا الوطن، ويفهم خصوصية بيوتنا. لم تكن البداية مجرد فكرة تجارية، بل كانت إجابة على سؤال طرحته أمهات كثيرات: "من أثق به ليكون مع أطفالي حين لا أكون؟"',
              'من الرياض، انطلقنا بفريق من السعوديات المؤهلات اللاتي يؤمنّ بأن الرعاية رسالة قبل أن تكون مهنة. واليوم، بعد أن وثق بنا مئاتُ الأسر، نواصل مسيرتنا بنفس الروح التي بدأنا بها — روح الأمانة والحضور الحقيقي.',
              'دِبرة ليست شركة تبحث عن التوسع بأي ثمن، بل مؤسسة تؤمن بأن الجودة قبل الكمية، وأن كل عائلة تثق بنا تستحق أفضل ما لدينا — دون استثناء.',
            ].map((t, i) => (
              <p key={i} style={{ fontSize: '.95rem', color: '#EEEEEE', lineHeight: 2.1, marginBottom: 16 }}>{t}</p>
            ))}
          </div>
          <div style={{ background: 'white', borderRadius: 24, padding: 8, border: '1px solid rgba(95,97,87,.15)', overflow: 'hidden' }}>
            <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 18, overflow: 'hidden' }}>
              <Image src="/images/hero-cover.png" alt="دِبرة العائلة" fill style={{ objectFit: 'cover' }} />
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <WhatsApp />

      <style jsx global>{`
        :root { --gold: #F6F0D7; --muted: #8a8e80; }

        @media (max-width: 1024px) {
          .about-box { grid-template-columns: 1fr !important; }
          .vision-box { grid-template-columns: 1fr !important; }
          .why-section { padding: 64px 24px !important; }
          .story-section { padding: 64px 24px !important; }
          .pillars-grid { grid-template-columns: 1fr 1fr !important; }
          .story-grid { grid-template-columns: 1fr !important; }
          .nl-section { padding: 48px 24px !important; }
          section[style*="96px 64px"] { padding: 64px 24px !important; }
        }
        @media (max-width: 600px) {
          .pillars-grid { grid-template-columns: 1fr !important; }
          .nl-form { flex-direction: column !important; }
        }
      `}</style>
    </>
  )
}
