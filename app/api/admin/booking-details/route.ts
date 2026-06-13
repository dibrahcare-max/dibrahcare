import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/booking-details?id=xxx
export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })
    }

    // 1. جلب الحجز + بيانات العميل
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', id)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const customer: any = booking.customers
    const phone = customer?.phone

    // 2. جلب آخر تسجيل (استبانة) لنفس رقم الجوال
    let registration: any = null
    if (phone) {
      const { data: regs } = await supabase
        .from('registrations')
        .select('*')
        .eq('subscriber_phone', phone)
        .order('created_at', { ascending: false })
        .limit(1)
      registration = regs?.[0] || null
    }

    // 3. تحويل detail_data من JSON string إلى object (إن وجد)
    let detail = null
    if (registration?.detail_data) {
      try {
        detail = typeof registration.detail_data === 'string'
          ? JSON.parse(registration.detail_data)
          : registration.detail_data
      } catch {
        detail = null
      }
    }

    return NextResponse.json({
      success: true,
      booking,
      customer,
      registration,
      detail,
    })
  } catch (e: any) {
    console.error('booking-details error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
