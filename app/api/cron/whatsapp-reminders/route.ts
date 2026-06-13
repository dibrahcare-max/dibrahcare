import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, TEMPLATES } from '@/lib/twilio'
import { getServiceTitle } from '@/lib/services'

export const runtime = 'nodejs'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// تشغيل يومي ٩ صباحاً (vercel.json) — يرسل تذكير لكل حجز موعده غداً
export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // غداً بصيغة YYYY-MM-DD
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // جلب حجوزات الغد الفعّالة — start_date و service_key مخزّنين في notes (JSON)
    // والـ customer name و phone في جدول customers (full_name)
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        id, service_type, package_id, status, notes,
        customers(full_name, phone)
      `)
      .in('status', ['confirmed', 'pending'])

    if (error) throw error

    let sent = 0
    let failed = 0
    const errors: string[] = []

    for (const booking of (bookings || [])) {
      // notes حقل text فيه JSON — نفك التشفير لاستخراج start_date و service_key
      let parsedNotes: any = null
      try {
        if (booking.notes) {
          parsedNotes = typeof booking.notes === 'string'
            ? JSON.parse(booking.notes)
            : booking.notes
        }
      } catch { parsedNotes = null }

      const bookingDate = parsedNotes?.start_date
      if (bookingDate !== tomorrowStr) continue  // ليس لغد

      const customer: any = booking.customers
      if (!customer?.phone || !customer?.full_name) continue

      const firstName    = (customer.full_name || '').trim().split(/\s+/)[0]
      // الأولوية: package_label (عربي من الواجهة) ← service_key مترجم ← service_type كآخر حل
      const serviceName  = parsedNotes?.package_label 
                        || getServiceTitle(parsedNotes?.service_key, booking.service_type)
      const startTime    = parsedNotes?.start_time
      const dateStr      = `${bookingDate}${startTime ? ' الساعة ' + startTime : ''}`

      const message = TEMPLATES.reminder(firstName, serviceName, dateStr)
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
      tomorrow: tomorrowStr,
      total_scanned: bookings?.length || 0,
      sent,
      failed,
      errors: errors.slice(0, 10),
    })
  } catch (e: any) {
    console.error('reminder cron error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
