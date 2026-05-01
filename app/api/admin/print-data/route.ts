import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/print-data?bookingId=<uuid>
// يرجع بيانات موحّدة للطباعة: العميل + الاستبانة الأصلية + الحجز الحالي
export async function GET(req: NextRequest) {
  try {
    const bookingId = req.nextUrl.searchParams.get('bookingId')
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 400 })
    }

    // 1. الحجز + بيانات العميل المرتبط
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const customer: any = booking.customers
    const phone = customer?.phone

    // 2. أول/أقدم استبانة للعميل (الأصلية — تظهر كل مرة يحجز)
    let registration: any = null
    if (phone) {
      const { data: regs } = await supabase
        .from('registrations')
        .select('*')
        .eq('subscriber_phone', phone)
        .order('created_at', { ascending: true }) // الأقدم = الأصلية
        .limit(1)
      registration = regs?.[0] || null
    }

    // 3. فكّ detail_data لو كانت نص JSON
    let detail: any = null
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
      booking: {
        id: booking.id,
        package: booking.package,
        price: booking.price,
        start_date: booking.start_date,
        start_time: booking.start_time,
        service: booking.service,
        status: booking.status,
        track_id: booking.track_id,
        payment_id: booking.payment_id,
        beneficiary_name: booking.beneficiary_name,
        beneficiary_age: booking.beneficiary_age,
        beneficiary_relation: booking.beneficiary_relation,
        emergency_phone: booking.emergency_phone,
        created_at: booking.created_at,
      },
      customer: customer ? {
        name: customer.name,
        phone: customer.phone,
        national_id: customer.national_id,
        nationality: customer.nationality,
        address: customer.address,
      } : null,
      registration: registration ? {
        type: registration.type,
        subscriber_job: registration.subscriber_job,
        subscriber_job_location: registration.subscriber_job_location,
        emergency_phone: registration.emergency_phone,
        created_at: registration.created_at,
        detail,
      } : null,
    })
  } catch (e: any) {
    console.error('print-data error:', e?.message)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
