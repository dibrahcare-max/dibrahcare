'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function Welcome() {
  const [visible, setVisible] = useState(false)
  const [hiding, setHiding] = useState(false)

  useEffect(() => {
    // Show only once per session
    const seen = sessionStorage.getItem('dibrah_welcomed')
    if (seen) return
    setVisible(true)
    sessionStorage.setItem('dibrah_welcomed', '1')

    const timer = setTimeout(() => {
      setHiding(true)
      setTimeout(() => setVisible(false), 800)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <div
      onClick={() => { setHiding(true); setTimeout(() => setVisible(false), 800) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(95,97,87,0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.8s ease',
      }}
    >
      {/* Logo */}
      <div style={{
        marginBottom: 32,
        opacity: hiding ? 0 : 1,
        transform: hiding ? 'translateY(-20px)' : 'translateY(0)',
        transition: 'all 0.6s ease',
      }}>
        <Image
          src="/images/dibrah-logo.png"
          alt="دِبرة"
          width={160}
          height={64}
          style={{ height: 64, width: 'auto', filter: 'brightness(0) invert(1)', opacity: .9 }}
          priority
        />
      </div>

      {/* Text */}
      <div style={{
        textAlign: 'center',
        opacity: hiding ? 0 : 1,
        transform: hiding ? 'translateY(20px)' : 'translateY(0)',
        transition: 'all 0.6s ease 0.1s',
      }}>
        <h1 style={{
          fontFamily: 'PNU, Tajawal, sans-serif',
          fontSize: 'clamp(1.6rem, 5vw, 2.8rem)',
          fontWeight: 900,
          color: '#F6F0D7',
          marginBottom: 12,
          letterSpacing: '.02em',
        }}>
          أهلاً بك في دِبرة ✨
        </h1>
        <p style={{
          fontFamily: 'PNU, Tajawal, sans-serif',
          fontSize: 'clamp(.9rem, 2.5vw, 1.1rem)',
          color: 'rgba(227,238,213,.55)',
          fontWeight: 500,
        }}>
          رعاية سعودية أصيلة — نحن سعداء بزيارتك
        </p>
      </div>

      {/* Decorative line */}
      <div style={{
        width: 48, height: 2, background: '#777C6D',
        borderRadius: 2, margin: '28px auto 0',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.6s ease 0.2s',
      }} />

      {/* Hint */}
      <p style={{
        position: 'absolute', bottom: 32,
        fontFamily: 'PNU, Tajawal, sans-serif',
        fontSize: '.75rem', color: 'rgba(227,238,213,.2)',
        letterSpacing: '.1em',
        opacity: hiding ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}>
        اضغط في أي مكان للدخول
      </p>
    </div>
  )
}
