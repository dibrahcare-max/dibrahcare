'use client'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

const sections = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    title: 'جمع المعلومات',
    content: 'قد نقوم بجمع بعض المعلومات الشخصية عند استخدامك للموقع أو عند طلب الخدمات، وذلك وفق مبدأ الحد الأدنى من البيانات — لا نجمع إلا ما هو ضروري فعلاً.',
    groups: [
      {
        label: 'المعلومات الشخصية المقدمة:',
        items: [
          { text: 'الاسم ورقم الجوال' },
          { text: 'البريد الإلكتروني وعنوان الخدمة' },
          { text: 'بيانات الحجز والتفضيلات' },
          { text: 'أي معلومات تقدمها طوعاً عبر الموقع أو التواصل معنا' },
        ]
      },
      {
        label: 'البيانات التقنية التلقائية:',
        items: [
          { text: 'عنوان IP ونوع الجهاز والمتصفح' },
          { text: 'بيانات الاستخدام لتحسين تجربة المستخدم' },
        ]
      }
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 1 0 4.93 19.07"/><path d="M19.07 4.93l-14.14 14.14"/></svg>,
    title: 'استخدام المعلومات',
    content: 'نستخدم المعلومات التي يتم جمعها للأغراض التالية:',
    items: [
      { text: 'تقديم خدمات (دِبرة) وإدارة الحجوزات بكفاءة' },
      { text: 'التواصل مع العملاء بخصوص الطلبات والاستفسارات' },
      { text: 'تحسين جودة الخدمات وتجربة المستخدم' },
      { text: 'معالجة المدفوعات بشكل آمن عبر مزودي خدمة معتمدين من البنك المركزي السعودي' },
      { text: 'إرسال إشعارات أو تحديثات متعلقة بالخدمة عند الحاجة' },
      { text: 'إرسال رسائل تسويقية ودورية، وذلك فقط بعد موافقة صريحة من العميل عند التسجيل أو عبر إعدادات حسابه، ويحق له سحب هذه الموافقة في أي وقت' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    title: 'حماية المعلومات',
    content: 'نُطبّق أفضل الممارسات والمعايير الأمنية التقنية والتنظيمية لحماية بياناتك. ويتم التعامل مع البيانات عبر أنظمة وتقنيات آمنة ومعتمدة. نحتفظ ببياناتك فقط للمدة اللازمة لتحقيق الأغراض التي جُمعت من أجلها، أو وفقاً لما تقتضيه الأنظمة واللوائح.',
    items: [
      { text: 'الحماية من الوصول غير المصرح به' },
      { text: 'الحماية من التعديل أو الإفصاح أو الإتلاف غير المصرح به' },
      { text: 'الحماية من إساءة الاستخدام أو الاختراق' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    title: 'مشاركة المعلومات',
    content: 'تلتزم (دِبرة) بعدم بيع أو تأجير أو مشاركة بيانات العملاء مع أي طرف ثالث. مشاركة البيانات تتم وفق موافقة العميل، وبما يحقق تقديم الخدمة المطلوبة. وفي جميع الحالات الاستثنائية يتم التعامل بأقصى درجات السرية:',
    items: [
      { text: 'عند الحاجة لتقديم الخدمة (مثل الكادر المنفذ للخدمة)' },
      { text: 'الالتزام بالأنظمة والقوانين المعمول بها في المملكة العربية السعودية' },
      { text: 'بناءً على طلب رسمي من جهة مختصة' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/></svg>,
    title: 'الخدمات المقدمة',
    content: 'تُقدَّم الرعاية الطبية المنزلية من قبل جهات صحية معتمدة، ويقتصر دور (دِبرة) على التنسيق فقط. سيتم التواصل بكم من قبل الجهة الطبية مباشرة.',
    items: [
      { text: '⚠️ تنويه: نحن غير مرخصين طبياً ولسنا مسؤولين عن أي تشخيص أو علاج' },
      { text: 'دورنا يقتصر على الربط بين العميل والمزوّد الطبي المرخّص' },
      { text: 'جميع القرارات الطبية تقع على عاتق المزوّد المرخّص من وزارة الصحة' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 8v4l3 3"/></svg>,
    title: 'ملفات تعريف الارتباط (Cookies)',
    content: 'قد يستخدم الموقع ملفات تعريف الارتباط لتحسين تجربتك. يمكنك تعطيلها من إعدادات المتصفح مع احتمال تأثر بعض وظائف الموقع.',
    items: [
      { text: 'تذكُّر تفضيلات الاستخدام' },
      { text: 'تحسين أداء الموقع وسرعة التصفح' },
      { text: 'تحليل سلوك الاستخدام بشكل غير شخصي' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    title: 'الاحتفاظ بالبيانات',
    content: 'تحتفظ (دِبرة) بالبيانات الشخصية للمدة اللازمة لتقديم الخدمة أو للامتثال للمتطلبات النظامية السارية. ما لم يطلب المستخدم إتلافها أو مسحها وفق الأنظمة المعمول بها. تخضع هذه السياسة لنظام حماية البيانات الشخصية المعمول به في المملكة العربية السعودية (SDAIA).',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><polyline points="20 6 9 17 4 12"/></svg>,
    title: 'حقوق المستخدم',
    content: 'يحق للمستخدم ممارسة الحقوق التالية في أي وقت:',
    items: [
      { text: 'طلب الوصول إلى بياناته الشخصية المحفوظة' },
      { text: 'طلب تصحيح أو تحديث البيانات غير الدقيقة' },
      { text: 'طلب إتلاف البيانات أو مسحها في الحالات المنصوص عليها نظاماً' },
      { text: 'سحب الموافقة على استخدام البيانات في أي وقت حيثما ينطبق ذلك' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    title: 'روابط الطرف الثالث',
    content: 'قد يحتوي الموقع على روابط لمواقع أو خدمات خارجية. (دِبرة) غير مسؤولة عن سياسات الخصوصية أو محتوى تلك المواقع، ويُنصح بمراجعة سياساتها الخاصة.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    title: 'خصوصية الأطفال',
    content: 'تحرص (دِبرة) على حماية خصوصية جميع المستخدمين. لا يتم جمع بيانات بشكل مقصود من الأطفال دون موافقة صريحة من ولي الأمر، والتزاماً بأعلى معايير الحماية.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    title: 'التعديلات على سياسة الخصوصية',
    content: 'تحتفظ (دِبرة) بحق تعديل هذه السياسة عند الحاجة. سيتم نشر أي تحديث على هذه الصفحة، ويُعدّ استمرار استخدام الموقع بعد نشر التعديلات موافقة صريحة عليها.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    title: 'التواصل معنا',
    content: 'لأي استفسار يتعلق بسياسة الخصوصية أو كيفية معالجة بياناتك، يمكنكم التواصل عبر البريد الإلكتروني: info@dibrahcare.com، أو عبر صفحة (تواصل معنا) على الموقع. نلتزم بالرد على جميع استفساراتكم خلال مدة زمنية وجيزة.',
  },
]

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      {/* Hero */}
      <div style={{ margin: '48px 12px 0', borderRadius: 24, overflow: 'hidden', lineHeight: 0 }}>
        <img src="/images/privacy-hero.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <section style={{ padding: '72px 64px', background: 'var(--bg)' }} className="sec-legal">
        {/* Grid 2 columns */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="legal-grid">
          {sections.map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 24,
              border: '1px solid rgba(95,97,87,.1)',
              boxShadow: '0 2px 16px rgba(95,97,87,.06)',
              overflow: 'hidden',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Card Header */}
              <div style={{
                background: 'var(--dark)', padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <span style={{
                  background: 'rgba(246,240,215,.12)', color: '#F6F0D7',
                  width: 48, height: 48, borderRadius: 12,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{s.icon}</span>
                <h2 style={{
                  fontSize: '1.15rem', fontWeight: 900, color: '#F6F0D7',
                  fontFamily: 'PNU, Tajawal, sans-serif', margin: 0,
                }}>{s.title}</h2>
              </div>
              {/* Card Body */}
              <div style={{ padding: '24px 28px', flex: 1 }}>
                {s.content && <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 2, marginBottom: (s as any).items || (s as any).groups ? 16 : 0 }}>{s.content}</p>}

                {(s as any).groups && (s as any).groups.map((g: any, gi: number) => (
                  <div key={gi} style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: '.85rem', fontWeight: 800, color: 'var(--dark)', marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid rgba(95,97,87,.1)' }}>{g.label}</div>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {g.items.map((item: any, j: number) => (
                        <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '.92rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                          <span style={{ color: '#5f6157', flexShrink: 0, marginTop: 4 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><polyline points="20 6 9 17 4 12"/></svg></span>
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}

                {(s as any).items && (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(s as any).items.map((item: any, j: number) => (
                      <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '.92rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                        <span style={{ color: '#5f6157', flexShrink: 0, marginTop: 4 }}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}><polyline points="20 6 9 17 4 12"/></svg></span>
                        {item.text}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
      <WhatsApp />
      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) { .sec-legal { padding: 48px 20px !important; } .legal-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </>
  )
}
