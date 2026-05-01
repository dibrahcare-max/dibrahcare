import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

const SECRET = 'dibrah_otp_secret_2025'

function signOtp(email: string, otp: string, ts: number) {
  return crypto.createHmac('sha256', SECRET)
    .update(`${email}:${otp}:${ts}`)
    .digest('hex')
}

// POST /api/otp — إرسال الكود
// POST /api/otp?verify=1 — التحقق من الكود
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const isVerify = searchParams.get('verify') === '1'
  const body = await req.json()

  // ===== تحقق من الكود =====
  if (isVerify) {
    const { email, otp, token, ts } = body
    if (!email || !otp || !token || !ts) {
      return NextResponse.json({ success: false, message: 'بيانات ناقصة' })
    }
    // تأكد ما مضى أكثر من 10 دقائق
    if (Date.now() - Number(ts) > 10 * 60 * 1000) {
      return NextResponse.json({ success: false, message: 'انتهت صلاحية الكود، اطلب كوداً جديداً' })
    }
    const expected = signOtp(email, otp, Number(ts))
    if (expected !== token) {
      return NextResponse.json({ success: false, message: 'الكود غير صحيح' })
    }
    return NextResponse.json({ success: true })
  }

  // ===== إرسال الكود =====
  const { email } = body
  if (!email) return NextResponse.json({ success: false, message: 'الإيميل مطلوب' })

  const otp = String(Math.floor(100000 + Math.random() * 900000))
  const ts  = Date.now()
  const token = signOtp(email, otp, ts)

  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><style>
  body { font-family: Arial, sans-serif; background: #B7B89F; margin: 0; padding: 32px; direction: rtl; }
  .card { background: white; border-radius: 16px; padding: 40px; max-width: 480px; margin: 0 auto; text-align: center; border: 1px solid rgba(95,97,87,.15); }
  .brand { font-size: 2rem; font-weight: 900; color: #777C6D; display: block; margin-bottom: 8px; }
  .title { font-size: 1.2rem; font-weight: 900; color: #5f6157; margin-bottom: 20px; }
  .otp { font-size: 2.8rem; font-weight: 900; color: #5f6157; letter-spacing: .3em; background: #B7B89F; border-radius: 12px; padding: 16px 32px; display: inline-block; margin: 20px 0; }
  .sub { font-size: .88rem; color: #8a8e80; line-height: 1.8; }
</style></head>
<body>
<div class="card">
  <span class="brand">دِبرة</span>
  <p class="title">كود التحقق لإتمام حجزك</p>
  <div class="otp">${otp}</div>
  <p class="sub">هذا الكود صالح لمدة <strong>10 دقائق</strong> فقط.<br>إذا لم تطلب هذا الكود، تجاهل هذا الإيميل.</p>
</div>
</body></html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'دِبرة <noreply@dibrahcare.com>',
      to: [email],
      subject: `${otp} — كود التحقق من دِبرة`,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ success: false, message: 'فشل إرسال الكود: ' + JSON.stringify(err) })
  }

  return NextResponse.json({ success: true, token, ts })
}
