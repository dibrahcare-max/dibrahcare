import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSessionToken } from '@/lib/admin-auth'
import { sendWhatsApp, TEMPLATES } from '@/lib/twilio'
import { getServiceTitle } from '@/lib/services'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// الأعمدة الفعلية الموجودة في جدول bookings
const DIRECT_COLUMNS = ['status', 'payment_status', 'service_details'] as const
// حقول تُخزّن داخل notes JSON
const NOTES_JSON_FIELDS = ['start_date', 'start_time', 'end_time', 'package_label'] as const

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // ═══ ١. التحقق من جلسة الأدمن ═══
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const body = await req.json()
    const updates: Record<string, any> = {}

    // ═══ ٢. جلب الحجز الحالي (للحالة السابقة + دمج JSON + بيانات العميل) ═══
    const { data: current } = await supabase
      .from('bookings')
      .select('*, customers(full_name, phone)')
      .eq('id', id)
      .single()

    const oldStatus = current?.status

    // ═══ ٣. الأعمدة المباشرة ═══
    for (const col of DIRECT_COLUMNS) {
      if (col in body) updates[col] = body[col]
    }
    if ('price' in body && body.price !== '' && body.price != null) {
      updates.amount = Number(body.price)
    }

    // ═══ ٤. الحقول المخزّنة في notes JSON (دمج) ═══
    const wantsNotesUpdate = NOTES_JSON_FIELDS.some(f => f in body) || 'package' in body
    const wantsBeneficiaryUpdate = 'beneficiary_name' in body || 'beneficiary_age' in body

    if (wantsNotesUpdate) {
      let notes: any = {}
      try {
        notes = typeof current?.notes === 'string' ? JSON.parse(current.notes) : (current?.notes || {})
      } catch { notes = {} }
      for (const f of NOTES_JSON_FIELDS) {
        if (f in body) notes[f] = body[f]
      }
      if ('package' in body) notes.package_label = body.package
      updates.notes = JSON.stringify(notes)
    }

    // دمج service_details (تعديل المستفيد الأول)
    if (wantsBeneficiaryUpdate && !('service_details' in updates)) {
      let sd: any = {}
      try {
        sd = typeof current?.service_details === 'string' ? JSON.parse(current.service_details) : (current?.service_details || {})
      } catch { sd = {} }
      if (sd?.type === 'multi' && Array.isArray(sd.beneficiaries) && sd.beneficiaries.length) {
        if ('beneficiary_name' in body) sd.beneficiaries[0].name = body.beneficiary_name
        if ('beneficiary_age' in body) sd.beneficiaries[0].age = body.beneficiary_age
        updates.service_details = sd
      } else if (sd?.type === 'child' && Array.isArray(sd.children) && sd.children.length) {
        if ('beneficiary_name' in body) sd.children[0].name = body.beneficiary_name
        if ('beneficiary_age' in body) sd.children[0].age = body.beneficiary_age
        updates.service_details = sd
      } else if (sd?.type === 'elderly' && sd.elderly) {
        if ('beneficiary_name' in body) sd.elderly.name = body.beneficiary_name
        if ('beneficiary_age' in body) sd.elderly.age = body.beneficiary_age
        updates.service_details = sd
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'لا توجد حقول للتحديث' }, { status: 400 })
    }

    // ═══ ٥. تنفيذ التحديث ═══
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[admin/bookings/update]', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // ═══ ٦. رسالة التأكيد عند الانتقال لـ "مؤكد" (مرة واحدة فقط) ═══
    // تُستثنى الحجوزات الطبية: لها مسار قانوني خاص (رسالة المحامي + تواصل المستشفى)
    const isMedicalBooking = current?.service_type === 'medical'
    if (body.status === 'confirmed' && oldStatus !== 'confirmed' && !isMedicalBooking) {
      const phone = current?.customers?.phone
      if (phone) {
        // استخراج بيانات الموعد من notes
        let meta: any = {}
        try {
          meta = typeof current?.notes === 'string' ? JSON.parse(current.notes) : (current?.notes || {})
        } catch { meta = {} }
        // لو الأدمن عدّل notes في نفس الطلب، استخدم القيم الجديدة
        if (updates.notes) {
          try { meta = JSON.parse(updates.notes) } catch {}
        }
        const firstName = (current?.customers?.full_name || '').trim().split(/\s+/)[0] || 'عميلنا الكريم'
        const shortId = `DBR-${id.split('-')[0].toUpperCase()}`
        const serviceName = getServiceTitle(meta.service_key, current?.service_type)

        try {
          const r = await sendWhatsApp(
            phone,
            TEMPLATES.bookingConfirmation(
              firstName,
              serviceName,
              meta.package_label || '—',
              meta.start_date || '—',
              meta.start_time || '',
              shortId
            )
          )
          if (r.success) console.log('✅ [confirm] رسالة تأكيد أُرسلت للحجز', id)
          else console.warn('⚠️ [confirm] فشل إرسال التأكيد:', r.error)
        } catch (e: any) {
          console.error('[confirm] استثناء:', e?.message)
        }
      }
    }

    return NextResponse.json({ success: true, booking: data })
  } catch (e: any) {
    console.error('[admin/bookings/update] خطأ:', e?.message)
    return NextResponse.json({ error: e?.message || 'خطأ' }, { status: 500 })
  }
}
