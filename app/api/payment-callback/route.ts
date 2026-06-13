import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// فك تشفير trandata القادم من Neoleap — مطابق ١:١ لـ PHP القديم اللي كان يشتغل
// PHP: openssl_decrypt($base64, 'AES-256-CBC', $key, OPENSSL_ZERO_PADDING, $iv)
// ثم urldecode، ثم json_decode، ثم parse_str كـ fallback
function decryptTrandata(hex: string, resourceKey: string): any | null {
  try {
    // hex → bytes (مثل PHP: array_map('hexdec', str_split($hex, 2)))
    const encrypted = Buffer.from(hex, 'hex')

    // المفتاح: 32 بايت من UTF-8
    const keyBuf = Buffer.from(resourceKey, 'utf8')
    const key = Buffer.alloc(32)
    keyBuf.copy(key, 0, 0, Math.min(keyBuf.length, 32))

    const iv = Buffer.from('PGKEYENCDECIVSPC', 'utf8')

    // فك التشفير بدون auto-padding (= OPENSSL_ZERO_PADDING في PHP)
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    decipher.setAutoPadding(false)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    // إزالة PKCS5/PKCS7 padding يدوياً
    const padLen = decrypted[decrypted.length - 1]
    const unpadded = (padLen >= 1 && padLen <= 16)
      ? decrypted.slice(0, decrypted.length - padLen)
      : decrypted

    // النص الخام بعد فك التشفير
    let text = unpadded.toString('utf8')

    // إزالة أي null bytes أو ZERO_PADDING زائد
    text = text.replace(/\x00+$/, '').trim()

    if (!text) return null

    console.log('🔓 [decrypt] raw text:', text.slice(0, 200))

    // الخطوة المهمة من PHP: urldecode
    let decoded = text
    try {
      decoded = decodeURIComponent(text.replace(/\+/g, ' '))
    } catch {
      // لو الـ URL decoding فشل، نكمل بالنص الخام
      decoded = text
    }

    console.log('🔓 [decrypt] after urldecode:', decoded.slice(0, 200))

    // المحاولة ١: JSON
    try {
      const parsed = JSON.parse(decoded)
      const obj = Array.isArray(parsed) ? parsed[0] : parsed
      // قد يكون nested array
      if (Array.isArray(obj)) return obj[0]
      return obj
    } catch {}

    // المحاولة ٢: parse_str (URL-encoded form data)
    // مثلاً: "result=CAPTURED&trackid=TRK123&paymentid=..."
    if (decoded.includes('=')) {
      const result: Record<string, string> = {}
      decoded.split('&').forEach(pair => {
        const eq = pair.indexOf('=')
        if (eq < 0) return
        const k = pair.substring(0, eq).trim()
        const v = pair.substring(eq + 1)
        if (k) {
          try {
            result[k] = decodeURIComponent(v.replace(/\+/g, ' '))
          } catch {
            result[k] = v
          }
        }
      })
      if (Object.keys(result).length > 0) return result
    }

    // إذا فشل كل شي، نرجع النص الخام كـ object
    return { _raw: decoded }
  } catch (e) {
    console.error('❌ [decrypt] exception:', (e as Error).message)
    return null
  }
}

