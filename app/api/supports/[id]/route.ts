import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp, TEMPLATES } from '@/lib/twilio'
import { verifyAdminSessionToken } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// جلب دعم واحد
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('supports')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'الدعم غير موجود' }, { status: 404 })
    }

    return NextResponse.json({ support: data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

// تنسيق التاريخ للعربي
function formatDateAr(dateStr: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    return d.toLocaleDateString('ar-SA', {
      year: 'numeric', month: 'long', day: 'numeric',
      calendar: 'gregory',
    })
  } catch { return dateStr }
}

// تحديث الدعم: stage = 'schedule' أو 'disburse'
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { stage } = body  // 'schedule' أو 'disburse'

    // جلب الدعم الحالي
    const { data: support, error: fetchErr } = await supabase
      .from('supports')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchErr || !support) {
      return NextResponse.json({ error: 'الدعم غير موجود' }, { status: 404 })
    }

    let updateData: any = {}
    let whatsappBody: string | null = null

    if (stage === 'schedule') {
      const { distribution_place, distribution_date, distribution_time } = body
      if (!distribution_place || !distribution_date) {
        return NextResponse.json({ error: 'مكان وتاريخ التوزيع مطلوبان' }, { status: 400 })
      }
      updateData = {
        distribution_place,
        distribution_date,
        distribution_time: distribution_time || null,
        scheduled_at: new Date().toISOString(),
        status: 'scheduled',
      }
      const firstName = (support.donor_name || '').trim().split(/\s+/)[0]
      whatsappBody = TEMPLATES.supportScheduled(
        firstName,
        distribution_place,
        formatDateAr(distribution_date),
        distribution_time || ''
      )
    } else if (stage === 'disburse') {
      const { report_url, report_files, silent } = body
      const files = Array.isArray(report_files) ? report_files : []
      // الإشعار يُرسل فقط في الحفظ غير الصامت (أول ملف)؛ الصامت قد يكون حذف/إضافة لاحقة
      if (!silent && !report_url && files.length === 0) {
        return NextResponse.json({ error: 'يجب رفع ملف تقرير واحد على الأقل' }, { status: 400 })
      }
      updateData = {
        report_url: report_url || files[0]?.url || null, // الأول للتوافق القديم
        report_files: files,
        report_uploaded_at: new Date().toISOString(),
        report_expired: false,
        disbursed_at: support.disbursed_at || new Date().toISOString(), // لا نغيّره لو موجود
        status: 'disbursed',
      }
      // إرسال إشعار الداعم فقط عند أول توزيع (غير صامت) ولم يكن موزّعاً من قبل
      if (!silent && support.status !== 'disbursed') {
        const firstName = (support.donor_name || '').trim().split(/\s+/)[0]
        whatsappBody = TEMPLATES.supportDisbursed(
          firstName,
          support.distribution_place || '',
          formatDateAr(support.distribution_date) || '',
          support.distribution_time || ''
        )
      }
    } else if (stage === 'cancel') {
      updateData = { status: 'cancelled' }
    } else {
      // تعديل عام (تعديل بيانات بدون تغيير مرحلة)
      const { donor_name, donor_phone, amount, received_by, support_type, notes } = body
      if (donor_name) updateData.donor_name = donor_name
      if (donor_phone) updateData.donor_phone = donor_phone
      if (amount !== undefined) updateData.amount = Number(amount)
      if (received_by) updateData.received_by = received_by
      if (support_type) updateData.support_type = support_type
      if (notes !== undefined) updateData.notes = notes
    }

    // تنفيذ التحديث
    const { data: updated, error: updateErr } = await supabase
      .from('supports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateErr) {
      console.error('[supports/update]', updateErr)
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    // إرسال واتساب لو فيه رسالة — نستخدم await لضمان اكتمال الإرسال
    // قبل انتهاء الدالة (في بيئة serverless، الرد المبكر قد يقطع طلباً غير مُنتظَر)
    if (whatsappBody && support.donor_phone) {
      try {
        await sendWhatsApp(support.donor_phone, whatsappBody)
      } catch (e) {
        console.error('[supports/update] WA:', e)
      }
    }

    return NextResponse.json({ success: true, support: updated })
  } catch (e: any) {
    console.error('[supports/update] خطأ:', e?.message)
    return NextResponse.json({ error: e?.message || 'خطأ غير معروف' }, { status: 500 })
  }
}

// حذف دعم (محمي + ينظّف ملفات التخزين)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  // ═══ تحقق من جلسة الأدمن (عملية خطيرة) ═══
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    // ١) حذف ملفات التقارير من التخزين (تنظيف — لا تترك ملفات يتيمة)
    try {
      const { data: files } = await supabase.storage.from('support-reports').list(params.id)
      if (files && files.length > 0) {
        const paths = files.map(f => `${params.id}/${f.name}`)
        await supabase.storage.from('support-reports').remove(paths)
      }
    } catch (e) {
      console.error('[supports/delete] تنظيف الملفات:', e)
      // نكمل الحذف حتى لو فشل تنظيف الملفات
    }

    // ٢) حذف سجل الداعم
    const { error } = await supabase.from('supports').delete().eq('id', params.id)
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
