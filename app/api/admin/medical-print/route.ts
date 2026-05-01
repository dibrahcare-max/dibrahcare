import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdminSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET /api/admin/medical-print?regId=<uuid>
// يرجع بيانات تسجيل الرعاية الطبية + بيانات العميل المرتبط
export async function GET(req: NextRequest) {
  try {
    // التحقق من جلسة الأدمن
    const cookieStore = await cookies()
    const token = cookieStore.get('dibrah_admin_session')?.value
    if (!token || !verifyAdminSessionToken(token)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const regId = req.nextUrl.searchParams.get('regId')
    if (!regId) {
      return NextResponse.json({ success: false, error: 'Missing regId' }, { status: 400 })
    }

    const { data: registration, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', regId)
      .single()

    if (error || !registration) {
      return NextResponse.json({ success: false, error: 'Registration not found' }, { status: 404 })
    }

    // ابحث عن العميل المرتبط (إن وُجد)
    let customer = null
    if (registration.customer_id) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('id', registration.customer_id)
        .maybeSingle()
      customer = data
    } else if (registration.subscriber_phone) {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', registration.subscriber_phone)
        .maybeSingle()
      customer = data
    }

    return NextResponse.json({
      success: true,
      registration,
      customer,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
