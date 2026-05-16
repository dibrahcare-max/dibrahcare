import type { MetadataRoute } from 'next'

const BASE_URL = 'https://dibrahcare.com'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // الصفحات العامة المهمة (للفهرسة)
  const publicRoutes = [
    { url: '',          changeFreq: 'weekly',  priority: 1.0 },  // الرئيسية
    { url: '/about',    changeFreq: 'monthly', priority: 0.8 },
    { url: '/services', changeFreq: 'monthly', priority: 0.9 },
    { url: '/packages', changeFreq: 'weekly',  priority: 0.9 },
    { url: '/contact',  changeFreq: 'monthly', priority: 0.7 },
    { url: '/feedback', changeFreq: 'monthly', priority: 0.5 },
    { url: '/privacy',  changeFreq: 'yearly',  priority: 0.3 },
    { url: '/terms',    changeFreq: 'yearly',  priority: 0.3 },
    { url: '/supporters', changeFreq: 'monthly', priority: 0.6 }, // بوابة الداعمين العامة
  ]

  return publicRoutes.map(route => ({
    url: `${BASE_URL}${route.url}`,
    lastModified: now,
    changeFrequency: route.changeFreq as MetadataRoute.Sitemap[number]['changeFrequency'],
    priority: route.priority,
  }))
}
