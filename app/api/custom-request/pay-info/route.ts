import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function GET(req: NextRequest) {
  try {
    const id = new URL(req.url).searchParams.get('id')
    if (!id) {
      return NextResponse.json({ success: false, message: 'id مطلوب' }, { status: 400 })
    }

    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select('id, amount, status, payment_status, notes, service_type, customers(full_name, phone)')
      .eq('id', id)
      .eq('service_type', 'other')
      .single()

    if (error || !booking) {
      return NextResponse.json({ success: false, message: 'الطلب غير موجود' }, { status: 404 })
    }

    // لو المبلغ ما تحدد بعد
    if (!booking.amount || booking.amount <= 0) {
      return NextResponse.json({ success: false, message: 'لم يتم تحديد سعر هذا الطلب بعد، سيتواصل معك فريق دبرة قريباً' }, { status: 400 })
    }

    return NextResponse.json({ success: true, booking })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