// Neoleap تعمل POST على هذا الرابط بعد الدفع
export async function POST(req: NextRequest) {
  try {
    let body: Record<string, string> = {}

    const ctype = req.headers.get('content-type') || ''
    if (ctype.includes('application/json')) {
      body = await req.json()
    } else {
      const form = await req.formData()
      form.forEach((v, k) => { body[k] = String(v) })
    }

    // ═══ Logging تشخيصي ═══
    console.log('🔵 [callback] Request received')
    console.log('🔵 [callback] Content-Type:', ctype)
    console.log('🔵 [callback] Body keys:', Object.keys(body))
    console.log('🔵 [callback] Has trandata:', !!body.trandata)
    console.log('🔵 [callback] trandata length:', body.trandata?.length || 0)

    // ⚠️ مهم: نستخدم origin الطلب الفعلي بدل ما نعتمد على env baseUrl
    // عشان نضمن إن المستخدم يرجع لنفس الـ origin اللي بدأ منه (سواء dibrahcare.com أو www.dibrahcare.com)
    // وبالتالي sessionStorage يبقى سليم
    const requestOrigin = new URL(req.url).origin
    const baseUrl = requestOrigin || process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'
    const qs = new URLSearchParams()

    // ═══ ١. حاول فك تشفير trandata ═══
    const resourceKey = process.env.NEOLEAP_KEY
    console.log('🔵 [callback] Has NEOLEAP_KEY env:', !!resourceKey)

    let decrypted: any = null
    if (body.trandata && resourceKey) {
      decrypted = decryptTrandata(body.trandata, resourceKey)
      if (decrypted) {
        console.log('✅ [callback] Decrypted SUCCESS:', JSON.stringify(decrypted).slice(0, 300))
        // احقن كل الحقول المفككة في query string
        Object.entries(decrypted).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            qs.append(k, String(v))
          }
        })
      } else {
        console.warn('⚠️  [callback] decryptTrandata returned null — falling back to body fields')
      }
    } else if (body.trandata && !resourceKey) {
      console.error('❌ [callback] trandata received but NEOLEAP_KEY env missing!')
    } else if (!body.trandata) {
      console.warn('⚠️  [callback] No trandata in response — Neoleap sent fields directly')
    }

    // ═══ ٢. أضف الحقول الأصلية من body (سواء decrypt نجح أو فشل) ═══
    // هذي مهمة جداً: لو decrypt فشل، الحقول الأصلية من Neoleap هي خيارنا الأخير
    Object.entries(body).forEach(([k, v]) => {
      if (k === 'trandata') return // تجاهل trandata نفسه
      if (!qs.has(k) && v !== null && v !== undefined && v !== '') {
        qs.append(k, String(v))
      }
    })

    // ═══ ٣. ملاحظة: لا نضع decrypt_error=1 أبداً ═══
    // الصفحة الأمامية تقرر النجاح/الفشل بناءً على الحقول الفعلية، مو على فلاج

    console.log('🔵 [callback] Final query params:', qs.toString().slice(0, 300))

    // ═══ ٤. حدّث سجل المحاولة في DB ═══
    try {
      // استخرج معرّفات وقيم النتيجة من الحقول المتاحة (سواء من decrypt أو من body)
      const trackId = qs.get('trackId') || qs.get('trackid') || qs.get('TrackID') || ''
      const paymentId = qs.get('paymentid') || qs.get('PaymentID') || qs.get('paymentId') || ''
      const result = (qs.get('result') || qs.get('Result') || '').toUpperCase().trim()
      const status = (qs.get('status') || qs.get('Status') || '').toUpperCase().trim()
      const authRespCode = qs.get('authRespCode') || qs.get('AuthRespCode') || ''
      const responseCode = qs.get('responseCode') || qs.get('ResponseCode') || ''
      const errorCode = qs.get('Error') || qs.get('error') || qs.get('ErrorCode') || ''
      const errorText = qs.get('ErrorText') || qs.get('errorText') || ''

      // قرّر الحالة (نفس منطق PHP الأصلي — صارم على حقل result فقط)
      // ⚠️ ممنوع الاعتماد على paymentId كدليل نجاح — Neoleap يرجعه حتى في الرفض
      const finalStatus = (result === 'CAPTURED' || result === 'APPROVED') ? 'success' : 'failed'

      if (trackId) {
        // اجمع كل البيانات (decrypted + body) كـ raw_response
        const rawData: Record<string, any> = {
          ...body,
          ...(decrypted || {}),
        }

        const { error: updateErr } = await supabaseAdmin
          .from('payment_attempts')
          .update({
            status: finalStatus,
            payment_id: paymentId || null,
            result_code: result || status || authRespCode || responseCode || null,
            result_message: errorText || null,
            raw_response: rawData,
            completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('track_id', trackId)

        if (updateErr) {
          console.error('⚠️  [callback] DB update failed:', updateErr.message)
        } else {
          console.log(`✅ [callback] Attempt ${trackId} → ${finalStatus}`)
        }

        // ═══ لو نجح الدفع → احفظ الحجز في bookings وأرسل واتساب ═══
        if (finalStatus === 'success' && trackId) {
          try {
            const { data: attempt } = await supabaseAdmin
              .from('payment_attempts')
              .select('*')
              .eq('track_id', trackId)
              .maybeSingle()

            // نحفظ فقط لو ما في booking_id مسبقاً (نمنع التكرار)
            if (attempt && !attempt.booking_id) {
              const saveRes = await fetch(`${baseUrl}/api/save-booking`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  customer_id:      attempt.customer_id,
                  service_key:      attempt.service_key,
                  service_category: attempt.service_category,
                  package_id:       attempt.package_id,
                  package_label:    attempt.package_label,
                  start_date:       attempt.start_date,
                  start_time:       attempt.start_time,
                  end_time:         attempt.end_time,
                  child_count:      attempt.child_count,
                  amount:           attempt.amount,
                  trackId:          attempt.track_id,
                  paymentId:        paymentId || attempt.payment_id,
                }),
              })
              const saveJson = await saveRes.json()
              if (saveJson?.success && saveJson?.bookingId) {
                console.log(`✅ [callback] Booking saved: ${saveJson.bookingId}`)
              } else {
                console.error('⚠️  [callback] save-booking failed:', JSON.stringify(saveJson))
              }
            } else if (attempt?.booking_id) {
              // الحجز موجود مسبقاً (مثل خدمة حسب الطلب) — نحدّث الحالة فقط
              console.log(`ℹ️  [callback] Booking already exists: ${attempt.booking_id} — updating payment status`)
              try {
                await supabaseAdmin
                  .from('bookings')
                  .update({
                    payment_status: 'paid',
                    status: 'confirmed',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', attempt.booking_id)
                console.log(`✅ [callback] Booking ${attempt.booking_id} updated to paid`)
              } catch (e: any) {
                console.error('⚠️  [callback] update booking failed:', e?.message)
              }
            }
          } catch (saveErr: any) {
            console.error('⚠️  [callback] save-booking exception:', saveErr?.message)
          }
        }

      } else {
        console.warn('⚠️  [callback] No trackId — cannot update attempt record')
      }
    } catch (dbErr: any) {
      console.error('⚠️  [callback] DB exception:', dbErr?.message)
      // لا نوقف العملية — العميل لازم يصل لصفحة النتيجة
    }

    // redirect 303 = "See Other" — يحول POST إلى GET
    return NextResponse.redirect(`${baseUrl}/payment-response?${qs.toString()}`, 303)
  } catch (e: any) {
    console.error('❌ [callback] Exception:', e?.message, e?.stack)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'}/payment-response?error=callback_failed`,
      303
    )
  }
}

// للـ GET requests (في حال جا المستخدم مباشرة)
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'
  return NextResponse.redirect(`${baseUrl}/payment-response${url.search}`, 303)
}
