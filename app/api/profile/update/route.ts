import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { verifySessionToken } from '@/lib/auth'

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

    const session = verifySessionToken(token)
    if (!session?.customerId) return NextResponse.json({ success: false, message: 'جلسة غير صالحة' }, { status: 401 })

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
      .eq('id', session.customerId)

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
