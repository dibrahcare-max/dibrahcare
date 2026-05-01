'use client'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

const sections = [
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
    title: 'التعريفات',
    content: 'قبل البدء ببنود الشروط والأحكام، يرجى الاطلاع على التعريفات التالية:',
    items: [
      { text: 'مقدم الخدمة: شركة دبرة العائلة وهي الجهة المسؤولة قانونياً عن تقديم خدمات الرعاية غير الطبية، وذلك من خلال ممثلاتها اللواتي يقمن بتنفيذ خدمات الرعاية غير الطبية للمستفيد وفق نطاق الخدمة.' },
      { text: 'العميل: الشخص الذي يطلب الخدمة ويدفع مقابلها.' },
      { text: 'المستفيد: الطفل أو كبير السن الذي تُقدَّم له الخدمة.' },
      { text: 'نطاق الخدمة: تقتصر الخدمة على الرعاية غير الطبية والمرافقة في الأنشطة اليومية والمنزلية والخروج للأماكن العامة، للأطفال وكبار السن فقط، ولا تشمل أي أعمال طبية أو تمريضية أو أعمال منزلية. وأن مقدمة الخدمة ليست ممرضة ولا خادمة، ولا يجوز تكليفها بأي مهام خارج نطاق الخدمة.' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    title: 'قبول الشروط',
    content: 'باستخدامك لموقع دِبرة أو أي من خدماتها، فإنك تُقرّ وتوافق على الالتزام بهذه الشروط والأحكام. في حال عدم الموافقة على أي بند، يُرجى التوقف عن استخدام الموقع أو الخدمات. واستمرارك في الاستخدام يُعدّ موافقة صريحة منك.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
    title: 'الخدمات المقدمة',
    content: 'تقدم (دِبرة) خدمات رعاية منزلية متخصصة تخضع جميعها لجدولة مسبقة وتوفر الكوادر.',
    items: [
      { text: 'رعاية الأطفال داخل المنزل وخارجه' },
      { text: 'رعاية كبار السن ومرافقتهم' },
      { text: 'مرافقة المرضى في المستشفيات' },
      { text: 'المرافقة في السفر داخل المملكة وخارجها' },
      { text: 'خدمات المناسبات والأعراس' },
      { text: 'الرعاية الطبية المنزلية تُقدَّم من قبل جهات صحية معتمدة' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    title: 'الحجز والدفع',
    items: [
      { text: 'يتم تأكيد الحجز بعد إتمام عملية الدفع بنجاح عبر بوابات الدفع المعتمدة' },
      { text: 'جميع المدفوعات تتم عبر أنظمة إلكترونية آمنة ومعتمدة' },
      { text: 'الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة' },
      { text: 'يحتفظ (دِبرة) بحقه في تعديل الأسعار، وسيتم نشر التعديلات على الموقع الإلكتروني' },
      { text: 'أقرّ بأن أي ساعات إضافية أو خدمات إضافية تخضع لموافقة مقدم الخدمة وتُحتسب بتكلفة إضافية' },
      { text: 'لا يتم تأكيد أي حجز إلا بعد إتمام عملية الدفع كاملاً' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>,
    title: 'سياسة الإلغاء والاسترداد',
    items: [
      { text: 'في حال الإلغاء قبل 48 ساعة من موعد الخدمة؛ يُسترد كامل المبلغ المدفوع' },
      { text: 'في حال الإلغاء قبل 24 ساعة؛ يُسترد 50% من المبلغ المدفوع' },
      { text: 'في حال الإلغاء خلال أقل من 24 ساعة؛ لا يتم استرداد المبلغ' },
      { text: 'إذا أُلغي الطلب بعد بدء الخدمة، يستحق مقدم الخدمة المبلغ كاملاً' },
      { text: 'يحق لمقدم الخدمة إلغاء الخدمة في الحالات التالية: سلوك عدواني أو غير آمن من المستفيد، أو تقديم معلومات غير صحيحة أو ناقصة، أو بيئة غير مناسبة أو غير آمنة لمقدم الخدمة، أو تكليف المرافقة بمهام خارج نطاق الخدمة' },
      { text: 'عدم جاهزية العميل: إذا حضرت مقدمة الخدمة في الموعد المحدد ولم يكن العميل أو المستفيد جاهزاً، تُحتسب الخدمة كاملة' },
      { text: 'تخضع حالات الطوارئ الموثّقة رسمياً للتقدير الفردي من قِبل إدارة (دِبرة)' },
      { text: 'تُعاد المبالغ المستحقة إلى نفس وسيلة الدفع المستخدمة عند الحجز خلال 7 إلى 14 يوم عمل' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    title: 'التزامات العميل',
    content: 'يلتزم العميل بما يلي:',
    items: [
      { text: 'تقديم معلومات صحيحة ودقيقة عند التسجيل والحجز' },
      { text: 'يتحمل العميل كامل المسؤولية عن دقة البيانات المقدمة وأي أضرار ناتجة عن بيانات خاطئة' },
      { text: 'توفير بيئة آمنة ومناسبة لتقديم الخدمة، وتوفير الخصوصية وأماكن الراحة لمقدم الخدمة بما يتوافق مع الأنظمة والعادات' },
      { text: 'الالتزام بمواعيد الخدمة أو الإبلاغ عن أي تعديل مسبقاً' },
      { text: 'احترام كادر (دِبرة) ومعاملتهم بتقدير في جميع الأوقات' },
      { text: 'الرد على مقدم الخدمة في حالات الطوارئ، ويتحمل العميل المسؤولية عند عدم الرد' },
      { text: 'تحمل جميع نفقات الطوارئ والإجراءات التابعة لها عند تقديمها للمستفيد' },
      { text: 'تقديم الشكاوى والملاحظات مباشرة لمقدم الخدمة، ولا يحق للعميل الرجوع لاحقاً إذا لم يبلغ مقدم الخدمة' },
      { text: 'الامتناع عن تكليف مقدم الخدمة بأي أعمال منزلية أو مهام خارج نطاق الخدمة' },
      { text: 'الإفصاح عن جميع المحاذير الصحية (مثل الحساسية أو الممنوعات الطبية)، ويُعفى مقدم الخدمة من المسؤولية عند عدم الإفصاح' },
      { text: 'الحفاظ على سرية المعلومات المتعلقة بمقدم الخدمة' },
      { text: 'تحمل تكاليف سفر مقدم الخدمة والتنقل داخل أو خارج المملكة عند طلب الخدمة خارج المدينة أو خارج البلاد' },
      { text: 'عند السفر للخارج، يجب على العميل تزويد مقدم الخدمة بالتعليمات والأنظمة الخاصة بالدولة التي سيتم تقديم الخدمة فيها' },
      { text: 'عدم طلب أي خدمات مخالفة للأنظمة أو القيم الإسلامية المعمول بها' },
      { text: 'يُحظر التعاقد المباشر مع كادر (دِبرة) خارج إطار المنصة، ويحتفظ (دِبرة) بحقه في المطالبة بالتعويض عن أي أضرار ناتجة عن ذلك' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><polyline points="20 6 9 17 4 12"/></svg>,
    title: 'التزامات دِبرة',
    content: 'تلتزم (دِبرة) بـ:',
    items: [
      { text: 'توفير كوادر سعودية مؤهلة ومدربة على أعلى معايير الرعاية' },
      { text: 'الالتزام بالآداب العامة واحترام خصوصية الأسرة' },
      { text: 'الحفاظ على سرية بيانات العملاء والمستفيدين' },
      { text: 'الالتزام بمعايير الجودة والسلامة في تقديم جميع الخدمات' },
      { text: 'التواصل الفوري مع العميل في حال حدوث أي طارئ أثناء تقديم الخدمة' },
      { text: 'تزويد العميل بالتقارير اليومية عن الحالة الصحية والنفسية للمستفيد عند الحاجة' },
      { text: 'بذل العناية اللازمة لتوفير بديل مناسب في حال تعذّر حضور الكادر المحدد' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
    title: 'حدود المسؤولية',
    content: 'تبذل (دِبرة) أقصى درجات العناية في تقديم خدماتها، ومع ذلك:',
    items: [
      { text: 'لا تتحمل (دِبرة) أي مسؤولية عن الأضرار غير المباشرة أو العرضية الناتجة عن استخدام الخدمة' },
      { text: 'تقتصر مسؤولية (دِبرة) في جميع الحالات على قيمة الخدمة المدفوعة' },
      { text: 'لا تتحمل (دِبرة) أي تأخير أو تعثر ناتج عن ظروف خارجة عن الإرادة أو أطراف ثالثة' },
      { text: 'مقدم الخدمة غير مسؤول عن فقدان أي مقتنيات ثمينة داخل المنزل' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    title: 'القوة القاهرة',
    content: 'لا تتحمل (دِبرة) المسؤولية عن أي تأخير أو تعذر في تقديم الخدمة بسبب ظروف خارجة عن السيطرة، بما في ذلك الكوارث الطبيعية، أو انقطاع الخدمات، أو الظروف الطارئة الاستثنائية.',
    items: [
      { text: 'في حال حدوث ظرف قهري يمنع تقديم الخدمة، يجب على العميل إخطار مقدم الخدمة فوراً، وبما لا يتجاوز قبل موعد تقديم الخدمة بـ 24 ساعة' },
      { text: 'إذا لم يلتزم العميل بمدة الإخطار المحددة، فيُسترجع فقط (50%) من المبلغ المدفوع ويُعد المتبقي عربوناً للحجز' },
    ],
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    title: 'الملكية الفكرية',
    content: 'جميع محتويات موقع (دِبرة)، بما في ذلك النصوص والتصاميم والشعارات والمواد البصرية، هي ملك حصري لـ (دِبرة). يُحظر نسخ أو إعادة استخدام أي محتوى دون إذن خطي مسبق.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    title: 'تعديل الشروط',
    content: 'تحتفظ (دِبرة) بحق تعديل هذه الشروط والأحكام في أي وقت. سيتم نشر أي تحديث على هذه الصفحة، ويُعدّ استمرار استخدام الموقع بعد نشر التعديلات موافقة صريحة عليها.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    title: 'القانون المطبق والاختصاص',
    content: 'تخضع هذه الشروط وتُفسَّر وفقاً للأنظمة واللوائح المعمول بها في المملكة العربية السعودية. ينعقد الاختصاص القضائي الحصري للنظر في أي نزاع لمحاكم مدينة الرياض.',
  },
  {
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:28,height:28}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    title: 'التواصل معنا',
    content: 'لأي استفسارات حول هذه الشروط، يمكنكم التواصل عبر البريد الإلكتروني: info@dibrahcare.com أو الاتصال على الرقم: 966535977511+ وسيسعدنا الرد على جميع استفساراتكم.',
  },
]

export default function TermsPage() {
  return (
    <>
      <Nav />
      {/* Hero */}
      <div style={{ margin: '48px 12px 0', borderRadius: 24, overflow: 'hidden', lineHeight: 0 }}>
        <img src="/images/terms-hero.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <section style={{ padding: '72px 64px', background: 'var(--bg)' }} className="sec-legal">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="legal-grid">
          {sections.map((s, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 24,
              border: '1px solid rgba(95,97,87,.1)',
              boxShadow: '0 2px 16px rgba(95,97,87,.06)',
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
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
              <div style={{ padding: '24px 28px', flex: 1 }}>
                {s.content && <p style={{ fontSize: '.95rem', color: 'var(--muted)', lineHeight: 2, marginBottom: (s as any).items ? 16 : 0 }}>{s.content}</p>}
                {(s as any).items && (
                  <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {(s as any).items.map((item: any, j: number) => (
                      <li key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: '.92rem', color: 'var(--muted)', lineHeight: 1.8 }}>
                        <span style={{ color: '#5f6157', flexShrink: 0, marginTop: 4 }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{width:14,height:14}}>
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </span>
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
