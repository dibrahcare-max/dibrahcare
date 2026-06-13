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

// POST { since: { medical, feedback, customers } } → عدد العناصر الأحدث من كل وقت
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const { since } = await req.json()
    const s = since || {}

    const countNewer = async (
      table: string,
      sinceVal: string | null,
      extra?: (q: any) => any
    ): Promise<number> => {
      if (!sinceVal) return 0 // بدون مرجع زمني = لا تنبيه (نتجنب عدّ كل القديم)
      let q = supabase
        .from(table)
        .select('id', { count: 'exact', head: true })
        .gt('created_at', sinceVal)
      if (extra) q = extra(q)
      const { count } = await q
      return count || 0
    }

    const [medical, feedback, customers] = await Promise.all([
      countNewer('bookings', s.medical || null, (q: any) => q.eq('service_type', 'medical')),
      countNewer('feedback', s.feedback || null),
      countNewer('customers', s.customers || null),
    ])

    return NextResponse.json(
      { success: true, medical, feedback, customers },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'خطأ' }, { status: 500 })
  }
}
