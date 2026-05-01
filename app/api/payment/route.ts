import { NextRequest, NextResponse } from 'next/server'
import https from 'https'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

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
    const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL || 'https://dibrahcare.com'

    if (!terminalId || !password || !resourceKey) {
      return NextResponse.json({ success: false, message: 'متغيرات البوابة غير مضبوطة' }, { status: 500 })
    }

    const PACKAGE_PRICES: Record<string, number> = {
      test_1: 1,                                                 // ← اختبار: 1 ريال فقط
      daily_4: 350, daily_8: 700,
      weekly_4: 1750, weekly_8: 3500,
      monthly_4: 8000, monthly_8: 16000,
      ramadan_2: 200,
    }
    const amount = PACKAGE_PRICES[body.package] || 0
    if (amount <= 0) {
      return NextResponse.json({ success: false, message: 'باقة غير صالحة' }, { status: 400 })
    }

    const trackId = 'TRK' + Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 900 + 100)

    const customerIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1'

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
          return NextResponse.json({
            success: true,
            url: `${url}?PaymentID=${payId}`,
            trackId,
          })
        }
      }

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
