import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sendWhatsApp, sendWhatsAppMedia } from '@/lib/twilio'
import { verifyAdminSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST { phone, name?, text, mediaUrl?, mediaType?, personalize? } — إرسال لمستلم واحد
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const { phone, name, text, mediaUrl, mediaType, personalize } = await req.json()
    if (!phone) return NextResponse.json({ success: false, error: 'رقم مفقود' }, { status: 400 })
    if (!text && !mediaUrl) {
      return NextResponse.json({ success: false, error: 'لا يوجد محتوى للإرسال' }, { status: 400 })
    }

    // إضافة اسم العميل في البداية (يقلّل كشف السبام)
    const firstName = (name || '').trim().split(/\s+/)[0]
    const finalText = (personalize && firstName)
      ? `مرحباً ${firstName} 💚\n\n${text || ''}`
      : (text || '')

    let result
    if (mediaUrl && (mediaType === 'image' || mediaType === 'video')) {
      result = await sendWhatsAppMedia(phone, mediaUrl, mediaType, finalText)
    } else {
      result = await sendWhatsApp(phone, finalText)
    }

    return NextResponse.json({ success: result.success, error: result.error || null })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'خطأ' }, { status: 500 })
  }
}
