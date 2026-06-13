import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSessionToken } from '@/lib/admin-auth'
import { sendWhatsApp } from '@/lib/twilio'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const { bookingId, amount } = await req.json()
    if (!bookingId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: 'بيانات ناقصة' }, { status: 400 })
    }

    // حدّث المبلغ في الحجز
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({
        amount,
        payment_status: 'unpaid',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select('*, customers(full_name, phone)')
      .single()

    if (error || !booking) {
      return NextResponse.json({ success: false, message: error?.message || 'فشل التحديث' }, { status: 500 })
    }

    // جيب بيانات العميل
    const notes = typeof booking.notes === 'string' ? JSON.parse(booking.notes || '{}') : booking.notes || {}
    const phone = booking.customers?.phone || notes.phone
    const name = booking.customers?.full_name || notes.full_name || 'عميلنا الكريم'
    const firstName = name.trim().split(/\s+/)[0]

    if (!phone) {
      return NextResponse.json({ success: false, message: 'لا يوجد رقم جوال للعميل' }, { status: 400 })
    }

    // رابط الدفع
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'
    const payUrl = `${baseUrl}/pay/${bookingId}`

    // أرسل واتساب للعميل
    const message = `مرحباً ${firstName} 💚\n\nشكراً لتواصلك مع دبرة!\n\nتم تحديد سعر طلبك *"${notes.service_title || 'خدمة حسب الطلب'}"* بمبلغ:\n\n*${parseFloat(amount).toFixed(2)} ريال سعودي*\n\nللمتابعة وإتمام الدفع بشكل آمن، اضغط على الرابط:\n${payUrl}\n\nنحن هنا لأي استفسار 🌿`

    const waResult = await sendWhatsApp(phone, message)
    if (!waResult.success) {
      console.error('⚠️ [send-payment] WhatsApp failed:', waResult.error)
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[send-payment]', e?.message)
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
