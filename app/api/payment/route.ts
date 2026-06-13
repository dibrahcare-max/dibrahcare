import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 30

// Supabase admin client (server-side فقط)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// Neoleap endpoint (LIVE production — digitalpayments)
const NEOLEAP_HOST = 'digitalpayments.neoleap.com.sa'
const NEOLEAP_PATH = '/pg/payment/hosted.htm'

// تشفير مطابق لـ PHP بالضبط:
// 1. PKCS5 padding يدوي
// 2. AES-256-CBC مع OPENSSL_ZERO_PADDING (لأن padding تم يدوياً)
// 3. النتيجة hex
function encryptTrandata(plaintext: string, resourceKey: string): string {
  // نطابق سلوك PHP openssl_encrypt:
  // - لو المفتاح أطول من 32 → نقصه
  // - لو أقصر → نحشيه بصفر bytes
  const keyInput = Buffer.from(resourceKey, 'utf8')
  const key = Buffer.alloc(32)
  keyInput.copy(key, 0, 0, Math.min(keyInput.length, 32))

  const iv = Buffer.from('PGKEYENCDECIVSPC', 'utf8')

  // PKCS5 padding يدوي (مطابق لـ PHP)
  const blocksize = 16
  const dataBuf = Buffer.from(plaintext, 'utf8')
  const padLen = blocksize - (dataBuf.length % blocksize)
  const padBuf = Buffer.alloc(padLen, padLen)
  const padded = Buffer.concat([dataBuf, padBuf])

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
  cipher.setAutoPadding(false)
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()])

  return encrypted.toString('hex')
}

