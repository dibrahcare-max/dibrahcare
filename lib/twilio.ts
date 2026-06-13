// ════════════════════════════════════════════════════════════════
//  إرسال رسائل واتساب عبر UltraMSG (وسيط مؤقت لحين تفعيل الرسمي)
//  - بدون قوالب معتمدة (UltraMSG لا يحتاجها)
//  - تأخير ٢ ثانية بين كل رسالة لمنع الحظر / Rate limit
//  - لو رجعنا للرسمي مستقبلاً، نستبدل دالة sendWhatsApp فقط
// ════════════════════════════════════════════════════════════════

const ULTRAMSG_API     = 'https://api.ultramsg.com'
const MIN_INTERVAL_MS  = 2000  // ثانيتان بين كل رسالة

function normalizePhone(phone: string): string {
  // UltraMSG يقبل الرقم بصيغة دولية بدون + (مثلاً 966512345678)
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('966')) return cleaned
  if (cleaned.startsWith('05'))  return '966' + cleaned.slice(1)
  if (cleaned.startsWith('5'))   return '966' + cleaned
  return cleaned
}

// ─── قائمة انتظار لضمان التأخير بين الرسائل ───
//     (يعمل ضمن نفس عملية النفاذ — قد يُعاد ضبطها بين الطلبات على Serverless)
let lastSentAt: number = 0
let chain: Promise<void> = Promise.resolve()

function awaitGate(): Promise<void> {
  const myTurn = chain.then(async () => {
    const elapsed   = Date.now() - lastSentAt
    const remaining = MIN_INTERVAL_MS - elapsed
    if (remaining > 0) {
      await new Promise(res => setTimeout(res, remaining))
    }
    lastSentAt = Date.now()
  })
  chain = myTurn.catch(() => {}) // ما نكسر السلسلة لو فشلت رسالة
  return myTurn
}

export async function sendWhatsApp(to: string, body: string): Promise<{ success: boolean; sid?: string; error?: string }> {
  const instance = process.env.ULTRAMSG_INSTANCE_ID
  const token    = process.env.ULTRAMSG_TOKEN

  if (!instance || !token) {
    return { success: false, error: 'بيانات UltraMSG غير مضبوطة (ULTRAMSG_INSTANCE_ID / ULTRAMSG_TOKEN)' }
  }

  // ─── انتظر دورك (٢ ثانية بعد آخر رسالة) ───
  await awaitGate()

  const phone = normalizePhone(to)

  const params = new URLSearchParams({
    token,
    to: phone,
    body,
  })

  try {
    const res = await fetch(`${ULTRAMSG_API}/${instance}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const data = await res.json()

    // UltraMSG يُرجع: { sent: 'true', message: 'ok', id: 'XXX' } للنجاح
    // أو: { error: '...' } للفشل
    if (!res.ok || data.error) {
      return { success: false, error: data.error || data.message || `HTTP ${res.status}` }
    }

    return { success: true, sid: String(data.id || '') }
  } catch (e: any) {
    return { success: false, error: e.message || 'فشل الاتصال' }
  }
}

// إرسال وسائط (صورة/فيديو) عبر UltraMSG — يحتاج رابط عام للملف
export async function sendWhatsAppMedia(
  to: string,
  mediaUrl: string,
  type: 'image' | 'video',
  caption: string = ''
): Promise<{ success: boolean; sid?: string; error?: string }> {
  const instance = process.env.ULTRAMSG_INSTANCE_ID
  const token    = process.env.ULTRAMSG_TOKEN
  if (!instance || !token) {
    return { success: false, error: 'بيانات UltraMSG غير مضبوطة' }
  }

  await awaitGate()
  const phone = normalizePhone(to)
  const endpoint = type === 'video' ? 'video' : 'image'

  const params = new URLSearchParams({ token, to: phone, caption })
  params.set(endpoint, mediaUrl) // image=URL أو video=URL

  try {
    const res = await fetch(`${ULTRAMSG_API}/${instance}/messages/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      return { success: false, error: data.error || data.message || `HTTP ${res.status}` }
    }
    return { success: true, sid: String(data.id || '') }
  } catch (e: any) {
    return { success: false, error: e.message || 'فشل الاتصال' }
  }
}

