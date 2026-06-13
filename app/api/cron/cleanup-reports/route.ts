import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'support-reports'

/**
 * يُشغّل عبر cron خارجي (cron-job.org) يومياً
 * يحذف تقارير الصرف الأقدم من ٣ أشهر من التخزين، ويمسح روابطها
 */
export async function GET(req: NextRequest) {
  // مصادقة Bearer
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // التقارير الأقدم من ٣ أشهر
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

    const { data: expired, error } = await supabase
      .from('supports')
      .select('id, report_url, report_uploaded_at')
      .not('report_url', 'is', null)
      .not('report_uploaded_at', 'is', null)
      .lte('report_uploaded_at', threeMonthsAgo.toISOString())

    if (error) throw error
    if (!expired || expired.length === 0) {
      return NextResponse.json({ success: true, deleted: 0 })
    }

    let deleted = 0
    const errors: string[] = []

    for (const s of expired) {
      try {
        // حذف ملفات الداعم من التخزين
        const { data: files } = await supabase.storage.from(BUCKET).list(s.id)
        if (files && files.length > 0) {
          const paths = files.map(f => `${s.id}/${f.name}`)
          await supabase.storage.from(BUCKET).remove(paths)
        }

        // مسح الروابط من قاعدة البيانات (مع علامة انتهاء)
        await supabase
          .from('supports')
          .update({
            report_url: null,
            report_files: [],
            report_uploaded_at: null,
            report_expired: true,
          })
          .eq('id', s.id)

        deleted++
      } catch (e: any) {
        errors.push(`${s.id}: ${e?.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      deleted,
      errors: errors.slice(0, 5),
    })
  } catch (e: any) {
    console.error('[cleanup-reports] خطأ:', e?.message)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
