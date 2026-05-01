import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export const runtime = 'nodejs'

// فك تشفير trandata القادم من Neoleap — نفس خوارزمية التشفير بالعكس
// AES-256-CBC مع IV ثابت + PKCS5 padding يدوي
function decryptTrandata(hex: string, resourceKey: string): any | null {
  try {
    const keyInput = Buffer.from(resourceKey, 'utf8')
    const key = Buffer.alloc(32)
    keyInput.copy(key, 0, 0, Math.min(keyInput.length, 32))

    const iv = Buffer.from('PGKEYENCDECIVSPC', 'utf8')

    const encrypted = Buffer.from(hex, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    decipher.setAutoPadding(false)
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

    // إزالة PKCS5 padding يدوياً
    const padLen = decrypted[decrypted.length - 1]
    if (padLen < 1 || padLen > 16) return null
    const unpadded = decrypted.slice(0, decrypted.length - padLen)

    const json = unpadded.toString('utf8')
    const parsed = JSON.parse(json)

    // قد يكون array أو object
    return Array.isArray(parsed) ? parsed[0] : parsed
  } catch (e) {
    console.error('فشل فك تشفير trandata:', (e as Error).message)
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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'
    const qs = new URLSearchParams()

    // ═══ فك تشفير trandata لاستخراج النتيجة الحقيقية ═══
    const resourceKey = process.env.NEOLEAP_KEY
    if (body.trandata && resourceKey) {
      const decrypted = decryptTrandata(body.trandata, resourceKey)
      if (decrypted) {
        console.log('✅ Neoleap decrypted:', decrypted)
        // احقن كل الحقول المفككة في query string
        Object.entries(decrypted).forEach(([k, v]) => {
          if (v !== null && v !== undefined && v !== '') {
            qs.append(k, String(v))
          }
        })
      } else {
        // فشل فك التشفير → نحط علم خطأ
        qs.append('decrypt_error', '1')
      }
    }

    // أضف الحقول الأصلية غير المشفّرة (لو موجودة) كبديل
    Object.entries(body).forEach(([k, v]) => {
      if (k === 'trandata') return // تجاهل trandata المشفّر
      if (!qs.has(k) && v !== null && v !== undefined && v !== '') {
        qs.append(k, String(v))
      }
    })

    // redirect 303 = "See Other" — يحول POST إلى GET
    return NextResponse.redirect(`${baseUrl}/payment-response?${qs.toString()}`, 303)
  } catch (e: any) {
    console.error('payment-callback error:', e?.message)
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
