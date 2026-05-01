import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'
import { verifyOtp as verifyOtpAuthentica } from '@/lib/authentica'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// تحويل لصيغة دولية للـ OTP
function toIntl(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('966')) return clean
  if (clean.startsWith('05'))  return '966' + clean.slice(1)
  if (clean.startsWith('5'))   return '966' + clean
  return clean
}

// تحويل لصيغة محلية للبحث في customers
function toLocal(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('966')) return '0' + clean.slice(3)
  if (clean.startsWith('05'))  return clean
  if (clean.startsWith('5'))   return '0' + clean
  return clean
}

// إنشاء توكن آمن
function createSessionToken(payload: { phone: string; customerId?: string }): string {
  const secret = process.env.SESSION_SECRET || 'dibrah-default-secret-change-me'
  const data = JSON.stringify({ ...payload, exp: Date.now() + 3 * 24 * 60 * 60 * 1000 })
  const encoded = Buffer.from(data).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json()

    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'البيانات ناقصة' }, { status: 400 })
    }

    const intlPhone  = toIntl(phone)
    const localPhone = toLocal(phone)

    // ═══ رقم اختبار — يبايباس Authentica ═══
    // افتراضياً: 0500000000 / 1234
    const testPhone = process.env.TEST_PHONE || '0500000000'
    const testOtp   = process.env.TEST_OTP   || '1234'
    let bypassAuthentica = false

    const normalizedTest = toIntl(testPhone)
    if (intlPhone === normalizedTest && code.toString() === testOtp) {
      bypassAuthentica = true
    }

    if (!bypassAuthentica) {
      // ═══ التحقق من OTP عبر Authentica ═══
      const verifyResult = await verifyOtpAuthentica(intlPhone, code.toString())

      if (!verifyResult.success) {
        return NextResponse.json({
          success: false,
          error: 'تعذّر التحقق. حاول مجدداً',
        }, { status: 500 })
      }

      if (!verifyResult.valid) {
        return NextResponse.json({
          success: false,
          error: 'رمز غير صحيح أو منتهي الصلاحية',
        }, { status: 400 })
      }
    }

    // ═══ فحص حالة العميل (customers فقط — السكيما الجديدة) ═══
    // new:      ما موجود في customers              → يبدأ التسجيل
    // complete: موجود في customers (بياناته كاملة) → يروح للخدمات/الحجز
    let status: 'new' | 'complete' = 'new'

    const { data: customer } = await supabase
      .from('customers')
      .select('id, full_name')
      .eq('phone', localPhone)
      .maybeSingle()

    if (customer) {
      status = 'complete'
    }

    // أنشئ توكن الجلسة
    const token = createSessionToken({
      phone: intlPhone,
      customerId: customer?.id,
    })

    const cookieStore = await cookies()
    cookieStore.set('dibrah_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3 * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      status,
      customerName: customer?.full_name || null,
      phone: intlPhone,
    })
  } catch (e: any) {
    console.error('verify-otp error:', e?.message)
    return NextResponse.json({ success: false, error: e?.message || 'خطأ' }, { status: 500 })
  }
}
