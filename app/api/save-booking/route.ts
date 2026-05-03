import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// خريطة الخدمات → نوع الحجز في DB
const SERVICE_CATEGORY_MAP: Record<string, string> = {
  medical:   'medical',
  childcare: 'child',
  elderly:   'elderly',
  // الباقي → other
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const {
      customer_id,
      service_key,
      service_category,
      package_id,
      package_label,
      start_date,
      start_time,
      end_time,
      child_count,
      amount,
      service_details,
      trackId,
      paymentId,
    } = body

    if (!customer_id) {
      return NextResponse.json({ success: false, message: 'بيانات العميل ناقصة' }, { status: 400 })
    }

    // قيمة service_type لازم تكون من القيم المسموحة في DB
    const serviceType = service_category || SERVICE_CATEGORY_MAP[service_key] || 'other'

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({
        customer_id,
        service_type: serviceType,
        package_id: package_id || null,
        service_details: service_details || null,
        status: 'confirmed',
        payment_status: 'paid',
        amount: amount || null,
        notes: JSON.stringify({
          service_key,
          package_label,
          start_date,
          start_time,
          end_time,
          child_count,
          trackId,
          paymentId,
        }),
      })
      .select('id')
      .single()

    if (error) {
      console.error('save-booking error:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    // ═══ اربط الحجز بالمحاولة في payment_attempts ═══
    if (trackId && booking?.id) {
      try {
        await supabase
          .from('payment_attempts')
          .update({
            booking_id: booking.id,
            updated_at: new Date().toISOString(),
          })
          .eq('track_id', trackId)
        console.log(`✅ [save-booking] Linked booking ${booking.id} to attempt ${trackId}`)
      } catch (linkErr: any) {
        console.error('⚠️  [save-booking] Link to attempt failed:', linkErr?.message)
      }
    }

    // إيميل للأدمن (اختياري)
    if (process.env.RESEND_API_KEY) {
      const adminEmail = process.env.ADMIN_EMAIL || 'info@dibrahcare.com'

      // اجلب بيانات العميل للإيميل
      const { data: customer } = await supabase
        .from('customers')
        .select('full_name, phone, email')
        .eq('id', customer_id)
        .maybeSingle()

      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'دِبرة <noreply@dibrahcare.com>',
          to: adminEmail,
          subject: `🎉 حجز جديد — ${customer?.full_name || 'عميل'}`,
          html: `
            <div dir="rtl" style="font-family:Arial;padding:24px;color:#5f6157">
              <h2 style="color:#5f6157">حجز جديد في دِبرة</h2>
              <p><strong>العميل:</strong> ${customer?.full_name || '—'}</p>
              <p><strong>الجوال:</strong> ${customer?.phone || '—'}</p>
              <p><strong>البريد:</strong> ${customer?.email || '—'}</p>
              <hr/>
              <p><strong>الخدمة:</strong> ${service_key}</p>
              <p><strong>الباقة:</strong> ${package_label || '—'}</p>
              <p><strong>تاريخ البدء:</strong> ${start_date || '—'}</p>
              <p><strong>المبلغ:</strong> ${amount} ريال</p>
              <p><strong>رقم الحجز:</strong> ${booking.id}</p>
              <p><strong>رقم الدفع:</strong> ${paymentId || trackId || '—'}</p>
              ${service_details ? `<hr/><pre style="background:#f7f6ee;padding:12px;border-radius:6px;font-size:.85rem;direction:rtl;text-align:right">${JSON.stringify(service_details, null, 2)}</pre>` : ''}
            </div>
          `,
        }),
      }).catch(err => console.error('admin email failed:', err))
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    })
  } catch (e: any) {
    console.error('save-booking error:', e?.message || e)
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
