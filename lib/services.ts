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