// قوالب الرسائل الجاهزة
export const TEMPLATES = {
  welcomeRegistration: (name: string) =>
`مرحباً ${name} 💚

تم تسجيل حسابك في دِبرة بنجاح ✅

تقدر تستعرض خدماتنا وتحجز من:
dibrahcare.com

شكراً لانضمامك إلينا 🌿`,

  bookingReceived: (name: string, serviceName: string, packageName: string, date: string, time: string, bookingId: string) =>
`مرحباً ${name} 💚

استلمنا طلب حجزك في دِبرة، وهو الآن قيد المراجعة 📋

🛎️ الخدمة: ${serviceName}${packageName && packageName !== '—' ? `
📦 الباقة: ${packageName}` : ''}${date && date !== '—' ? `
📅 التاريخ المطلوب: ${date}` : ''}${time ? `
🕐 الساعة: ${time}` : ''}
🆔 رقم الطلب: ${bookingId}

سيقوم فريقنا بمراجعة طلبك وتأكيده في أقرب وقت، وسنرسل لك رسالة التأكيد فور اعتماده.

شكراً لاختيارك دِبرة 🌿`,

  bookingConfirmation: (name: string, serviceName: string, packageName: string, date: string, time: string, bookingId: string) =>
`مرحباً ${name} 💚

تم تأكيد موعدك بنجاح في دِبرة ✅

🛎️ الخدمة: ${serviceName}${packageName && packageName !== '—' ? `
📦 الباقة: ${packageName}` : ''}${date && date !== '—' ? `
📅 تاريخ الموعد: ${date}` : ''}${time ? `
🕐 الساعة: ${time}` : ''}
🆔 رقم الحجز: ${bookingId}

سنتواصل معك للتذكير قبل الموعد.
شكراً لثقتك بدِبرة 🌿`,

  medicalBookingRequest: (name: string, bookingId: string) =>
`مرحباً ${name} 💚

استلمنا طلبك للرعاية الطبية المنزلية في دِبرة.

🏥 هذه الخدمة تقدم بالتعاون مع مستشفى الرعاية الطبية
🆔 رقم الطلب: ${bookingId}

سيتواصل معك فريق مستشفى الرعاية الطبية قريباً لتأكيد التفاصيل وإرسال عرض السعر.

شكراً لاختيارك دِبرة 🌿`,

  adminNewMedicalRequest: (customerName: string, phone: string, bookingId: string) =>
`🩺 طلب طبي جديد بانتظار التسعير

👤 العميل: ${customerName}
📱 الجوال: ${phone}
🆔 رقم الطلب: ${bookingId}

افتح اللوحة:
https://dibrahcare.com/admindibrah/medical`,

  giftReceived: (senderName: string, giftText: string, serviceName: string, date: string) =>
`🎁 إهداء خاص لك من ${senderName}

${giftText}

— تفاصيل الإهداء —
🌿 الخدمة: ${serviceName}
📅 التاريخ: ${date}

سنتواصل معك للتنسيق قبل الموعد.
دِبرة للرعاية 💚`,

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

  endingSoon: (name: string) =>
`مرحباً ${name} 🌿

نود إشعاركم بأن موعدكم سينتهي بعد ١٥ دقيقة.

في حال الاستفادة من وقت إضافي، سيتم احتساب رسوم إضافية حسب مدة التمديد.

شكراً لثقتكم بدِبرة 💚`,

  // ═══ قوالب الداعمين ═══

  supportReceived: (donorName: string, amount: number, supportNumber: string) =>
`كتب الله أجرك ${donorName} 🌿

تم استلام دعمكم بمبلغ ${amount} ريال، وتم تسجيله لدينا برقم:
${supportNumber}

تابع رحلة دعمك:
https://dibrahcare.com/supporters`,

  supportScheduled: (donorName: string, place: string, date: string, time: string) =>
`${donorName} 🌿

تم توجيه دعمكم الكريم لصرفه وتوزيعه في "${place}" بتاريخ ${date}${time ? ' الساعة ' + time : ''}.

رحلة الدعم:
https://dibrahcare.com/supporters`,

  supportDisbursed: (donorName: string, place: string, date: string, time: string) =>
`بفضل من الله ثم بدعمكم الكريم ${donorName} 🌿

تم توزيع دعمكم في "${place}" بتاريخ ${date}${time ? ' الساعة ' + time : ''}.
وبين أيديكم تقرير الصرف.

اطلع على التقرير من رحلة الدعم:
https://dibrahcare.com/supporters`,

  // إشعار الأدمن بدعم جديد
  adminNewSupport: (donorName: string, phone: string, amount: number, supportNumber: string, receivedBy: string) =>
`💚 دعم جديد في دِبرة

👤 الداعم: ${donorName}
📱 الجوال: ${phone}
💰 المبلغ: ${amount} ر.س
👥 مستلم الدعم: ${receivedBy}
🆔 رقم الدعم: ${supportNumber}

افتح لوحة الداعمين:
https://dibrahcare.com/supporters/admin`,

  adminNewBooking: (customerName: string, phone: string, service: string, packageName: string, amount: number | null, bookingId: string, date: string, time: string) =>
`🔔 حجز جديد في دِبرة

👤 العميل: ${customerName}
📱 الجوال: ${phone}
🛎️ الخدمة: ${service}
📦 الباقة: ${packageName}
📅 الموعد: ${date}${time ? ' الساعة ' + time : ''}
💰 المبلغ: ${amount !== null && amount !== undefined ? amount + ' ر.س' : 'مجاني (خصم ١٠٠٪)'}
🆔 الحجز: ${bookingId}

افتح اللوحة:
https://dibrahcare.com/admindibrah`,

  adminNewRegistration: (name: string, phone: string) =>
`📝 تسجيل جديد في دِبرة

👤 الاسم: ${name}
📱 الجوال: ${phone}

افتح اللوحة:
https://dibrahcare.com/admindibrah`,
}

// ════════════════════════════════════════════════════════════════
//  مساعد: أرسل تنبيه لكل أرقام الأدمن (من env var)
//  ADMIN_PHONES يدعم أكثر من رقم مفصولين بفاصلة
//  مثلاً: ADMIN_PHONES=00966535977511,00966555403632
// ════════════════════════════════════════════════════════════════
export async function notifyAdmins(body: string): Promise<void> {
  const raw = process.env.ADMIN_PHONES || ''
  const phones = raw.split(',').map(p => p.trim()).filter(Boolean)

  if (phones.length === 0) {
    console.warn('⚠️  [notifyAdmins] ADMIN_PHONES غير مضبوط — لا أرقام للإرسال')
    return
  }

  // sendWhatsApp فيه gate يضمن ٢ ثانية بين كل رسالة، فالحلقة آمنة
  for (const phone of phones) {
    sendWhatsApp(phone, body)
      .then(r => {
        if (!r.success) {
          console.warn(`⚠️  [notifyAdmins] فشل إرسال إلى ${phone}:`, r.error)
        } else {
          console.log(`✅ [notifyAdmins] أُرسل إلى ${phone}:`, r.sid)
        }
      })
      .catch(err => console.error(`[notifyAdmins] استثناء عند ${phone}:`, err?.message))
  }
}
