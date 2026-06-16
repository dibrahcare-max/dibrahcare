import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

function verifyToken(token: string): { phone: string; customerId?: string } | null {
  try {
    const secret = process.env.SESSION_SECRET || 'dibrah-secret-key'
    const [payloadB64, sig] = token.split('.')
    if (!payloadB64 || !sig) return null
    const expected = crypto.createHmac('sha256', secret).update(payloadB64).digest('hex')
    if (expected !== sig) return null
    const data = JSON.parse(Buffer.from(payloadB64, 'base64').toString())
    if (data.exp && Date.now() > data.exp) return null
    return { phone: data.phone, customerId: data.customerId }
  } catch { return null }
}

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('dibrah_session')?.value
    if (!token) return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 })

    const session = verifyToken(token)
    if (!session?.customerId && !session?.phone) return NextResponse.json({ success: false, message: 'جلسة غير صالحة' }, { status: 401 })

    // جيب customer id من الجلسة أو بالجوال
    let customerId = session.customerId
    if (!customerId && session.phone) {
      const localPhone = session.phone.replace(/^966/, '0')
      const { data: c } = await supabase.from('customers').select('id').eq('phone', localPhone).maybeSingle()
      customerId = c?.id
    }
    if (!customerId) return NextResponse.json({ success: false, message: 'العميل غير موجود' }, { status: 404 })

    const body = await req.json()
    const {
      full_name, email, emergency_phone, short_address,
      nationality, district, street, city, vat_number,
    } = body

    if (!full_name?.trim()) {
      return NextResponse.json({ success: false, message: 'الاسم مطلوب' }, { status: 400 })
    }

    const { error } = await supabase
      .from('customers')
      .update({
        full_name: full_name.trim(),
        email: email || null,
        emergency_phone: emergency_phone || null,
        short_address: short_address || null,
        nationality: nationality || null,
        district: district || null,
        street: street || null,
        city: city || null,
        vat_number: vat_number || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)

    if (error) {
      console.error('[profile/update]', error)
      if (error.code === '23514') {
        return NextResponse.json({ success: false, message: 'تحقق من صحة البيانات المدخلة' }, { status: 400 })
      }
      return NextResponse.json({ success: false, message: 'فشل الحفظ' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[profile/update]', e?.message)
    return NextResponse.json({ success: false, message: e?.message || 'خطأ' }, { status: 500 })
  }
}
