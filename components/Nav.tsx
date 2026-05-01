'use client'
import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

type Session = { authenticated: boolean; name?: string; phone?: string } | null

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [lastY, setLastY] = useState(0)
  const [mobOpen, setMobOpen] = useState(false)

  const [session, setSession] = useState<Session>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY
      setScrolled(y > 10)
      setHidden(y > lastY && y > 80)
      setLastY(y)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastY])

  // جلب حالة الجلسة
  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        if (d.authenticated) {
          setSession({
            authenticated: true,
            name: d.customer?.name || '',
            phone: d.phone || '',
          })
        } else {
          setSession({ authenticated: false })
        }
      })
      .catch(() => setSession({ authenticated: false }))
  }, [])

  // إغلاق القائمة لما يضغط خارجها
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    window.location.href = '/'
  }

  // الاسم المختصر (الاسم الأول فقط)
  const firstName = (session?.name || '').trim().split(/\s+/)[0] || ''

  const links = [
    { href: '/', label: 'الرئيسية' },
    { href: '/about', label: 'من نحن' },
    { href: '/services', label: 'خدماتنا' },
    { href: '/packages', label: 'الباقات' },
    { href: '/privacy', label: 'سياسة الخصوصية' },
    { href: '/terms', label: 'الشروط والأحكام' },
    { href: '/contact', label: 'تواصل معنا' },
  ]

  const isLoggedIn = session?.authenticated === true

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 500,
        background: '#EEEEEE',
        borderBottom: '1px solid rgba(95,97,87,.15)',
        height: 70,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 64px',
        transition: 'box-shadow 0.3s, transform 0.35s',
        transform: hidden ? 'translateY(-100%)' : 'translateY(0)',
        boxShadow: scrolled ? '0 2px 16px rgba(45,58,30,.1)' : 'none',
        direction: 'rtl',
      }}>
        <a href="/">
          <Image src="/images/dibrah-logo.png" alt="دِبرة" width={120} height={48} style={{ height: 48, width: 'auto' }} priority />
        </a>

        <ul style={{ display: 'flex', gap: 4, listStyle: 'none', margin: 0, padding: 0 }} className="nav-links-desktop">
          {links.map(l => (
            <li key={l.href}>
              <a href={l.href} style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--dark)', padding: '7px 13px', borderRadius: 6, transition: 'all .2s', display: 'block' }}
                onMouseEnter={e => { (e.target as HTMLElement).style.color = 'var(--dark)'; (e.target as HTMLElement).style.background = 'rgba(45,58,30,.07)' }}
                onMouseLeave={e => { (e.target as HTMLElement).style.color = 'var(--muted)'; (e.target as HTMLElement).style.background = 'transparent' }}
              >{l.label}</a>
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* زر الإهداء - دائماً ظاهر */}
          <a href="/auth" className="btn-desktop" style={{ fontSize: '.95rem', fontWeight: 800, color: 'var(--dark)', background: '#F6F0D7', padding: '9px 18px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6, border: '1.5px solid var(--dark)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            إهداء
          </a>

          {/* زر الدخول أو الاسم — Desktop */}
          {session === null ? (
            // placeholder أثناء التحميل (نفس المساحة)
            <div className="btn-desktop" style={{ width: 120, height: 36 }} />
          ) : isLoggedIn ? (
            <div ref={menuRef} className="btn-desktop" style={{ position: 'relative' }}>
              <button
                onClick={() => setMenuOpen(v => !v)}
                style={{
                  fontSize: '.95rem', fontWeight: 800, color: '#F6F0D7',
                  background: 'var(--dark)', padding: '9px 16px', borderRadius: 6,
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F6F0D7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
                <span>{firstName || 'حسابي'}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#F6F0D7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9"/></svg>
              </button>

              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 6px)', left: 0,
                  background: 'white', borderRadius: 10,
                  boxShadow: '0 8px 24px rgba(45,58,30,.15)',
                  border: '1px solid rgba(95,97,87,.12)',
                  minWidth: 180, overflow: 'hidden', zIndex: 100,
                }}>
                  <a href="/book" style={menuItem}>
                    <span>➕</span> حجز جديد
                  </a>
                  <div style={menuDivider} />
                  <a href="/my-bookings" style={menuItem}>
                    <span>📅</span> حجوزاتي
                  </a>
                  <div style={menuDivider} />
                  <button onClick={logout} style={{ ...menuItem, border: 'none', width: '100%', textAlign: 'right', cursor: 'pointer', fontFamily: 'inherit', color: '#c0392b' }}>
                    <span>🚪</span> خروج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <a href="/auth" className="btn-desktop" style={{ fontSize: '.95rem', fontWeight: 800, color: '#F6F0D7', background: 'var(--dark)', padding: '9px 18px', borderRadius: 6 }}>دخول / تسجيل</a>
          )}

          {/* Mobile buttons */}
          <a href="/auth" className="btn-mob" style={{ fontSize: '.78rem', fontWeight: 700, color: 'var(--dark)', background: '#F6F0D7', padding: '7px 12px', borderRadius: 6, display: 'none', alignItems: 'center', gap: 5, border: '1.5px solid var(--dark)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            إهداء
          </a>

          {isLoggedIn ? (
            <a href="/my-bookings" className="btn-mob" style={{ fontSize: '.78rem', fontWeight: 700, color: '#F6F0D7', background: 'var(--dark)', padding: '7px 12px', borderRadius: 6, display: 'none', alignItems: 'center', gap: 5 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#F6F0D7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="7" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/></svg>
              {firstName || 'حسابي'}
            </a>
          ) : (
            <a href="/auth" className="btn-mob" style={{ fontSize: '.78rem', fontWeight: 700, color: '#F6F0D7', background: 'var(--dark)', padding: '7px 12px', borderRadius: 6, display: 'none' }}>دخول / تسجيل</a>
          )}

          <button onClick={() => setMobOpen(true)} style={{ display: 'none', flexDirection: 'column', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 6 }} className="ham-btn" aria-label="القائمة">
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--dark)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--dark)', borderRadius: 2 }} />
            <span style={{ display: 'block', width: 22, height: 2, background: 'var(--dark)', borderRadius: 2 }} />
          </button>
        </div>
      </nav>

      {/* MOB MENU */}
      {mobOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 600,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24,
          direction: 'rtl',
        }}>
          <button onClick={() => setMobOpen(false)} style={{ position: 'absolute', top: 24, right: 24, background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--dark)' }}>✕</button>

          {/* ترحيب بالعميل المسجّل دخول */}
          {isLoggedIn && firstName && (
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#777C6D', fontFamily: 'PNU, Tajawal, sans-serif', marginBottom: -8 }}>
              👋 أهلاً {firstName}
            </div>
          )}

          {links.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMobOpen(false)}
              style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}
            >{l.label}</a>
          ))}

          {/* روابط المسجّلين */}
          {isLoggedIn && (
            <>
              <a href="/book" onClick={() => setMobOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>
                ➕ حجز جديد
              </a>
              <a href="/my-bookings" onClick={() => setMobOpen(false)} style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark)', fontFamily: 'PNU, Tajawal, sans-serif' }}>
                📅 حجوزاتي
              </a>
              <button onClick={() => { setMobOpen(false); logout() }} style={{ background: 'none', border: 'none', fontSize: '1.1rem', fontWeight: 700, color: '#c0392b', fontFamily: 'inherit', cursor: 'pointer' }}>
                🚪 خروج
              </button>
            </>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="/auth" onClick={() => setMobOpen(false)} style={{ background: '#F6F0D7', color: 'var(--dark)', padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: 7, border: '1.5px solid var(--dark)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--dark)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
              إهداء
            </a>
            {!isLoggedIn && (
              <a href="/auth" onClick={() => setMobOpen(false)} style={{ background: 'var(--dark)', color: '#F6F0D7', padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: '.9rem' }}>دخول / تسجيل</a>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .nav-links-desktop { display: none !important; }
          .btn-desktop { display: none !important; }
          .btn-mob { display: inline-flex !important; align-items: center; }
          .ham-btn { display: flex !important; }
          nav { padding: 0 20px !important; }
        }
      `}</style>
    </>
  )
}

const menuItem: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10,
  padding: '12px 16px', fontSize: '.9rem', fontWeight: 700,
  color: 'var(--dark)', textDecoration: 'none',
  background: 'transparent', fontFamily: 'PNU, Tajawal, sans-serif',
  transition: 'background .15s',
}

const menuDivider: React.CSSProperties = {
  height: 1, background: 'rgba(95,97,87,.1)',
}
