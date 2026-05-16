import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/print-data?bookingId=<uuid>
// يرجع بيانات موحّدة للطباعة من السكيما الجديدة:
//   - بيانات العميل من جدول customers
//   - تفاصيل الحجز من جدول bookings
//   - بيانات الفورم الإضافية (طفل/كبير سن) من service_details JSON
export async function GET(req: NextRequest) {
  try {
    const bookingId = req.nextUrl.searchParams.get('bookingId')
    if (!bookingId) {
      return NextResponse.json({ success: false, error: 'Missing bookingId' }, { status: 400 })
    }

    // الحجز + بيانات العميل المرتبط
    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*, customers(*)')
      .eq('id', bookingId)
      .single()

    if (bErr || !booking) {
      return NextResponse.json({ success: false, error: 'Booking not found' }, { status: 404 })
    }

    const customer: any = booking.customers || {}

    // فكّ notes (يحتوي على service_key, package_label, start_date, start_time, إلخ)
    let bookingMeta: any = {}
    if (booking.notes) {
      try {
        bookingMeta = typeof booking.notes === 'string' ? JSON.parse(booking.notes) : booking.notes
      } catch {
        bookingMeta = {}
      }
    }

    // service_details (يحتوي على بيانات الفورم — للأطفال أو كبار السن)
    let serviceDetails: any = null
    if (booking.service_details) {
      try {
        serviceDetails = typeof booking.service_details === 'string'
          ? JSON.parse(booking.service_details)
          : booking.service_details
      } catch {
        serviceDetails = null
      }
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        service_type: booking.service_type,
        service_key: bookingMeta.service_key || null,
        package_id: booking.package_id,
        package_label: bookingMeta.package_label || null,
        amount: booking.amount,
        start_date: bookingMeta.start_date || null,
        start_time: bookingMeta.start_time || null,
        end_time: bookingMeta.end_time || null,
        child_count: bookingMeta.child_count || null,
        status: booking.status,
        payment_status: booking.payment_status,
        trackId: bookingMeta.trackId || null,
        paymentId: bookingMeta.paymentId || null,
        created_at: booking.created_at,
      },
      customer: {
        full_name: customer.full_name || '—',
        phone: customer.phone || '—',
        national_id: customer.national_id || '—',
        email: customer.email || '—',
        nationality: customer.nationality || '—',
        district: customer.district || '—',
        street: customer.street || '—',
        emergency_phone: customer.emergency_phone || '—',
        short_address: customer.short_address || '—',
      },
      serviceDetails,
    })
  } catch (e: any) {
    console.error('print-data error:', e?.message)
    return NextResponse.json({ success: false, error: e?.message || 'خطأ' }, { status: 500 })
  }
}
