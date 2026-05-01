import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import Marquee from '@/components/Marquee'
import About from '@/components/About'
import Services from '@/components/Services'
import Packages from '@/components/Packages'
import Testimonials from '@/components/Testimonials'
import FAQ from '@/components/FAQ'
import Articles from '@/components/Articles'
import Jobs from '@/components/Jobs'
import Partners from '@/components/Partners'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import WhatsApp from '@/components/WhatsApp'
import Reveal from '@/components/Reveal'
import Welcome from '@/components/Welcome'
import VisitTracker from '@/components/VisitTracker'

export const metadata: Metadata = {
  title: 'دِبرة — رعاية سعودية أصيلة للأطفال وكبار السن | Dibrah — Trusted Saudi Care',
  description: 'كوادر سعودية مؤهلة لرعاية أطفالك وكبار السن في الرياض. احجز الآن. | Professional Saudi caregivers for childcare and elderly care in Riyadh. Book now.',
  keywords: 'رعاية أطفال, جليسة أطفال, رعاية كبار السن, الرياض, دِبرة, childcare, elderly care, Riyadh, Dibrah',
  openGraph: {
    title: 'دِبرة — رعاية سعودية أصيلة للأطفال وكبار السن',
    description: 'كوادر سعودية مؤهلة لرعاية أطفالك وكبار السن في الرياض. احجز الآن.',
    url: 'https://dibrahcare.com',
    siteName: 'دِبرة',
    locale: 'ar_SA',
    type: 'website',
  },
}

export default function Design1() {
  return (
    <>
      <VisitTracker page="home" />
      <Welcome />
      <Nav />
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Packages />
      <Testimonials />
      <FAQ />
      <Articles />
      <Jobs />
      <Partners />
      <Contact />
      <Footer />
      <WhatsApp />
      <Reveal />
    </>
  )
}
