'use client'
import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const login = () => {
    if (!phone) { setError('أدخل رقم جوالك'); return }
    if (!/^05\d{8}$/.test(phone)) { setError('رقم الجوال غير صحيح'); return }
    setLoading(true)
    localStorage.setItem('dibrah_verified_phone', phone)
    router.push('/my-bookings')
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '12px 16px',
    border: '1.5px solid rgba(95,97,87,.2)', borderRadius: 10,
    fontFamily: 'inherit', fontSize: '.95rem', color: 'var(--dark)',
    background: 'var(--bg)', outline: 'none', direction: 'rtl',
  }

  return (
    <>
      <Nav />
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Image src="/images/dibrah-logo.png" alt="دِبرة" width={160} height={64} style={{ height: 72, width: 'auto', margin: '0 auto', display: 'block' }} />
          </div>
          <div style={{
            background: 'white', borderRadius: 24, padding: '40px 40px',
            textAlign: 'center',
            border: '1px solid rgba(95,97,87,.15)',
            boxShadow: '0 4px 24px rgba(95,97,87,.08)',
          }}>
            <span style={{ fontSize: '2rem', fontWeight: 900, color: '#777C6D', display: 'block', marginBottom: 8 }}>مرحباً</span>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--dark)', marginBottom: 8 }}>سجّل دخولك</h1>
            <p style={{ fontSize: '.88rem', color: 'var(--muted)', marginBottom: 28, lineHeight: 1.8 }}>
              أدخل رقم جوالك لعرض حجوزاتك
            </p>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
              <label style={{ display: 'block', fontSize: '.85rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>رقم الجوال</label>
              <input style={inp} type="tel" placeholder="05XXXXXXXX" value={phone}
                onChange={e => setPhone(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && login()} />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: '.88rem', marginBottom: 12 }}>{error}</div>}
            <button onClick={login} disabled={loading} style={{
              width: '100%', padding: '14px', background: loading ? '#9ca3af' : 'var(--dark)',
              color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit',
              fontSize: '1rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              دخول
            </button>
          </div>
        </div>
      </div>
      <Footer />
      <style jsx global>{`:root { --muted: #8a8e80; }`}</style>
    </>
  )
}
