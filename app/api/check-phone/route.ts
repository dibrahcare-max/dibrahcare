import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({
        success: false,
        message: 'متغيرات Supabase غير مضبوطة'
      }, { status: 500 })
    }

    const supabase = createClient(url, key)
    const { phone } = await req.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: 'رقم الجوال مطلوب' }, { status: 400 })
    }

    // نظّف رقم الجوال
    const cleanPhone = phone.replace(/\s|-/g, '')

    const { data } = await supabase
      .from('registrations')
      .select('id, subscriber_name, type')
      .eq('subscriber_phone', cleanPhone)
      .limit(1)
      .maybeSingle()

    if (data) {
      return NextResponse.json({
        success: true,
        registered: true,
        name: data.subscriber_name,
        type: data.type,
      })
    }

    return NextResponse.json({ success: true, registered: false })
  } catch (e: any) {
    console.error('check-phone error:', e)
    return NextResponse.json({ success: false, message: e.message }, { status: 500 })
  }
}
