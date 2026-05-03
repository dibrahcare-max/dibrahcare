// مكتبة إرسال رسائل واتساب عبر Twilio
// تستخدم REST API مباشرة (بدون SDK لتقليل حجم النشر)

const TWILIO_API = 'https://api.twilio.com/2010-04-01'

function normalizePhone(phone: string): string {
  // يحوّل الأرقام السعودية لصيغة دولية
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('966')) return '+' + cleaned
  if (cleaned.startsWith('05'))  return '+966' + cleaned.slice(1)
  if (cleaned.startsWith('5'))   return '+966' + cleaned
  if (cleaned.startsWith('+'))   return cleaned
  return '+' + cleaned
}

export async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || '+14155238886'

  if (!accountSid || !authToken) {
    return { success: false, error: 'بيانات Twilio غير مضبوطة' }
  }

  const toFormatted   = `whatsapp:${normalizePhone(to)}`
  const fromFormatted = `whatsapp:${fromNumber}`

  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')

  const params = new URLSearchParams({
    To: toFormatted,
    From: fromFormatted,
    Body: body,
  })

  try {
    const res = await fetch(`${TWILIO_API}/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: data.message || `HTTP ${res.status}` }
    }

    return { success: true, sid: data.sid }
  } catch (e: any) {
    return { success: false, error: e.message || 'فشل الاتصال' }
  }
}

// قوالب الرسائل الجاهزة
export const TEMPLATES = {
  bookingConfirmation: (name: string, packageName: string, date: string, bookingId: string) =>
`مرحباً ${name} 💚

تم استلام حجزك بنجاح في دِبرة:

📦 الباقة: ${packageName}
📅 التاريخ: ${date}
🆔 رقم الحجز: ${bookingId}

سنتواصل معك للتأكيد قبل الموعد.
شكراً لاختيارك دِبرة 🌿`,

  reminder: (name: string, serviceName: string, date: string) =>
`أهلاً ${name} 🌿

نذكّرك بموعد خدمتك معنا غداً:

🛎️ ${serviceName}
📅 ${date}

الكادر سيكون عندك في الموعد. لو تحتاج أي تعديل، تواصل معنا.

دِبرة 💚`,

  feedbackRequest: (name: string, link: string) =>
`نشكرك على ثقتك بدِبرة ${name} 💚

رأيك يهمّنا — قيّم تجربتك معنا في دقيقتين:
${link}

ملاحظاتك تساعدنا على التحسين المستمر 🌿`,

  otp: (code: string) =>
`رمز التحقق الخاص بك في دِبرة:

🔐 ${code}

هذا الرمز صالح لمدة 5 دقائق. لا تشاركه مع أحد.`,

  adminNewBooking: (customerName: string, phone: string, service: string, packageName: string, amount: number, bookingId: string) =>
`🔔 حجز جديد في دِبرة

👤 العميل: ${customerName}
📱 الجوال: ${phone}
🛎️ الخدمة: ${service}
📦 الباقة: ${packageName}
💰 المبلغ: ${amount} ر.س
🆔 الحجز: ${bookingId}

افتح اللوحة لمراجعته:
https://dibrahcare.com/admindibrah`,

  adminNewRegistration: (name: string, phone: string, type: string) =>
`📝 تسجيل جديد في دِبرة

👤 الاسم: ${name}
📱 الجوال: ${phone}
📋 النوع: ${type}

افتح اللوحة:
https://dibrahcare.com/admindibrah`,
}
