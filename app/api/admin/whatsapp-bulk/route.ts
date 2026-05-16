import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// تنسيق الجوال: 0555403632 → 966555403632
function formatPhone(phone: string): string {
  let p = phone.trim().replace(/\s|-|\+/g, '')
  if (p.startsWith('00')) p = p.slice(2)
  if (p.startsWith('0')) p = '966' + p.slice(1)
  if (p.startsWith('5') && p.length === 9) p = '966' + p
  return p
}

// إرسال رسالة واحدة عبر UltraMsg
async function sendOne(instanceId: string, token: string, phone: string, body: string) {
  const url = `https://api.ultramsg.com/${instanceId}/messages/chat`
  const params = new URLSearchParams({
    token,
    to: phone,
    body,
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const text = await res.text()
    let data: any = {}
    try { data = JSON.parse(text) } catch { data = { raw: text } }

    // UltraMsg يرجع { sent: "true", message: "ok" } عند النجاح
    const success = data?.sent === 'true' || data?.sent === true || data?.message === 'ok'

    return {
      success,
      status: res.status,
      raw: data,
    }
  } catch (e: any) {
    return {
      success: false,
      status: 0,
      raw: { error: e?.message || 'Network error' },
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    // ════ التحقق من جلسة الأدمن ════
    const sessionToken = req.cookies.get('admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'غير مصرّح' }, { status: 401 })
    }

    const { data: session } = await supabaseAdmin
      .from('admin_sessions')
      .select('user_id')
      .eq('token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (!session) {
      return NextResponse.json({ success: false, message: 'الجلسة منتهية' }, { status: 401 })
    }

    // ════ التحقق من البيانات ════
    const body = await req.json()
    const recipients: { id?: string, phone: string, name?: string }[] = body.recipients || []
    const message: string = (body.message || '').trim()

    if (!recipients.length) {
      return NextResponse.json({ success: false, message: 'لم يتم اختيار أي مستلم' }, { status: 400 })
    }
    if (recipients.length > 100) {
      return NextResponse.json({ success: false, message: 'الحد الأقصى 100 مستلم في المرة' }, { status: 400 })
    }
    if (!message || message.length < 2) {
      return NextResponse.json({ success: false, message: 'الرسالة قصيرة جداً' }, { status: 400 })
    }
    if (message.length > 4000) {
      return NextResponse.json({ success: false, message: 'الرسالة طويلة جداً (الحد 4000 حرف)' }, { status: 400 })
    }

    // ════ التحقق من بيانات UltraMsg ════
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID
    const token = process.env.ULTRAMSG_TOKEN

    if (!instanceId || !token) {
      console.error('❌ [whatsapp-bulk] Missing UltraMsg env variables')
      return NextResponse.json({
        success: false,
        message: 'إعدادات الواتساب غير مكتملة في النظام'
      }, { status: 500 })
    }

    console.log(`🔵 [whatsapp-bulk] Sending to ${recipients.length} recipients`)

    // ════ إرسال متسلسل (بفاصل زمني صغير) ════
    const results: any[] = []
    const successfulIds: string[] = []

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i]
      const phone = formatPhone(r.phone)

      // تخصيص الرسالة (استبدال {name} باسم العميل)
      const personalizedMsg = r.name 
        ? message.replace(/\{name\}/g, r.name).replace(/\{الاسم\}/g, r.name)
        : message

      const result = await sendOne(instanceId, token, phone, personalizedMsg)

      results.push({
        id: r.id,
        phone: r.phone,
        formattedPhone: phone,
        name: r.name,
        ...result,
      })

      if (result.success && r.id) {
        successfulIds.push(r.id)
      }

      console.log(`${result.success ? '✅' : '❌'} [whatsapp-bulk] ${phone}: ${result.success ? 'sent' : JSON.stringify(result.raw).slice(0, 100)}`)

      // فاصل 1 ثانية بين الرسائل (تجنب rate limiting)
      if (i < recipients.length - 1) {
        await new Promise(r => setTimeout(r, 1000))
      }
    }

    // ════ تحديث last_messaged_at للناجحين ════
    if (successfulIds.length > 0) {
      try {
        await supabaseAdmin
          .from('customers')
          .update({ last_messaged_at: new Date().toISOString() })
          .in('id', successfulIds)
        console.log(`✅ [whatsapp-bulk] Updated last_messaged_at for ${successfulIds.length} customers`)
      } catch (e: any) {
        console.error('⚠️  [whatsapp-bulk] Failed to update last_messaged_at:', e?.message)
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.length - successCount

    return NextResponse.json({
      success: true,
      total: results.length,
      successCount,
      failCount,
      results,
    })
  } catch (e: any) {
    console.error('❌ [whatsapp-bulk] Exception:', e?.message)
    return NextResponse.json({
      success: false,
      message: e?.message || 'خطأ في النظام'
    }, { status: 500 })
  }
}
