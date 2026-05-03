'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

declare global {
  interface Window {
    fbq?: any
    _fbq?: any
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '2171713803666831'

/**
 * Meta (Facebook + Instagram) Pixel
 * - يُحقن مرة واحدة عبر الـ layout
 * - PageView تلقائي عند كل تغيير صفحة
 */
export default function MetaPixel() {
  const pathname = usePathname()

  // تثبيت السكربت مرة واحدة
  useEffect(() => {
    if (!META_PIXEL_ID) return
    if (typeof window === 'undefined') return
    if (window.fbq) return

    const code = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', '${META_PIXEL_ID}');
    `
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.text = code
    document.head.appendChild(script)
  }, [])

  // PageView عند كل تغيير صفحة
  useEffect(() => {
    if (!META_PIXEL_ID) return
    if (typeof window === 'undefined') return
    if (!window.fbq) return
    window.fbq('track', 'PageView')
  }, [pathname])

  if (!META_PIXEL_ID) return null

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  )
}

/**
 * helper لتسجيل Purchase عند نجاح الدفع
 */
export function trackMetaPurchase(value?: number, currency?: string) {
  if (typeof window === 'undefined') return
  if (!window.fbq) return
  try {
    window.fbq('track', 'Purchase', {
      value: value || 0,
      currency: currency || 'SAR',
    })
  } catch (e) {
    console.warn('Meta purchase tracking failed:', e)
  }
}
