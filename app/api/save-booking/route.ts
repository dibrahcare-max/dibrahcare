import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      subscriber_name, subscriber_phone,
      subscriber_id, subscriber_nationality, subscriber_address,
      beneficiary_name, beneficiary_age, beneficiary_relation,
      emergency_phone, package: pkg, start_date, start_time,
      beneficiaries, totalPrice, trackId, paymentId, service
    } = body

    // طبّع رقم الجوال إلى الصيغة الدولية (9665XXXXXXXX)
    const normalizePhone = (p: string): string => {
      if (!p) return ''
      const clean = p.replace(/\D/g, '')
      if (clean.startsWith('966')) return clean
      if (clean.startsWith('05'))  return '966' + clean.slice(1)
      if (clean.startsWith('5'))   return '966' + clean
      return clean
    }
    const normalizedPhone = normalizePhone(subscriber_phone)
    const normalizedEmergency = normalizePhone(emergency_phone)

    // البحث عن العميل برقم الجوال (maybeSingle يتحمّل صفر نتائج)
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    let customerId = existing?.id

    if (customerId) {
      // تحديث بيانات العميل
      await supabase.from('customers').update({
        name: subscriber_name,
        national_id: subscriber_id,
        nationality: subscriber_nationality,
        address: subscriber_address,
      }).eq('id', customerId)
    } else {
      // إنشاء عميل جديد
      customerId = randomUUID()
      const { error: insertErr } = await supabase.from('customers').insert({
        id: customerId,
        name: subscriber_name,
        phone: normalizedPhone,
        national_id: subscriber_id,
        nationality: subscriber_nationality,
        address: subscriber_address,
      })
      if (insertErr) throw new Error('فشل إنشاء العميل: ' + insertErr.message)
    }

    // حفظ الحجز
    const { error } = await supabase.from('bookings').insert({
      customer_id: customerId,
      beneficiary_name: beneficiary_name || beneficiaries?.[0]?.name || '',
      beneficiary_age: beneficiary_age || beneficiaries?.[0]?.age || '',
      beneficiary_relation,
      emergency_phone: normalizedEmergency || null,
      service: service || null,
      package: pkg,
      start_date,
      start_time,
      price: totalPrice,
      track_id: trackId,
      payment_id: paymentId || null,
      status: 'pending',
    })

    if (error) throw error

    // ❌ إشعارات الواتساب معطّلة لتوفير التكاليف
    // (الموقع لا يرسل رسائل تلقائية بعد الحجز.
    //  الموظفة تتواصل مع العميل من لوحة التحكم يدوياً)
    /*
    if (normalizedPhone) {
      try {
        const { sendWhatsApp, TEMPLATES } = await import('@/lib/twilio')
        const packageLabels: Record<string, string> = {
          test_1: 'باقة اختبار', daily_4: 'يومي 4 ساعات', daily_8: 'يومي 8 ساعات',
          weekly_4: 'أسبوعي 4 ساعات', weekly_8: 'أسبوعي 8 ساعات',
          monthly_4: 'شهري 4 ساعات', monthly_8: 'شهري 16 ساعة', ramadan_2: 'باقة رمضان',
        }
        const packageLabel = packageLabels[pkg] || pkg
        const bookingId = trackId || randomUUID().slice(0, 8)
        const customerMsg = TEMPLATES.bookingConfirmation(subscriber_name, packageLabel, start_date || '—', bookingId)
        sendWhatsApp('+' + normalizedPhone, customerMsg).catch(console.error)
        const adminPhone = process.env.ADMIN_WHATSAPP_PHONE
        if (adminPhone) {
          const adminMsg = TEMPLATES.adminNewBooking(subscriber_name, normalizedPhone, service || '—', packageLabel, totalPrice || 0, bookingId)
          sendWhatsApp(adminPhone, adminMsg).catch(console.error)
        }
      } catch (waErr) {
        console.error('WhatsApp error:', waErr)
      }
    }
    */

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('save-booking error:', e)
    return NextResponse.json({ success: false, message: e.message }, { status: 500 })
  }
}
