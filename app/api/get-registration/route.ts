import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({ success: false, message: 'Missing env vars' }, { status: 500 })
    }

    const supabase = createClient(url, key)
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: 'رقم الجوال مطلوب' }, { status: 400 })
    }

    // طبّع إلى صيغة دولية (9665XXXXXXXX) — متوافقة مع customers و session
    const clean = phone.replace(/\D/g, '')
    let normalized = clean
    if (clean.startsWith('05') && clean.length === 10) normalized = '966' + clean.slice(1)
    else if (clean.startsWith('5') && clean.length === 9) normalized = '966' + clean

    const { data } = await supabase
      .from('registrations')
      .select('*')
      .eq('subscriber_phone', normalized)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!data) {
      return NextResponse.json({ success: true, data: null })
    }

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    console.error('get-registration error:', e)
    return NextResponse.json({ success: false, message: e.message }, { status: 500 })
  }
}
