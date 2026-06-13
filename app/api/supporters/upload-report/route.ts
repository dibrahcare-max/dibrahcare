import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminSessionToken } from '@/lib/admin-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'support-reports'
const MAX_SIZE = 10 * 1024 * 1024 // 10 ميجا
const MAX_FILES = 3

export async function POST(req: NextRequest) {
  // ═══ التحقق من جلسة الأدمن ═══
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const supportId = String(formData.get('supportId') || '').trim()

    // ═══ التحقق من الملف ═══
    if (!file) return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 })
    if (!supportId) return NextResponse.json({ error: 'معرّف الداعم مفقود' }, { status: 400 })
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'يُسمح بملفات PDF فقط' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز ١٠ ميجابايت' }, { status: 400 })
    }

    // ═══ التحقق من الحد الأقصى (٣ ملفات) ═══
    const { data: existing } = await supabase.storage.from(BUCKET).list(supportId)
    const currentCount = (existing || []).length
    if (currentCount >= MAX_FILES) {
      return NextResponse.json(
        { error: `الحد الأقصى ${MAX_FILES} ملفات لكل داعم. احذف ملفاً قبل إضافة جديد.` },
        { status: 400 }
      )
    }

    // ═══ رفع الملف (نضيف، لا نحذف القديم) ═══
    const arrayBuffer = await file.arrayBuffer()
    const path = `${supportId}/report-${Date.now()}.pdf`

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: 'application/pdf', upsert: false })

    if (upErr) {
      console.error('[upload-report] فشل الرفع:', upErr)
      return NextResponse.json({ error: 'تعذّر رفع الملف: ' + upErr.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({
      success: true,
      file: {
        url: urlData.publicUrl,
        path,
        name: file.name,
        uploaded_at: new Date().toISOString(),
      },
    })
  } catch (e: any) {
    console.error('[upload-report] خطأ:', e?.message)
    return NextResponse.json({ error: e?.message || 'خطأ غير متوقع' }, { status: 500 })
  }
}
