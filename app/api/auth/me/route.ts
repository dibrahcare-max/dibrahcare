import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

// تحويل لصيغة محلية للبحث في customers
function toLocal(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('966')) return '0' + clean.slice(3)
  if (clean.startsWith('05'))  return clean
  if (clean.startsWith('5'))   return '0' + clean
  return clean
}

export async function GET() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_session')?.value

  if (!token) {
    return NextResponse.json({ authenticated: false })
  }

  const session = verifyToken(token)
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }

  // اجلب بيانات العميل (إن وجد) — السكيما الجديدة
  const localPhone = toLocal(session.phone)
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, full_name, phone, national_id, email, nationality, district, street, emergency_phone, short_address')
    .eq('phone', localPhone)
    .maybeSingle()

  if (error) {
    console.error('me customer fetch error:', error.message)
  }

  // الحالة: complete إذا موجود، new إذا غير موجود
  const status: 'new' | 'complete' = customer ? 'complete' : 'new'

  return NextResponse.json({
    authenticated: true,
    phone: session.phone,
    customer: customer || null,
    isRegistered: !!customer,
    status,
  })
}
