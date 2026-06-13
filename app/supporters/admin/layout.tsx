'use client'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function SupportersAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [auth, setAuth] = useState<boolean | null>(null)
  const [loginUsername, setLoginUsername] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/admin/me')
      .then(r => r.json())
      .then(d => setAuth(!!d.user))
      .catch(() => setAuth(false))
  }, [])

  const login = async () => {
    setLoginError('')
    if (!loginUsername || !loginPassword) { setLoginError('أدخل البيانات'); return }
    setLoginLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      })
      const data = await res.json()
      if (res.ok && data.success) setAuth(true)
      else setLoginError(data.error || 'بيانات الدخول غير صحيحة')
    } catch (e: any) {
      setLoginError(e?.message || 'خطأ في الاتصال')
    } finally {
      setLoginLoading(false)
    }
  }

  const logout = async () => {
    try { await fetch('/api/admin/logout', { method: 'POST' }) } catch {}
    setAuth(false)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid rgba(95,97,87,.2)',
    borderRadius: 8, fontFamily: 'inherit', fontSize: '.9rem',
    color: 'var(--dark)', background: '#fafaf9', outline: 'none', direction: 'rtl',
  }

  if (auth === null) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: 'var(--muted)' }}>جارٍ التحقق...</div>
    </div>
  )

  if (!auth) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 4px 24px rgba(95,97,87,.1)', border: '1px solid rgba(95,97,87,.12)' }}>
        <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 90, height: 'auto', borderRadius: 14, marginBottom: 18 }} />
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#777C6D', marginBottom: 8, fontFamily: 'PNU, Tajawal, sans-serif' }}>لوحة الداعمين</div>
        <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 28 }}>سجّل دخولك بحسابك</p>

        <div style={{ textAlign: 'right', marginBottom: 14 }}>
          <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6, display: 'block' }}>اسم المستخدم</label>
          <input style={{ ...inp, fontSize: '.95rem' }} type="text" placeholder="username"
            value={loginUsername} onChange={e => setLoginUsername(e.target.value)}
            autoComplete="username" dir="ltr" autoFocus />
        </div>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <label style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--dark)', marginBottom: 6, display: 'block' }}>كلمة المرور</label>
          <input style={{ ...inp, fontSize: '.95rem' }} type="password" placeholder="••••••••"
            value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && login()} autoComplete="current-password" />
        </div>

        {loginError && <div style={{ color: '#b91c1c', fontSize: '.85rem', marginBottom: 12, textAlign: 'center' }}>⚠️ {loginError}</div>}

        <button onClick={login} disabled={loginLoading}
          style={{ width: '100%', padding: '13px', background: 'var(--dark)', color: '#F6F0D7', border: 'none', borderRadius: 10, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: loginLoading ? 'wait' : 'pointer', opacity: loginLoading ? 0.6 : 1 }}>
          {loginLoading ? '...جارٍ الدخول' : 'دخول'}
        </button>
      </div>
      <style jsx global>{`:root { --muted: #8a8e80; }`}</style>
    </div>
  )

  const navItems = [
    { href: '/supporters/admin/donors', label: 'الداعمين', icon: '👥' },
    { href: '/supporters/admin/new', label: 'تعبئة دعم جديد', icon: '➕' },
  ]

  return (
    <div className="sup-shell" style={{ background: 'var(--bg)', minHeight: '100vh', direction: 'rtl', display: 'flex', overflowX: 'hidden', maxWidth: '100vw' }}>
      {/* SIDEBAR */}
      <aside style={{
        width: 240,
        background: 'white',
        borderLeft: '1px solid rgba(95,97,87,.1)',
        minHeight: '100vh',
        position: 'sticky',
        top: 0,
        padding: '24px 16px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }} className={`sup-sidebar ${mobileMenuOpen ? 'sup-sidebar-open' : ''}`}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 32, padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 44, height: 'auto', borderRadius: 8 }} />
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900, color: '#777C6D', fontFamily: 'PNU, Tajawal, sans-serif' }}>دِبرة</div>
              <div style={{ fontSize: '.7rem', color: 'var(--muted)' }}>لوحة الداعمين</div>
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(false)} aria-label="إغلاق" className="sup-sidebar-close">✕</button>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px',
                  background: active ? 'var(--dark)' : 'transparent',
                  color: active ? '#F6F0D7' : 'var(--dark)',
                  border: 'none', borderRadius: 8,
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '.9rem',
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                {item.label}
              </a>
            )
          })}

          <div style={{ height: 1, background: 'rgba(95,97,87,.1)', margin: '12px 0' }} />

          <a href="/admindibrah" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 8,
            color: 'var(--dark)', textDecoration: 'none',
            fontWeight: 700, fontSize: '.9rem',
          }}>
            <span style={{ fontSize: '1.1rem' }}>📋</span>
            لوحة الحجوزات
          </a>
        </nav>

        <button onClick={logout} style={{
          background: 'transparent', border: '1px solid rgba(95,97,87,.2)',
          color: 'var(--dark)', padding: '10px 14px', borderRadius: 8,
          fontFamily: 'inherit', fontWeight: 700, fontSize: '.85rem',
          cursor: 'pointer', marginTop: 12,
        }}>
          تسجيل الخروج
        </button>
      </aside>

      {/* MOBILE TOPBAR */}
      <div className="sup-topbar" style={{
        display: 'none', background: 'white', borderBottom: '1px solid rgba(95,97,87,.1)',
        padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <button onClick={() => setMobileMenuOpen(true)}
          style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--dark)' }}>
          ☰
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/images/dibrah-logo-dark.png" alt="دِبرة" style={{ width: 32, height: 'auto', borderRadius: 6 }} />
          <span style={{ fontWeight: 900, color: '#777C6D' }}>لوحة الداعمين</span>
        </div>
      </div>

      {/* CONTENT */}
      <main style={{ flex: 1, padding: '28px 32px', overflow: 'auto', minWidth: 0 }} className="sup-main">
        {children}
      </main>

      <style jsx global>{`
        :root { --muted: #8a8e80; }
        .sup-sidebar-close { display: none; background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: var(--dark); }
        @media (max-width: 768px) {
          .sup-shell { flex-direction: column !important; }
          .sup-topbar { display: flex !important; width: 100% !important; }
          .sup-sidebar {
            position: fixed !important;
            right: -280px;
            top: 0;
            transition: right .25s ease;
            z-index: 100;
            width: 280px !important;
            height: 100vh !important;
            min-height: 100vh !important;
          }
          .sup-sidebar-open { right: 0 !important; box-shadow: -8px 0 24px rgba(0,0,0,.15); }
          .sup-sidebar-close { display: block !important; }
          .sup-main { padding: 20px 16px !important; width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
