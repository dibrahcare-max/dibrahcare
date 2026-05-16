import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',                  // كل الـ APIs
          '/admin',                 // إعادة توجيه
          '/admindibrah/',          // لوحة الإدارة
          '/supporters/admin/',     // لوحة الداعمين
          '/supporters/journey/',   // صفحات الداعم الخاصة
          '/my-bookings',           // حجوزات المستخدم
          '/book/',                 // صفحات الحجز (معاملات)
          '/payment-response',      // ردود الدفع
          '/pay-test',              // اختبار
          '/quick-pay',             // دفع سريع
          '/print/',                // صفحات الطباعة
          '/design1',               // مسوّدة قديمة
          '/login',                 // صفحات المصادقة
          '/register',
          '/auth/',
        ],
      },
    ],
    sitemap: 'https://dibrahcare.com/sitemap.xml',
    host: 'https://dibrahcare.com',
  }
}
