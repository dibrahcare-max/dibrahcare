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

// PATCH: تحديث موظف
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const updates: any = {}

    if (body.name !== undefined) updates.name = String(body.name).trim()

    if (body.username !== undefined) {
      const u = String(body.username).toLowerCase().trim()
      if (!/^[a-z0-9_]{3,20}$/.test(u)) {
        return NextResponse.json({ success: false, error: 'اسم المستخدم: 3-20 حرف إنجليزي/أرقام/_ فقط' }, { status: 400 })
      }
      updates.username = u
    }

    if (body.active !== undefined) updates.active = !!body.active

    if (body.password !== undefined) {
      if (String(body.password).length < 8) {
        return NextResponse.json({ success: false, error: 'كلمة المرور لازم 8 أحرف على الأقل' }, { status: 400 })
      }
      updates.password_hash = hashPassword(body.password)
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ success: false, error: 'لا توجد بيانات للتحديث' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('admin_users')
      .update(updates)
      .eq('id', id)
      .select('id, username, name, active, last_login, created_at')
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

// DELETE: حذف موظف
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false }, { status: 401 })

  try {
    const { id } = await params

    if (id === session.id) {
      return NextResponse.json({ success: false, error: 'ما تقدر تحذف حسابك' }, { status: 400 })
    }

    const { count } = await supabase
      .from('admin_users')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)

    if ((count || 0) <= 1) {
      return NextResponse.json({ success: false, error: 'لا يمكن حذف آخر حساب نشط' }, { status: 400 })
    }

    const { error } = await supabase.from('admin_users').delete().eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
