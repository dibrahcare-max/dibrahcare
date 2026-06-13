// ════════════════════════════════════════════════════════════════
// ترجمات أسماء الخدمات من المفاتيح الإنجليزية للعرض العربي
// تستخدم في الرسائل (واتساب، إيميل) واللوحات
// ════════════════════════════════════════════════════════════════

export const SERVICE_TITLES_AR: Record<string, string> = {
  'medical':         'الرعاية الطبية المنزلية',
  'childcare':       'حضانة الأطفال داخل المنزل',
  'child-travel':    'مرافقة الأطفال في السفر',
  'elderly':         'رعاية كبار السن',
  'elderly-travel':  'مرافقة كبار السن في السفر',
  'hospital':        'مرافقة المرضى في المستشفى',
  'postnatal':       'رعاية ما بعد الولادة',
  'bride':           'وصيفة العروس',
  'wedding':         'مرافقة الأعراس والمناسبات',
  'teen':            'المرافقة الآمنة للمراهقين',
  'religious':       'مرافقة المناسبات الدينية والأعياد',
}

export const SERVICE_CATEGORIES_AR: Record<string, string> = {
  'medical': 'طبية',
  'child':   'أطفال',
  'elderly': 'كبار السن',
  'multi':   'متعددة',
  'other':   'أخرى',
}

/**
 * يرجّع اسم الخدمة بالعربي بناءً على service_key أو يرجع إلى service_category
 * أو fallback لنص عام إذا ما عرف
 */
export function getServiceTitle(serviceKey?: string | null, serviceCategory?: string | null): string {
  if (serviceKey && SERVICE_TITLES_AR[serviceKey]) {
    return SERVICE_TITLES_AR[serviceKey]
  }
  if (serviceCategory && SERVICE_CATEGORIES_AR[serviceCategory]) {
    return SERVICE_CATEGORIES_AR[serviceCategory]
  }
  return 'الخدمة المحجوزة'
}

/**
 * يحوّل الوقت العربي ١٢ ساعة (مثل "٧:٠٠ مساءً" أو "7:00 مساءً") إلى صيغة ٢٤ ساعة "HH:MM"
 * يدعم الأرقام العربية والإنجليزية، ويُرجع الوقت كما هو لو كان أصلاً بصيغة ٢٤ ساعة.
 * أمثلة:
 *   "7:00 مساءً"   → "19:00"
 *   "12:00 مساءً"  → "12:00"  (ظهراً)
 *   "12:00 صباحاً" → "00:00"  (منتصف الليل)
 *   "8:00 صباحاً"  → "08:00"
 *   "19:00"        → "19:00"  (كما هو)
 */
export function parseArabicTime(input?: string | null): string | null {
  if (!input) return null
  // تحويل الأرقام العربية إلى إنجليزية
  const normalized = String(input)
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .trim()

  // لو أصلاً بصيغة ٢٤ ساعة (HH:MM بدون مساء/صباح)
  const h24Match = normalized.match(/^(\d{1,2}):(\d{2})$/)
  if (h24Match) {
    const h = parseInt(h24Match[1], 10)
    const m = h24Match[2]
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, '0')}:${m}`
  }

  // صيغة ١٢ ساعة عربية: "7:00 مساءً" / "8:00 صباحاً"
  const m12 = normalized.match(/(\d{1,2}):(\d{2})\s*(مساء|صباح)/)
  if (m12) {
    let h = parseInt(m12[1], 10)
    const min = m12[2]
    const isPM = m12[3].startsWith('مساء')
    if (isPM) {
      if (h !== 12) h += 12        // 7 مساءً → 19، لكن 12 مساءً تبقى 12
    } else {
      if (h === 12) h = 0          // 12 صباحاً → 00
    }
    return `${String(h).padStart(2, '0')}:${min}`
  }

  return null // صيغة غير معروفة
}
