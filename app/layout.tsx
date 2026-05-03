import type { Metadata } from 'next'
import './globals.css'
import XPixel from '@/components/XPixel'
import MetaPixel from '@/components/MetaPixel'

export const metadata: Metadata = {
  title: 'دِبرة — رعاية سعودية أصيلة',
  description: 'كوادر سعودية موثوقة لرعاية أطفالك وكبار السن',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Google Tag Manager */}
        <script dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','GTM-5N2QVPXC');` }} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-PFSX1VQMPG"></script>
        <script dangerouslySetInnerHTML={{ __html: `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', 'G-PFSX1VQMPG');` }} />
        <link rel="preload" href="/fonts/PNU-Bold.ttf?v=3" as="font" type="font/ttf" crossOrigin="anonymous"/>
        <link rel="preload" href="/fonts/PNU-Regular.ttf?v=3" as="font" type="font/ttf" crossOrigin="anonymous"/>

        {/* خط احتياطي من Google Fonts — يشتغل على جميع الأجهزة */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;900&display=swap" />
        
        <link rel="icon" href="/favicon.png" type="image/png"/>
        <meta name="google-site-verification" content="v9lxCqzB18qdfjjFsj1PDHi1sDhgAcTbNNKtmaWnY9E" />
      </head>
      <body>
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5N2QVPXC" height="0" width="0" style={{display:'none',visibility:'hidden'}}></iframe></noscript>
        {/* X (Twitter) Pixel — يتفعّل تلقائياً عند وجود NEXT_PUBLIC_X_PIXEL_ID في env */}
        <XPixel />
        {/* Meta (Facebook + Instagram) Pixel */}
        <MetaPixel />
        {children}
      </body>
    </html>
  )
}
