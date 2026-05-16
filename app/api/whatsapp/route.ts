import { NextRequest, NextResponse } from 'next/server'
import * as crypto from 'crypto'

// ⚠️ هذا الملف موروث من الإصدار القديم (UltraMSG)
//    OTP الحين يمر عبر Authentica (SMS) — راجع /api/auth/send-otp
//    إشعارات الحجز الحين تمر عبر Twilio WhatsApp — راجع /lib/twilio.ts
//    الملف باقٍ هنا للرجوع التاريخي فقط، وكل القيم الحساسة تُقرأ من env.

const SECRET = process.env.OTP_SIGN_SECRET || 'dibrah_otp_secret_2025'

function signOtp(phone: string, otp: string, ts: number) {
  return crypto.createHmac('sha256', SECRET)
    .update(`${phone}:${otp}:${ts}`)
    .digest('hex')
}

async function sendWhatsApp(to: string, message: string) {
  const instance = process.env.ULTRAMSG_INSTANCE_ID
  const token = process.env.ULTRAMSG_TOKEN
  if (!instance || !token) {
    console.warn('[/api/whatsapp] UltraMSG غير مفعّل — تم تخطّي الإرسال')
    return false
  }
  const phone = to.startsWith('966') ? to : to.startsWith('0') ? '966' + to.slice(1) : '966' + to
  const res = await fetch(`https://api.ultramsg.com/${instance}/messages/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token, to: phone, body: message }).toString(),
  })
  return res.ok
}

export async function POST(req: NextRequest) {
  // النقطة معطّلة افتراضياً — لو ULTRAMSG_INSTANCE_ID و ULTRAMSG_TOKEN غير مضبوطة
  if (!process.env.ULTRAMSG_INSTANCE_ID || !process.env.ULTRAMSG_TOKEN) {
    return NextResponse.json({
      success: false,
      message: 'هذه النقطة معطّلة. يرجى استخدام /api/auth/send-otp للتحقق و Meta WhatsApp للإشعارات.',
    }, { status: 410 }) // 410 Gone
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const body = await req.json()

  if (action === 'send') {
    const { phone } = body
    if (!phone) return NextResponse.json({ success: false, message: 'رقم الجوال مطلوب' })
    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const ts = Date.now()
    const token = signOtp(phone, otp, ts)
    const message = `دِبرة للرعاية 🌿\n\nكود التحقق الخاص بك:\n*${otp}*\n\nصالح لمدة 10 دقائق فقط.\nلا تشاركه مع أحد.`
    const sent = await sendWhatsApp(phone, message)
    if (!sent) return NextResponse.json({ success: false, message: 'فشل إرسال الكود' })
    return NextResponse.json({ success: true, token, ts })
  }

  if (action === 'verify') {
    const { phone, otp, token, ts } = body
    if (!phone || !otp || !token || !ts)
      return NextResponse.json({ success: false, message: 'بيانات ناقصة' })
    if (Date.now() - Number(ts) > 10 * 60 * 1000)
      return NextResponse.json({ success: false, message: 'انتهت صلاحية الكود' })
    const expected = signOtp(phone, otp, Number(ts))
    if (expected !== token)
      return NextResponse.json({ success: false, message: 'الكود غير صحيح' })
    return NextResponse.json({ success: true })
  }

  if (action === 'notify') {
    const { phone, name, package_label, start_date, start_time } = body
    if (!phone) return NextResponse.json({ success: false })
    const message = `دِبرة للرعاية 🌿\n\nمرحباً ${name}،\n\nتم تأكيد حجزك بنجاح ✅\n\n📦 الباقة: ${package_label}\n📅 التاريخ: ${start_date}\n🕐 الوقت: ${start_time}\n\nشكراً لثقتك بدِبرة 🙏\nللاستفسار: 966535977511+`
    await sendWhatsApp(phone, message)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ success: false, message: 'action غير صحيح' })
}
