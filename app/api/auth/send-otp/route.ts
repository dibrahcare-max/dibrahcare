import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/authentica'

export const runtime = 'nodejs'

function normalize(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('966')) return clean
  if (clean.startsWith('05'))  return '966' + clean.slice(1)
  if (clean.startsWith('5'))   return '966' + clean
  return clean
}

export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ success: false, error: 'رقم الجوال مطلوب' }, { status: 400 })
    }

    const normalizedPhone = normalize(phone)

    if (normalizedPhone.length !== 12 || !normalizedPhone.startsWith('9665')) {
      return NextResponse.json({ success: false, error: 'رقم جوال غير صحيح. مثال: 05XXXXXXXX' }, { status: 400 })
    }

    // ═══ رقم اختبار — يبايباس Authentica ═══
    // افتراضياً: 0500000000 / يقدر يتغير عبر env TEST_PHONE
    const testPhone = process.env.TEST_PHONE || '0500000000'
    const normalizedTest = normalize(testPhone)
    if (normalizedPhone === normalizedTest) {
      return NextResponse.json({
        success: true,
        message: 'وضع الاختبار: استخدم الكود الثابت 1234',
        expiresIn: 300,
        test: true,
      })
    }

    // إرسال OTP عبر Authentica (SMS افتراضياً، لين يجاهز الواتساب)
    const method = (process.env.AUTHENTICA_METHOD as 'sms' | 'whatsapp') || 'sms'
    const result = await sendOtp(normalizedPhone, method)

    if (!result.success) {
      console.error('OTP send failed:', result.error)
      return NextResponse.json({
        success: false,
        error: 'تعذّر إرسال الرمز. تأكد من الرقم وحاول مجدداً'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `تم إرسال الرمز عبر ${method === 'whatsapp' ? 'واتساب' : 'الرسائل النصية'}`,
      expiresIn: 300,
    })
  } catch (e: any) {
    console.error('send-otp error:', e?.message)
    return NextResponse.json({ success: false, error: e?.message || 'خطأ' }, { status: 500 })
  }
}
