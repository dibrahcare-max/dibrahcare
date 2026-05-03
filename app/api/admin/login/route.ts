import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyPassword, createAdminSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'اسم المستخدم وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const cleanUsername = String(username).toLowerCase().trim()

    const { data: user, error } = await supabase
      .from('admin_users')
      .select('id, username, name, password_hash, active')
      .eq('username', cleanUsername)
      .maybeSingle()

    if (error) {
      console.error('admin login query error:', error.message)
      return NextResponse.json({ success: false, error: 'خطأ في النظام' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (!user.active) {
      return NextResponse.json({ success: false, error: 'هذا الحساب معطّل' }, { status: 403 })
    }

    if (!verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    // ✅ نجح - حدّث آخر دخول
    await supabase.from('admin_users').update({ last_login: new Date().toISOString() }).eq('id', user.id)

    const token = createAdminSessionToken({
      id: user.id,
      username: user.username,
      name: user.name,
    })

    const cookieStore = await cookies()
    cookieStore.set('dibrah_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3 * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, name: user.name },
    })
  } catch (e: any) {
    console.error('admin login error:', e?.message)
    return NextResponse.json({ success: false, error: e?.message || 'خطأ' }, { status: 500 })
  }
}
