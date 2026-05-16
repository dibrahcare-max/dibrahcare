import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { normalizeSAPhone } from '@/lib/supports'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// دخول الداعم: التحقق من تطابق الجوال + رقم الدعم
export async function POST(req: NextRequest) {
  try {
    const { phone, support_number } = await req.json()

    if (!phone || !support_number) {
      return NextResponse.json({ error: 'أدخل الجوال ورقم الدعم' }, { status: 400 })
    }

    const normalizedPhone = normalizeSAPhone(phone)
    const supportNum = support_number.trim().toUpperCase()

    const { data, error } = await supabase
      .from('supports')
      .select('*')
      .eq('support_number', supportNum)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'لم يتم العثور على دعم بهذا الرقم' }, { status: 404 })
    }

    // التحقق من تطابق الجوال (تطبيع كلا الطرفين)
    const storedPhone = normalizeSAPhone(data.donor_phone)
    if (storedPhone !== normalizedPhone) {
      return NextResponse.json({ error: 'رقم الجوال غير مطابق لرقم الدعم' }, { status: 401 })
    }

    return NextResponse.json({ success: true, support: data })
  } catch (e: any) {
    console.error('[supports/login] خطأ:', e?.message)
    return NextResponse.json({ error: e?.message || 'خطأ غير معروف' }, { status: 500 })
  }
}
