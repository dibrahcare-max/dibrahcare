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

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return null
  return verifyAdminSessionToken(token)
}

// DELETE: حذف أو إلغاء كود
//   - لو الكود غير مستخدم (use_count = 0) → حذف نهائي
//   - لو الكود مستخدم → علامة is_void = true (للحفاظ على سجل المحاسبة)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, message: 'غير مصرّح' }, { status: 401 })

  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف الكود مطلوب' }, { status: 400 })
    }

    // اقرأ الكود أولاً للتأكد من حالته
    const { data: codeRow, error: fetchErr } = await supabase
      .from('discount_codes')
      .select('id, code, use_count, is_public')
      .eq('id', id)
      .maybeSingle()

    if (fetchErr) {
      console.error('discount-codes delete fetch error:', fetchErr)
      return NextResponse.json({ success: false, message: 'تعذّر القراءة' }, { status: 500 })
    }

    if (!codeRow) {
      return NextResponse.json({ success: false, message: 'الكود غير موجود' }, { status: 404 })
    }

    // ─── لو مستخدم → علامة "ملغى" (soft delete) ───
    if (codeRow.use_count > 0) {
      const { error: updateErr } = await supabase
        .from('discount_codes')
        .update({ is_void: true })
        .eq('id', id)

      if (updateErr) {
        console.error('discount-codes void error:', updateErr)
        return NextResponse.json({ success: false, message: 'فشل الإلغاء: ' + updateErr.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        action: 'voided',
        message: `تم إلغاء الكود ${codeRow.code} (مستخدم سابقاً — احتُفظ به للسجل)`,
      })
    }

    // ─── غير مستخدم → حذف نهائي ───
    const { error: deleteErr } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id)

    if (deleteErr) {
      console.error('discount-codes delete error:', deleteErr)
      return NextResponse.json({ success: false, message: 'فشل الحذف: ' + deleteErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      action: 'deleted',
      message: `تم حذف الكود ${codeRow.code} نهائياً`,
    })
  } catch (err: any) {
    console.error('discount-codes delete exception:', err)
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 })
  }
}
