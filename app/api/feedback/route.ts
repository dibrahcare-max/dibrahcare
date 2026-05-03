import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const insert = {
      booking_id:             body.booking_id || null,
      customer_name:          body.customer_name || null,
      customer_phone:         body.customer_phone || null,
      rating_overall:         body.rating_overall || null,
      rating_caregiver:       body.rating_caregiver || null,
      rating_punctuality:     body.rating_punctuality || null,
      rating_professionalism: body.rating_professionalism || null,
      rating_cleanliness:     body.rating_cleanliness || null,
      rating_communication:   body.rating_communication || null,
      would_recommend:        body.would_recommend || null,
      would_rebook:           body.would_rebook || null,
      positive_feedback:      body.positive_feedback || null,
      improvement_feedback:   body.improvement_feedback || null,
      additional_comments:    body.additional_comments || null,
    }

    const { error } = await supabase.from('feedback').insert(insert)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message }, { status: 500 })
  }
}
