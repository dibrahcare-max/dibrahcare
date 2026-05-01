import { NextRequest, NextResponse } from 'next/server'
import { sendWhatsApp, TEMPLATES } from '@/lib/twilio'

export const runtime = 'nodejs'

// POST /api/twilio-whatsapp
// Body: { to: string, template?: string, params?: any[], message?: string }
//
// أنواع القوالب المدعومة:
//   - bookingConfirmation: [name, packageName, date, bookingId]
//   - reminder:            [name, serviceName, date]
//   - feedbackRequest:     [name, link]
//   - otp:                 [code]
//   - adminNewBooking:     [customerName, phone, service, packageName, amount, bookingId]
//   - adminNewRegistration:[name, phone, type]
//
// أو ترسل message مباشرة بدون قالب

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { to, template, params, message } = body

    if (!to) {
      return NextResponse.json({ success: false, error: 'رقم المستلم مطلوب' }, { status: 400 })
    }

    let messageText = message
    if (template && TEMPLATES[template as keyof typeof TEMPLATES]) {
      const fn = TEMPLATES[template as keyof typeof TEMPLATES] as (...args: any[]) => string
      messageText = fn(...(params || []))
    }

    if (!messageText) {
      return NextResponse.json({ success: false, error: 'نص الرسالة مطلوب' }, { status: 400 })
    }

    const result = await sendWhatsApp(to, messageText)

    if (!result.success) {
      console.error('❌ Twilio WhatsApp error:', result.error)
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, sid: result.sid })
  } catch (e: any) {
    console.error('❌ API error:', e?.message)
    return NextResponse.json({ success: false, error: e?.message }, { status: 500 })
  }
}
