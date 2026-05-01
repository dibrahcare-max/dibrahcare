import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const { name, email, phone, message } = await req.json()

  const html = `
<div dir="rtl" style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;background:#f5f5f5;padding:24px;border-radius:12px;">
  <div style="background:#5f6157;color:white;padding:20px;border-radius:8px;margin-bottom:20px;text-align:center;">
    <h2 style="margin:0;font-size:1.2rem;">رسالة جديدة من الموقع — دِبرة</h2>
  </div>
  <div style="background:white;border-radius:8px;padding:20px;border:1px solid #e0e0e0;">
    <p><strong>الاسم:</strong> ${name}</p>
    <p><strong>البريد:</strong> ${email}</p>
    ${phone ? `<p><strong>الجوال:</strong> ${phone}</p>` : ''}
    <hr style="border:1px solid #f0f0f0;margin:16px 0;"/>
    <p><strong>الرسالة:</strong></p>
    <p style="color:#555;line-height:1.8;">${message.replace(/\n/g,'<br/>')}</p>
  </div>
</div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'دِبرة <noreply@dibrahcare.com>',
      to: ['info@dibrahcare.com'],
      reply_to: email,
      subject: `رسالة جديدة من ${name} — تواصل معنا`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ success: false, message: JSON.stringify(err) }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
