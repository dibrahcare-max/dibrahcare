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

// GET ?city=الرياض — قائمة المستلمين (الاسم + الجوال)
export async function GET(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const city = req.nextUrl.searchParams.get('city') || ''
    let q = supabase.from('customers').select('full_name, phone').not('phone', 'is', null)
    if (city) q = q.eq('city', city)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // إزالة التكرار في الأرقام
    const seen = new Set<string>()
    const recipients = (data || []).filter(r => {
      if (!r.phone || seen.has(r.phone)) return false
      seen.add(r.phone)
      return true
    }).map(r => ({ name: r.full_name || '', phone: r.phone }))

    return NextResponse.json(
      { success: true, recipients, total: recipients.length },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'خطأ' }, { status: 500 })
  }
}
