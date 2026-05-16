import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsApp } from '@/lib/twilio'

export const runtime = 'nodejs'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * يشتغل عبر cron خارجي (مثلاً cron-job.org) كل ٥ دقايق
 * يفحص جدول scheduled_messages ويرسل أي رسالة حان وقتها
 * يتخطّى رسائل الحجوزات الملغية
 */
export async function GET(req: NextRequest) {
  // مصادقة بسيطة عبر Bearer token
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // ١. جلب الرسائل المستحقة (لم ترسل بعد، وحان وقتها)
    const { data: dueMessages, error: fetchErr } = await supabase
      .from('scheduled_messages')
      .select('id, booking_id, phone, body, template, scheduled_for')
      .lte('scheduled_for', new Date().toISOString())
      .is('sent_at', null)
      .order('scheduled_for', { ascending: true })
      .limit(50)

    if (fetchErr) throw fetchErr

    if (!dueMessages || dueMessages.length === 0) {
      return NextResponse.json({ success: true, processed: 0 })
    }

    // ٢. جلب حالات الحجوزات المرتبطة لمعرفة الملغية
    const bookingIds = dueMessages
      .map(m => m.booking_id)
      .filter((id): id is string => !!id)

    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, status')
      .in('id', bookingIds)

    const cancelledIds = new Set(
      (bookings || []).filter(b => b.status === 'cancelled').map(b => b.id)
    )

    let sent = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    // ٣. معالجة كل رسالة
    for (const msg of dueMessages) {
      // تخطّي الحجوزات الملغية
      if (msg.booking_id && cancelledIds.has(msg.booking_id)) {
        await supabase
          .from('scheduled_messages')
          .update({
            sent_at: new Date().toISOString(),
            error: 'تم تخطّي الرسالة: الحجز ملغي',
          })
          .eq('id', msg.id)
        skipped++
        continue
      }

      // محاولة الإرسال
      const result = await sendWhatsApp(msg.phone, msg.body)

      if (result.success) {
        await supabase
          .from('scheduled_messages')
          .update({ sent_at: new Date().toISOString(), error: null })
          .eq('id', msg.id)
        sent++
        console.log(`✅ [scheduler] أُرسلت ${msg.template} للحجز ${msg.booking_id}`)
      } else {
        // ما نعلّم sent_at — يعيد المحاولة في الدورة التالية
        await supabase
          .from('scheduled_messages')
          .update({ error: result.error || 'فشل الإرسال' })
          .eq('id', msg.id)
        failed++
        errors.push(`${msg.phone}: ${result.error}`)
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueMessages.length,
      sent,
      skipped,
      failed,
      errors: errors.slice(0, 5),
    })
  } catch (e: any) {
    console.error('[scheduler] خطأ:', e?.message)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
