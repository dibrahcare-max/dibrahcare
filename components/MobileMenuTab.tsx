'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  open: boolean
  setOpen: (v: boolean) => void
}

export default function MobileMenuTab({ open, setOpen }: Props) {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setMounted(true)
    const check = () => setIsMobile(window.innerWidth <= 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (!mounted || !isMobile) return null

  return createPortal(
    <>
      {/* اللسان الجانبي — inline styles لضمان الظهور */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="فتح قائمة لوحة التحكم"
          style={{
            position: 'fixed',
            top: '50%',
            right: 0,
            marginTop: -42,
            zIndex: 999999,
            width: 36,
            height: 84,
            borderRadius: '12px 0 0 12px',
            background: '#5F6157',
            color: '#F6F0D7',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            boxShadow: '-4px 0 14px rgba(0,0,0,0.18)',
            animation: 'dibrah-tab-pulse 2.2s ease-in-out infinite',
          }}
        >
          <span style={{
            fontSize: 20,
            fontWeight: 900,
            display: 'inline-block',
            animation: 'dibrah-arrow-bounce 1.4s ease-in-out infinite',
            lineHeight: 1,
          }}>‹</span>
          <span style={{
            fontSize: 14,
            opacity: 0.85,
            lineHeight: 1,
          }}>☰</span>
        </button>
      )}

      {/* الخلفية المظلمة */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            zIndex: 999997,
          }}
        />
      )}

      {/* keyframes فقط (لأن inline styles ما تدعمها) */}
      <style>{`
        @keyframes dibrah-arrow-bounce {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(-5px); }
        }
        @keyframes dibrah-tab-pulse {
          0%, 100% { box-shadow: -4px 0 14px rgba(0,0,0,0.18); }
          50%      { box-shadow: -4px 0 22px rgba(95,97,87,0.45); }
        }
      `}</style>
    </>,
    document.body
  )
}
