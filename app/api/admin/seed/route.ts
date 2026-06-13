import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashPassword } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { masterPassword, username, password, name } = await req.json()

    const expected = process.env.ADMIN_MASTER_PASSWORD
    if (!expected) {
      return NextResponse.json({
        success: false,
        error: 'ADMIN_MASTER_PASSWORD غير مضبوط في الـ environment variables'
      }, { status: 500 })
    }

    if (masterPassword !== expected) {
      return NextResponse.json({
        success: false,
        error: 'كلمة المرور الرئيسية غير صحيحة'
      }, { status: 401 })
    }

    if (!username || !password || !name) {
      return NextResponse.json({
        success: false,
        error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة'
      }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({
        success: false,
        error: 'كلمة المرور لازم 8 أحرف على الأقل'
      }, { status: 400 })
    }

    if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
      return NextResponse.json({
        success: false,
        error: 'اسم المستخدم: 3-20 حرف إنجليزي/أرقام/_ فقط'
      }, { status: 400 })
    }

    // الجدول لازم يكون فاضي
    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })

    if ((count || 0) > 0) {
      return NextResponse.json({
        success: false,
        error: 'يوجد حسابات أدمن. استخدم لوحة التحكم لإضافة حسابات.'
      }, { status: 403 })
    }

    const passwordHash = hashPassword(password)
    const { data, error } = await supabase
      .from('admin_users')
      .insert({
        username: username.toLowerCase().trim(),
        password_hash: passwordHash,
        name: name.trim(),
        active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء الحساب الأول. تقدر تسجل دخول من /admindibrah',
      user: { id: data.id, username: data.username, name: data.name },
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'خطأ' }, { status: 500 })
  }
}
