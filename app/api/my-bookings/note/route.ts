import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export const runtime = 'nodejs'

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
  } catch { return null }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('dibrah_session')?.value
    if (!token) return NextResponse.json({ success: false }, { status: 401 })

    const session = verifyToken(token)
    if (!session) return NextResponse.json({ success: false }, { status: 401 })

    const { id, notes } = await req.json()
    if (!id) return NextResponse.json({ success: false, error: 'Missing id' }, { status: 400 })

    // تأكد إن العميل يحدّث حجزه الخاص
    const { data: customer } = await supabase
      .from('customers').select('id').eq('phone', session.phone).maybeSingle()
    if (!customer) return NextResponse.json({ success: false }, { status: 403 })

    const { error } = await supabase
      .from('bookings')
      .update({ notes: notes || '' })
      .eq('id', id)
      .eq('customer_id', customer.id) // حماية: فقط حجوزاته

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
