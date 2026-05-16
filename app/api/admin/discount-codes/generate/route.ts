import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { verifyAdminSessionToken } from '@/lib/admin-auth'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function requireAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('dibrah_admin_session')?.value
  if (!token) return null
  return verifyAdminSessionToken(token)
}

// ─── أحرف آمنة (بدون I, O, 0, 1 — تجنباً للالتباس البصري) ───
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 32 حرفاً

function generateCode(): string {
  const bytes = crypto.randomBytes(6)
  let s = ''
  for (let i = 0; i < 6; i++) {
    s += SAFE_CHARS[bytes[i] % SAFE_CHARS.length]
  }
  return `DIB-${s}`
}

// POST: توليد دفعة جديدة من الأكواد
export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ success: false, message: 'غير مصرّح' }, { status: 401 })

  try {
    const body = await req.json()
    const percentage = parseInt(body.percentage, 10)
    const count = parseInt(body.count, 10)
    const validityMonths = parseInt(body.validityMonths, 10)
    const batchLabel = String(body.batchLabel || '').trim() || null
    const isPublic = !!body.isPublic
    const customCode = String(body.customCode || '').trim().toUpperCase()

    // تحقق
    if (![10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 90, 95, 99, 100].includes(percentage)) {
      return NextResponse.json({ success: false, message: 'نسبة الخصم غير صالحة' }, { status: 400 })
    }
    if (validityMonths < 1 || validityMonths > 24) {
      return NextResponse.json({ success: false, message: 'المدة يجب أن تكون بين 1 و 24 شهراً' }, { status: 400 })
    }

    // ─── تحقق من الكود المخصّص (لو وُجد) ───
    if (customCode) {
      if (!/^[A-Z0-9\-]{4,20}$/.test(customCode)) {
        return NextResponse.json({
          success: false,
          message: 'الكود المخصّص: حروف إنجليزية وأرقام وشرطة فقط، من 4 إلى 20 حرفاً',
        }, { status: 400 })
      }
    } else {
      // التحقق من العدد فقط في حالة التوليد العشوائي
      if (count < 1 || count > 500) {
        return NextResponse.json({ success: false, message: 'العدد يجب أن يكون بين 1 و 500' }, { status: 400 })
      }
    }

    // ─── حضّر قائمة الأكواد ───
    let codesToInsert: string[]
    if (customCode) {
      // كود واحد مخصّص
      codesToInsert = [customCode]
    } else {
      // توليد عشوائي (مع منع التكرار في نفس الدفعة)
      const codeSet = new Set<string>()
      while (codeSet.size < count) {
        codeSet.add(generateCode())
      }
      codesToInsert = Array.from(codeSet)
    }

    const validUntil = new Date()
    validUntil.setMonth(validUntil.getMonth() + validityMonths)

    const rows = codesToInsert.map(code => ({
      code,
      discount_percent: percentage,
      valid_until: validUntil.toISOString(),
      batch_label: batchLabel,
      is_public: isPublic,
    }))

    const { data, error } = await supabase
      .from('discount_codes')
      .insert(rows)
      .select('code, discount_percent, valid_until, batch_label, is_public')

    if (error) {
      console.error('discount-codes generate error:', error)
      // كود مكرّر (UNIQUE constraint violation)
      if (error.code === '23505') {
        return NextResponse.json({
          success: false,
          message: customCode
            ? `الكود "${customCode}" موجود بالفعل — اختر اسماً آخر`
            : 'فشل التوليد بسبب تكرار غير متوقع — جرّب مرة أخرى',
        }, { status: 400 })
      }
      return NextResponse.json({ success: false, message: 'فشل التوليد: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      inserted: data?.length || 0,
      codes: data || [],
    })
  } catch (err: any) {
    console.error('discount-codes generate exception:', err)
    return NextResponse.json({ success: false, message: err.message || 'خطأ غير متوقع' }, { status: 500 })
  }
}
