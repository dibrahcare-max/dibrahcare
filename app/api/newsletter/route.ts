import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'دِبرة <noreply@dibrahcare.com>',
      to: ['info@dibrahcare.com'],
      subject: 'اشتراك جديد في النشرة',
      html: `<p dir="rtl">اشتراك جديد في النشرة البريدية: <strong>${email}</strong></p>`,
    }),
  })
  if (!res.ok) return NextResponse.json({ success: false }, { status: 500 })
  return NextResponse.json({ success: true })
}
