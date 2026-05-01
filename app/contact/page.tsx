'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<'idle'|'loading'|'done'|'error'>('idle')
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const send = async () => {
    if (!form.name || !form.email || !form.message) return
    setStatus('loading')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      setStatus(data.success ? 'done' : 'error')
    } catch { setStatus('error') }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10,
    fontFamily: 'inherit', fontSize: '.95rem', color: 'var(--dark)',
    background: 'var(--bg)', outline: 'none', direction: 'rtl',
  }

  return (
    <>
      <Nav />
      {/* Hero */}
      <div style={{ margin: '48px 12px 0', borderRadius: 24, overflow: 'hidden', lineHeight: 0 }}>
        <img src="/images/contact-hero.png" alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <section style={{ padding: '72px 64px', background: 'var(--bg)' }} className="sec-contact-page">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, maxWidth: 1000, margin: '0 auto' }} className="contact-grid-page">

          {/* معلومات التواصل */}
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 32, fontFamily: 'PNU, Tajawal, sans-serif' }}>معلومات التواصل</h2>
            {[
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>, label: 'الموقع', val: 'الرياض، المملكة العربية السعودية', href: 'https://www.google.com/maps/search/?api=1&query=Riyadh,Saudi+Arabia' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>, label: 'البريد الإلكتروني', val: 'info@dibrahcare.com', href: 'mailto:info@dibrahcare.com' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.99 11.7 19.79 19.79 0 011.93 3.1 2 2 0 013.92 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>, label: 'رقم الهاتف', val: '+966 53 597 7511', ltr: true, href: 'tel:+966535977511' },
              { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:22,height:22}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, label: 'ساعات الخدمة', val: 'متاحة 24/7' },
            ].map((item, i) => {
              const content = (
                <>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--dark)', border: '1px solid rgba(95,97,87,.1)' }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '.78rem', color: 'var(--muted)', marginBottom: 4, fontWeight: 700, letterSpacing: '.05em' }}>{item.label}</div>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--dark)', direction: item.ltr ? 'ltr' : 'rtl' }}>{item.val}</div>
                  </div>
                </>
              )
              const wrapStyle: React.CSSProperties = { display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderBottom: '1px solid rgba(95,97,87,.1)', textDecoration: 'none', color: 'inherit', transition: 'opacity .2s' }
              return item.href
                ? <a key={i} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={wrapStyle}>{content}</a>
                : <div key={i} style={wrapStyle}>{content}</div>
            })}

            {/* Social */}
            <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
              {[
                { href: 'https://www.instagram.com/dibrahcare', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' },
                { href: 'https://x.com/dibrahcare', path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z' },
                { href: 'https://www.tiktok.com/@dibrahcare', path: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z' },
                { href: 'https://wa.me/966535977511', path: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' },
                { href: 'https://www.linkedin.com/in/%D8%AF%D8%A8%D8%B1%D8%A9-%D8%A7%D9%84%D8%B9%D8%A7%D9%8A%D9%84%D8%A9-666767404', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.852 3.37-1.852 3.601 0 4.267 2.37 4.267 5.455v6.288zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer" style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'var(--bg)' }}><path d={s.path}/></svg>
                </a>
              ))}
            </div>
          </div>

          {/* فورم */}
          <div style={{ background: 'white', borderRadius: 20, padding: '32px 36px', border: '1px solid rgba(95,97,87,.15)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 24, fontFamily: 'PNU, Tajawal, sans-serif' }}>أرسل رسالة</h2>

            {status === 'done' ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>✅</div>
                <p style={{ fontWeight: 800, color: 'var(--dark)', fontSize: '1.1rem', marginBottom: 8 }}>تم إرسال رسالتك</p>
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>سيتواصل معك فريق دِبرة قريباً</p>
                <button onClick={() => { setForm({ name:'', email:'', phone:'', message:'' }); setStatus('idle') }} style={{ marginTop: 20, background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: '.88rem' }}>إرسال رسالة أخرى</button>
              </div>
            ) : (
              <>
                {[
                  { label: 'الاسم', key: 'name', type: 'text', placeholder: 'الاسم الكامل' },
                  { label: 'البريد الإلكتروني', key: 'email', type: 'email', placeholder: 'example@email.com' },
                  { label: 'رقم الجوال', key: 'phone', type: 'tel', placeholder: '05xxxxxxxx' },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} value={form[f.key as keyof typeof form]} onChange={e => set(f.key, e.target.value)} style={inp} />
                  </div>
                ))}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>الرسالة</label>
                  <textarea placeholder="كيف يمكننا مساعدتك؟" value={form.message} onChange={e => set('message', e.target.value)} style={{ ...inp, resize: 'vertical', minHeight: 100 }} />
                </div>
                {status === 'error' && <p style={{ color: '#b91c1c', fontSize: '.85rem', marginBottom: 10 }}>حدث خطأ، حاول مرة أخرى</p>}
                <button onClick={send} disabled={status === 'loading'} style={{
                  width: '100%', padding: 14, background: status === 'loading' ? '#9ca3af' : 'var(--dark)',
                  color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit',
                  fontWeight: 800, fontSize: '.95rem', cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                }}>
                  {status === 'loading' ? 'جاري الإرسال...' : 'إرسال الرسالة'}
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
      <WhatsApp />
      <style jsx global>{`
        :root { --muted: #8a8e80; }
        @media (max-width: 1024px) { .hero-contact { margin: 8px !important; border-radius: 16px !important; }
          .hero-legal { padding: 60px 24px 48px !important; margin: 0 !important; border-radius: 0 0 20px 20px !important; }
          .sec-contact-page { padding: 48px 24px !important; }
          .contact-grid-page { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </>
  )
}
