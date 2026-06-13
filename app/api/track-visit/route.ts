import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { page } = await req.json()
    if (!page) {
      return NextResponse.json({ success: false }, { status: 400 })
    }

    // hash للـ IP + User-Agent لتمييز الزوار بدون تخزين بيانات شخصية
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const ua = req.headers.get('user-agent') || 'unknown'
    const visitorHash = crypto.createHash('sha256').update(ip + ua).digest('hex').slice(0, 16)

    await supabase.from('page_visits').insert({
      page: String(page).slice(0, 40),
      visitor_hash: visitorHash,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
