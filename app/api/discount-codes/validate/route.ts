import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST: التحقق من صلاحية كود الخصم
// body: { code: string }
// returns: { success, code: { id, percent, is_public }, message }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const code = String(body.code || '').trim().toUpperCase()

    if (!code) {
      return NextResponse.json({ success: false, message: 'يرجى إدخال الكود' }, { status: 400 })
    }

    // ابحث عن الكود
    const { data, error } = await supabase
      .from('discount_codes')
      .select('id, code, discount_percent, valid_from, valid_until, used, is_void, is_public, use_count')
      .eq('code', code)
      .maybeSingle()

    if (error) {
      console.error('discount-codes validate error:', error)
      return NextResponse.json({ success: false, message: 'تعذّر التحقق — جرّب لاحقاً' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ success: false, message: 'الكود غير موجود' }, { status: 404 })
    }

    // الحالات المرفوضة
    if (data.is_void) {
      return NextResponse.json({ success: false, message: 'هذا الكود ملغى' }, { status: 400 })
    }

    const now = new Date()
    if (new Date(data.valid_until) < now) {
      return NextResponse.json({ success: false, message: 'انتهت صلاحية هذا الكود' }, { status: 400 })
    }

    if (new Date(data.valid_from) > now) {
      return NextResponse.json({ success: false, message: 'الكود لم يُفعَّل بعد' }, { status: 400 })
    }

    // الكود الخاص — مستخدم؟
    if (!data.is_public && data.use_count >= 1) {
      return NextResponse.json({ success: false, message: 'هذا الكود استُخدم سابقاً' }, { status: 400 })
    }

    // جاهز للاستخدام
    return NextResponse.json({
      success: true,
      code: {
        id: data.id,
        code: data.code,
        percent: data.discount_percent,
        is_public: data.is_public,
      },
    })
  } catch (err: any) {
    console.error('discount-codes validate exception:', err)
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 })
  }
}
