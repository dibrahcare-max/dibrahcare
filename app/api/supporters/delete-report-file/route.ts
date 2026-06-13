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

const BUCKET = 'support-reports'

// POST { path } — حذف ملف تقرير واحد من التخزين
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const { path } = await req.json()
    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'مسار الملف مفقود' }, { status: 400 })
    }
    // حماية: المسار لازم داخل البكت (صيغة supportId/file.pdf)
    if (path.includes('..') || !path.includes('/')) {
      return NextResponse.json({ error: 'مسار غير صالح' }, { status: 400 })
    }

    const { error } = await supabase.storage.from(BUCKET).remove([path])
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'خطأ' }, { status: 500 })
  }
}
