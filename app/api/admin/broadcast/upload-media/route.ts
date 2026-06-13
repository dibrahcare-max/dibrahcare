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

const BUCKET = 'broadcast-media'
const MAX_SIZE = 16 * 1024 * 1024 // 16 ميجا (حد واتساب للوسائط)

// POST multipart: file — يرفع صورة/فيديو ويرجّع رابطاً عاماً
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  const session = verifyAdminSessionToken(token)
  if (!session) return NextResponse.json({ error: 'جلسة غير صالحة' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 })

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'يُسمح بصور أو فيديو فقط' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'حجم الملف يتجاوز ١٦ ميجابايت' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg')
    const path = `broadcast-${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

    if (upErr) {
      return NextResponse.json(
        { error: 'تعذّر الرفع: ' + upErr.message + ' (تأكد من إنشاء bucket عام باسم broadcast-media)' },
        { status: 500 }
      )
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      type: isVideo ? 'video' : 'image',
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'خطأ' }, { status: 500 })
  }
}
