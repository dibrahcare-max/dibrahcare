// توليد رقم دعم بصيغة SUP-XXXXXXXX (8 أحرف عشوائية)
export function generateSupportNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // بدون 0/O/1/I لتجنب اللبس
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `SUP-${result}`
}

// أنواع الدعم بالعربي
export const SUPPORT_TYPE_LABELS: Record<string, string> = {
  sadaqa: 'صدقة',
  zakat: 'زكاة',
  kaffara: 'كفارة',
  general: 'دعم عام',
}

// حالات الدعم بالعربي
export const SUPPORT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  received:  { label: 'تم الاستلام',   color: '#3b82f6' },
  scheduled: { label: 'جُدوِل للتوزيع', color: '#f59e0b' },
  disbursed: { label: 'تم التوزيع',    color: '#22c55e' },
  cancelled: { label: 'ملغي',          color: '#ef4444' },
}

// تطبيع رقم الجوال السعودي للتحقق
export function normalizeSAPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('966')) return '0' + cleaned.slice(3) // 05XXXXXXXX
  if (cleaned.startsWith('5')) return '0' + cleaned
  return cleaned
}

// تحويل رابط Google Drive إلى رابط معاينة قابل للتضمين
export function toDrivePreviewUrl(url: string): string | null {
  if (!url) return null
  // مثال: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
  const match = url.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (match) {
    return `https://drive.google.com/file/d/${match[1]}/preview`
  }
  // OneDrive: نتركها كما هي (المستخدم يضع الرابط القابل للتضمين)
  return url
}
