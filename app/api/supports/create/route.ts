import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, TEMPLATES } from '@/lib/twilio'
import { generateSupportNumber } from '@/lib/supports'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ADMIN_PHONES = (process.env.ADMIN_PHONES || '')
  .split(',').map(p => p.trim()).filter(Boolean)

// إنشاء دعم جديد (المربع الأول)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { donor_name, donor_phone, amount, received_by, support_type, notes } = body

    if (!donor_name || !donor_phone || !amount || !received_by) {
      return NextResponse.json({ error: 'بيانات ناقصة' }, { status: 400 })
    }

    // توليد رقم دعم فريد (محاولة 5 مرات لتجنب التصادم)
    let support_number = ''
    for (let i = 0; i < 5; i++) {
      const candidate = generateSupportNumber()
      const { data: existing } = await supabase
        .from('supports')
        .select('id')
        .eq('support_number', candidate)
        .maybeSingle()
      if (!existing) { support_number = candidate; break }
    }
    if (!support_number) {
      return NextResponse.json({ error: 'فشل توليد رقم الدعم' }, { status: 500 })
    }

    // الإدراج
    const { data, error } = await supabase
      .from('supports')
      .insert({
        support_number,
        donor_name,
        donor_phone,
        amount: Number(amount),
        received_by,
        support_type: support_type || 'general',
        status: 'received',
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[supports/create]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // واتساب للداعم
    const firstName = donor_name.trim().split(/\s+/)[0]
    sendWhatsApp(donor_phone, TEMPLATES.supportReceived(firstName, Number(amount), support_number))
      .catch(e => console.error('[supports/create] WA donor:', e))

    // واتساب للأدمن
    const adminMsg = TEMPLATES.adminNewSupport(donor_name, donor_phone, Number(amount), support_number, received_by)
    ADMIN_PHONES.forEach(p => {
      sendWhatsApp(p, adminMsg).catch(e => console.error('[supports/create] WA admin:', e))
    })

    return NextResponse.json({ success: true, support: data })
  } catch (e: any) {
    console.error('[supports/create] خطأ:', e?.message)
    return NextResponse.json({ error: e?.message || 'خطأ غير معروف' }, { status: 500 })
  }
}
