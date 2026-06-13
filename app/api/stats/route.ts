import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// استخدام SERVICE_ROLE_KEY للتجاوز على RLS (آمن لأن هذا API للأدمن فقط)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x.toISOString() }
function daysAgo(n: number) { const x = new Date(); x.setDate(x.getDate() - n); x.setHours(0,0,0,0); return x.toISOString() }

const PAGES_TO_TRACK = ['home', 'services', 'register']

async function countVisits(page: string, since?: string) {
  let q = supabase.from('page_visits').select('id', { count: 'exact' }).eq('page', page)
  if (since) q = q.gte('created_at', since)
  const { count, error } = await q
  if (error) console.error('countVisits error:', page, error.message)
  return count || 0
}

async function countUniqueVisits(page: string, since?: string) {
  let q = supabase.from('page_visits').select('visitor_hash').eq('page', page)
  if (since) q = q.gte('created_at', since)
  const { data, error } = await q
  if (error) console.error('countUniqueVisits error:', page, error.message)
  if (!data) return 0
  return new Set(data.map(r => r.visitor_hash)).size
}

export async function GET() {
  try {
    const today = startOfDay(new Date())
    const week  = daysAgo(7)
    const month = daysAgo(30)

    // ١. زيارات الصفحات الرئيسية
    const visits: Record<string, any> = {}
    for (const page of PAGES_TO_TRACK) {
      visits[page] = {
        today:  await countVisits(page, today),
        week:   await countVisits(page, week),
        month:  await countVisits(page, month),
        total:  await countVisits(page),
        unique_today: await countUniqueVisits(page, today),
        unique_total: await countUniqueVisits(page),
      }
    }

    // ٢. عدد المسجلين (صفحة التسجيل — عبّوا بيانات)
    const { count: registered } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })

    // ٣. عدد الذين طلبوا الخدمة (حجوزات فعلية)
    const { count: bookings } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })

    // ٤. مسجلين جدد اليوم
    const { count: registeredToday } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    const { count: bookingsToday } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    return NextResponse.json({
      success: true,
      visits,
      registered: registered || 0,
      registered_today: registeredToday || 0,
      bookings: bookings || 0,
      bookings_today: bookingsToday || 0,
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message }, { status: 500 })
  }
}
