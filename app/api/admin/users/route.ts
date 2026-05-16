import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdminSessionToken, hashPassword } from '@/lib/admin-auth'

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

// GET: قائمة الموظفين
export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, name, active, last_login, created_at')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, users: data || [] })
}

// POST: إنشاء موظف جديد
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  try {
    const { username, password, name } = await req.json()

    if (!username || !password || !name) {
      return NextResponse.json({ success: false, error: 'الاسم واسم المستخدم وكلمة المرور مطلوبة' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'كلمة المرور لازم 8 أحرف على الأقل' }, { status: 400 })
    }
    if (!/^[a-z0-9_]{3,20}$/i.test(username)) {
      return NextResponse.json({ success: false, error: 'اسم المستخدم: 3-20 حرف إنجليزي/أرقام/_ فقط' }, { status: 400 })
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
      .select('id, username, name, active, created_at')
      .single()

    if (error) {
      if (error.message.includes('duplicate')) {
        return NextResponse.json({ success: false, error: 'اسم المستخدم محجوز' }, { status: 409 })
      }
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, user: data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
