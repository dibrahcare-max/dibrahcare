import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// فك توكن الجلسة للحصول على رقم الجوال
function verifyToken(token: string): { phone: string; customerId?: string } | null {
  try {
    const secret = process.env.SESSION_SECRET || 'dibrah-default-secret-change-me'
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null

    const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
    if (expected !== signature) return null

    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (data.exp < Date.now()) return null

    return { phone: data.phone, customerId: data.customerId }
  } catch {
    return null
  }
}

export async function GET() {
  try {
    // 1. تحقق من الجلسة
    const cookieStore = await cookies()
    const token = cookieStore.get('dibrah_session')?.value

    if (!token) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    const session = verifyToken(token)
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    // 2. جلب بيانات العميل
    const { data: customer } = await supabase
      .from('customers')
      .select('id, name, phone, address')
      .eq('phone', session.phone)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ success: true, customer: null, bookings: [] })
    }

    // 3. جلب الحجوزات
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('bookings fetch error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
      },
      bookings: bookings || [],
    })
  } catch (e: any) {
    console.error('my-bookings error:', e?.message)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
