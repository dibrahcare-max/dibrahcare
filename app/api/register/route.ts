import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export const runtime = 'nodejs'

// ─── التحقق من البيانات (server-side) ─────────────────
function validateForm(form: any): string | null {
  const fullName = (form.full_name || '').trim()
  const words = fullName.split(/\s+/).filter(Boolean)
  if (words.length !== 4) return 'الاسم لازم يكون رباعي (٤ كلمات)'

  if (!/^[12]\d{9}$/.test(form.national_id || '')) return 'رقم الهوية: ١٠ أرقام تبدأ بـ ١ أو ٢'
  if (!/^05\d{8}$/.test(form.phone || '')) return 'رقم الجوال: ١٠ أرقام تبدأ بـ ٠٥'

  const nat = (form.nationality || '').trim()
  if (nat.length < 3) return 'الجنسية: لا تقل عن ٣ أحرف'
  if (nat.split(/\s+/).filter(Boolean).length > 1) return 'الجنسية: كلمة واحدة فقط'

  if (!/^05\d{8}$/.test(form.emergency_phone || '')) return 'رقم الطوارئ: ١٠ أرقام تبدأ بـ ٠٥'
  if (!/^[A-Z]{4}\d{4}$/.test(form.short_address || '')) return 'العنوان الوطني المختصر: ٤ حروف + ٤ أرقام (مثل RYAR4321)'

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(form.email || '')) return 'صيغة الإيميل غير صحيحة'

  return null
}

// ─── إنشاء session token جديد بعد التسجيل ─────────────
function createSessionToken(payload: { phone: string; customerId?: string }): string {
  const secret = process.env.SESSION_SECRET || 'dibrah-default-secret-change-me'
  const data = JSON.stringify({ ...payload, exp: Date.now() + 3 * 24 * 60 * 60 * 1000 })
  const encoded = Buffer.from(data).toString('base64url')
  const signature = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
  return `${encoded}.${signature}`
}

// ─── تحويل الجوال لصيغة دولية للـ session ─────────────
function toIntlPhone(p: string): string {
  if (p.startsWith('05')) return '966' + p.slice(1)
  return p
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      return NextResponse.json({
        success: false,
        message: 'متغيرات Supabase غير مضبوطة',
      }, { status: 500 })
    }

    const supabase = createClient(url, key)
    const form = await req.json()

    // تحقق
    const validationError = validateForm(form)
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 })
    }

    // إدراج العميل
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        full_name: form.full_name.trim(),
        national_id: form.national_id,
        phone: form.phone,
        nationality: form.nationality.trim(),
        district: form.district?.trim() || null,
        street: form.street?.trim() || null,
        emergency_phone: form.emergency_phone,
        short_address: form.short_address,
        email: form.email.toLowerCase().trim(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('register insert error:', error)

      // قيود UNIQUE
      if (error.code === '23505') {
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('phone')) return NextResponse.json({ success: false, message: 'رقم الجوال مسجَّل مسبقاً' }, { status: 409 })
        if (msg.includes('national_id')) return NextResponse.json({ success: false, message: 'رقم الهوية مسجَّل مسبقاً' }, { status: 409 })
        if (msg.includes('email')) return NextResponse.json({ success: false, message: 'البريد الإلكتروني مسجَّل مسبقاً' }, { status: 409 })
        return NextResponse.json({ success: false, message: 'البيانات مسجَّلة مسبقاً' }, { status: 409 })
      }

      // قيود CHECK
      if (error.code === '23514') {
        return NextResponse.json({ success: false, message: 'بيانات غير صحيحة، تحقق من الصيغ' }, { status: 400 })
      }

      return NextResponse.json({ success: false, message: 'تعذّر الحفظ' }, { status: 500 })
    }

    // ═══ تحديث session token ليحتوي customerId الجديد ═══
    const intlPhone = toIntlPhone(form.phone)
    const token = createSessionToken({ phone: intlPhone, customerId: customer.id })
    const cookieStore = await cookies()
    cookieStore.set('dibrah_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3 * 24 * 60 * 60,
      path: '/',
    })

    // ═══ إيميل للأدمن (اختياري) ═══
    if (process.env.RESEND_API_KEY) {
      const adminEmail = process.env.ADMIN_EMAIL || 'info@dibrahcare.com'
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'دِبرة <noreply@dibrahcare.com>',
          to: adminEmail,
          subject: `🌿 عميل جديد سجّل في دِبرة — ${form.full_name}`,
          html: `
            <div dir="rtl" style="font-family:Arial;padding:24px;color:#5f6157">
              <h2 style="color:#5f6157">عميل جديد سجّل في دِبرة</h2>
              <p><strong>الاسم:</strong> ${form.full_name}</p>
              <p><strong>الجوال:</strong> ${form.phone}</p>
              <p><strong>الإيميل:</strong> ${form.email}</p>
              <p><strong>الجنسية:</strong> ${form.nationality}</p>
              <p><strong>العنوان الوطني:</strong> ${form.short_address}</p>
              <hr/>
              <p style="color:#888;font-size:.85rem">يمكنك مراجعة بياناته الكاملة من لوحة التحكم.</p>
            </div>
          `,
        }),
      }).catch(err => console.error('admin email failed:', err))
    }

    return NextResponse.json({
      success: true,
      customerId: customer.id,
    })
  } catch (e: any) {
    console.error('register error:', e?.message || e)
    return NextResponse.json({
      success: false,
      message: e?.message || 'خطأ في السيرفر',
    }, { status: 500 })
  }
}
