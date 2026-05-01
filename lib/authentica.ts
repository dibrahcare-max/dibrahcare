/**
 * Authentica SA - OTP Service
 * Docs: https://authenticasa.docs.apiary.io/
 *
 * Endpoints:
 *   POST /api/sdk/v1/sendOTP    body: { To, Channel }
 *   POST /api/sdk/v1/verifyOTP  body: { To, OtpCode }
 */

const BASE_URL = 'https://api.authentica.sa/api/sdk/v1'

function getHeaders() {
  const apiKey = process.env.AUTHENTICA_API_KEY
  if (!apiKey) {
    throw new Error('AUTHENTICA_API_KEY is not set')
  }
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Authorization': apiKey,
  }
}

/**
 * طبّع الرقم لصيغة دولية بدون +
 * 05XXXXXXXX → 9665XXXXXXXX
 */
function normalizePhone(phone: string): string {
  const clean = phone.replace(/\D/g, '')
  if (clean.startsWith('966')) return clean
  if (clean.startsWith('05') && clean.length === 10) return '966' + clean.slice(1)
  if (clean.startsWith('5') && clean.length === 9) return '966' + clean
  return clean
}

/**
 * إرسال OTP
 * @param phone رقم الجوال (أي صيغة — يتم تطبيعه)
 * @param method 'sms' | 'whatsapp'
 */
export async function sendOtp(
  phone: string,
  method: 'sms' | 'whatsapp' = 'sms'
): Promise<{ success: boolean; error?: string }> {
  try {
    const normalized = normalizePhone(phone)

    const res = await fetch(`${BASE_URL}/sendOTP`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        phone: normalized,
        method, // 'sms' | 'whatsapp'
        template_id: parseInt(process.env.AUTHENTICA_TEMPLATE_ID || '1'),
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Authentica sendOtp error:', res.status, data)
      return { success: false, error: data.message || `HTTP ${res.status}` }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Authentica sendOtp exception:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * التحقق من OTP
 * @param phone رقم الجوال
 * @param otp الرمز اللي دخله العميل
 */
export async function verifyOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; valid: boolean; error?: string }> {
  try {
    const normalized = normalizePhone(phone)

    const res = await fetch(`${BASE_URL}/verifyOTP`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        phone: normalized,
        otp,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.error('Authentica verifyOtp error:', res.status, data)
      return { success: false, valid: false, error: data.message || `HTTP ${res.status}` }
    }

    // التحقق من النجاح بأي صيغة محتملة
    const isValid = data.valid === true
                 || data.verified === true
                 || data.status === 'success'
                 || data.success === true
                 || (typeof data.message === 'string' && /verified|valid|success/i.test(data.message))

    return { success: true, valid: !!isValid }
  } catch (err: any) {
    console.error('Authentica verifyOtp exception:', err.message)
    return { success: false, valid: false, error: err.message }
  }
}