function postJson(body: string, customerIp: string): Promise<{ status: number; text: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request({
      host: NEOLEAP_HOST,
      port: 443,
      path: NEOLEAP_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-FORWARDED-FOR': customerIp,
      },
      rejectUnauthorized: false,
      timeout: 30000,
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => resolve({ status: res.statusCode || 0, text: data }))
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(body)
    req.end()
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const terminalId  = process.env.NEOLEAP_ID
    const password    = process.env.NEOLEAP_PASS
    const resourceKey = process.env.NEOLEAP_KEY

    // ⚠️ مهم: نستخدم origin طلب المستخدم الفعلي بدل ما نثبت baseUrl
    // عشان نضمن إن Neoleap يعمل callback على نفس الـ origin اللي المستخدم منه
    // وبالتالي sessionStorage يبقى محفوظاً طوال رحلة الدفع
    const requestOrigin = new URL(req.url).origin
    const baseUrl = requestOrigin || process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'

    if (!terminalId || !password || !resourceKey) {
      return NextResponse.json({ success: false, message: 'متغيرات البوابة غير مضبوطة' }, { status: 500 })
    }

    const PACKAGE_PRICES: Record<string, number> = {
      daily_4: 350, daily_8: 700,
      weekly_4: 1750, weekly_8: 3500,
      monthly_4: 8000, monthly_8: 16000,
      ramadan_2: 200,
    }

    // خدمة حسب الطلب — المبلغ يأتي من الأدمن مباشرة
    if (body.package === 'custom') {
      const customAmount = parseFloat(body.customAmount)
      if (!customAmount || customAmount <= 0) {
        return NextResponse.json({ success: false, message: 'مبلغ غير صالح' }, { status: 400 })
      }
      body.customAmount = customAmount
    }

    const basePrice = body.package === 'custom' ? body.customAmount : (PACKAGE_PRICES[body.package] || 0)
    if (basePrice <= 0) {
      return NextResponse.json({ success: false, message: 'باقة غير صالحة' }, { status: 400 })
    }

    // كمية اختيارية لخدمة الأطفال — مقيّدة بـ 1-8 (9 أطفال = ×8 باقات)
    const qty = Math.max(1, Math.min(10, parseInt(body.quantity) || 1))
    const subtotal = basePrice * qty
    let amount = subtotal

    // ═══ تطبيق كود الخصم (من DB — لا نثق في القيم القادمة من العميل) ═══
    let appliedDiscount: {
      code_id: string;
      code: string;
      percent: number;
      discount_amount: number;
    } | null = null

    const discountCodeId = body.discountCodeId
    if (discountCodeId) {
      try {
        const { data: codeRow } = await supabaseAdmin
          .from('discount_codes')
          .select('id, code, discount_percent, valid_until, is_void, is_public, use_count, applies_to_package')
          .eq('id', discountCodeId)
          .maybeSingle()

        const now = new Date()
        // فحص قيد الباقة: لو الكود مقيّد بباقة، لازم تطابق باقة الحجز
        const packageMatches =
          !codeRow?.applies_to_package || codeRow.applies_to_package === body.package

        const isValid =
          !!codeRow &&
          !codeRow.is_void &&
          new Date(codeRow.valid_until) >= now &&
          (codeRow.is_public || codeRow.use_count === 0) &&
          packageMatches

        if (isValid && codeRow) {
          const discountAmt = Math.round(subtotal * codeRow.discount_percent / 100)
          amount = subtotal - discountAmt
          appliedDiscount = {
            code_id: codeRow.id,
            code: codeRow.code,
            percent: codeRow.discount_percent,
            discount_amount: discountAmt,
          }
          console.log(`✅ [payment] Discount applied: ${codeRow.code} (${codeRow.discount_percent}%) — saved ${discountAmt} ر`)
        } else if (codeRow && !packageMatches) {
          console.warn(`⚠️  [payment] Discount code rejected: لا ينطبق على الباقة ${body.package} (مقيّد بـ ${codeRow.applies_to_package})`)
        } else {
          console.warn(`⚠️  [payment] Discount code rejected (expired/used/void)`)
        }
      } catch (e: any) {
        console.error('[payment] discount lookup failed:', e?.message)
      }
    }

    const trackId = 'TRK' + Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 900 + 100)

    // ═══ سجّل المحاولة في DB قبل أي شي ═══
    // هذا يضمن إن أي دفعة لها سجل مهما حصل بعدها
    try {
      const attemptData: any = {
        track_id: trackId,
        status: 'initiated',
        amount: amount,
        package_id: body.package,
        package_label: body.packageLabel || null,
        service_key: body.serviceKey || null,
        service_category: body.serviceCategory || null,
        phone: body.phone || null,
        full_name: body.fullName || null,
        customer_id: body.customerId || null,
        start_date: body.startDate || null,
        start_time: body.startTime || null,
        end_time: body.endTime || null,
        child_count: body.childCount || null,
        // ─── معلومات الخصم (للسجل والمحاسبة) ───
        notes: appliedDiscount ? JSON.stringify({
          subtotal,
          discount_code: appliedDiscount.code,
          discount_percent: appliedDiscount.percent,
          discount_amount: appliedDiscount.discount_amount,
        }) : null,
      }

      const { error: insertErr } = await supabaseAdmin
        .from('payment_attempts')
        .insert(attemptData)

      if (insertErr) {
        console.error('⚠️  [payment] Failed to log attempt:', insertErr.message)
        // لا نوقف العملية — نكمل حتى لو فشل التسجيل
      } else {
        console.log('✅ [payment] Attempt logged with trackId:', trackId)
      }
    } catch (logErr: any) {
      console.error('⚠️  [payment] Logging exception:', logErr?.message)
    }

    const customerIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

    // ═══ مسار "حجز مجاني" — لما الكود 100% خصم، ما نمر عبر Neoleap أصلاً ═══
    if (amount === 0) {
      try {
        await supabaseAdmin
          .from('payment_attempts')
          .update({
            status: 'completed',
            payment_id: 'FREE',
            result_code: '00',
            result_message: 'CAPTURED_FREE',
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('track_id', trackId)
        console.log('✅ [payment] Free booking — bypassing Neoleap, trackId:', trackId)
      } catch (e: any) {
        console.error('⚠️  [payment] Free booking log failed:', e?.message)
      }

      // ⚠️ نستخدم رابط نسبي (مو مطلق) عشان يبقى على نفس الـ origin
      // اللي عليه المستخدم — يحفظ sessionStorage من الضياع لو dibrahcare.com vs www.dibrahcare.com
      const successUrl =
        `/payment-response?result=CAPTURED&paymentId=FREE&trackId=${trackId}`

      return NextResponse.json({
        success: true,
        free: true,
        url: successUrl,
        trackId,
      })
    }

    // Plain trandata — نفس ترتيب PHP بالضبط
    const responseURL = `${baseUrl}/api/payment-callback?trackId=${trackId}`
    const plainData = JSON.stringify([{
      amt: String(amount),
      action: '1',
      password: password,
      id: terminalId,
      currencyCode: '682',
      trackId: trackId,
      responseURL: responseURL,
      errorURL: responseURL,
      langid: 'ar',
    }])

    const trandata = encryptTrandata(plainData, resourceKey)

    const postFields = JSON.stringify([{
      id: terminalId,
      trandata: trandata,
      responseURL: responseURL,
      errorURL: responseURL,
    }])

    console.log('🔵 URL:', NEOLEAP_HOST + NEOLEAP_PATH)
    console.log('🔵 trackId:', trackId)
    console.log('🔵 trandata prefix:', trandata.slice(0, 60))

    const resp = await postJson(postFields, customerIp)
    console.log('🟢 Status:', resp.status)
    console.log('🟢 Response:', resp.text.slice(0, 600))

    const raw = resp.text

    try {
      const parsed = JSON.parse(raw)
      // PHP: $responseData[0][0] ?? $responseData[0]
      const item = parsed?.[0]?.[0] || parsed?.[0] || null

      if (item?.status === '1' && item.result) {
        // result: "PAYID:URL"
        const match = /^(\d+):(https?:\/\/[^\s"']+)/.exec(String(item.result))
        if (match) {
          const payId = match[1]
          const url = match[2]

          // ═══ حدّث المحاولة: redirected ═══
          try {
            await supabaseAdmin
              .from('payment_attempts')
              .update({
                status: 'redirected',
                payment_id: payId,
                updated_at: new Date().toISOString(),
              })
              .eq('track_id', trackId)
            console.log('✅ [payment] Attempt updated to redirected, payId:', payId)
          } catch (e: any) {
            console.error('⚠️  [payment] Update to redirected failed:', e?.message)
          }

          return NextResponse.json({
            success: true,
            url: `${url}?PaymentID=${payId}`,
            trackId,
          })
        }
      }

      // ═══ حدّث المحاولة: failed (Neoleap رفض من البداية) ═══
      try {
        await supabaseAdmin
          .from('payment_attempts')
          .update({
            status: 'failed',
            result_code: 'INIT_FAILED',
            result_message: item?.errorText || item?.error || 'فشل بدء الدفع',
            raw_response: parsed,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('track_id', trackId)
      } catch {}

      return NextResponse.json({
        success: false,
        message: item?.errorText || item?.error || 'فشل بدء الدفع',
        debug: { httpStatus: resp.status, raw: raw.slice(0, 500), item },
      }, { status: 400 })

    } catch {
      return NextResponse.json({
        success: false,
        message: `رد غير متوقع (HTTP ${resp.status})`,
        debug: { raw: raw.slice(0, 500) },
      }, { status: 500 })
    }

  } catch (e: any) {
    console.error('❌ Payment Error:', e?.message)
    return NextResponse.json({
      success: false,
      message: 'خطأ في الاتصال: ' + (e?.message || 'unknown'),
    }, { status: 500 })
  }
}
