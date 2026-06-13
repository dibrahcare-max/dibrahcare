import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notifyAdmins } from '@/lib/twilio'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { service_title, description, requested_date, phone, full_name } = body

    if (!service_title || !description || !phone || !full_name) {
      return NextResponse.json({ success: false, message: 'بيانات ناقصة' }, { status: 400 })
    }

    // ابحث عن العميل بالجوال
    const normalizedPhone = phone.trim().replace(/^0/, '966')
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .or(`phone.eq.${phone.trim()},phone.eq.${normalizedPhone}`)
      .maybeSingle()

    // احفظ الطلب في bookings
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        customer_id: customer?.id || null,
        service_type: 'other',
        package_id: 'custom',
        status: 'pending',
        payment_status: 'awaiting_quote',
        amount: 0,
        notes: JSON.stringify({
          service_title,
          description,
          requested_date: requested_date || null,
          phone: phone.trim(),
          full_name: full_name.trim(),
        }),
      })
      .select('id')
      .single()

    if (error || !booking) {
      console.error('[custom-request]', error)
      return NextResponse.json({ success: false, message: 'فشل حفظ الطلب' }, { status: 500 })
    }

    // أرسل واتساب للأدمن
    const shortId = `DBR-${booking.id.split('-')[0].toUpperCase()}`
    await notifyAdmins(
      `🔔 طلب خدمة جديد (حسب الطلب)\n\nالاسم: ${full_name.trim()}\nالجوال: ${phone.trim()}\nالخدمة: ${service_title}\nالوصف: ${description}${requested_date ? `\nالتاريخ: ${requested_date}` : ''}\n\nرقم الطلب: ${shortId}\n\nافتح لوحة التحكم لتسعير الطلب وإرسال رابط الدفع.`
    ).catch(e => console.error('[custom-request] notify failed:', e?.message))

    return NextResponse.json({ success: true, bookingId: booking.id })
  } catch (e: any) {
    console.error('[custom-request]', e?.message)
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
