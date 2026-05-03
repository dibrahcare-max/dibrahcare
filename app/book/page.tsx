'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'

export default function BookRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => {
      router.push('/services')
    }, 4000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <>
      <Nav />
      <section style={{
        background: 'var(--bg)', minHeight: '60vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 40,
      }}>
        <div style={{
          background: 'white', borderRadius: 24,
          padding: '56px 40px', maxWidth: 540, width: '100%',
          textAlign: 'center',
          border: '1px solid rgba(95,97,87,.15)',
          boxShadow: '0 4px 24px rgba(95,97,87,.08)',
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🌿</div>

          <span style={{
            fontSize: '2rem', fontWeight: 900, color: '#777C6D',
            display: 'block', marginBottom: 8,
            fontFamily: 'PNU, Tajawal, sans-serif',
          }}>
            دِبرة
          </span>

          <h1 style={{
            fontSize: 'clamp(1.3rem, 2.8vw, 1.7rem)', fontWeight: 900,
            color: 'var(--dark)', marginBottom: 14,
            fontFamily: 'PNU, Tajawal, sans-serif', lineHeight: 1.4,
          }}>
            قبل البدء بالحجز،<br />اختر الخدمة المناسبة لك
          </h1>

          <p style={{
            color: 'var(--muted)', fontSize: '.95rem',
            lineHeight: 1.9, marginBottom: 28,
          }}>
            لكل خدمة من خدماتنا تفاصيل تخصها — اختر الخدمة المناسبة من قائمة خدماتنا، ثم نكمل معك تفاصيل الحجز بكل سهولة.
          </p>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            color: 'var(--muted)', fontSize: '.85rem', fontWeight: 600,
            marginBottom: 24,
          }}>
            <span style={{
              display: 'inline-block', width: 16, height: 16,
              border: '2px solid rgba(95,97,87,.2)',
              borderTopColor: 'var(--dark)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            سيتم تحويلك خلال لحظات...
          </div>

          <div>
            <a href="/services" style={{
              display: 'inline-block', padding: '14px 36px',
              background: 'var(--dark)', color: '#F6F0D7',
              borderRadius: 10, textDecoration: 'none',
              fontWeight: 700, fontSize: '1rem',
            }}>
              تصفّح خدماتنا الآن ←
            </a>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      <Footer />
      <WhatsApp />
    </>
  )
}
