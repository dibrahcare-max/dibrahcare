import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'بوابة الداعمين — دِبرة',
  description: 'تابع رحلة دعمك',
}

export default function SupportersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #FDF8F0 0%, #F5EFE5 100%)',
      fontFamily: 'PNU, Tajawal, sans-serif',
      color: '#2D4A1E',
    }}>
      {children}
    </div>
  )
}
