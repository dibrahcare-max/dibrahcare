import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// قائمة الاستعلامات المسموح بها فقط (whitelist - أمان)
const QUERIES: Record<string, () => any> = {
  bookings: () =>
    supabase
      .from('bookings')
      .select('*, customers(full_name, phone, national_id, email, nationality, district, street, emergency_phone, short_address)')
      .neq('service_type', 'medical')
      .order('created_at', { ascending: false }),

  'bookings-medical': () =>
    supabase
      .from('bookings')
      .select('*, customers(full_name, phone, national_id, email, district, street)')
      .eq('service_type', 'medical')
      .order('created_at', { ascending: false }),

  'bookings-all': () =>
    supabase
      .from('bookings')
      .select('*, customers(full_name, phone, national_id, email, nationality, district, street, emergency_phone, short_address)')
      .order('created_at', { ascending: false }),

  customers: () =>
    supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false }),

  feedback: () =>
    supabase
      .from('feedback')
      .select('*')
      .order('created_at', { ascending: false }),

  'discount-codes': () =>
    supabase
      .from('discount_codes')
      .select('*')
      .order('created_at', { ascending: false }),

  'registrations-medical': () =>
    supabase
      .from('registrations')
      .select('*')
      .eq('type', 'medical')
      .order('created_at', { ascending: false }),
}

export async function GET(req: NextRequest) {
  // ═══ التحقق من جلسة الأدمن ═══
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }
  const session = verifyAdminSessionToken(token)
  if (!session) {
    return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })
  }

  // ═══ تنفيذ الاستعلام المطلوب ═══
  const resource = req.nextUrl.searchParams.get('resource') || ''
  const queryFn = QUERIES[resource]
  if (!queryFn) {
    return NextResponse.json({ error: 'مورد غير معروف' }, { status: 400 })
  }

  try {
    const { data, error } = await queryFn()
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, data: data || [] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
