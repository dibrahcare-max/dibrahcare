'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    twq?: any
  }
}

/**
 * X (Twitter) Pixel — أداة التتبع
 * يُحقن مرة واحدة عبر الـ layout
 * يُسجّل PageView تلقائياً عند كل تغيير صفحة
 */
export default function XPixel() {
  const pathname = usePathname()
  // X Pixel ID — قابل للتغيير عبر env variable
  const pixelId = process.env.NEXT_PUBLIC_X_PIXEL_ID || 'qxrvj'

  // تثبيت سكربت X مرة واحدة
  useEffect(() => {
    if (!pixelId) return
    if (typeof window === 'undefined') return
    if (window.twq) return

    const code = `
      !function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){
      s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
      },s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
      a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
      twq('config','${pixelId}');
    `
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.text = code
    document.head.appendChild(script)
  }, [pixelId])

  // PageView عند كل تغيير صفحة
  useEffect(() => {
    if (!pixelId) return
    if (typeof window === 'undefined') return
    if (!window.twq) return
    window.twq('event', 'tw-page_view', {})
  }, [pathname, pixelId])

  return null
}

/**
 * helper لتسجيل conversion عند نجاح الدفع
 */
export function trackXConversion(value?: number, currency?: string) {
  if (typeof window === 'undefined') return
  if (!window.twq) return
  try {
    window.twq('event', 'tw-purchase', {
      value: value || 0,
      currency: currency || 'SAR',
    })
  } catch (e) {
    console.warn('X conversion tracking failed:', e)
  }
}
