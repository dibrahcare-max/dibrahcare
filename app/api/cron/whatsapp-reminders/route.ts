import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, TEMPLATES } from '@/lib/twilio'

export const runtime = 'nodejs'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// يشتغل يومياً في 9 صباحاً (يضبط في vercel.json)
// يرسل تذكير لكل حجز موعده غداً

export async function GET(req: NextRequest) {
  // ❌ التذكيرات التلقائية معطّلة لتوفير تكاليف الإرسال
  return NextResponse.json({
    success: true,
    disabled: true,
    message: 'التذكيرات التلقائية معطّلة. الموظفة تتواصل مع العميل يدوياً.',
    sent: 0,
  })

  // الكود الأصلي محفوظ تحت لو احتجناه لاحقاً:
  /*
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // غداً بصيغة YYYY-MM-DD
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // جلب حجوزات الغد الفعّالة
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id, service, package, start_date, start_time, status,
        customers(name, phone)
      `)
      .eq('start_date', tomorrowStr)
      .in('status', ['confirmed', 'pending'])

    if (error) throw error

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const booking of (bookings || [])) {
      const customer: any = booking.customers
      if (!customer?.phone || !customer?.name) continue

      const serviceName = booking.service || 'الخدمة المحجوزة'
      const dateStr = `${booking.start_date}${booking.start_time ? ' الساعة ' + booking.start_time : ''}`

      const message = TEMPLATES.reminder(customer.name, serviceName, dateStr)

      const result = await sendWhatsApp(customer.phone, message)
      if (result.success) {
        sent++
      } else {
        failed++
        errors.push(`${customer.phone}: ${result.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      total: bookings?.length || 0,
      sent,
      failed,
      errors: errors.slice(0, 10),
    })
  } catch (e: any) {
    console.error('reminder cron error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
  */
}
