import type { Metadata } from 'next'
import './globals.css'
import XPixel from '@/components/XPixel'
import MetaPixel from '@/components/MetaPixel'

export const metadata: Metadata = {
  metadataBase: new URL('https://dibrahcare.com'),
  title: {
    default: 'دِبرة — رعاية سعودية أصيلة | جليسة أطفال، حضانة منزلية، رعاية كبار السن في الرياض',
    template: '%s | دِبرة',
  },
  description: 'دِبرة العائلة — منصة سعودية رائدة في خدمات الرعاية المنزلية بالرياض. نقدم جليسة أطفال موثوقة، حضانة منزلية، رعاية كبار السن، مرافقة مرضى في المستشفى، مرافقة مواعيد طبية، مرافقة آمنة للبنات، مرافقة سفر داخلي وخارجي، خدمة العروس وأعراس، برامج وأنشطة للأطفال، ومدبرات منازل. كوادر سعودية مدربة، خدمة احترافية بكل أمان وثقة. احجز الآن أو تواصل معنا.',
  keywords: [
    // العلامة التجارية
    'دبرة', 'دِبرة', 'دبرة العائلة', 'دبرة كير', 'Dibrah', 'dibrahcare', 'دبرة الرياض',

    // جليسة أطفال + حضانة
    'جليسة أطفال', 'جليسة أطفال الرياض', 'جليسة أطفال سعودية', 'جليسة في المنزل',
    'جليسة موثوقة', 'جليسة أطفال احترافية', 'بيبي سيتر',
    'حضانة', 'حضانة منزلية', 'حضانة في المنزل', 'حضانة أطفال',
    'حضانة الرياض', 'حضانة منزلية الرياض', 'حضانة خاصة',

    // رعاية الأطفال
    'رعاية أطفال', 'رعاية الطفل', 'رعاية أطفال منزلية',
    'برامج أطفال', 'أنشطة أطفال', 'برامج ترفيهية أطفال',

    // رعاية كبار السن
    'رعاية كبار السن', 'عناية كبار السن', 'مرافقة كبار السن',
    'رعاية مسنين', 'خدمات كبار السن', 'رعاية كبار السن الرياض',

    // مرافقة طبية
    'مرافقة مرضى', 'مرافقة في المستشفى', 'مرافقة مواعيد طبية',
    'مرافقة طبية', 'مرافقة للمواعيد', 'رعاية طبية منزلية',

    // مرافقة آمنة
    'مرافقة آمنة', 'مرافقة بنات', 'مرافقة طالبات',
    'مرافقة آمنة الرياض', 'مرافقة للفتيات',

    // مرافقة سفر
    'مرافقة سفر', 'مرافقة في السفر', 'رفيقة سفر',
    'مرافقة أطفال في السفر', 'خدمات السفر العائلي',

    // أعراس ومناسبات
    'مرافقة أعراس', 'خدمة العروس', 'وصيفة العروس',
    'خدمات الأعراس', 'مرافقة مناسبات', 'وصيفات سعوديات',

    // مدبرة منزل
    'مدبرة منزل', 'ربعيات', 'مدبّرة', 'إدارة المنزل',
    'خدمات منزلية', 'مدبرة منزل سعودية',

    // عامة
    'رعاية سعودية', 'كوادر سعودية', 'رعاية منزلية',
    'خدمات رعاية الرياض', 'الرعاية في الرياض',
    'خدمات منزلية سعودية', 'رعاية شاملة', 'أسرة سعودية',
  ],
  authors: [{ name: 'دِبرة', url: 'https://dibrahcare.com' }],
  creator: 'دِبرة',
  publisher: 'دِبرة',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: 'https://dibrahcare.com',
    siteName: 'دِبرة',
    title: 'دِبرة — رعاية سعودية أصيلة',
    description: 'جليسة أطفال، حضانة منزلية، رعاية كبار السن، مرافقة مرضى، مرافقة سفر، خدمات الأعراس — كوادر سعودية موثوقة في الرياض.',
    images: [{
      url: '/images/dibrah-logo.png',
      width: 1200,
      height: 630,
      alt: 'دِبرة — رعاية سعودية أصيلة',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'دِبرة — رعاية سعودية أصيلة',
    description: 'جليسة أطفال، حضانة منزلية، رعاية كبار السن، مرافقة سفر وأعراس — بأيدٍ سعودية موثوقة.',
    images: ['/images/dibrah-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

// بيانات منظمة لـ Google: يعرف إنك شركة محلية بالرياض
const businessJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://dibrahcare.com',
  name: 'دِبرة',
  alternateName: ['Dibrah', 'دبرة العائلة', 'دبرة كير', 'دبرة الرياض'],
  description: 'منصة سعودية رائدة لخدمات الرعاية المنزلية: جليسة أطفال، حضانة، رعاية كبار السن، مرافقة مرضى ومواعيد، مرافقة سفر، خدمات الأعراس، وأكثر.',
  url: 'https://dibrahcare.com',
  telephone: '+966535977511',
  email: 'info@dibrah.net',
  image: 'https://dibrahcare.com/images/dibrah-logo.png',
  logo: 'https://dibrahcare.com/images/dibrah-logo.png',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'الرياض',
    addressRegion: 'منطقة الرياض',
    addressCountry: 'SA',
  },
  areaServed: {
    '@type': 'City',
    name: 'الرياض',
  },
  serviceType: [
    'جليسة أطفال',
    'حضانة منزلية',
    'رعاية كبار السن',
    'مرافقة مرضى في المستشفى',
    'مرافقة مواعيد طبية',
    'مرافقة آمنة للبنات',
    'مرافقة في السفر',
    'خدمة العروس',
    'مرافقة الأعراس',
    'برامج وأنشطة للأطفال',
    'مدبرة منزل',
    'رعاية منزلية',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'خدمات دِبرة',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'جليسة أطفال وحضانة منزلية' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'رعاية كبار السن' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'مرافقة مرضى في المستشفى' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'مرافقة آمنة للبنات' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'مرافقة في السفر' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'خدمة العروس والأعراس' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'برامج وأنشطة للأطفال' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'مدبرة منزل / ربعيات' } },
    ],
  },
  priceRange: '$$',
  sameAs: [
    'https://twitter.com/dibrahcare',
    'https://instagram.com/dibrahcare',
  ],
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

        {/* بيانات منظمة لـ Google — تخبره أنك شركة محلية بالرياض */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
        />
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
