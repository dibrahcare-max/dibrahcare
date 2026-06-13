import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// فك توكن الجلسة للحصول على رقم الجوال
function verifyToken(token: string): { phone: string; customerId?: string } | null {
  try {
    const secret = process.env.SESSION_SECRET || 'dibrah-default-secret-change-me'
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null

    const expected = crypto.createHmac('sha256', secret).update(encoded).digest('base64url')
    if (expected !== signature) return null

    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (data.exp < Date.now()) return null

    return { phone: data.phone, customerId: data.customerId }
  } catch {
    return null
  }
}

// تحويل الرقم من صيغة دولية (+9665…) إلى محلية (05…) — تطابق ما هو مخزن في customers
function toLocal(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('966')) return '0' + clean.slice(3)
  if (clean.startsWith('05'))  return clean
  if (clean.startsWith('5'))   return '0' + clean
  return clean
}

export async function GET() {
  try {
    // 1. تحقق من الجلسة
    const cookieStore = await cookies()
    const token = cookieStore.get('dibrah_session')?.value

    if (!token) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    const session = verifyToken(token)
    if (!session) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 })
    }

    // 2. جلب بيانات العميل (استخدم الصيغة المحلية للمطابقة مع customers.phone)
    const localPhone = toLocal(session.phone)
    const { data: customer } = await supabase
      .from('customers')
      .select('id, full_name, phone, short_address')
      .eq('phone', localPhone)
      .maybeSingle()

    if (!customer) {
      return NextResponse.json({ success: true, customer: null, bookings: [] })
    }

    // 3. جلب الحجوزات
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('bookings fetch error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // ─── تطبيع البيانات: استخراج القيم من notes JSON و service_details ───
    const normalized = (bookings || []).map((b: any) => {
      let meta: any = {}
      try {
        meta = (typeof b.notes === 'string' && b.notes.trim().startsWith('{'))
          ? JSON.parse(b.notes) : {}
      } catch { meta = {} }

      // اسم المستفيد من service_details
      let beneficiaryName = ''
      try {
        const sd = typeof b.service_details === 'string' ? JSON.parse(b.service_details) : b.service_details
        if (sd?.type === 'multi' && Array.isArray(sd.beneficiaries) && sd.beneficiaries.length) {
          beneficiaryName = sd.beneficiaries.map((x: any) => x.name).filter(Boolean).join('، ')
        } else if (sd?.type === 'child' && Array.isArray(sd.children) && sd.children.length) {
          beneficiaryName = sd.children.map((x: any) => x.name).filter(Boolean).join('، ')
        } else if (sd?.type === 'elderly' && sd.elderly) {
          beneficiaryName = sd.elderly.name || ''
        }
      } catch {}

      return {
        id: b.id,
        package: meta.package_label || (b.service_type === 'other' ? 'custom' : b.package_id || ''),
        start_date: meta.start_date || '',
        start_time: meta.start_time || '',
        end_time: meta.end_time || '',
        price: (typeof b.amount === 'number' ? b.amount : (meta.subtotal ?? null)),
        status: b.status,
        beneficiary_name: beneficiaryName,
        beneficiary_relation: '',
        notes: meta.user_note || '',   // الملاحظة الحرّة محفوظة داخل JSON
        created_at: b.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        name: customer.full_name,        // mapping للحفاظ على عقد الـ API مع الصفحة
        phone: customer.phone,
        address: customer.short_address, // short_address هو العمود الفعلي
      },
      bookings: normalized,
    }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (e: any) {
    console.error('my-bookings error:', e?.message)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
