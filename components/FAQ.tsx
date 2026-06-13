'use client'
import { useState } from 'react'

const faqs = [
  { q: 'من هن كوادر دِبرة؟', a: 'كوادر دِبرة سعوديات مدربات ومؤهلات، يخضعن لعملية اختيار دقيقة تشمل التحقق من الهوية والخلفية والتدريب المتخصص.' },
  { q: 'كيف يمكنني الحجز؟', a: 'يمكنك الحجز مباشرة عبر موقعنا أو التواصل معنا على واتساب، وسيتم تأكيد الحجز خلال ساعات قليلة.' },
  { q: 'هل يمكنني إلغاء الحجز؟', a: 'نعم، يمكن إلغاء أو تعديل الحجز قبل ٤٨ ساعة من موعد الخدمة دون أي رسوم إضافية.' },
  { q: 'هل الخدمة متوفرة خارج الرياض؟', a: 'حالياً نقدم خدماتنا في مدينة الرياض، ونعمل على التوسع لتشمل مناطق أخرى قريباً.' },
  { q: 'ماذا يشمل التأمين على الكادر؟', a: 'جميع كوادر دِبرة مؤمن عليهن تأميناً شاملاً يغطي أي طارئ أثناء ساعات العمل.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" style={{ padding: '96px 64px', background: 'white' }} className="sec-faq">
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 56px' }} className="rv">
        <span style={{ fontSize: '3rem', fontWeight: 900, color: '#777C6D', marginBottom: 12, display: 'block', fontFamily: 'PNU, Tajawal, sans-serif' }}>الأسئلة الشائعة</span>
        <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.8rem)', fontWeight: 900, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>لديك سؤال؟</h2>
      </div>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        {faqs.map((f, i) => (
          <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{
              width: '100%', background: 'none', border: 'none', fontFamily: 'Tajawal, sans-serif',
              fontSize: '1rem', fontWeight: 700, color: 'var(--dark)', padding: '20px 0',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'right',
            }}>
              {f.q}
              <span style={{ fontSize: '1.2rem', color: 'var(--gold)', transition: 'transform .3s', transform: open === i ? 'rotate(45deg)' : 'none', flexShrink: 0, marginRight: 16 }}>+</span>
            </button>
            {open === i && (
              <div style={{ fontSize: '.9rem', color: 'var(--muted)', lineHeight: 1.8, paddingBottom: 20 }}>{f.a}</div>
            )}
          </div>
        ))}
      </div>
      <style>{`@media (max-width: 1024px) { .sec-faq { padding: 64px 24px !important; } }`}</style>
    </section>
  )
}
